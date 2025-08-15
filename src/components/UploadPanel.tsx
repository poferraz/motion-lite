import React, { useEffect, useRef, useState } from 'react'
import { parseCsv } from '../utils/parseCsv'
import { setCsvMeta } from '../utils/storage'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { mountLandingAnimations, unmountLandingAnimations } from '../animations/landing'

import { CsvRow } from '../App'

interface UploadPanelProps {
  onSuccess: (rawCsvText: string, parsedRows: CsvRow[], sessionNames: string[]) => void
  onCancel: () => void
  isReupload: boolean
  onReplaceConfirm: (rawCsvText: string, parsedRows: CsvRow[], sessionNames: string[]) => void
}

function UploadPanel({ onSuccess, onCancel, isReupload, onReplaceConfirm }: UploadPanelProps) {
  const [csvText, setCsvText] = useState('')
  const [uploadComplete, setUploadComplete] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const reducedMotion = usePrefersReducedMotion()
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    mountLandingAnimations(containerRef.current, { reducedMotion })
    return () => unmountLandingAnimations()
  }, [reducedMotion])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setCsvText(text)
      setUploadComplete(false)
      setSelectedFileName(file.name)
    } catch (error) {
      console.error('Failed to read file:', error)
    }
  }

  const handleProcessCsv = () => {
    if (!csvText) return

    try {
      const parseResult = parseCsv(csvText)
      
      if (parseResult.errors.length === 0) {
        const sessionsCount = parseResult.sessionNames.length
        setCsvMeta({ sessionsCount, uploadedAt: Date.now() })
        
        if (isReupload) {
          onReplaceConfirm(csvText, parseResult.rows, parseResult.sessionNames)
        } else {
          onSuccess(csvText, parseResult.rows, parseResult.sessionNames)
        }
      } else {
        console.error('CSV parsing errors:', parseResult.errors)
        // TODO: Show error to user
      }
    } catch (error) {
      console.error('Failed to parse CSV:', error)
      // TODO: Show error to user
    }
  }

  const handleReturnToLanding = () => {
    onCancel()
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 relative p-6 flex items-center justify-center app-minscreen pt-[env(safe-area-inset-top)]"
    >
      {!reducedMotion && (
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
          <div className="fixed-fullbleed z-[1] bg-black/70" aria-hidden="true" />
          <div className="fixed-fullbleed z-[2] bg-purple-500/30" aria-hidden="true" />
        </>
      )}
      <div className="max-w-md mx-auto w-full relative z-10">
        {!uploadComplete ? (
          <div className="w-full" data-landing-update>
            <div className="text-center text-white flex flex-col items-center gap-3">
              <div className="bg-purple-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-400">cloud_upload</span>
              </div>
              <h3 className="text-2xl font-semibold text-white" data-landing-title>
                {isReupload ? 'Replace CSV' : 'Upload CSV'}
              </h3>
              <p className="text-white text-sm max-w-prose" data-landing-subtitle>
                {isReupload 
                  ? 'Choose a new CSV file to replace your current workout data.'
                  : 'Upload a CSV file with your workout sessions. Make sure it has the required columns.'
                }
              </p>
            </div>

            <div className="w-full mt-8 flex flex-col items-stretch">
                <input
                  ref={fileInputRef}
                  id="csvFileInput"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="sr-only"
                  aria-label="Select CSV file"
                />
              <label
                  htmlFor="csvFileInput"
                className="btn-gradient w-full cursor-pointer select-none block text-center"
                  data-pressable
                  role="button"
                  aria-controls="csvFileInput"
                >
                  {selectedFileName ? 'Change File' : (isReupload ? 'Choose New CSV' : 'Choose CSV File')}
                </label>
                {selectedFileName && (
                  <div className="text-sm text-white truncate text-center mt-4" aria-live="polite">
                    Selected: <span className="text-white">{selectedFileName}</span>
                  </div>
                )}

                {csvText && (
                  <div className="rounded-lg p-3 border border-white/10 bg-black/20 mt-4">
                    <h4 className="text-sm font-medium text-white mb-2">Preview:</h4>
                    <div className="text-xs text-white max-h-24 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{csvText.substring(0, 200)}...</pre>
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="flex justify-center gap-4 mt-12">
                <button
                  onClick={onCancel}
                  className="px-3 py-2 border border-white/20 text-xs font-medium rounded-lg text-white/90 bg-black/20 hover:bg-black/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
                  data-pressable
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessCsv}
                  disabled={!csvText}
                  className="px-3 py-2 border border-white/20 text-xs font-medium rounded-lg text-white hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
                  aria-disabled={!csvText}
                  data-pressable
                  data-landing-cta
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="bg-green-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-green-400">check_circle</span>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">Upload Complete!</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Your CSV has been successfully processed.
            </p>
            <button
              onClick={handleReturnToLanding}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-green-500/30"
              data-pressable
            >
              Return to Landing
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadPanel
