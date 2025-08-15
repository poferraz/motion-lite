import React, { useState, useRef, useEffect, useMemo } from 'react'
import type { ExerciseLibraryEntry } from '../App'
import gsap from 'gsap'

interface BuilderPanelProps {
  exerciseLibrary: ExerciseLibraryEntry[] | null
  onBack: () => void
}

const BODY_PARTS = ['core', 'upper body', 'lower body', 'full body'] as const
const EXERCISE_TYPES = ['main', 'warm-up', 'cool-down', 'mobility', 'plyometric', 'rehab'] as const
const LEVELS = ['beginner', 'intermediate', 'expert'] as const

const BODY_PART_MUSCLES: Record<string, string[]> = {
  'core': ['abdominals', 'lower back'],
  'upper body': ['biceps', 'chest', 'forearms', 'lats', 'middle back', 'neck', 'shoulders', 'traps', 'triceps'],
  'lower body': ['abductors', 'adductors', 'calves', 'glutes', 'hamstrings', 'quadriceps'],
  'full body': [], // Will be handled as 'all muscles'
}

const getEquipmentOptions = (library: ExerciseLibraryEntry[] | null) => {
  if (!library) return []
  const set = new Set<string>()
  library.forEach(e => { if (e.equipment) set.add(e.equipment) })
  return Array.from(set)
}

const getMusclesForBodyPart = (library: ExerciseLibraryEntry[] | null, bodyPart: string) => {
  if (!library || !bodyPart) return []
  if (bodyPart === 'full body') {
    // All unique muscles in the library
    const set = new Set<string>()
    library.forEach(e => e.primaryMuscles.forEach(m => set.add(m)))
    return Array.from(set)
  }
  // Only muscles from this body part, and only if present in the library
  const allowed = new Set(BODY_PART_MUSCLES[bodyPart] || [])
  const set = new Set<string>()
  library.forEach(e => e.primaryMuscles.forEach(m => { if (allowed.has(m)) set.add(m) }))
  return Array.from(set)
}

