import { lazy } from 'react'

// Centralized lazy component definitions for better testability
export const LandingPanel = lazy(() => import('./components/LandingPanel'))
export const UploadPanel = lazy(() => import('./components/UploadPanel'))
export const SessionSelect = lazy(() => import('./components/SessionSelect'))
export const WorkoutMode = lazy(() => import('./components/WorkoutMode'))
