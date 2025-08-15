import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

interface DimmerProps {
  open: boolean
  onClose: () => void
}

function Dimmer({ open, onClose }: DimmerProps) {
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    
    // Store previously focused element
    previouslyFocused.current = document.activeElement as HTMLElement | null
    
    // Prevent body scroll
    document.body.style.overflow = "hidden"
    
    // Add escape key handler
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    
    window.addEventListener("keydown", handleEscape)
    
    return () => {
      window.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
      // Restore focus to previously focused element
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking the overlay itself, not its children
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const modal = (
    <div 
      className="fixed inset-0 z-50 bg-black/80 transition-opacity duration-300 ease-in-out"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
      onClick={handleOverlayClick}
      role="button"
      aria-label="Dim screen overlay. Tap to exit."
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClose()
        }
      }}
    />
  )

  return createPortal(modal, document.body)
}

export default Dimmer
