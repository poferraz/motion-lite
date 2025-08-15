import { useEffect, useState, useCallback } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export default function Toast({ 
  message, 
  type = 'success', 
  duration = 3000, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    onClose?.()
  }, [onClose])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    onClose?.()
  }, [onClose])

  if (!isVisible) return null

  const baseClasses = "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ease-in-out border"
  
  const typeClasses = {
    success: "bg-green-500/20 border-green-500/50 text-green-400",
    error: "bg-red-500/20 border-red-500/50 text-red-400", 
    info: "bg-blue-500/20 border-blue-500/50 text-blue-400"
  }

  return (
    <div 
      className={`${baseClasses} ${typeClasses[type]}`}
      role="alert"
      aria-live="polite"
      aria-label={`${type} notification: ${message}`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={handleClose}
          className="ml-2 text-current/80 hover:text-current transition-colors"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}
