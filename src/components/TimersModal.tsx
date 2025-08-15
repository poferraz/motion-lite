import { useState, useEffect, useRef, useCallback } from 'react'
import { animateModalOpen } from '../utils/animations'
import { formatTime, formatCountdown } from '../utils/timers'
import { loadTimers, saveTimers } from '../utils/storage'

interface TimersModalProps {
  isOpen: boolean
  onClose: () => void
}

interface TimerState {
  countdown: {
    remainingMs: number
    initialMs: number
    isRunning: boolean
    targetTs: number | null
  }
  stopwatch: {
    elapsedMs: number
    isRunning: boolean
    startTs: number | null
  }
}

function TimersModal({ isOpen, onClose }: TimersModalProps) {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    const saved = loadTimers()
    return {
      countdown: {
        remainingMs: saved.countdown?.remainingMs || 0,
        initialMs: saved.countdown?.initialMs || 0,
        isRunning: false,
        targetTs: null
      },
      stopwatch: {
        elapsedMs: saved.stopwatch?.elapsedMs || 0,
        isRunning: false,
        startTs: null
      }
    }
  })

  const animationFrameRef = useRef<number>()
  const lastUpdateRef = useRef<number>(Date.now())

  // Timer tick loop
  const tick = useCallback(() => {
    const now = Date.now()
    const delta = now - lastUpdateRef.current
    lastUpdateRef.current = now

    setTimerState(prev => {
      let updated = false
      const newState = { ...prev }

      // Update countdown
      if (newState.countdown.isRunning && newState.countdown.targetTs) {
        const remaining = Math.max(0, newState.countdown.targetTs - now)
        if (remaining !== newState.countdown.remainingMs) {
          newState.countdown.remainingMs = remaining
          updated = true
        }
        
        // Auto-stop at zero
        if (remaining === 0) {
          newState.countdown.isRunning = false
          newState.countdown.targetTs = null
          // TODO: Add haptic vibration here
          updated = true
        }
      }

      // Update stopwatch
      if (newState.stopwatch.isRunning && newState.stopwatch.startTs) {
        const elapsed = newState.stopwatch.elapsedMs + delta
        if (Math.abs(elapsed - newState.stopwatch.elapsedMs) >= 10) { // Update every 10ms
          newState.stopwatch.elapsedMs = elapsed
          updated = true
        }
      }

      return updated ? newState : prev
    })

    // Continue loop if any timer is running
    if (timerState.countdown.isRunning || timerState.stopwatch.isRunning) {
      animationFrameRef.current = requestAnimationFrame(tick)
    }
  }, [timerState.countdown.isRunning, timerState.stopwatch.isRunning])

  // Start/stop animation loop
  useEffect(() => {
    if (timerState.countdown.isRunning || timerState.stopwatch.isRunning) {
      lastUpdateRef.current = Date.now()
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [timerState.countdown.isRunning, timerState.stopwatch.isRunning, tick])

  // Persist timer state
  useEffect(() => {
    if (isOpen) {
      saveTimers({
        countdown: {
          remainingMs: timerState.countdown.remainingMs,
          initialMs: timerState.countdown.initialMs,
          isRunning: timerState.countdown.isRunning
        },
        stopwatch: {
          elapsedMs: timerState.stopwatch.elapsedMs,
          isRunning: timerState.stopwatch.isRunning
        }
      })
    }
  }, [timerState, isOpen])

  // Countdown handlers
  const startCountdown = () => {
    if (timerState.countdown.remainingMs > 0) {
      setTimerState(prev => ({
        ...prev,
        countdown: {
          ...prev.countdown,
          isRunning: true,
          targetTs: Date.now() + prev.countdown.remainingMs
        }
      }))
    }
  }

  const stopCountdown = () => {
    setTimerState(prev => ({
      ...prev,
      countdown: {
        ...prev.countdown,
        isRunning: false,
        targetTs: null
      }
    }))
  }

  const resetCountdown = () => {
    setTimerState(prev => ({
      ...prev,
      countdown: {
        ...prev.countdown,
        remainingMs: prev.countdown.initialMs,
        isRunning: false,
        targetTs: null
      }
    }))
  }

  const add30Seconds = () => {
    setTimerState(prev => {
      const newRemaining = prev.countdown.remainingMs + 30000
      const newTarget = prev.countdown.isRunning && prev.countdown.targetTs 
        ? prev.countdown.targetTs + 30000 
        : null
      
      return {
        ...prev,
        countdown: {
          ...prev.countdown,
          remainingMs: newRemaining,
          targetTs: newTarget
        }
      }
    })
  }

  const setPreset = (minutes: number) => {
    const ms = minutes * 60 * 1000
    setTimerState(prev => ({
      ...prev,
      countdown: {
        ...prev.countdown,
        remainingMs: ms,
        initialMs: ms,
        isRunning: false,
        targetTs: null
      }
    }))
  }

  const setCustomSeconds = (seconds: number) => {
    const ms = seconds * 1000
    setTimerState(prev => ({
      ...prev,
      countdown: {
        ...prev.countdown,
        remainingMs: ms,
        initialMs: ms,
        isRunning: false,
        targetTs: null
      }
    }))
  }

  // Stopwatch handlers
  const startStopwatch = () => {
    setTimerState(prev => ({
      ...prev,
      stopwatch: {
        ...prev.stopwatch,
        isRunning: true,
        startTs: Date.now()
      }
    }))
  }

  const stopStopwatch = () => {
    setTimerState(prev => ({
      ...prev,
      stopwatch: {
        ...prev.stopwatch,
        isRunning: false,
        startTs: null
      }
    }))
  }

  const resetStopwatch = () => {
    setTimerState(prev => ({
      ...prev,
      stopwatch: {
        ...prev.stopwatch,
        elapsedMs: 0,
        isRunning: false,
        startTs: null
      }
    }))
  }

  const containerRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      animateModalOpen(containerRef.current, backdropRef.current)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        ref={backdropRef}
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        ref={containerRef}
        className="relative bg-zinc-900 rounded-t-2xl w-full max-w-[430px] max-h-[80vh] overflow-hidden border border-zinc-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="timers-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 id="timers-title" className="text-xl font-semibold text-white">
            Timers
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Close timers"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Countdown Section */}
          <section aria-labelledby="countdown-title">
            <h3 id="countdown-title" className="text-lg font-semibold text-white mb-4">
              Countdown
            </h3>
            
            {/* Preset Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(minutes => (
                <button
                  key={minutes}
                  onClick={() => setPreset(minutes)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black border border-zinc-700"
                  aria-label={`Set ${minutes} minute countdown`}
                >
                  {minutes}m
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                min="1"
                placeholder="Custom seconds"
                className="flex-1 px-3 py-2 border border-zinc-700 bg-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-zinc-400"
                aria-label="Custom countdown seconds"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = parseInt(e.currentTarget.value)
                    if (value > 0) setCustomSeconds(value)
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Custom seconds"]') as HTMLInputElement
                  const value = parseInt(input.value)
                  if (value > 0) setCustomSeconds(value)
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Set custom countdown"
              >
                Set
              </button>
            </div>

            {/* Time Display */}
            <div className="text-center mb-4">
              <div 
                className="text-3xl font-mono font-bold text-white"
                aria-live="polite"
                aria-label={`Countdown: ${formatCountdown(timerState.countdown.remainingMs)}`}
              >
                {formatCountdown(timerState.countdown.remainingMs)}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={startCountdown}
                disabled={timerState.countdown.remainingMs === 0 || timerState.countdown.isRunning}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-green-500/30 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Start countdown"
                aria-disabled={timerState.countdown.remainingMs === 0 || timerState.countdown.isRunning}
              >
                Start
              </button>
              <button
                onClick={stopCountdown}
                disabled={!timerState.countdown.isRunning}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-yellow-500/30 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Stop countdown"
                aria-disabled={!timerState.countdown.isRunning}
              >
                Stop
              </button>
              <button
                onClick={resetCountdown}
                disabled={timerState.countdown.remainingMs === 0}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:cursor-not-allowed text-zinc-300 hover:text-white font-medium rounded-xl transition-colors border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Reset countdown"
                aria-disabled={timerState.countdown.remainingMs === 0}
              >
                Reset
              </button>
            </div>

            {/* +30s Button */}
            <button
              onClick={add30Seconds}
              className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black border border-blue-500/30"
              aria-label="Add 30 seconds to countdown"
            >
              +30s
            </button>
          </section>

          {/* Stopwatch Section */}
          <section aria-labelledby="stopwatch-title">
            <h3 id="stopwatch-title" className="text-lg font-semibold text-white mb-4">
              Stopwatch
            </h3>
            
            {/* Time Display */}
            <div className="text-center mb-4">
              <div 
                className="text-4xl font-mono font-bold text-white"
                aria-live="polite"
                aria-label={`Stopwatch: ${formatTime(timerState.stopwatch.elapsedMs)}`}
              >
                {formatTime(timerState.stopwatch.elapsedMs)}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={startStopwatch}
                disabled={timerState.stopwatch.isRunning}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-green-500/30 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Start stopwatch"
                aria-disabled={timerState.stopwatch.isRunning}
              >
                Start
              </button>
              <button
                onClick={stopStopwatch}
                disabled={!timerState.stopwatch.isRunning}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-yellow-500/30 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Stop stopwatch"
                aria-disabled={!timerState.stopwatch.isRunning}
              >
                Stop
              </button>
              <button
                onClick={resetStopwatch}
                disabled={timerState.stopwatch.elapsedMs === 0}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:cursor-not-allowed text-zinc-300 hover:text-white font-medium rounded-xl transition-colors border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Reset stopwatch"
                aria-disabled={timerState.stopwatch.elapsedMs === 0}
              >
                Reset
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default TimersModal
