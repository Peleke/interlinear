'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { usePathname } from 'next/navigation'

type TutorialType = 'dashboard' | 'discovery' | null
type TutorialStep = 1 | 2 | 3 | 4

interface TutorialPosition {
  x: number
  y: number
  placement: 'top' | 'bottom' | 'left' | 'right'
}

interface TutorialState {
  isActive: boolean
  tutorialType: TutorialType
  currentStep: TutorialStep
  totalSteps: number
  hasEnrolledCourses: boolean
  tutorialCompleted: boolean
}

interface TutorialContextValue {
  // State
  tutorialState: TutorialState

  // Actions
  startTutorial: (type: TutorialType) => void
  nextStep: () => void
  previousStep: () => void
  skipTutorial: () => void
  completeTutorial: () => void
  setTargetElement: (elementId: string, position: TutorialPosition) => void

  // Current step info
  targetElementId: string | null
  targetPosition: TutorialPosition | null
}

const TutorialContext = createContext<TutorialContextValue | null>(null)

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider')
  }
  return context
}

interface TutorialProviderProps {
  children: React.ReactNode
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    isActive: false,
    tutorialType: null,
    currentStep: 1,
    totalSteps: 4,
    hasEnrolledCourses: false,
    tutorialCompleted: false
  })

  const [targetElementId, setTargetElementId] = useState<string | null>(null)
  const [targetPosition, setTargetPosition] = useState<TutorialPosition | null>(null)

  // Check tutorial status and enrollment on mount
  useEffect(() => {
    if (!user) return

    const checkTutorialStatus = async () => {
      const supabase = createClient()

      try {
        // Check if tutorial is already completed
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('tutorial_completed, tutorial_step')
          .eq('user_id', user.id)
          .single()

        // Check if user has enrolled courses
        const { data: enrollments } = await supabase
          .from('user_courses')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        const hasEnrolledCourses = enrollments && enrollments.length > 0

        setTutorialState(prev => ({
          ...prev,
          tutorialCompleted: profile?.tutorial_completed || false,
          hasEnrolledCourses,
          totalSteps: hasEnrolledCourses ? 4 : 3 // 4 steps if enrolled, 3 if not
        }))

        // Auto-start tutorial if not completed and we're on dashboard
        if (!profile?.tutorial_completed && pathname === '/dashboard') {
          setTimeout(() => {
            startTutorial('dashboard')
          }, 2000) // 2 second delay for page to load
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error)
      }
    }

    checkTutorialStatus()
  }, [user, pathname])

  const startTutorial = (type: TutorialType) => {
    if (!type) return

    setTutorialState(prev => ({
      ...prev,
      isActive: true,
      tutorialType: type,
      currentStep: 1
    }))
  }

  const nextStep = () => {
    setTutorialState(prev => {
      if (prev.currentStep < prev.totalSteps) {
        return { ...prev, currentStep: (prev.currentStep + 1) as TutorialStep }
      }
      return prev
    })
  }

  const previousStep = () => {
    setTutorialState(prev => {
      if (prev.currentStep > 1) {
        return { ...prev, currentStep: (prev.currentStep - 1) as TutorialStep }
      }
      return prev
    })
  }

  const skipTutorial = () => {
    completeTutorial()
  }

  const completeTutorial = async () => {
    console.log('🎯 completeTutorial called', { userId: user?.id })

    setTutorialState(prev => ({
      ...prev,
      isActive: false,
      tutorialCompleted: true
    }))

    // Update database
    if (user) {
      const supabase = createClient()
      try {
        console.log('📝 Updating tutorial status in DB for user:', user.id)
        const result = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            tutorial_completed: true,
            tutorial_step: null
          }, {
            onConflict: 'user_id'
          })
        console.log('✅ Tutorial DB update result:', result)
      } catch (error) {
        console.error('❌ Error updating tutorial status:', error)
      }
    }
  }

  const setTargetElement = (elementId: string, position: TutorialPosition) => {
    setTargetElementId(elementId)
    setTargetPosition(position)
  }

  const value: TutorialContextValue = {
    tutorialState,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    setTargetElement,
    targetElementId,
    targetPosition
  }

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  )
}