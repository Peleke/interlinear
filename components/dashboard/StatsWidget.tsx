'use client'

import { Zap, Flame, Trophy, TrendingUp } from 'lucide-react'

interface StatsWidgetProps {
  xp: number
  streak: number
  level: number
  completedLessons: number
}

// Level thresholds (XP needed for each level)
const LEVEL_THRESHOLDS = [
  0, // Level 1
  100, // Level 2
  250, // Level 3
  500, // Level 4
  1000, // Level 5
  2000, // Level 6
  3500, // Level 7
  5500, // Level 8
  8000, // Level 9
  11000 // Level 10
]

function calculateLevel(xp: number): { level: number; progress: number; nextLevelXp: number } {
  let level = 1
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
      break
    }
  }

  const currentLevelXp = LEVEL_THRESHOLDS[level - 1] || 0
  const nextLevelXp = LEVEL_THRESHOLDS[level] || currentLevelXp + 1000
  const xpInCurrentLevel = xp - currentLevelXp
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp
  const progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100

  return { level, progress, nextLevelXp }
}

export default function StatsWidget({ xp, streak, level: _level, completedLessons }: StatsWidgetProps) {
  const { level, progress, nextLevelXp } = calculateLevel(xp)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* XP Widget */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-600 rounded-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <TrendingUp className="h-5 w-5 text-purple-600" />
        </div>
        <div className="mb-2">
          <p className="text-sm font-medium text-purple-700 uppercase tracking-wide">
            Experience Points
          </p>
          <p className="text-4xl font-bold text-purple-900">{xp.toLocaleString()}</p>
        </div>
        <div className="text-xs text-purple-600">
          {nextLevelXp - xp} XP to Level {level + 1}
        </div>
      </div>

      {/* Streak Widget */}
      <div className="bg-gradient-to-br from-orange-50 to-red-100 border-2 border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
            <Flame className="h-6 w-6 text-white" />
          </div>
          {streak > 0 && <span className="text-2xl">🔥</span>}
        </div>
        <div className="mb-2">
          <p className="text-sm font-medium text-orange-700 uppercase tracking-wide">
            Day Streak
          </p>
          <p className="text-4xl font-bold text-orange-900">{streak}</p>
        </div>
        <div className="text-xs text-orange-600">
          {streak > 0 ? 'Keep it going!' : 'Start your streak today!'}
        </div>
      </div>

      {/* Level Widget */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-100 border-2 border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl">⭐</span>
        </div>
        <div className="mb-2">
          <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">
            Current Level
          </p>
          <p className="text-4xl font-bold text-blue-900">{level}</p>
        </div>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-blue-600 mt-1">{Math.round(progress)}% to next level</p>
        </div>
      </div>

      {/* Lessons Completed Widget */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-2xl">📚</span>
        </div>
        <div className="mb-2">
          <p className="text-sm font-medium text-green-700 uppercase tracking-wide">
            Lessons Completed
          </p>
          <p className="text-4xl font-bold text-green-900">{completedLessons}</p>
        </div>
        <div className="text-xs text-green-600">
          {completedLessons > 0 ? 'Amazing progress!' : 'Complete your first lesson!'}
        </div>
      </div>
    </div>
  )
}
