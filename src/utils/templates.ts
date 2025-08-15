import { getState, updateState } from './storage'

/**
 * Update flat template values for an exercise
 */
export function updateFlat(sessionName: string, exerciseName: string, updates: Record<string, any>): void {
  try {
    const existing = getState()
    const sessionTemplates = existing.sessionTemplates || {}
    const sessionTemplate = sessionTemplates[sessionName] || {}
    const exerciseTemplate = sessionTemplate[exerciseName] || {}
    
    const updatedTemplate = { ...exerciseTemplate, ...updates }
    sessionTemplate[exerciseName] = updatedTemplate
    sessionTemplates[sessionName] = sessionTemplate
    
    updateState({ sessionTemplates })
  } catch (error) {
    console.error('Failed to update template', error)
  }
}

/**
 * Set sets count for an exercise template
 */
export function setSets(sessionName: string, exerciseName: string, sets: number): void {
  updateFlat(sessionName, exerciseName, { sets })
}
