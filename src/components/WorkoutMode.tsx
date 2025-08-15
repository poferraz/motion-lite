import { useState, useEffect, useMemo, useRef } from 'react'
import { buildTodaySessions } from '../utils/selectors'
import { getState, updateState } from '../utils/storage'
import { 
  updateFlat, 
  setSets
} from '../utils/templates'
import { isSessionFullyComplete } from '../utils/progress'

import { CsvRow } from '../App'

interface WorkoutModeProps {
  parsedRows: CsvRow[]
  selectedSessions: string[]
  onClose: () => void
}

interface ExerciseUpdate {
  sets?: number
  repsText?: string
  weightText?: string
  notes?: string
  formGuidance?: string
  displayName?: string
}

function WorkoutMode({ parsedRows, selectedSessions, onClose }: WorkoutModeProps) {
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<Record<string, number>>({})
  const [checkedSets, setCheckedSets] = useState<Record<string, Record<string, boolean[]>>>({})
  const [showSuccessFlash, setShowSuccessFlash] = useState(false)
  const [notesCollapsed, setNotesCollapsed] = useState(true)
  const [formCollapsed, setFormCollapsed] = useState(true)
  const [editingField, setEditingField] = useState<'sets' | 'reps' | 'weight' | null>(null)
  const [editValue, setEditValue] = useState('')
  const [exerciseUpdates, setExerciseUpdates] = useState<Record<string, Record<string, ExerciseUpdate>>>({})
  const suppressBlurSaveRef = useRef(false)


  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = getState()
      if (savedState.currentSessionIndex !== undefined) {
        setCurrentSessionIndex(savedState.currentSessionIndex)
      }
      if (savedState.currentExerciseIndex) {
        setCurrentExerciseIndex(savedState.currentExerciseIndex)
      }
      if (savedState.checkedSets) {
        setCheckedSets(savedState.checkedSets)
      }
      
      // Load exercise updates from localStorage
      if (savedState.sessionTemplates) {
        setExerciseUpdates(savedState.sessionTemplates)
      }
    } catch (error) {
      console.warn('Failed to load workout state from localStorage')
    }
  }, [])

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      updateState({
        currentSessionIndex,
        currentExerciseIndex,
        checkedSets
      })
    } catch (error) {
      console.error('Failed to save workout state to localStorage', error)
    }
  }, [currentSessionIndex, currentExerciseIndex, checkedSets])



  // Build today's sessions from selected sessions
  const todaySessions = useMemo(() => {
    return buildTodaySessions(parsedRows, selectedSessions)
  }, [parsedRows, selectedSessions])

  const currentSession = todaySessions[currentSessionIndex] || { name: '', exercises: [] }
  const currentExercise = currentSession.exercises[currentExerciseIndex[currentSession.name] || 0]
  
  // Debug: Log muscle data when exercise changes
  useEffect(() => {
    if (currentExercise) {
      console.log('Exercise muscle data:', {
        name: currentExercise.name,
        muscleGroup: currentExercise.muscleGroup,
        mainMuscle: currentExercise.mainMuscle,
        hasMuscleGroup: !!currentExercise.muscleGroup,
        hasMainMuscle: !!currentExercise.mainMuscle
      })
    }
  }, [currentExercise])
  
  // Get the current exercise with template overrides and local updates
  const getCurrentExerciseWithTemplates = useMemo(() => {
    if (!currentExercise) return null
    
    try {
      const savedState = getState()
      const sessionTemplates = savedState.sessionTemplates || {}
      const sessionTemplate = sessionTemplates[currentSession.name] || {}
      const exerciseTemplate = sessionTemplate[currentExercise.name] || {}
      
      // Get local updates for this exercise
      const localUpdates = exerciseUpdates[currentSession.name]?.[currentExercise.name] || {}
      
      // Merge original exercise data with template overrides and local updates
      return {
        ...currentExercise,
        sets: localUpdates.sets || exerciseTemplate.sets || currentExercise.sets,
        repsText: localUpdates.repsText || exerciseTemplate.repsText || currentExercise.repsText,
        weightText: localUpdates.weightText || exerciseTemplate.weightText || currentExercise.weightText,
        notes: localUpdates.notes || exerciseTemplate.notes || currentExercise.notes,
        formGuidance: localUpdates.formGuidance || exerciseTemplate.formGuidance || currentExercise.formGuidance,
        displayName: localUpdates.displayName || exerciseTemplate.displayName || currentExercise.name,
        muscleGroup: currentExercise.muscleGroup,
        mainMuscle: currentExercise.mainMuscle
      }
    } catch (error) {
      console.warn('Failed to load template data')
      return currentExercise
    }
  }, [currentExercise, currentSession.name, exerciseUpdates])
  
  // Check if session is fully complete
  const isSessionComplete = useMemo(() => {
    if (!currentSession.exercises.length) return false
    
    const checkedSetsByExerciseId: Record<string, boolean[]> = {}
    currentSession.exercises.forEach(exercise => {
      checkedSetsByExerciseId[exercise.id] = checkedSets[currentSession.name]?.[exercise.id] || []
    })
    
    return isSessionFullyComplete(currentSession.exercises, checkedSetsByExerciseId)
  }, [currentSession.exercises, checkedSets, currentSession.name])

  // Removed unused areAllSessionsComplete variable

  // Calculate session progress
  const sessionProgress = useMemo(() => {
    if (!currentSession.exercises.length) return 0
    
    let totalSets = 0
    let completedSets = 0
    
    currentSession.exercises.forEach(exercise => {
      totalSets += exercise.sets
      const exerciseSets = checkedSets[currentSession.name]?.[exercise.id] || []
      completedSets += exerciseSets.filter(Boolean).length
    })
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
  }, [currentSession.exercises, checkedSets, currentSession.name])

  const handleExerciseChange = (index: number) => {
    setCurrentExerciseIndex(prev => ({
      ...prev,
      [currentSession.name]: index
    }))
  }

  const handleSetToggle = (sessionName: string, exerciseId: string, setIndex: number, checked: boolean) => {
    setCheckedSets(prev => {
      const sessionSets = prev[sessionName] || {}
      const exerciseSets = sessionSets[exerciseId] || []
      const newExerciseSets = [...exerciseSets]
      newExerciseSets[setIndex] = checked
      
      return {
        ...prev,
        [sessionName]: {
          ...sessionSets,
          [exerciseId]: newExerciseSets
        }
      }
    })

    // Auto-advance if all sets are checked
    if (checked && currentExercise) {
      const updatedExerciseSets = [...(checkedSets[sessionName]?.[exerciseId] || [])]
      updatedExerciseSets[setIndex] = checked
      
      const allSetsChecked = Array.from({ length: currentExercise.sets }, (_, i) => {
        return updatedExerciseSets[i] || false
      }).every(Boolean)

      if (allSetsChecked) {
        setTimeout(() => {
          const currentExerciseIdx = currentExerciseIndex[currentSession.name] || 0
          if (currentExerciseIdx < currentSession.exercises.length - 1) {
            handleExerciseChange(currentExerciseIdx + 1)
          }
        }, 500)
      }
    }
  }

  const handleCompleteSession = () => {
    if (isSessionComplete) {
      // Update session completion in localStorage
      const currentState = getState()
      const sessionCompletion = currentState.sessionCompletion || {}
      const updatedCompletion = {
        ...sessionCompletion,
        [currentSession.name]: { completed: true, completedAt: Date.now() }
      }
      updateState({ sessionCompletion: updatedCompletion })
      
      // Show success flash
      setShowSuccessFlash(true)
      setTimeout(() => setShowSuccessFlash(false), 2000)

      // Navigate to next session or back to landing
      if (currentSessionIndex < todaySessions.length - 1) {
        // Go to next session
        setCurrentSessionIndex(currentSessionIndex + 1)
        setCurrentExerciseIndex(prev => ({
          ...prev,
          [todaySessions[currentSessionIndex + 1].name]: 0
        }))
      } else {
        // All sessions complete, go back to landing
        onClose()
      }
    }
  }

  const handleNextSession = () => {
    if (currentSessionIndex < todaySessions.length - 1) {
      setCurrentSessionIndex(currentSessionIndex + 1)
      setCurrentExerciseIndex(prev => ({
        ...prev,
        [todaySessions[currentSessionIndex + 1].name]: 0
      }))
    }
  }

  const handlePreviousSession = () => {
    if (currentSessionIndex > 0) {
      setCurrentSessionIndex(currentSessionIndex - 1)
      setCurrentExerciseIndex(prev => ({
        ...prev,
        [todaySessions[currentSessionIndex - 1].name]: 0
      }))
    }
  }

  const handleSetsChange = (newSets: number) => {
    if (currentExercise && newSets > 0) {
      // Update localStorage
      setSets(currentSession.name, currentExercise.name, newSets)
      
      // Update local state immediately for instant UI update
      setExerciseUpdates(prev => ({
        ...prev,
        [currentSession.name]: {
          ...prev[currentSession.name],
          [currentExercise.name]: {
            ...prev[currentSession.name]?.[currentExercise.name],
            sets: newSets
          }
        }
      }))
    }
  }

  const handleFieldEdit = (field: 'repsText' | 'weightText' | 'notes' | 'formGuidance', value: string) => {
    if (currentExercise) {
      // Update localStorage
      updateFlat(currentSession.name, currentExercise.name, { [field]: value })
      
      // Update local state immediately for instant UI update
      setExerciseUpdates(prev => ({
        ...prev,
        [currentSession.name]: {
          ...prev[currentSession.name],
          [currentExercise.name]: {
            ...prev[currentSession.name]?.[currentExercise.name],
            [field]: value
          }
        }
      }))
    }
  }

  const saveEdit = () => {
    if (!editingField || !currentExercise) return
    
    if (editingField === 'sets') {
      const sets = parseInt(editValue)
      if (!isNaN(sets) && sets > 0) {
        handleSetsChange(sets)
      }
    } else if (editingField === 'reps') {
      handleFieldEdit('repsText', editValue)
    } else if (editingField === 'weight') {
      handleFieldEdit('weightText', editValue)
    }
    
    setEditingField(null)
    setEditValue('')
  }

  const startEditing = (field: 'sets' | 'reps' | 'weight') => {
    setEditingField(field)
    const exerciseWithTemplates = getCurrentExerciseWithTemplates
    if (field === 'sets') {
      setEditValue(exerciseWithTemplates?.sets?.toString() || '1')
    } else if (field === 'reps') {
      setEditValue(exerciseWithTemplates?.repsText || '')
    } else if (field === 'weight') {
      setEditValue(exerciseWithTemplates?.weightText || '')
    }
  }

  const cancelEdit = () => {
    setEditingField(null)
    setEditValue('')
  }



  if (todaySessions.length === 0) {
    return (
      <div className="app-minscreen pt-[var(--safe-top)] bg-black">
        <div className="max-w-[430px] mx-auto h-full flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">No Sessions Selected</h2>
            <p className="text-zinc-400 mb-6">Please select at least one session to view workouts.</p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30"
            >
              Choose Sessions
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="workout-mode-full-height flex-1 flex flex-col bg-zinc-900 text-white">
      
      {/* Session Navigation */}
      {todaySessions.length > 1 && (
        <div className="mt-4 px-4 py-2 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handlePreviousSession}
              disabled={currentSessionIndex === 0}
              className="shrink-0 flex items-center text-xs sm:text-sm text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
              data-pressable
            >
              <span className="material-symbols-outlined mr-1">chevron_left</span>
              <span className="inline sm:hidden">Previous</span>
              <span className="hidden sm:inline">Previous Session</span>
            </button>
            
            <div className="flex-1 min-w-0 text-center px-1">
              <span className="block text-xs sm:text-sm font-medium text-white leading-tight whitespace-nowrap">
                Session {currentSessionIndex + 1} of {todaySessions.length}
              </span>
              <div className="text-[11px] sm:text-xs text-zinc-400 mt-1 truncate max-w-full">
                {currentSession.name}
              </div>
            </div>
            
            <button
              onClick={handleNextSession}
              disabled={currentSessionIndex === todaySessions.length - 1}
              className="shrink-0 flex items-center text-xs sm:text-sm text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
              data-pressable
            >
              <span className="inline sm:hidden">Next</span>
              <span className="hidden sm:inline">Next Session</span>
              <span className="material-symbols-outlined ml-1">chevron_right</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Progress Bar - Session Progress */}
      <div className="mt-4 px-4 py-2 border-b border-zinc-800 flex-shrink-0">
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300 shadow-lg shadow-purple-500/30" 
            style={{ width: `${sessionProgress}%` }}
          ></div>
        </div>
        <div className="text-center mt-1">
          <span className="text-sm text-zinc-400 font-medium">
            {sessionProgress}% Complete
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-3 pb-0 space-y-3 overflow-y-auto flex-1 bg-zinc-900">
        {currentExercise ? (
          <>
            {/* Exercise Name and Muscle Groups */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 text-center">
              <h1 className="text-3xl font-extrabold mb-3 text-white">{getCurrentExerciseWithTemplates?.name || currentExercise.name}</h1>

              <div className="flex flex-wrap justify-center gap-2">
                {currentExercise.muscleGroup ? (
                  <div className="bg-purple-500/20 text-purple-400 text-xs font-medium px-3 py-1 rounded-full inline-block border border-purple-500/30">
                    {currentExercise.muscleGroup}
                  </div>
                ) : null}
                {currentExercise.mainMuscle ? (
                  <div className="bg-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1 rounded-full inline-block border border-blue-500/30">
                    {currentExercise.mainMuscle}
                  </div>
                ) : null}
                {!currentExercise.muscleGroup && !currentExercise.mainMuscle ? (
                  <div className="bg-zinc-500/20 text-zinc-400 text-xs font-medium px-3 py-1 rounded-full inline-block border border-zinc-500/30">
                    Muscle Info
                  </div>
                ) : null}
              </div>
            </div>

            {/* Exercise Controls - Reps & Weight */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 mb-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Reps */}
                <div className="text-center">
                  <span className="text-sm text-zinc-400 font-medium">Reps</span>
                  {editingField === 'reps' ? (
                    <div className="mt-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            saveEdit()
                          } else if (e.key === 'Escape') {
                            e.preventDefault()
                            suppressBlurSaveRef.current = true
                            cancelEdit()
                          }
                        }}
                        onBlur={() => {
                          if (suppressBlurSaveRef.current) {
                            suppressBlurSaveRef.current = false
                            return
                          }
                          saveEdit()
                        }}
                        className="w-full text-center font-bold text-xl border border-zinc-700 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="6-8"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button 
                      onClick={() => startEditing('reps')}
                      className="w-full text-xl font-extrabold mt-1 hover:bg-zinc-800 rounded-xl py-3 transition-colors min-h-[3rem] flex items-center justify-center text-white"
                    >
                      {(() => {
                        const repsText = getCurrentExerciseWithTemplates?.repsText || currentExercise.repsText || '6-8'
                        
                        // Check if reps contains a number
                        const hasNumber = /\d/.test(repsText)
                        
                        if (hasNumber) {
                          // Try to split by dash for range format
                          const parts = repsText.trim().split(/[-–—]/)
                          if (parts.length >= 2 && /^\d+$/.test(parts[0].trim()) && /^\d+$/.test(parts[1].trim())) {
                            // Format: "6-8" or "10-12"
                            return (
                              <>
                                <span>{parts[0].trim()}</span>
                                <span className="text-base font-medium mx-1">-</span>
                                <span>{parts[1].trim()}</span>
                              </>
                            )
                          } else {
                            // Format: "6-8 reps" or "10-12 reps"
                            const rangeMatch = repsText.match(/(\d+)\s*[-–—]\s*(\d+)/)
                            if (rangeMatch) {
                              const min = rangeMatch[1]
                              const max = rangeMatch[2]
                              const unit = repsText.replace(rangeMatch[0], '').trim()
                              return (
                                <>
                                  <span>{min}</span>
                                  <span className="text-base font-medium mx-1">-</span>
                                  <span>{max}</span>
                                  {unit && <span className="text-base font-medium ml-1">{unit}</span>}
                                </>
                              )
                            }
                          }
                        }
                        
                        // Fallback: display as-is for non-numeric reps or other formats
                        return (
                          <span className="text-base font-medium px-2">{repsText}</span>
                        )
                      })()}
                    </button>
                  )}
                </div>

                {/* Weight */}
                <div className="text-center">
                  <span className="text-sm text-zinc-400 font-medium">Weight</span>
                  {editingField === 'weight' ? (
                    <div className="mt-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            saveEdit()
                          } else if (e.key === 'Escape') {
                            e.preventDefault()
                            suppressBlurSaveRef.current = true
                            cancelEdit()
                          }
                        }}
                        onBlur={() => {
                          if (suppressBlurSaveRef.current) {
                            suppressBlurSaveRef.current = false
                            return
                          }
                          saveEdit()
                        }}
                        className="w-full text-center font-bold text-xl border border-zinc-700 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="100 lb"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button 
                      onClick={() => startEditing('weight')}
                      className="w-full text-xl font-extrabold mt-1 hover:bg-zinc-800 rounded-xl py-3 transition-colors min-h-[3rem] flex items-center justify-center text-white"
                    >
                      {(() => {
                        const weightText = getCurrentExerciseWithTemplates?.weightText || currentExercise.weightText || '100 lb'
                        
                        // Check if weight contains a number
                        const hasNumber = /\d/.test(weightText)
                        
                        if (hasNumber) {
                          // Try to split by space for "number unit" format
                          const parts = weightText.trim().split(/\s+/)
                          if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
                            // Format: "100 lb" or "100lb"
                            return (
                              <>
                                <span>{parts[0]}</span>
                                <span className="text-base font-medium ml-1">{parts.slice(1).join(' ')}</span>
                              </>
                            )
                          } else {
                            // Format: "100lb" or other numeric formats
                            const numberMatch = weightText.match(/(\d+)/)
                            if (numberMatch) {
                              const number = numberMatch[1]
                              const unit = weightText.replace(number, '').trim()
                              return (
                                <>
                                  <span>{number}</span>
                                  {unit && <span className="text-base font-medium ml-1">{unit}</span>}
                                </>
                              )
                            }
                          }
                        }
                        
                        // Fallback: display as-is for non-numeric weights
                        return (
                          <span className="text-base font-medium px-2">{weightText}</span>
                        )
                      })()}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sets & Completed Sets - Unified */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 mb-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Sets */}
                <div className="text-center">
                  <span className="text-sm text-zinc-400 font-medium">Sets</span>
                  {editingField === 'sets' ? (
                    <div className="mt-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            saveEdit()
                          } else if (e.key === 'Escape') {
                            e.preventDefault()
                            suppressBlurSaveRef.current = true
                            cancelEdit()
                          }
                        }}
                        onBlur={() => {
                          if (suppressBlurSaveRef.current) {
                            suppressBlurSaveRef.current = false
                            return
                          }
                          saveEdit()
                        }}
                        className="w-full text-center font-bold text-xl border border-zinc-700 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="3"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button 
                      onClick={() => startEditing('sets')}
                      className="w-full text-xl font-extrabold mt-1 hover:bg-zinc-800 rounded-xl py-3 transition-colors min-h-[3rem] flex items-center justify-center text-white"
                    >
                      {(() => {
                        const setsText = getCurrentExerciseWithTemplates?.sets || currentExercise.sets || 1
                        
                        // Check if sets contains a number
                        const hasNumber = /\d/.test(setsText.toString())
                        
                        if (hasNumber) {
                          // For sets, we typically just show the number
                          const numberMatch = setsText.toString().match(/(\d+)/)
                          if (numberMatch) {
                            const number = numberMatch[1]
                            const unit = setsText.toString().replace(number, '').trim()
                            return (
                              <>
                                <span>{number}</span>
                                {unit && <span className="text-base font-medium ml-1">{unit}</span>}
                              </>
                            )
                          }
                        }
                        
                        // Fallback: display as-is for non-numeric sets or other formats
                        return (
                          <span className="text-base font-medium px-2">{setsText}</span>
                        )
                      })()}
                    </button>
                  )}
                </div>

                {/* Completed Sets */}
                <div className="text-center">
                  <span className="text-sm text-zinc-400 font-medium">Completed</span>
                  <div className="mt-1">
                    <div className="flex justify-center space-x-3">
                      {Array.from({ length: Math.max(1, getCurrentExerciseWithTemplates?.sets || currentExercise.sets || 1) }, (_, index) => {
                        const isChecked = (checkedSets[currentSession.name]?.[currentExercise.id]?.[index] || false)
                        return (
                          <button
                            key={index}
                            onClick={() => handleSetToggle(currentSession.name, currentExercise.id, index, !isChecked)}
                            className={`rounded-full w-14 h-14 flex items-center justify-center font-extrabold text-xl transition-colors ${
                              isChecked 
                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30' 
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                            }`}
                          >
                            {index + 1}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Form - Collapsible */}
            <div className="grid grid-cols-1 gap-3 mb-0">
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <button
                  onClick={() => setNotesCollapsed(!notesCollapsed)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-zinc-800 transition-colors"
                >
                  <h2 className="text-base font-semibold text-white">Notes</h2>
                  <span 
                    className={`material-symbols-outlined text-zinc-400 transition-transform ${notesCollapsed ? 'rotate-0' : 'rotate-180'}`}
                  >
                    expand_more
                  </span>
                </button>
                {!notesCollapsed && (
                  <div className="px-4 pb-4">
                    <div className="text-sm text-zinc-300 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                      {getCurrentExerciseWithTemplates?.notes || currentExercise.notes || ''}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <button
                  onClick={() => setFormCollapsed(!formCollapsed)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-zinc-800 transition-colors"
                >
                  <h2 className="text-base font-semibold text-white">Form</h2>
                  <span 
                    className={`material-symbols-outlined text-zinc-400 transition-transform ${formCollapsed ? 'rotate-0' : 'rotate-180'}`}
                  >
                    expand_more
                  </span>
                </button>
                {!formCollapsed && (
                  <div className="px-4 pb-4">
                    <div className="text-sm text-zinc-300 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                      {getCurrentExerciseWithTemplates?.formGuidance || currentExercise.formGuidance || ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400">
            No exercises in this session
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800 pt-4 pb-4 px-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
        <div className="flex space-x-4">
          <button
            onClick={() => handleExerciseChange((currentExerciseIndex[currentSession.name] || 0) - 1)}
            disabled={(currentExerciseIndex[currentSession.name] || 0) === 0}
            className="flex-1 bg-zinc-800 text-zinc-300 font-semibold py-3 rounded-xl hover:bg-zinc-700 hover:text-white disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors border border-zinc-700"
          >
            Previous Exercise
          </button>
          
          {isSessionComplete ? (
            <button
              onClick={handleCompleteSession}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-blue-500/30"
              data-pressable
            >
              {currentSessionIndex < todaySessions.length - 1 ? 'Next Session' : 'Complete Workout'}
            </button>
          ) : (
            <button
              onClick={() => handleExerciseChange((currentExerciseIndex[currentSession.name] || 0) + 1)}
              disabled={(currentExerciseIndex[currentSession.name] || 0) === currentSession.exercises.length - 1}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 rounded-xl hover:from-purple-600 hover:to-blue-600 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30"
              data-pressable
            >
              Next Exercise
            </button>
          )}
        </div>
      </footer>
      
      {/* Success Flash */}
      {showSuccessFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-pulse">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-8 py-6 rounded-2xl shadow-2xl transform transition-all duration-500 ease-out scale-100 border border-green-500/30">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto mb-4 w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center animate-bounce">
                <span className="material-symbols-outlined text-4xl text-white">check_circle</span>
              </div>
              
              {/* Success Message */}
              <h3 className="text-2xl font-bold mb-2 animate-pulse">
                Session Completed! 🎉
              </h3>
              <p className="text-green-100 text-sm">
                Great job! Keep up the momentum!
              </p>
              
              {/* Progress Bar */}
              <div className="mt-4 w-full bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
                <div className="bg-white h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutMode
