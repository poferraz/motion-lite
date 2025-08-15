// Basic in-memory analytics tracking with a rolling buffer
type AnalyticsEvent = { event: string; properties?: Record<string, unknown> }

const MAX_EVENTS = 100
let eventsBuffer: AnalyticsEvent[] = []

export const analytics = {
  track: (event: string, properties?: Record<string, unknown>) => {
    eventsBuffer.push({ event, properties })
    if (eventsBuffer.length > MAX_EVENTS) {
      eventsBuffer = eventsBuffer.slice(eventsBuffer.length - MAX_EVENTS)
    }
  },
  clearEvents: () => {
    eventsBuffer = []
  },
  getEvents: (): AnalyticsEvent[] => {
    return [...eventsBuffer]
  },
  exportEvents: (): string => {
    return JSON.stringify(eventsBuffer)
  }
}

export const trackPanelTransition = (from: string, to: string) => {
  analytics.track('panel_transition', { from, to })
}

export const trackCsvValidation = (success: boolean, error?: string, rowCount?: number) => {
  analytics.track('csv_validation', { success, error: error ?? null, rowCount: rowCount ?? 0 })
}

export const trackWorkoutSession = (action: string, sessionCount: number) => {
  analytics.track('workout_session', { action, sessionCount })
}
