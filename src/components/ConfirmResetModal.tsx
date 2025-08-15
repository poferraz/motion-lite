import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { animateModalOpen } from "../utils/animations"

export interface ConfirmResetModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmResetModal({ open, onConfirm, onCancel }: ConfirmResetModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const primaryRef = useRef<HTMLButtonElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    document.body.style.overflow = "hidden"
    // focus primary action when ready
    setTimeout(() => primaryRef.current?.focus(), 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onCancel()
      }
      if (e.key === "Tab" && dialogRef.current) {
        // simple focus trap
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
          )
        ).filter(el => !el.hasAttribute("disabled"))
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
      // return focus to trigger
      previouslyFocused.current?.focus?.()
    }
  }, [open, onCancel])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (open) {
      animateModalOpen(containerRef.current, overlayRef.current)
    }
  }, [open])

  if (!open) return null

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onMouseDown={e => {
        // backdrop click closes only when clicking the overlay itself
        if (e.target === e.currentTarget) onCancel()
      }}
      aria-hidden={!open}
    >
      <div
        ref={(node) => {
          dialogRef.current = node
          containerRef.current = node
        }}
        className="bg-zinc-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-zinc-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-title"
        aria-describedby="reset-desc"
      >
        <h3 id="reset-title" className="text-xl font-semibold text-white mb-2">
          Reset All Data
        </h3>
        <p id="reset-desc" className="text-zinc-400 text-sm mb-6">
          This clears your CSV, selections, workout progress, and local settings on this device. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black transition-colors"
            aria-label="Cancel reset operation"
          >
            Cancel
          </button>
          <button
            ref={primaryRef}
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black transition-colors"
            aria-label="Confirm reset all data - this action cannot be undone"
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default ConfirmResetModal
