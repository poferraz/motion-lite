Landing page motion checklist

- Motion language
  - Rhythm: calm, entrance under 1.0s; micro moves < 12px
  - Easing: power2.out, power3.out, expo.out; elastic.out for soft pop
  - Stagger: 0.01–0.03s; Base durations 0.6–1.0s
  - Travel: y 6–12px; idle float 1–2px
  - Respect prefers-reduced-motion and feature flag

- Elements mapped
  - Header cluster: `[data-landing-header]`
  - Logo bolt: `[data-landing-logo]`
  - Title: `[data-landing-title]`
  - Subtitle: `[data-landing-subtitle]`
  - Sessions count row: `[data-landing-count]` and number: `[data-landing-count-num]`
  - Last upload text: `[data-landing-last-upload]`
  - Primary CTA: `[data-landing-cta]`
  - Update section cards: `[data-landing-update]`
  - Replace CSV: `[data-landing-replace]`
  - Reset All Data: `[data-landing-reset]`

- Entrance sequence (master timeline)
  - Header fades in with y:8px
  - SplitText on title; chars cascade, scale 0.98, slight rotation reset
  - Count row and last upload slide in; number ticks
  - CTA Flip from compact ghost; soft shadow pop
  - Update cards lift in with 30ms stagger

- Micro interactions
  - CTA press: scaleX to 0.98 then back
  - Replace/Reset hover/focus: elevate y:-2 with subtle shadow
  - Logo bolt idle float loop 1–2px

- SplitText usage
  - Title and Sessions line; stagger 0.01–0.02; revert immediately after entrance

- Flip transitions (state)
  - Use `captureLandingFlipState` before content update, then `animateLandingFlipFrom` after DOM updates (CSV replacement or count changes)

- Safeguards & performance
  - Feature flag `canEnableLandingMotion`
  - `prefers-reduced-motion` respected
  - `gsap.context` scoping; clean unmount
  - No heavy blurs; minimal shadows; no repeated layout reads in tick

- Accessibility
  - Do not animate focus rings
  - Never move active pointer/focused control
  - Number ticks update `aria-live` politely

- Testing
  - Timelines mount once per visit
  - Toggling `prefers-reduced-motion` disables animation
  - Pressing CTA does not block click handlers
  - Long task time < 50ms during entrance on iPhone 16 Pro simulator
  - Lighthouse performance regression ≤ 2 points


