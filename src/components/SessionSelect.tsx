import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { hasCsv } from '../utils/storage'

import { CsvRow } from '../App'

type Props = {
  /** Full list of parsed rows from CSV */
  parsedRows: CsvRow[]
  /** List of session names */
  sessionNames: string[]
  /** Currently selected sessions by name in order */
  initialSelectedSessions: string[]
  /** Called when user clicks Start Workout */
  onContinue: (sessions: string[]) => void
  onBack: () => void
  onReplaceCSV: () => void
}

/**
 * Reliable drag and drop reorder for the selected list.
 * Large hit targets, visible insert marker, Safari friendly.
 */
function SessionSelect({ sessionNames, initialSelectedSessions, onContinue, onBack, onReplaceCSV }: Props) {
  const [selectedNames, setSelectedNames] = useState<string[]>(initialSelectedSessions)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [overAfter, setOverAfter] = useState<boolean>(false)
  const ghostRef = useRef<HTMLDivElement | null>(null)

  // Update selectedNames when initialSelectedSessions changes
  useEffect(() => {
    setSelectedNames(initialSelectedSessions)
  }, [initialSelectedSessions])

  // Map for quick lookups
  const selectedSet = useMemo(() => new Set(selectedNames), [selectedNames])
  const available = useMemo(
    () => sessionNames.filter(name => !selectedSet.has(name)),
    [sessionNames, selectedSet]
  )

  // Note: Selected sessions are saved to localStorage by the parent component
  // when onContinue is called, so we don't need to save them here

  // Create a small drag image to ensure Safari keeps dataTransfer
  useEffect(() => {
    const ghost = document.createElement("div")
    ghost.style.position = "fixed"
    ghost.style.top = "0"
    ghost.style.left = "0"
    ghost.style.width = "1px"
    ghost.style.height = "1px"
    ghost.style.opacity = "0"
    document.body.appendChild(ghost)
    ghostRef.current = ghost
    return () => {
      ghost.remove()
      ghostRef.current = null
    }
  }, [])

  const startDrag = (e: React.DragEvent, index: number) => {
    setDraggingIndex(index)
    e.dataTransfer.setData("text/plain", String(index))
    if (ghostRef.current) {
      e.dataTransfer.setDragImage(ghostRef.current, 0, 0)
    }
    // indicate move
    e.dataTransfer.effectAllowed = "move"
  }

  const onItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggingIndex === null) return
    const target = e.currentTarget as HTMLDivElement
    const rect = target.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    const after = e.clientY > midpoint
    setOverIndex(index)
    setOverAfter(after)
    e.dataTransfer.dropEffect = "move"
  }

  const onListDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null
    if (!e.currentTarget.contains(related)) {
      setOverIndex(null)
      setOverAfter(false)
    }
  }

  const onListContainerDragOver = (e: React.DragEvent) => {
    if (draggingIndex !== null && e.target === e.currentTarget) {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      // When not over any specific item, show the end marker
      setOverIndex(null)
      setOverAfter(false)
    }
  }

  const onListDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggingIndex === null) {
      cleanupDrag()
      return
    }
    let insertIndex: number
    if (overIndex === null) {
      // dropped at the end
      insertIndex = selectedNames.length
    } else {
      insertIndex = overAfter ? overIndex + 1 : overIndex
    }

    if (insertIndex === draggingIndex || insertIndex === draggingIndex + 1) {
      cleanupDrag()
      return
    }

    const next = [...selectedNames]
    const [moved] = next.splice(draggingIndex, 1)
    // adjust index if removing before the insert point
    const adjusted = draggingIndex < insertIndex ? insertIndex - 1 : insertIndex
    next.splice(adjusted, 0, moved)
    setSelectedNames(next)
    cleanupDrag()
  }

  // TODO: implement drag handlers when feature lands
  // const onListDragLeave = (e: React.DragEvent) => {
  //   // Only clear if actually leaving the list
  //   const related = e.relatedTarget as Node | null
  //   if (!e.currentTarget.contains(related)) {
  //     setOverIndex(null)
  //     setOverAfter(false)
  //   }
  // }

  // TODO: implement drag handlers when feature lands
  // const onListDrop = (e: React.DragEvent) => {
  //   e.preventDefault()
  //   if (draggingIndex === null) return
  //   let insertIndex: number
  //   if (overIndex === null) {
  //     // dropped at the end
  //     insertIndex = selectedNames.length
  //   } else {
  //     insertIndex = overAfter ? overIndex + 1 : overIndex
  //   }

  //   if (insertIndex === draggingIndex || insertIndex === draggingIndex + 1) {
  //     cleanupDrag()
  //     return
  //   }

  //   const next = [...selectedNames]
  //   const [moved] = next.splice(draggingIndex, 1)
  //   // adjust index if removing before the insert point
  //   const adjusted = draggingIndex < insertIndex ? insertIndex - 1 : insertIndex
  //   next.splice(adjusted, 0, moved)
  //   setSelectedNames(next)
  //   cleanupDrag()
  // }

  const cleanupDrag = () => {
    setDraggingIndex(null)
    setOverIndex(null)
    setOverAfter(false)
  }

  const toggleSelect = useCallback((name: string) => {
    const exists = selectedSet.has(name)
    if (exists) {
      setSelectedNames(selectedNames.filter(n => n !== name))
    } else {
      setSelectedNames([...selectedNames, name])
    }
  }, [selectedNames, selectedSet])

  // Guard against accessing without CSV
  if (!hasCsv()) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 text-center max-w-sm">
          <h2 className="text-2xl font-semibold text-white mb-4">No CSV Loaded</h2>
          <p className="text-zinc-400 mb-6">Upload a CSV first.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30"
          >
            Go to Landing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Select and Order Sessions</h2>
          <p className="text-zinc-400 text-sm">Choose sessions and drag to reorder them</p>
        </div>

        {/* Available sessions - compact list */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl mb-4">
          <div className="px-6 py-4 border-b border-zinc-800 text-sm font-medium text-white" id="available-sessions-label">
            Available Sessions ({available.length})
          </div>
          <div className="p-6 space-y-2 max-h-52 overflow-auto" role="listbox" aria-labelledby="available-sessions-label">
            {available.length === 0 ? (
              <div className="text-sm text-zinc-500 px-2 py-3 text-center">All sessions selected</div>
            ) : (
              available.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleSelect(name)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 active:bg-zinc-700 transition text-sm text-white hover:text-white"
                  data-pressable
                >
                  {name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected sessions with drag and drop */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl mb-6">
          <div className="px-6 py-4 border-b border-zinc-800 text-sm font-medium text-white">
            Selected Order ({selectedNames.length})
          </div>

          <div className="p-6 space-y-2 max-h-64 overflow-auto" onDragOver={onListContainerDragOver} onDragLeave={onListDragLeave} onDrop={onListDrop}>
            {selectedNames.length === 0 ? (
              <div className="text-sm text-zinc-500 px-2 py-3 text-center">
                Pick from the list above to build today
              </div>
            ) : (
              selectedNames.map((name, index) => {
                const isDragging = draggingIndex === index
                const showTopMarker = overIndex === index && !overAfter
                const showBottomMarker = overIndex === index && overAfter
                return (
                  <div key={name} className="relative">
                    {/* top insert marker */}
                    {showTopMarker && (
                      <div className="absolute -top-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full pointer-events-none z-10" />
                    )}

                    <div
                      draggable
                      onDragStart={e => startDrag(e, index)}
                      onDragEnd={cleanupDrag}
                      onDragOver={e => onItemDragOver(e, index)}
                      className={[
                        "px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 transition shadow-sm",
                        isDragging ? "opacity-50" : "hover:bg-zinc-700",
                      ].join(" ")}
                      title="Drag to reorder"
                    >
                      <div className="flex items-center gap-3">
                        <span className="cursor-grab select-none text-zinc-400">⋮⋮</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-white">{name}</div>
                          <div className="text-xs text-zinc-400">
                            Position {index + 1} of {selectedNames.length}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSelect(name)}
                          className="text-xs px-2 py-1 rounded-md border border-zinc-600 hover:bg-zinc-700 flex-shrink-0 text-zinc-300 hover:text-white"
                          data-pressable
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* bottom insert marker */}
                    {showBottomMarker && (
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full pointer-events-none z-10" />
                    )}
                  </div>
                )
              })
            )}

            {/* When dragging below last item show end marker */}
            {draggingIndex !== null && overIndex === null && selectedNames.length > 0 && (
              <div className="h-3 relative">
                <div className="absolute top-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-3 border border-zinc-700 text-sm font-medium rounded-xl text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-white transition-colors"
            data-pressable
          >
            Back
          </button>
          <button
            onClick={() => onContinue(selectedNames)}
            disabled={selectedNames.length === 0}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30"
            aria-disabled={selectedNames.length === 0}
            data-pressable
          >
            Start Workout ({selectedNames.length})
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onReplaceCSV}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            aria-label="Replace CSV data"
            data-pressable
          >
            Replace CSV
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionSelect
