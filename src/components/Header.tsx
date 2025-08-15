
import TimerButton from './TimerButton'

interface HeaderProps {
  onReset: () => void
  onExit?: () => void
  onGoToLanding?: () => void
  dimmerActive: boolean
  onToggleDimmer: () => void
}

function Header({ onReset, onExit, onGoToLanding, dimmerActive, onToggleDimmer }: HeaderProps) {
  const handleExit = () => {
    if (onExit) {
      onExit()
    } else {
      // Fallback to reset if no exit handler provided
      onReset()
    }
  }

  const handleGoToLanding = () => {
    if (onGoToLanding) {
      onGoToLanding()
    }
  }

  return (
    <>
      <header className="iphone-header safe-top bg-zinc-900 shadow-sm sticky top-0 z-10" data-landing-header>
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center min-w-0 space-x-2">
              <span className="material-symbols-outlined text-purple-400" style={{ fontSize: '32px' }} data-landing-logo>electric_bolt</span>
              <h1 
                className="text-xl sm:text-2xl font-bold text-white ml-2 tracking-tight cursor-pointer hover:text-purple-400 transition-colors truncate"
                onClick={handleGoToLanding}
                title="Go to landing"
              >
                motion
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
              <button 
                onClick={handleExit}
                className="flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full p-1.5 transition-colors min-w-[44px] min-h-[44px]"
                data-pressable
                aria-label="Go back to previous screen"
                title="Go back"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button 
                onClick={onToggleDimmer}
                className={`flex items-center justify-center rounded-full p-1.5 transition-colors min-w-[44px] min-h-[44px] ${
                  dimmerActive 
                    ? 'text-purple-400 bg-purple-500/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                data-pressable
                aria-label={dimmerActive ? "Disable dark mode" : "Enable dark mode"}
                title={dimmerActive ? "Disable dark mode" : "Enable dark mode"}
              >
                <span className="material-symbols-outlined">dark_mode</span>
              </button>

              <TimerButton />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export default Header
