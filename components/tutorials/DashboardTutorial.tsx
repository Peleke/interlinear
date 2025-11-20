'use client'

import React from 'react'
import { useTutorial } from './TutorialProvider'
import { TutorialOverlay } from './TutorialOverlay'

/**
 * Dashboard Tutorial Component
 *
 * Renders the tutorial overlay for the dashboard page.
 * Automatically handles both flows:
 * - Users with no courses: 3-step tour ending with course discovery
 * - Users with courses: 4-step full dashboard tour
 */
export function DashboardTutorial() {
  const { tutorialState } = useTutorial()

  // Only render on dashboard tutorial
  if (tutorialState.tutorialType !== 'dashboard' || !tutorialState.isActive) {
    return null
  }

  return <TutorialOverlay />
}