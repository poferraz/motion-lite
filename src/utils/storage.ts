import { GTState } from './types'

const STORAGE_KEY = 'motion_lite_state'
const SCHEMA_VERSION = 1

// Default state structure
const DEFAULT_STATE: GTState = {
  panel: 'landing',
  csvText: undefined,
  parsedRows: undefined,
  sessionNames: undefined,
  selectedSessions: [],
  currentSessionIndex: 0,
  currentExerciseIndex: {},
  checkedSets: {},
  sessionTemplates: {},
  timers: {
    countdown: { remainingMs: 0, initialMs: 0, isRunning: false },
    stopwatch: { elapsedMs: 0, isRunning: false }
  },
  version: SCHEMA_VERSION,
  csvMeta: undefined,
  sessionCompletion: {}
}

/**
 * Get the current state from localStorage
 */
export function getState(): GTState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      console.log('No stored state found, using default')
      return { ...DEFAULT_STATE }
    }

    const parsed = JSON.parse(stored)
    console.log('Retrieved state from localStorage:', parsed)

    // Validate version compatibility
    if (parsed.version !== SCHEMA_VERSION) {
      console.log('Version mismatch, clearing old state')
      clearAll()
      return { ...DEFAULT_STATE }
    }

    // Merge with defaults to ensure all required fields exist
    const mergedState = { ...DEFAULT_STATE, ...parsed }
    console.log('Merged state:', mergedState)
    return mergedState

  } catch (error) {
    console.error('Failed to load state from localStorage:', error)
    return { ...DEFAULT_STATE }
  }
}

/**
 * Save state to localStorage immediately
 */
export function setState(state: GTState): void {
  try {
    console.log('Saving state to localStorage:', state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    console.log('State saved successfully')
  } catch (error) {
    console.error('Failed to save state to localStorage:', error)
  }
}

/**
 * Update specific fields in the state
 */
export function updateState(updates: Partial<GTState>): void {
  try {
    const currentState = getState()
    const newState = { ...currentState, ...updates }
    setState(newState)
  } catch (error) {
    console.error('Failed to update state:', error)
  }
}

/**
 * Clear all stored data
 */
export function clearAll(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('All stored data cleared')
  } catch (error) {
    console.error('Failed to clear stored data:', error)
  }
}

/**
 * Check if CSV data exists
 */
export function hasCsv(): boolean {
  try {
    const state = getState()
    return !!(state.csvText && state.parsedRows && state.parsedRows.length > 0)
  } catch (error) {
    console.error('Failed to check CSV availability:', error)
    return false
  }
}

/**
 * Get CSV metadata
 */
export function getCsvMeta(): { sessionsCount: number; uploadedAt: number } | null {
  try {
    const state = getState()
    return state.csvMeta || null
  } catch (error) {
    console.error('Failed to get CSV metadata:', error)
    return null
  }
}

/**
 * Set CSV metadata
 */
export function setCsvMeta(meta: { sessionsCount: number; uploadedAt: number }): void {
  updateState({ csvMeta: meta })
}

/**
 * Get session completion data
 */
export function getSessionCompletion(): Record<string, { completed: boolean; completedAt: number }> {
  try {
    const state = getState()
    return state.sessionCompletion || {}
  } catch (error) {
    console.error('Failed to get session completion:', error)
    return {}
  }
}

/**
 * Set session completion
 */
export function setSessionCompletion(sessionName: string, completed: boolean): void {
  try {
    const currentState = getState()
    const sessionCompletion = currentState.sessionCompletion || {}
    const updatedCompletion = {
      ...sessionCompletion,
      [sessionName]: { completed, completedAt: Date.now() }
    }
    updateState({ sessionCompletion: updatedCompletion })
  } catch (error) {
    console.error('Failed to set session completion:', error)
  }
}

/**
 * Get timers state
 */
export function getTimers() {
  try {
    const state = getState()
    return state.timers || DEFAULT_STATE.timers
  } catch (error) {
    console.error('Failed to get timers:', error)
    return DEFAULT_STATE.timers
  }
}

/**
 * Load timers state (alias for getTimers for compatibility)
 */
export function loadTimers() {
  return getTimers()
}

/**
 * Save timers state
 */
export function saveTimers(timers: Partial<typeof DEFAULT_STATE.timers>): void {
  try {
    const currentState = getState()
    const updatedTimers = { ...currentState.timers, ...timers }
    updateState({ timers: updatedTimers })
  } catch (error) {
    console.error('Failed to save timers:', error)
  }
}