const BuilderPanel: React.FC<BuilderPanelProps> = ({ exerciseLibrary, onBack }) => {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    bodyPart: '',
    muscles: [] as string[],
    exerciseType: '',
    equipment: '',
    level: '',
    selectedExercises: [] as ExerciseLibraryEntry[],
  })
  const [filtered, setFiltered] = useState<ExerciseLibraryEntry[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const qRef = useRef<HTMLDivElement>(null)

  // Animate in on step change
  useEffect(() => {
    if (qRef.current) {
      gsap.fromTo(qRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
    }
  }, [step, showSummary])

  // Filter exercises when all answers are chosen
  useEffect(() => {
    if (
      answers.bodyPart &&
      answers.muscles.length > 0 &&
      answers.exerciseType &&
      answers.equipment &&
      answers.level &&
      exerciseLibrary
    ) {
      const filtered = exerciseLibrary.filter(e =>
        e.bodyPart === answers.bodyPart &&
        answers.muscles.some(m => e.primaryMuscles.includes(m)) &&
        e.exerciseType === answers.exerciseType &&
        (answers.equipment === 'any' || e.equipment === answers.equipment) &&
        e.level === answers.level
      )
      setFiltered(filtered)
    }
  }, [answers, exerciseLibrary])

  // Step content
  const steps = [
    {
      question: 'Which body part do you want to focus on?',
      options: BODY_PARTS,
      key: 'bodyPart',
      render: (options: string[]) => (
        <div className="grid grid-cols-2 gap-2">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => handleOption('bodyPart', opt)}
              className="py-1.5 px-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 rounded-md text-white font-semibold shadow hover:scale-105 transition-transform"
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      )
    },
    {
      question: 'Which muscle(s)?',
      options: useMemo(() => getMusclesForBodyPart(exerciseLibrary, answers.bodyPart), [exerciseLibrary, answers.bodyPart]),
      key: 'muscles',
      render: (options: string[]) => (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-zinc-400">Selected: {answers.muscles.length}</div>
            <div className="space-x-1">
              <button
                type="button"
                onClick={() => selectAllMuscles(options)}
                className="py-1 px-2 text-xs rounded-md border border-zinc-600 text-zinc-200 hover:bg-zinc-800"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearMuscles}
                className="py-1 px-2 text-xs rounded-md border border-zinc-600 text-zinc-200 hover:bg-zinc-800"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {options.length === 0 && <div className="text-zinc-400 col-span-2">No options available.</div>}
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => handleMuscleToggle(opt)}
                className={`py-1.5 px-2 text-sm rounded-md border flex items-center justify-between ${answers.muscles.includes(opt) ? 'border-purple-500 bg-purple-500/20' : 'border-zinc-700 bg-zinc-800'} text-white font-semibold shadow hover:scale-105 transition-transform`}
              >
                <span>{opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
                {answers.muscles.includes(opt) && <span className="ml-2 text-green-400 font-bold">✓</span>}
              </button>
            ))}
          </div>
          <button
            onClick={handleNextMuscles}
            disabled={answers.muscles.length === 0}
            className="w-full py-1.5 text-sm bg-gradient-to-r from-blue-500 to-purple-500 rounded-md text-white font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </>
      )
    },
    {
      question: 'What type of exercise?',
      options: EXERCISE_TYPES,
      key: 'exerciseType',
      render: (options: string[]) => (
        <div className="grid grid-cols-2 gap-2">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => handleOption('exerciseType', opt)}
              className="py-1.5 px-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 rounded-md text-white font-semibold shadow hover:scale-105 transition-transform"
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      )
    },
    {
      question: 'What equipment do you have?',
      options: ['any', ...getEquipmentOptions(exerciseLibrary)],
      key: 'equipment',
      render: (options: string[]) => (
        <div className="grid grid-cols-2 gap-2">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => handleOption('equipment', opt)}
              className="py-1.5 px-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 rounded-md text-white font-semibold shadow hover:scale-105 transition-transform"
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      )
    },
    {
      question: 'What is your level?',
      options: LEVELS,
      key: 'level',
      render: (options: string[]) => (
        <div className="grid grid-cols-2 gap-2">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => handleOption('level', opt)}
              className="py-1.5 px-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 rounded-md text-white font-semibold shadow hover:scale-105 transition-transform"
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      )
    },
  ]

  function handleOption(key: string, value: string) {
    if (key === 'bodyPart') {
      setAnswers(prev => ({ ...prev, [key]: value, muscles: [] }))
    } else {
      setAnswers(prev => ({ ...prev, [key]: value }))
    }
    gsap.to(qRef.current, { opacity: 0, y: -40, duration: 0.4, ease: 'power2.in', onComplete: () => setStep(s => s + 1) })
  }

  function handleMuscleToggle(muscle: string) {
    setAnswers(prev => {
      const exists = prev.muscles.includes(muscle)
      return {
        ...prev,
        muscles: exists ? prev.muscles.filter(m => m !== muscle) : [...prev.muscles, muscle]
      }
    })
  }

  function handleNextMuscles() {
    gsap.to(qRef.current, { opacity: 0, y: -40, duration: 0.4, ease: 'power2.in', onComplete: () => setStep(s => s + 1) })
  }

  function selectAllMuscles(options: string[]) {
    if (!options?.length) return
    setAnswers(prev => ({ ...prev, muscles: options }))
  }

  function clearMuscles() {
    setAnswers(prev => ({ ...prev, muscles: [] }))
  }

  const handleExerciseSelect = (ex: ExerciseLibraryEntry) => {
    setAnswers(prev => {
      const exists = prev.selectedExercises.find(e => e.id === ex.id)
      return exists
        ? { ...prev, selectedExercises: prev.selectedExercises.filter(e => e.id !== ex.id) }
        : { ...prev, selectedExercises: [...prev.selectedExercises, ex] }
    })
  }

  const handleFinish = () => {
    gsap.to(qRef.current, { opacity: 0, y: -40, duration: 0.4, ease: 'power2.in', onComplete: () => setShowSummary(true) })
  }

  const handleRestart = () => {
    setAnswers({ bodyPart: '', muscles: [], exerciseType: '', equipment: '', level: '', selectedExercises: [] })
    setStep(0)
    setShowSummary(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-2">
      <h1 className="text-2xl font-bold mb-2">Build Your Workout</h1>
      <button
        onClick={onBack}
        className="absolute left-4 top-4 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-lg transition-colors text-sm"
      >
        Back
      </button>
      <div className="w-full max-w-md mt-4 overflow-y-auto max-h-[70vh] p-1 rounded-lg bg-zinc-900">
        {!showSummary ? (
          <div ref={qRef}>
            {step < steps.length ? (
              <>
                <div className="text-lg font-semibold mb-4 text-center">{steps[step].question}</div>
                {steps[step].render(steps[step].options)}
              </>
            ) : (
              <>
                <div className="text-lg font-semibold mb-4 text-center">Select exercises for your workout</div>
                {filtered.length === 0 ? (
                  <div className="text-zinc-400 mb-4">No exercises found for your criteria.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 mb-4 max-h-60 overflow-y-auto pr-1" style={{ scrollbarGutter: 'stable' }}>
                    {filtered.map(ex => (
                      <button
                        key={ex.id}
                        onClick={() => handleExerciseSelect(ex)}
                        className={`py-1.5 px-2 rounded-md border ${answers.selectedExercises.find(e => e.id === ex.id) ? 'border-purple-500 bg-purple-500/20' : 'border-zinc-700 bg-zinc-800'} text-white text-left shadow hover:scale-105 transition-transform text-sm`}
                      >
                        <div className="font-semibold">{ex.name}</div>
                        <div className="text-xs text-zinc-400 mt-1">{ex.primaryMuscles.join(', ')}</div>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleFinish}
                  disabled={answers.selectedExercises.length === 0}
                  className="w-full py-1.5 text-sm bg-gradient-to-r from-blue-500 to-purple-500 rounded-md text-white font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Finish &amp; See Summary
                </button>
              </>
            )}
          </div>
        ) : (
          <div ref={qRef}>
            <div className="text-lg font-semibold mb-4 text-center">Your Custom Workout</div>
            {answers.selectedExercises.length === 0 ? (
              <div className="text-zinc-400 mb-4">No exercises selected.</div>
            ) : (
              <ul className="mb-4">
                {answers.selectedExercises.map(ex => (
                  <li key={ex.id} className="mb-1">
                    <span className="font-semibold text-purple-400">{ex.name}</span>
                    <span className="text-zinc-400 text-xs ml-2">({ex.primaryMuscles.join(', ')})</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={handleRestart}
              className="w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-md transition-colors text-sm"
            >
              Build Another Workout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BuilderPanel
