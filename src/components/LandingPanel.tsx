import { useEffect, useState, useCallback, useRef } from 'react'
import { getCsvMeta } from '../utils/storage'
import { mountLandingAnimations, unmountLandingAnimations, captureLandingFlipState, animateLandingFlipFrom } from '../animations/landing'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

interface LandingPanelProps {
  onUploadCSV: () => void
  hasExistingData: boolean
  onReplaceCSV: () => void
  onStartWorkoutMode: () => void
  onReset: () => void
  onStartBuilder: () => void // new prop
}

function LandingPanel({ onUploadCSV, hasExistingData, onReplaceCSV, onStartWorkoutMode, onReset, onStartBuilder }: LandingPanelProps) {
  const [csvMeta, setCsvMeta] = useState<{ sessionsCount: number; uploadedAt: number } | null>(null)
  const headlineRef = useRef<HTMLHeadingElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const reducedMotion = usePrefersReducedMotion()
  const prevCountRef = useRef<number | null>(null)

  useEffect(() => {
    if (hasExistingData) {
      const meta = getCsvMeta()
      if (meta) {
        const rootEl = containerRef.current
        const state = rootEl ? captureLandingFlipState(rootEl) : null
        setCsvMeta(meta)
        requestAnimationFrame(() => animateLandingFlipFrom(state))
      }
    }
  }, [hasExistingData])

  useEffect(() => {
    if (!containerRef.current) return
    mountLandingAnimations(containerRef.current, { reducedMotion })
    return () => unmountLandingAnimations()
  }, [reducedMotion])

  // Flip when sessionsCount number changes while on landing
  useEffect(() => {
    if (!containerRef.current) return
    if (!csvMeta) return
    const prev = prevCountRef.current
    if (prev !== null && prev !== csvMeta.sessionsCount) {
      const state = captureLandingFlipState(containerRef.current)
      requestAnimationFrame(() => animateLandingFlipFrom(state))
    }
    prevCountRef.current = csvMeta.sessionsCount
  }, [csvMeta])

  const formatUploadDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toISOString().split('T')[0]
  }, [])

  return (
    <div
      ref={containerRef}
      className={`flex-grow flex flex-col items-center ${!hasExistingData ? 'justify-start' : 'justify-center'} text-center p-4 relative app-minscreen pt-[env(safe-area-inset-top)]`}
      data-landing-root
    >
      {!reducedMotion && !hasExistingData && (
        <>
          <video
            className="fixed-fullbleed object-cover pointer-events-none"
            src="/videos/landing-bg-1.optimized.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <div className="fixed-fullbleed z-[1] pointer-events-none bg-black/70" aria-hidden="true"></div>
          <div className="fixed-fullbleed z-[2] pointer-events-none bg-purple-500/30" aria-hidden="true"></div>
        </>
      )}
      {hasExistingData && csvMeta ? (
        <div className="w-full max-w-sm relative z-10">
          <h1 ref={headlineRef} className="text-4xl font-bold mb-3 text-white" data-landing-title>Welcome Back!</h1>
          <p className="text-white text-lg mb-10" data-landing-subtitle>Ready to start your next session?</p>
          <div className="bg-zinc-900 rounded-2xl p-6 w-full mb-6" data-landing-update>
            <div className="bg-purple-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-purple-400" data-landing-icon>event_available</span>
            </div>
            <h2 className="text-2xl font-semibold mb-1" data-landing-count>
              <span aria-live="polite" data-landing-count-num>{csvMeta.sessionsCount}</span>
              {` `}Sessions Detected
            </h2>
            <p className="text-zinc-500 text-sm mb-6" data-landing-last-upload>Last upload on {formatUploadDate(csvMeta.uploadedAt)}</p>
            <button 
              onClick={onStartWorkoutMode}
              className="bg-gradient-to-r from-purple-500 to-blue-500 w-full py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 relative z-10"
              data-pressable
              data-landing-cta
            >
              <span className="material-symbols-outlined">play_arrow</span>
              <span className="font-semibold">Start Workout Mode</span>
            </button>
          </div>
          <div className="text-white my-4">Or</div>
          <button
            onClick={onStartBuilder}
            className="bg-gradient-to-r from-blue-500 to-purple-500 w-full py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 transition-all duration-200 mb-6"
            data-pressable
            data-landing-cta
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            <span className="font-semibold">Build Your Workout</span>
          </button>
          <div className="bg-zinc-900 rounded-2xl p-6 w-full" data-landing-update>
            <div className="bg-zinc-700/50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-zinc-400" data-landing-icon>upload_file</span>
            </div>
            <h2 className="text-2xl font-semibold mb-1 text-white">Update Your Data</h2>
            <p className="text-white text-sm mb-6">Upload a new CSV file to refresh.</p>
            <div className="space-y-4">
              <button 
                onClick={onReplaceCSV}
                className="bg-zinc-800 w-full py-3 rounded-xl flex items-center justify-center space-x-2 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                data-pressable
                data-landing-replace
              >
                <span className="material-symbols-outlined">cloud_upload</span>
                <span className="font-semibold">Replace CSV</span>
              </button>
              <button 
                onClick={onReset}
                className="bg-red-500/20 text-red-400 w-full py-3 rounded-xl flex items-center justify-center space-x-2 border border-red-500/50 hover:bg-red-500/30 transition-colors"
                data-pressable
                data-landing-reset
              >
                <span className="material-symbols-outlined">delete_forever</span>
                <span className="font-semibold">Reset All Data</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="w-full max-w-sm relative z-10 mt-24">
            <h1 ref={headlineRef} className="text-4xl font-bold mb-3 text-white" data-landing-title>Motion.</h1>
            <p className="text-white text-lg" data-landing-subtitle>Your workout companion</p>
          </div>
          <div className="flex-1 flex items-center w-full">
            <div className="w-full max-w-sm relative z-10">
              <div className="w-full text-white" data-landing-update>
                <div className="flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-purple-400 text-5xl" data-landing-icon>cloud_upload</span>
                </div>
                <h2 className="text-2xl font-semibold mb-1 text-white">Get Started</h2>
                <p className="text-white text-sm mb-6">Upload a CSV file to begin your workout journey.</p>
                <button 
                  onClick={onUploadCSV}
                  className="btn-gradient w-full flex items-center justify-center space-x-2 relative z-10"
                  data-pressable
                  data-landing-cta
                >
                  <span className="material-symbols-outlined">cloud_upload</span>
                  <span className="font-semibold">Upload CSV</span>
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onStartBuilder}
            className="btn-gradient w-full flex items-center justify-center space-x-2 relative z-10 mt-4"
            data-pressable
            data-landing-cta
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            <span className="font-semibold">Build Your Workout</span>
          </button>
        </>
      )}
    </div>
  )
}

export default LandingPanel
