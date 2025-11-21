'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTutorial } from './TutorialProvider'
import { TutorialTooltip } from './TutorialTooltip'

export function TutorialOverlay() {
  const router = useRouter()
  const {
    tutorialState,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial
  } = useTutorial()

  const {
    isActive,
    tutorialType,
    currentStep,
    totalSteps,
    hasEnrolledCourses
  } = tutorialState

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case ' ': // Spacebar
          event.preventDefault()
          if (currentStep < totalSteps) {
            nextStep()
          } else {
            completeTutorial()
          }
          break
        case 'ArrowLeft':
          event.preventDefault()
          if (currentStep > 1) {
            previousStep()
          }
          break
        case 'Escape':
          event.preventDefault()
          skipTutorial()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, currentStep, totalSteps, nextStep, previousStep, skipTutorial, completeTutorial])

  // Don't render if tutorial is not active
  if (!isActive || tutorialType !== 'dashboard') {
    return null
  }

  const getStepConfig = () => {
    switch (currentStep) {
      case 1:
        return {
          targetElementId: 'mobile-stats-chart',
          message: "Track your progress in different ways - we'll have more chart options later! (1/4)",
          variant: 'blue' as const,
          placement: 'bottom' as const,
          pulseTarget: true,
          spotlightMode: false,
          showPrevious: false
        }

      case 2:
        return {
          targetElementId: 'constellation-chart-container',
          message: "We'll show your XP and level progress here (2/4)",
          variant: 'green' as const,
          placement: 'left' as const,
          pulseTarget: true,
          spotlightMode: false,
          showPrevious: true
        }

      case 3:
        // Smart branching: if no enrolled courses, show course discovery
        if (!hasEnrolledCourses) {
          return {
            targetElementId: 'training-ground-books',
            message: "When you catch the learning bug, check out all the courses we have here (3/3)",
            variant: 'purple' as const,
            placement: 'top' as const,
            pulseTarget: true,
            spotlightMode: false, // No spotlight - just tooltip above panda
            showPrevious: true
          }
        }
        // Otherwise continue with full tour
        return {
          targetElementId: 'training-ground-books',
          message: "When you catch the learning bug, check out all the courses we have here (3/4)",
          variant: 'purple' as const,
          placement: 'top' as const,
          pulseTarget: true,
          spotlightMode: false,
          showPrevious: true
        }

      case 4:
        // Only show step 4 if user has enrolled courses
        return {
          targetElementId: 'continue-adventure-btn',
          message: "Ready to dive in? Let's continue your learning journey! (4/4)",
          variant: 'red' as const,
          placement: 'top' as const,
          pulseTarget: true,
          spotlightMode: false,
          showPrevious: true
        }

      default:
        return null
    }
  }

  const stepConfig = getStepConfig()
  if (!stepConfig) return null

  const handleNext = () => {
    if (currentStep < totalSteps) {
      nextStep()
    } else {
      // Complete tutorial and navigate appropriately
      completeTutorial()

      // Navigate based on user state:
      if (hasEnrolledCourses) {
        // For enrolled users, simulate clicking the continue adventure button
        // This will take them to their next lesson
        const continueBtn = document.getElementById('continue-adventure-btn')
        if (continueBtn && continueBtn.closest('a')) {
          continueBtn.closest('a')?.click()
        } else {
          // Fallback to courses page
          router.push('/courses')
        }
      } else {
        // For non-enrolled users, go to course discovery
        router.push('/courses')
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      previousStep()
    }
  }

  return (
    <>
      {/* Main overlay backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 transition-all duration-300" />

      {/* Tutorial tooltip */}
      <TutorialTooltip
        targetElementId={stepConfig.targetElementId}
        message={stepConfig.message}
        step={currentStep}
        totalSteps={totalSteps}
        placement={stepConfig.placement}
        variant={stepConfig.variant}
        pulseTarget={stepConfig.pulseTarget}
        spotlightMode={stepConfig.spotlightMode}
        showNext={true}
        showPrevious={stepConfig.showPrevious}
        showSkip={true}
        onNext={handleNext}
        onPrevious={stepConfig.showPrevious ? handlePrevious : undefined}
        onSkip={skipTutorial}
        onDismiss={skipTutorial}
      />
    </>
  )
}