import { useState, useEffect, useRef, Suspense, useCallback, useMemo, createContext } from 'react'
import { animatePanelChange } from './utils/animations'
import Header from './components/Header'
import Dimmer from './components/Dimmer'
import { getState } from './utils/storage'
import { storageActions } from './utils/storageReducer'
import { LandingPanel, UploadPanel, SessionSelect, WorkoutMode } from './lazyComponents'
import BuilderPanel from './components/BuilderPanel'

// Constants
const SCHEMA_VERSION = 1
const STORAGE_DEBOUNCE_MS = 50
const FOCUS_DELAY_MS = 100

// Types
export type Panel = 'landing' | 'upload' | 'sessionSelect' | 'workout' | 'builder'

export type CsvRow = {
  Day: string
  Exercise: string
  Sets: string
  "Reps or Time": string
  Weight: string
  Notes?: string
  "Form Guidance"?: string
  "Muscle Group"?: string
  "Main Muscle"?: string
  "Day Type": string
}

interface ParsedData {
  rawCsvText: string
  parsedRows: CsvRow[]
  sessionNames: string[]
}

// Type for exercise library entry (based on new schema)
export interface ExerciseLibraryEntry {
  id: string;
  name: string;
  force: string | null;
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: 'isolation' | 'compound' | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  bodyPart: 'upper body' | 'lower body' | 'core' | 'full body';
  exerciseType: 'main' | 'warm-up' | 'cool-down' | 'mobility' | 'plyometric' | 'rehab';
  duration: string | null;
  repsRange: string | null;
  setsRange: string | null;
  videoUrl: string | null;
  tags: string[];
  source: string | null;
}

export const ExerciseLibraryContext = createContext<ExerciseLibraryEntry[] | null>(null);

// Custom hooks
const useAppState = () => {
  const [currentPanel, setCurrentPanel] = useState<Panel>('landing')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [dimmerActive, setDimmerActive] = useState(false)

  return {
    currentPanel,
    setCurrentPanel,
    parsedData,
    setParsedData,
    selectedSessions,
    setSelectedSessions,
    dimmerActive,
    setDimmerActive,
  }
}

const useStorageSync = (currentPanel: Panel) => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        storageActions.setPanel(currentPanel)
        // Keep URL in sync for refresh and share
        if (window.location.hash !== `#${currentPanel}`) {
          window.location.hash = `#${currentPanel}`
        }
      } catch (error) {
        console.error("Failed to persist panel", error)
      }
    }, STORAGE_DEBOUNCE_MS)
    
    return () => clearTimeout(timeoutId)
  }, [currentPanel])
}

const useInitialState = (
  setCurrentPanel: (panel: Panel) => void,
  setParsedData: (data: ParsedData | null) => void,
  setSelectedSessions: (sessions: string[]) => void
) => {
  useEffect(() => {
    try {
      const savedState = getState()
      
      if (!savedState) {
        storageActions.setVersion(SCHEMA_VERSION)
        return
      }
      
      if (savedState.version !== SCHEMA_VERSION) {
        // Ignore incompatible old state
        storageActions.clearAll()
        storageActions.setVersion(SCHEMA_VERSION)
        return
      } else {
        storageActions.setVersion(SCHEMA_VERSION)
      }
      
      // Restore panel state if sensible
      if (savedState.panel && savedState.panel !== 'workout') {
        setCurrentPanel(savedState.panel as Panel)
      }
      
      // Restore CSV data if available
      if (savedState.csvText && savedState.parsedRows) {
        setParsedData({
          rawCsvText: savedState.csvText,
          parsedRows: savedState.parsedRows,
          sessionNames: savedState.sessionNames || []
        })
      }
      
      // Restore selected sessions if available
      if (savedState.selectedSessions) {
        setSelectedSessions(savedState.selectedSessions)
      }
      
      // If we're trying to restore workout mode but no sessions selected, fall back to session select
      if (savedState.panel === 'workout' && (!savedState.selectedSessions || savedState.selectedSessions.length === 0)) {
        setCurrentPanel('sessionSelect')
      }
    } catch (error) {
      console.warn('Failed to load app state from localStorage')
    }
  }, [setCurrentPanel, setParsedData, setSelectedSessions])
}

const useHashNavigation = (setCurrentPanel: (panel: Panel) => void) => {
  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, "")
    const validPanels = new Set<Panel>(["landing", "upload", "sessionSelect", "workout"])
    
    if (validPanels.has(fromHash as Panel)) {
      setCurrentPanel(fromHash as Panel)
    }
  }, [setCurrentPanel])
}

