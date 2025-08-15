/**
 * Represents a parsed row from the CSV workout data
 */
export interface ParsedRow {
  sessionName: string
  sessionType: string
  name: string
  sets: number
  repsText: string
  weightText: string
  notes: string
  formGuidance: string
  muscleGroup: string
  mainMuscle: string
  invalidSetsNumber?: boolean
}

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

export interface SessionTemplate {
  sets?: number
  repsText?: string
  weightText?: string
  perSet?: Array<{
    repsText?: string
    weightText?: string
  }>
  notes?: string
  formGuidance?: string
  displayName?: string // UI name without changing match key
}

export interface PerSetEditPayload {
  sessionName: string
  exerciseName: string
  setIndex: number
  repsText: string
  weightText: string
}

export interface UndoRecord {
  kind: 'sets' | 'flat' | 'perSet'
  prevValue: unknown
  nextValue: unknown
  timestamp: number
}

export interface TemplatesState {
  [sessionName: string]: {
    [exerciseName: string]: SessionTemplate
  }
}

export interface TimersState {
  countdown?: {
    remainingMs: number
    initialMs: number
    isRunning: boolean
  }
  stopwatch?: {
    elapsedMs: number
    isRunning: boolean
  }
}

export type SessionCompletion = {
  completed: boolean
  completedAt: number
}

/**
 * Global application state stored in localStorage
 */
export interface GTState {
  panel: string
  csvText?: string
  parsedRows?: any[] // Accept both CsvRow[] and ParsedRow[]
  sessionNames?: string[]
  selectedSessions: string[]
  currentSessionIndex: number
  currentExerciseIndex: Record<string, number>
  checkedSets: Record<string, Record<string, boolean[]>>
  sessionTemplates: TemplatesState
  timers: TimersState
  version?: number

  csvMeta?: { sessionsCount: number; uploadedAt: number }
  sessionCompletion?: Record<string, SessionCompletion>
}
