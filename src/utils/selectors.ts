import { CsvRow } from '../App'

export interface ExerciseVM {
  id: string
  sessionName: string
  name: string
  sets: number
  repsText: string
  weightText: string
  notes: string
  formGuidance: string
  muscleGroup: string
  mainMuscle: string
}

export interface Session {
  name: string
  exercises: ExerciseVM[]
}

/**
 * Build today's workout sessions from CSV data and selected session names
 */
export function buildTodaySessions(parsedRows: CsvRow[], selectedSessions: string[]): Session[] {
  const sessions: Session[] = []
  
  for (const sessionName of selectedSessions) {
    const sessionRows = parsedRows.filter(row => row.Day === sessionName)
    const exercises: ExerciseVM[] = sessionRows.map((row, index) => ({
      id: `${sessionName}-${row.Exercise}-${index}`,
      sessionName,
      name: row.Exercise,
      sets: parseInt(row.Sets) || 1,
      repsText: row['Reps or Time'] || '',
      weightText: row.Weight || '',
      notes: row.Notes || '',
      formGuidance: row['Form Guidance'] || '',
      muscleGroup: row['Muscle Group'] || '',
      mainMuscle: row['Main Muscle'] || ''
    }))
    
    sessions.push({
      name: sessionName,
      exercises
    })
  }
  
  return sessions
}
