import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
gsap.registerPlugin(Flip)

// Add this import for type safety and linting
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { DocumentEventMap } from 'typescript';

/**
 * Utilities to provide consistent GSAP-powered micro-interactions.
 * All helpers respect prefers-reduced-motion.
 */

export const isReducedMotionPreferred = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const initGlobalPressAnimations = (): void => {
  if (typeof window === 'undefined') return
  const FLAG = '__ml_press_animations__'
  // Prevent double-init in HMR/StrictMode
  if ((window as any)[FLAG]) return
  ;(window as any)[FLAG] = true

  const down = (el: HTMLElement) => {
    if (isReducedMotionPreferred()) return
    gsap.to(el, { scale: 0.96, duration: 0.12, ease: 'power2.out' })
  }
  const up = (el: HTMLElement) => {
    if (isReducedMotionPreferred()) return
    gsap.to(el, { scale: 1, duration: 0.2, ease: 'power3.out' })
  }

  const getPressable = (target: EventTarget | null): HTMLElement | null => {
    const el = (target as HTMLElement | null)?.closest('[data-pressable]') as HTMLElement | null
    return el || null
  }

  document.addEventListener('pointerdown', (e) => {
    const el = getPressable(e.target)
    if (!el) return
    down(el)
  }, { passive: true })

  const cancelEvents: Array<keyof DocumentEventMap> = ['pointerup', 'pointercancel', 'pointerleave']
  cancelEvents.forEach(type => {
    document.addEventListener(type, (e) => {
      const el = getPressable(e.target)
      if (!el) return
      up(el)
    }, { passive: true })
  })

  // Keyboard activation (space/enter) for a11y
  document.addEventListener('keydown', (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return
    const el = getPressable(e.target)
    if (!el) return
    down(el)
  })
  document.addEventListener('keyup', (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return
    const el = getPressable(e.target)
    if (!el) return
    up(el)
  })
}

export const animatePanelChange = (containerEl: HTMLElement | null): void => {
  if (!containerEl || isReducedMotionPreferred()) return
  // Animate the immediate children for subtle transition
  const child = containerEl.firstElementChild as HTMLElement | null
  if (!child) return
  gsap.fromTo(child, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' })
}

export const animateModalOpen = (
  modalEl: HTMLElement | null,
  backdropEl?: HTMLElement | null
): void => {
  if (!modalEl || isReducedMotionPreferred()) return
  const tl = gsap.timeline({ defaults: { duration: 0.28, ease: 'power2.out' } })
  if (backdropEl) {
    tl.fromTo(backdropEl, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
  }
  tl.fromTo(modalEl, { yPercent: 8, opacity: 0.9 }, { yPercent: 0, opacity: 1 }, 0.05)
}

export const fadeInOverlay = (overlayEl: HTMLElement | null): void => {
  if (!overlayEl || isReducedMotionPreferred()) return
  gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' })
}


type SplitMode = 'chars' | 'words'

interface SplitTextOptions {
  mode?: SplitMode
  stagger?: number
  duration?: number
  fromY?: number
}

/**
 * Lightweight SplitText-style animation without the Club plugin.
 * Splits the element's textContent into spans and animates them in.
 * Returns a cleanup function that restores original text.
 */
export const animateSplitText = (
  el: HTMLElement | null,
  options: SplitTextOptions = {}
): (() => void) => {
  if (!el) return () => {}
  if (isReducedMotionPreferred()) return () => {}

  const { mode = 'chars', stagger = 0.03, duration = 0.6, fromY = 14 } = options

  const originalText = el.textContent || ''
  const container = el

  // Accessibility: preserve original label, hide animation spans from AT
  const previousAriaLabel = container.getAttribute('aria-label')
  container.setAttribute('aria-label', originalText)

  // Build spans
  const tokens: string[] = mode === 'words' ? originalText.split(/(\s+)/) : Array.from(originalText)
  container.textContent = ''
  const spans: HTMLSpanElement[] = []
  tokens.forEach((token) => {
    if (token === '' && mode === 'chars') return
    const span = document.createElement('span')
    span.className = 'inline-block will-change-transform'
    span.setAttribute('aria-hidden', 'true')
    span.style.whiteSpace = 'pre'
    span.textContent = token === ' ' ? '\u00A0' : token
    container.appendChild(span)
    spans.push(span)
  })

  gsap.from(spans, {
    opacity: 0,
    y: fromY,
    duration,
    ease: 'power3.out',
    stagger,
    overwrite: 'auto'
  })

  // Cleanup restores original text and ARIA state
  return () => {
    container.textContent = originalText
    if (previousAriaLabel == null) {
      container.removeAttribute('aria-label')
    } else {
      container.setAttribute('aria-label', previousAriaLabel)
    }
  }
}

/**
 * Adds Flip-powered hover animations to buttons inside a container.
 * On hover, padding and border-radius expand slightly and animate via FLIP.
 */
export const initLandingButtonsFlip = (containerEl: HTMLElement | null): (() => void) => {
  if (!containerEl) return () => {}
  if (isReducedMotionPreferred()) return () => {}

  // Only enable on hover-capable, fine pointers (avoid mobile/touch)
  const supportsHover = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
    : false
  if (!supportsHover) return () => {}

  const buttons = Array.from(containerEl.querySelectorAll<HTMLElement>('[data-pressable]'))
  const removeHandlers: Array<() => void> = []

  buttons.forEach((btn) => {
    const computed = window.getComputedStyle(btn)
    const basePaddingInlineStart = parseFloat(computed.paddingInlineStart || computed.paddingLeft || '0')
    const basePaddingInlineEnd = parseFloat(computed.paddingInlineEnd || computed.paddingRight || '0')
    const baseBorderRadius = parseFloat(computed.borderTopLeftRadius || '0')

    const hoverPaddingBoost = 6
    const hoverRadiusBoost = 4

    const onEnter = () => {
      const state = Flip.getState(btn)
      btn.style.paddingInlineStart = `${basePaddingInlineStart + hoverPaddingBoost}px`
      btn.style.paddingInlineEnd = `${basePaddingInlineEnd + hoverPaddingBoost}px`
      btn.style.borderRadius = `${baseBorderRadius + hoverRadiusBoost}px`
      Flip.from(state, {
        duration: 0.28,
        ease: 'power2.out',
        absolute: false,
        nested: true,
      })
    }

    const onLeave = () => {
      const state = Flip.getState(btn)
      btn.style.paddingInlineStart = `${basePaddingInlineStart}px`
      btn.style.paddingInlineEnd = `${basePaddingInlineEnd}px`
      btn.style.borderRadius = `${baseBorderRadius}px`
      Flip.from(state, {
        duration: 0.28,
        ease: 'power2.out',
        absolute: false,
        nested: true,
      })
    }

    btn.addEventListener('pointerenter', onEnter)
    btn.addEventListener('pointerleave', onLeave)

    removeHandlers.push(() => {
      btn.removeEventListener('pointerenter', onEnter)
      btn.removeEventListener('pointerleave', onLeave)
    })
  })

  return () => removeHandlers.forEach((dispose) => dispose())
}

