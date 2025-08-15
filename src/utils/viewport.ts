// Utilities to stabilize viewport height in iOS PWAs

export const isStandaloneDisplayMode = (): boolean => {
  try {
    // iOS Safari uses navigator.standalone; others support display-mode media query
    const navStandalone = (navigator as any).standalone === true
    const mediaStandalone = window.matchMedia('(display-mode: standalone)').matches
    return navStandalone || mediaStandalone
  } catch {
    return false
  }
}

export const startViewportHeightLock = (): (() => void) => {
  const updateAppHeight = () => {
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight
    document.documentElement.style.setProperty('--app-height', `${Math.round(viewportHeight)}px`)
  }

  updateAppHeight()

  const onResize = () => updateAppHeight()
  const onOrientation = () => updateAppHeight()

  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onOrientation)
  window.visualViewport?.addEventListener('resize', onResize)

  return () => {
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onOrientation)
    window.visualViewport?.removeEventListener('resize', onResize)
  }
}


