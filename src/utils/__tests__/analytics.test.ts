import { analytics, trackPanelTransition, trackCsvValidation, trackWorkoutSession } from '../analytics'

describe('Analytics', () => {
  beforeEach(() => {
    analytics.clearEvents()
  })

  test('tracks panel transitions', () => {
    trackPanelTransition('landing', 'upload')
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('panel_transition')
    expect(events[0].properties).toEqual({ from: 'landing', to: 'upload' })
  })

  test('tracks CSV validation success', () => {
    trackCsvValidation(true, undefined, 25)
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('csv_validation')
    expect(events[0].properties).toEqual({ success: true, error: null, rowCount: 25 })
  })

  test('tracks CSV validation errors', () => {
    trackCsvValidation(false, 'Invalid CSV format', 0)
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('csv_validation')
    expect(events[0].properties).toEqual({ success: false, error: 'Invalid CSV format', rowCount: 0 })
  })

  test('tracks workout sessions', () => {
    trackWorkoutSession('start', 3)
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('workout_session')
    expect(events[0].properties).toEqual({ action: 'start', sessionCount: 3 })
  })

  test('limits stored events to MAX_EVENTS', () => {
    // Add more than MAX_EVENTS
    for (let i = 0; i < 150; i++) {
      analytics.track(`event_${i}`)
    }
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(100) // Should be limited to MAX_EVENTS
    expect(events[events.length - 1].event).toBe('event_149') // Should keep latest
  })

  test('exports events as JSON', () => {
    trackPanelTransition('landing', 'upload')
    
    const json = analytics.exportEvents()
    const parsed = JSON.parse(json)
    
    expect(parsed).toHaveLength(1)
    expect(parsed[0].event).toBe('panel_transition')
  })
})
