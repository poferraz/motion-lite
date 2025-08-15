import { useState, useMemo, useRef, useCallback } from 'react'

interface VirtualizedSessionListProps {
  sessions: string[]
  selectedSessions: string[]
  onSessionToggle: (session: string) => void // eslint-disable-line no-unused-vars
  itemHeight?: number
  containerHeight?: number
}

export default function VirtualizedSessionList({
  sessions,
  selectedSessions,
  onSessionToggle,
  itemHeight = 60,
  containerHeight = 400
}: VirtualizedSessionListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      sessions.length
    )
    
    return {
      startIndex: Math.max(0, startIndex - 1), // Add buffer
      endIndex: Math.min(sessions.length, endIndex + 1) // Add buffer
    }
  }, [scrollTop, itemHeight, containerHeight, sessions.length])

  // Get visible sessions
  const visibleSessions = useMemo(() => {
    return sessions.slice(visibleRange.startIndex, visibleRange.endIndex)
  }, [sessions, visibleRange])

  // Calculate total height for scrollbar
  const totalHeight = sessions.length * itemHeight

  // Calculate offset for visible items
  const offsetY = visibleRange.startIndex * itemHeight

  const startDisplay = sessions.length === 0 ? 0 : visibleRange.startIndex + 1
  const endDisplay = sessions.length === 0 ? 0 : visibleRange.endIndex

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const handleSessionToggle = useCallback((session: string) => {
    onSessionToggle(session)
  }, [onSessionToggle])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="overflow-auto border border-gray-200 rounded-lg"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
        role="listbox"
        aria-label="Select workout sessions"
        tabIndex={0}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleSessions.map((session, index) => {
              const actualIndex = visibleRange.startIndex + index
              const isSelected = selectedSessions.includes(session)
              
              return (
                <div
                  key={session}
                  className={`
                    flex items-center px-4 py-3 cursor-pointer transition-colors
                    ${isSelected 
                      ? 'bg-blue-100 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }
                  `}
                  style={{ height: itemHeight }}
                  onClick={() => handleSessionToggle(session)}
                  role="option"
                  aria-selected={isSelected}
                  aria-label={`${session} - Session ${actualIndex + 1}`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSessionToggle(session)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900" aria-label={session}>
                      {session}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500" aria-hidden="true">
                    No. {actualIndex + 1}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Showing {startDisplay}-{endDisplay} of {sessions.length} sessions
      </div>
    </div>
  )
}
