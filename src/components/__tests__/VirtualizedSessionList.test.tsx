import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import VirtualizedSessionList from '../VirtualizedSessionList'

describe('VirtualizedSessionList', () => {
  const mockSessions = Array.from({ length: 100 }, (_, i) => `Session ${i + 1}`)
  const mockSelectedSessions = ['Session 1', 'Session 3']
  const mockOnSessionToggle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders visible sessions only', () => {
    render(
      <VirtualizedSessionList
        sessions={mockSessions}
        selectedSessions={mockSelectedSessions}
        onSessionToggle={mockOnSessionToggle}
        itemHeight={60}
        containerHeight={400}
      />
    )

    // Should only render visible items (400px height / 60px item height ≈ 6-7 items + buffer)
    const sessionElements = screen.getAllByText(/Session \d+/)
    expect(sessionElements.length).toBeLessThan(20) // Much less than 100
  })

  test('shows correct session numbers', () => {
    render(
      <VirtualizedSessionList
        sessions={mockSessions}
        selectedSessions={mockSelectedSessions}
        onSessionToggle={mockOnSessionToggle}
        itemHeight={60}
        containerHeight={400}
      />
    )

    // First visible session should show "Session 1"
    expect(screen.getByText('Session 1')).toBeInTheDocument()
  })

  test('handles session selection', () => {
    render(
      <VirtualizedSessionList
        sessions={mockSessions}
        selectedSessions={mockSelectedSessions}
        onSessionToggle={mockOnSessionToggle}
        itemHeight={60}
        containerHeight={400}
      />
    )

    const firstSession = screen.getByText('Session 1')
    fireEvent.click(firstSession)

    expect(mockOnSessionToggle).toHaveBeenCalledWith('Session 1')
  })

  test('displays scroll indicator', () => {
    render(
      <VirtualizedSessionList
        sessions={mockSessions}
        selectedSessions={mockSelectedSessions}
        onSessionToggle={mockOnSessionToggle}
        itemHeight={60}
        containerHeight={400}
      />
    )

    expect(screen.getByText(/Showing \d+-\d+ of 100 sessions/)).toBeInTheDocument()
  })

  test('handles empty sessions list', () => {
    render(
      <VirtualizedSessionList
        sessions={[]}
        selectedSessions={[]}
        onSessionToggle={mockOnSessionToggle}
        itemHeight={60}
        containerHeight={400}
      />
    )

    expect(screen.getByText('Showing 0-0 of 0 sessions')).toBeInTheDocument()
  })
})
