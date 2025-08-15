import { CsvRow } from '../App'

interface ParseResult {
  rows: CsvRow[]
  sessionNames: string[]
  errors: string[]
}

/**
 * Robust CSV line splitter (no deps).
 * Handles quotes, escaped quotes, commas inside quotes, CRLF/LF.
 */
function splitCsvLine(line: string, delimiter: ',' | '\t'): string[] {
  const out: string[] = []
  let cur = ''
  let i = 0
  const n = line.length
  let inQuotes = false

  while (i < n) {
    const ch = line[i]

    if (inQuotes) {
      if (ch === '"') {
        // Peek next for escaped quote
        if (i + 1 < n && line[i + 1] === '"') {
          cur += '"'
          i += 2
          continue
        } else {
          inQuotes = false
          i++
          continue
        }
      } else {
        cur += ch
        i++
        continue
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
        continue
      }
      if (ch === delimiter) {
        out.push(cur)
        cur = ''
        i++
        continue
      }
      // Treat stray \r as whitespace
      if (ch === '\r') {
        i++
        continue
      }
      cur += ch
      i++
    }
  }
  out.push(cur)
  return out
}

/** Normalize header names for easier matching */
function normHeader(h: string): string {
  return h.trim().replace(/\uFEFF/g, '') // strip BOM if present
    .replace(/\s+/g, ' ')               // collapse spaces
    .replace(/[-_]+/g, ' ')
    .replace(/:/g, '')
    .toLowerCase()
}

/** Try to detect delimiter from header line */
function detectDelimiter(headerLine: string): ',' | '\t' {
  // If tab exists, prefer it. Otherwise default comma.
  return headerLine.includes('\t') ? '\t' : ','
}

export function parseCsv(csvText: string): ParseResult {
  if (!csvText || !csvText.trim()) {
    return { rows: [], sessionNames: [], errors: ['CSV is empty'] }
  }

  // Normalize newlines, remove leading BOM
  let text = csvText.replace(/^\uFEFF/, '')
  // Keep original line breaks for correct row numbers
  const rawLines = text.split(/\n/)

  if (rawLines.length < 2) {
    return { rows: [], sessionNames: [], errors: ['CSV must have a header and at least one data row'] }
  }

  const headerLine = rawLines[0].replace(/\r$/, '')
  const delimiter = detectDelimiter(headerLine)

  // Parse headers robustly
  const headerCells = splitCsvLine(headerLine, delimiter).map(h => h.trim())

  // Map of canonical -> accepted variants
  const headerMap: Record<string, string[]> = {
    Day: ['day', 'date'],
    Exercise: ['exercise', 'workout', 'name'],
    Sets: ['sets', 'set'],
    'Reps or Time': ['reps or time', 'reps/time', 'reps time', 'time', 'duration', 'reps'],
    Weight: ['weight', 'load', 'kg', 'lbs'],
    Notes: ['notes', 'note', 'comments'],
    'Form Guidance': ['form guidance', 'form', 'guidance', 'cues', 'form cues'],
    'Muscle Group': ['muscle group', 'muscle groups', 'group'],
    'Main Muscle': ['main muscle', 'primary muscle', 'target'],
    'Day Type': ['day type', 'type']
  }

  // Build reverse index: normalized header cell -> index
  const headerIndexByNorm = new Map<string, number>()
  headerCells.forEach((h, idx) => headerIndexByNorm.set(normHeader(h), idx))

  // Resolve actual indices for each canonical key
  const indexOf: Record<keyof CsvRow, number | undefined> = {} as any
  const errors: string[] = []

  // Helper to locate index by variants
  function findIndex(variants: string[]): number | undefined {
    for (const v of variants) {
      const idx = headerIndexByNorm.get(normHeader(v))
      if (idx !== undefined) return idx
    }
    return undefined
  }

  // Required columns in your UI
  const required: Array<keyof CsvRow> = ['Day', 'Exercise', 'Sets', 'Reps or Time', 'Weight']

  // Fill indices for all known columns
  Object.entries(headerMap).forEach(([canon, variants]) => {
    const idx = findIndex([canon, ...variants])
    indexOf[canon as keyof CsvRow] = idx
  })

  // Validate required headers
  const missingRequired = required.filter(k => indexOf[k] === undefined)
  if (missingRequired.length) {
    errors.push(
      `Missing required headers: ${missingRequired.join(', ')}. Found headers: ${headerCells.join(' | ')}`
    )
    return { rows: [], sessionNames: [], errors }
  }

  const rows: CsvRow[] = []
  const sessionNames = new Set<string>()

  // Parse each data row
  for (let lineNo = 1; lineNo < rawLines.length; lineNo++) {
    const raw = rawLines[lineNo]
    if (!raw || !raw.trim()) continue

    const values = splitCsvLine(raw.replace(/\r$/, ''), delimiter).map(v => v.trim())

    // Build a safe accessor
    const get = (key: keyof CsvRow): string => {
      const idx = indexOf[key]
      return typeof idx === 'number' && idx >= 0 && idx < values.length ? values[idx] ?? '' : ''
    }

    const row: CsvRow = {
      Day: get('Day'),
      Exercise: get('Exercise'),
      Sets: get('Sets'),
      'Reps or Time': get('Reps or Time'),             // unify to this key in the app
      Weight: get('Weight'),
      Notes: get('Notes'),
      'Form Guidance': get('Form Guidance'),
      'Muscle Group': get('Muscle Group'),
      'Main Muscle': get('Main Muscle'),
      'Day Type': get('Day Type'),
    }

    // Basic sanity: require at least Day + Exercise
    if (!row.Day && !row.Exercise) {
      // ignore completely empty logical rows
      continue
    }

    // If some required field is missing in this row, record an error but keep going
    const missingInRow: string[] = []
    for (const k of required) {
      if (!row[k] || row[k].length === 0) missingInRow.push(k)
    }
    if (missingInRow.length) {
      errors.push(`Row ${lineNo + 1}: missing ${missingInRow.join(', ')}`)
    }

    rows.push(row)
    if (row.Day) sessionNames.add(row.Day)
  }

  return {
    rows,
    sessionNames: Array.from(sessionNames).sort(),
    errors
  }
}
