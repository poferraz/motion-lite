import { useState } from 'react'
import TimersModal from './TimersModal'

function TimerButton() {
  const [showTimers, setShowTimers] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowTimers(true)}
        className="flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full p-1.5 transition-colors"
        data-pressable
        aria-label="Open timers"
      >
        <span className="material-symbols-outlined">timer</span>
      </button>

      {showTimers && (
        <TimersModal
          isOpen={showTimers}
          onClose={() => setShowTimers(false)}
        />
      )}
    </>
  )
}

export default TimerButton
