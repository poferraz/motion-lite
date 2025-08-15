import { ExerciseVM } from './selectors'

/**
 * Check if a session is fully complete based on checked sets
 */
export function isSessionFullyComplete(exercises: ExerciseVM[], checkedSets: Record<string, boolean[]>): boolean {
  if (!exercises.length) return false
  
  return exercises.every(exercise => {
    const exerciseSets = checkedSets[exercise.id] || []
    const completedSets = exerciseSets.filter(Boolean).length
    return completedSets >= exercise.sets
  })
}
