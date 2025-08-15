import { getState, updateState, clearAll } from './storage'
import { CsvRow, GTState } from './types'

/**
 * Simple, direct storage actions that work immediately
 */
export const storageActions = {
  /**
   * Set the current panel
   */
  setPanel: (panel: string): void => {
    try {
      console.log('Setting panel:', panel)
      updateState({ panel })
    } catch (error) {
      console.error('Failed to set panel:', error)
    }
  },

  /**
   * Set CSV data (upload or replace)
   */
  setCsvData: (csvText: string, parsedRows: CsvRow[], sessionNames: string[]): void => {
    try {
      console.log('Setting CSV data:', { csvText: csvText.substring(0, 100) + '...', parsedRows: parsedRows.length, sessionNames })
      updateState({ 
        csvText, 
        parsedRows, 
        sessionNames,
        // Reset related state when CSV changes
        selectedSessions: [],
        currentSessionIndex: 0,
        currentExerciseIndex: {},
        checkedSets: {}
      })
    } catch (error) {
      console.error('Failed to set CSV data:', error)
    }
  },

  /**
   * Set selected workout sessions
   */
  setSelectedSessions: (sessions: string[]): void => {
    try {
      console.log('Setting selected sessions:', sessions)
      updateState({ selectedSessions: sessions })
    } catch (error) {
      console.error('Failed to set selected sessions:', error)
    }
  },

  /**
   * Set session completion status
   */
  setSessionCompletion: (sessionName: string, completed: boolean): void => {
    try {
      console.log('Setting session completion:', { sessionName, completed })
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
  },

  /**
   * Set timers state
   */
  setTimers: (timers: Partial<GTState['timers']>): void => {
    try {
      console.log('Setting timers:', timers)
      const currentState = getState()
      const updatedTimers = { ...currentState.timers, ...timers }
      updateState({ timers: updatedTimers })
    } catch (error) {
      console.error('Failed to set timers:', error)
    }
  },

  /**
   * Set version for schema compatibility
   */
  setVersion: (version: number): void => {
    try {
      console.log('Setting version:', version)
      updateState({ version })
    } catch (error) {
      console.error('Failed to set version:', error)
    }
  },

  /**
   * Set CSV metadata
   */
  setCsvMeta: (meta: { sessionsCount: number; uploadedAt: number }): void => {
    try {
      console.log('Setting CSV metadata:', meta)
      updateState({ csvMeta: meta })
    } catch (error) {
      console.error('Failed to set CSV metadata:', error)
    }
  },

  /**
   * Clear all stored data
   */
  clearAll: (): void => {
    try {
      console.log('Clearing all data')
      clearAll()
    } catch (error) {
      console.error('Failed to clear all data:', error)
    }
  }
}