const useFocusManagement = (mainRef: React.RefObject<HTMLDivElement>, currentPanel: Panel) => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Move focus to the first focusable element inside main after panel change
      const focusableElement = mainRef.current?.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      )
      focusableElement?.focus()
    }, FOCUS_DELAY_MS)
    
    return () => clearTimeout(timeoutId)
  }, [currentPanel, mainRef])
}

// Error boundary fallback component
const ErrorFallback = ({ 
  title, 
  message, 
  actionText, 
  onAction 
}: { 
  title: string
  message: string
  actionText: string
  onAction: () => void 
}) => (
  <div className="flex-1 flex items-center justify-center p-4">
    <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)] p-6 text-center max-w-sm">
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">{title}</h2>
      <p className="text-[var(--text-secondary)] mb-6">{message}</p>
      <button
        onClick={onAction}
        className="px-6 py-3 bg-[var(--brand-purple)] hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        aria-label={actionText}
      >
        {actionText}
      </button>
    </div>
  </div>
)

function App() {
  const {
    currentPanel,
    setCurrentPanel,
    parsedData,
    setParsedData,
    selectedSessions,
    setSelectedSessions,
    dimmerActive,
    setDimmerActive,
  } = useAppState()

  const mainRef = useRef<HTMLDivElement>(null)
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibraryEntry[] | null>(null);

  useEffect(() => {
    fetch('/ex-library/exercises.json')
      .then(res => res.json())
      .then(setExerciseLibrary)
      .catch(err => {
        console.error('Failed to load exercise library', err);
        setExerciseLibrary([]);
      });
  }, []);

  // Custom hooks for different concerns
  useStorageSync(currentPanel)
  useInitialState(setCurrentPanel, setParsedData, setSelectedSessions)
  useHashNavigation(setCurrentPanel)
  useFocusManagement(mainRef, currentPanel)

  // Animate panel changes
  useEffect(() => {
    animatePanelChange(mainRef.current)
  }, [currentPanel])

  // Always clear previously selected sessions when entering the sessionSelect panel
  useEffect(() => {
    if (currentPanel === 'sessionSelect') {
      setSelectedSessions([])
      try {
        storageActions.setSelectedSessions([])
      } catch (error) {
        console.warn('Failed to clear selected sessions')
      }
    }
  }, [currentPanel, setSelectedSessions])

  // Memoized computed values
  const canShowSessionSelect = useMemo(() => parsedData !== null, [parsedData])
  const canShowWorkoutMode = useMemo(() => 
    parsedData !== null && selectedSessions.length > 0, 
    [parsedData, selectedSessions]
  )

  // Event handlers
  const handleReset = useCallback(() => {
    setCurrentPanel('landing')
    setParsedData(null)
    setSelectedSessions([])
    storageActions.clearAll()
  }, [setCurrentPanel, setParsedData, setSelectedSessions])

  const handleUploadCSV = useCallback(() => {
    setCurrentPanel('upload')
  }, [setCurrentPanel])

  const handleUploadSuccess = useCallback((rawCsvText: string, parsedRows: CsvRow[], sessionNames: string[]) => {
    console.log('handleUploadSuccess called with:', { rawCsvText: rawCsvText.substring(0, 100) + '...', parsedRows: parsedRows.length, sessionNames })
    
    const newData = { rawCsvText, parsedRows, sessionNames }
    setParsedData(newData)
    
    // Save to localStorage
    try {
      console.log('Saving CSV data to localStorage...')
      storageActions.setCsvData(rawCsvText, parsedRows, sessionNames)
      storageActions.setPanel('landing')
      console.log('CSV data saved successfully')
    } catch (error) {
      console.error('Failed to save CSV data to localStorage:', error)
    }
    
    setCurrentPanel('landing')
  }, [setParsedData, setCurrentPanel])

  const handleReplaceCSV = useCallback(() => {
    setCurrentPanel('upload')
  }, [setCurrentPanel])

  const handleStartWorkoutMode = useCallback(() => {
    setCurrentPanel('sessionSelect')
  }, [setCurrentPanel])

  const handleSessionSelectContinue = useCallback((sessions: string[]) => {
    setSelectedSessions(sessions)
    
    // Save selected sessions to localStorage
    try {
      storageActions.setSelectedSessions(sessions)
      storageActions.setPanel('workout')
    } catch (error) {
      console.warn('Failed to save selected sessions to localStorage')
    }
    
    setCurrentPanel('workout')
  }, [setSelectedSessions, setCurrentPanel])

  const handleSessionSelectBack = useCallback(() => {
    setCurrentPanel('landing')
  }, [setCurrentPanel])

  const handleWorkoutModeClose = useCallback(() => {
    setCurrentPanel('sessionSelect')
  }, [setCurrentPanel])

  const handleToggleDimmer = useCallback(() => {
    setDimmerActive(prev => !prev)
  }, [setDimmerActive])

  const handleDimmerClose = useCallback(() => {
    setDimmerActive(false)
  }, [setDimmerActive])

  // Handle exit from header based on current panel context
  const handleHeaderExit = useCallback(() => {
    switch (currentPanel) {
      case 'upload':
        setCurrentPanel('landing')
        break
      case 'sessionSelect':
        setCurrentPanel('landing')
        break
      case 'workout':
        setCurrentPanel('sessionSelect')
        break
      default:
        // For landing panel, exit resets everything
        handleReset()
        break
    }
  }, [currentPanel, setCurrentPanel, handleReset])

  const handleGoToLanding = useCallback(() => {
    setCurrentPanel('landing')
  }, [setCurrentPanel])

  const handleUploadCancel = useCallback(() => {
    setCurrentPanel('landing')
  }, [setCurrentPanel])

  // Add handler to go to builder panel
  const handleStartBuilder = useCallback(() => {
    setCurrentPanel('builder')
  }, [setCurrentPanel])

  // Panel rendering logic
  const renderPanel = () => {
    switch (currentPanel) {
      case 'landing':
        return (
          <LandingPanel 
            onUploadCSV={handleUploadCSV}
            hasExistingData={parsedData !== null}
            onReplaceCSV={handleReplaceCSV}
            onStartWorkoutMode={handleStartWorkoutMode}
            onReset={handleReset}
            onStartBuilder={handleStartBuilder}
          />
        )
      
      case 'upload':
        return (
          <UploadPanel
            onSuccess={handleUploadSuccess}
            onCancel={handleUploadCancel}
            isReupload={parsedData !== null}
            onReplaceConfirm={handleUploadSuccess}
          />
        )
      
      case 'sessionSelect':
        if (!canShowSessionSelect) {
          return (
            <ErrorFallback
              title="No CSV Loaded"
              message="Upload a CSV first to select sessions."
              actionText="Go to Landing"
              onAction={handleGoToLanding}
            />
          )
        }
        
        return (
          <SessionSelect
            parsedRows={parsedData!.parsedRows}
            sessionNames={parsedData!.sessionNames}
            initialSelectedSessions={[]}
            onContinue={handleSessionSelectContinue}
            onBack={handleSessionSelectBack}
            onReplaceCSV={handleReplaceCSV}
          />
        )
      
      case 'workout':
        if (!canShowWorkoutMode) {
          return (
            <ErrorFallback
              title="No Sessions Selected"
              message="Please select at least one session to continue."
              actionText="Choose Sessions"
              onAction={() => setCurrentPanel('sessionSelect')}
            />
          )
        }
        
        return (
          <WorkoutMode
            parsedRows={parsedData!.parsedRows}
            selectedSessions={selectedSessions}
            onClose={handleWorkoutModeClose}
          />
        )
      
      case 'builder':
        return (
          <BuilderPanel 
            exerciseLibrary={exerciseLibrary}
            onBack={() => setCurrentPanel('landing')}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <ExerciseLibraryContext.Provider value={exerciseLibrary}>
      <div className="iphone-container app-minscreen min-h-[100dvh] flex flex-col bg-zinc-900 text-white">
        {/* Base full-bleed background to cover safe areas in iOS PWA */}
        <div className="fixed-fullbleed bg-zinc-900" aria-hidden="true" />
        {useMemo(() => {
          // Hide header on Get Started (landing with no data) and Upload panels
          const hideHeader = (currentPanel === 'upload') || (currentPanel === 'landing' && parsedData === null)
          if (hideHeader) return null
          return (
            <Header 
              onReset={handleReset} 
              onExit={handleHeaderExit} 
              onGoToLanding={handleGoToLanding}
              dimmerActive={dimmerActive}
              onToggleDimmer={handleToggleDimmer}
            />
          )
        }, [currentPanel, parsedData, handleReset, handleHeaderExit, handleGoToLanding, dimmerActive, handleToggleDimmer])}
        
        <Dimmer open={dimmerActive} onClose={handleDimmerClose} />
        
        <main ref={mainRef} className={`iphone-main flex-1 flex flex-col scroll-container ${currentPanel === 'workout' ? 'workout-mode-active' : ''}`} role="main" aria-live="polite">
          <Suspense fallback={
            <div className="p-6 text-sm text-zinc-400">Loading…</div>
          }>
            {renderPanel()}
          </Suspense>
        </main>
      </div>
    </ExerciseLibraryContext.Provider>
  )
}

export default App
