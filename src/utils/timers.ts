/**
 * Format milliseconds to MM:SS display format
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Format countdown milliseconds to MM:SS display format
 */
export function formatCountdown(ms: number): string {
  return formatTime(ms)
}