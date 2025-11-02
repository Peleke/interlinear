'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PREDEFINED_GOALS = [
  { id: 'travel', label: 'Travel & Tourism', emoji: '✈️' },
  { id: 'business', label: 'Business & Work', emoji: '💼' },
  { id: 'academic', label: 'Academic Study', emoji: '📚' },
  { id: 'cultural', label: 'Cultural Exploration', emoji: '🎭' },
  { id: 'family', label: 'Family & Friends', emoji: '👨‍👩‍👧‍👦' },
]

export function OnboardingWelcome() {
  const router = useRouter()
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [customGoal, setCustomGoal] = useState('')

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    )
  }

  const handleNext = () => {
    // Store goals in sessionStorage for use in Story 2.2 (AI chat)
    sessionStorage.setItem(
      'onboardingGoals',
      JSON.stringify({
        selectedGoals,
        customGoal,
      })
    )
    router.push('/onboarding/assessment')
  }

  const hasGoals = selectedGoals.length > 0 || customGoal.trim().length > 0

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif text-sepia-900 mb-4">
            ¡Bienvenido!
          </h1>
          <p className="text-lg text-sepia-700">
            Welcome to Interlinear. Let's personalize your Spanish learning journey.
          </p>
        </div>

        {/* Goal Selection Section */}
        <div className="bg-white rounded-lg shadow-sm border border-sepia-200 p-8 mb-6">
          <h2 className="text-2xl font-serif text-sepia-900 mb-2">
            What are your learning goals?
          </h2>
          <p className="text-sepia-600 mb-6">
            Select one or more goals that match your interests:
          </p>

          {/* Predefined Goal Chips */}
          <div className="flex flex-wrap gap-3 mb-8">
            {PREDEFINED_GOALS.map((goal) => {
              const isSelected = selectedGoals.includes(goal.id)
              return (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-sepia-700 text-white border-sepia-700'
                      : 'bg-white text-sepia-700 border-sepia-300 hover:border-sepia-500'
                  }`}
                >
                  <span className="text-xl">{goal.emoji}</span>
                  <span className="font-medium">{goal.label}</span>
                </button>
              )
            })}
          </div>

          {/* Freeform Spanish Input */}
          <div>
            <label
              htmlFor="customGoal"
              className="block text-sm font-medium text-sepia-700 mb-2"
            >
              Or describe your goals in Spanish (optional):
            </label>
            <textarea
              id="customGoal"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="Quiero hablar español porque..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-sepia-300 rounded-lg focus:outline-none focus:border-sepia-700 transition-colors resize-none text-sepia-900 placeholder-sepia-400"
            />
            <p className="text-xs text-sepia-500 mt-2">
              💡 Feel free to write in Spanish! This helps us assess your current level.
            </p>
          </div>
        </div>

        {/* Next Button */}
        <div className="flex justify-center">
          <button
            onClick={handleNext}
            disabled={!hasGoals}
            className={`px-8 py-4 rounded-lg font-medium text-lg transition-all ${
              hasGoals
                ? 'bg-sepia-700 text-white hover:bg-sepia-800'
                : 'bg-sepia-200 text-sepia-400 cursor-not-allowed'
            }`}
          >
            Next: Level Assessment →
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 flex justify-center items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sepia-700"></div>
          <div className="w-3 h-3 rounded-full bg-sepia-300"></div>
          <div className="w-3 h-3 rounded-full bg-sepia-300"></div>
        </div>
        <p className="text-center text-sm text-sepia-600 mt-2">
          Step 1 of 3: Learning Goals
        </p>
      </div>
    </div>
  )
}
