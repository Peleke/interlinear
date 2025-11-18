'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Target } from 'lucide-react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import ConstellationChart from './charts/ConstellationChart'
import RingChart from './charts/RingChart'

export type ChartMode = 'constellation' | 'ring'

interface StatsData {
  xp: number
  streak: number
  level: number
  completedLessons: number
}

interface MobileStatsChartProps extends StatsData {
  className?: string
  nextLesson?: {
    id: string
    title: string
    courseId: string
  } | null
}

const chartModes = [
  {
    key: 'constellation' as ChartMode,
    icon: Sparkles,
    label: 'Constellation',
    description: 'Progress as celestial bodies'
  }
  // Removed ring chart - keeping selector for future charts
]

export default function MobileStatsChart({
  xp,
  streak,
  level,
  completedLessons,
  nextLesson,
  className = ''
}: MobileStatsChartProps) {
  const [currentMode, setCurrentMode] = useState<ChartMode>('constellation')
  const [isLoaded, setIsLoaded] = useState(false)
  const [typedMessage, setTypedMessage] = useState('')
  const [showTooltip, setShowTooltip] = useState(false)

  // Load user preference from localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('dashboard-chart-mode') as ChartMode
      if (savedMode && chartModes.find(m => m.key === savedMode)) {
        setCurrentMode(savedMode)
      }
    } catch (error) {
      console.warn('Failed to load chart mode from localStorage:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save user preference
  const handleModeChange = (mode: ChartMode) => {
    setCurrentMode(mode)
    try {
      localStorage.setItem('dashboard-chart-mode', mode)
    } catch (error) {
      console.warn('Failed to save chart mode to localStorage:', error)
    }
  }

  // Simple typewriter effect
  useEffect(() => {
    if (!isLoaded) return

    const message = nextLesson
      ? `You're about to conquer the lesson **${nextLesson.title}**. Let's go!`
      : "Ready to start your learning journey? Explore courses below!"

    let index = 0
    setTypedMessage('')

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (index < message.length) {
          setTypedMessage(message.slice(0, index + 1))
          index++
        } else {
          clearInterval(interval)
        }
      }, 50)

      return () => clearInterval(interval)
    }, 2000)

    return () => clearTimeout(timer)
  }, [isLoaded, nextLesson])

  // Auto-hide tooltip after 3 seconds
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showTooltip])

  const statsData: StatsData = { xp, streak, level, completedLessons }

  if (!isLoaded) {
    return (
      <div className={`h-80 flex items-center justify-center ${className}`}>
        <div className="w-32 h-32">
          <DotLottieReact
            src="/assets/lottie/mandala.lottie"
            loop
            autoplay
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Chart Mode Toggle */}
      <motion.div
        className="flex justify-center mb-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div
          className="flex bg-sepia-100/80 backdrop-blur-sm rounded-full p-1.5 shadow-lg border border-sepia-200 relative"
          onClick={() => setShowTooltip(!showTooltip)}
        >
          {chartModes.map((mode, index) => (
            <motion.button
              key={mode.key}
              onClick={() => handleModeChange(mode.key)}
              className={`
                relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                flex items-center gap-2
                ${currentMode === mode.key
                  ? 'bg-sunset-gold text-white shadow-md'
                  : 'text-sepia-600 hover:text-sunset-red hover:bg-sepia-50'
                }
              `}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <mode.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{mode.label}</span>

              {currentMode === mode.key && (
                <motion.div
                  className="absolute inset-0 bg-sunset-gold rounded-full -z-10"
                  layoutId="activeMode"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          ))}

          {/* Mobile Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-sepia-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-10"
              >
                More charts coming soon!
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-sepia-800 rotate-45"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Chart Container */}
      <div className="h-72 relative overflow-hidden mt-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
            duration: 0.6
          }}
          className="absolute inset-0"
        >
          <ConstellationChart {...statsData} />
        </motion.div>
      </div>

      {/* Streak Indicator */}
      {isLoaded && (
        <motion.div
          className="mt-1 space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 bg-sunset-red/10 border border-sunset-red/20 rounded-full px-4 py-2">
              <span className="text-lg">🔥</span>
              <span className="text-sepia-700 font-medium">
                {Math.max(streak, 1)} day{Math.max(streak, 1) !== 1 ? 's' : ''} streak
              </span>
            </div>
          </div>

          {/* HR Divider */}
          <hr className="border-sepia-300" />
        </motion.div>
      )}

      {/* Motivational Message */}
      {/* {isLoaded && typedMessage && (
        <div className="mt-6 bg-sepia-50/80 backdrop-blur-sm border border-sepia-200 rounded-lg p-4 shadow-sm">
          <p className="text-sepia-700 text-center leading-relaxed">
            {typedMessage.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                const boldText = part.slice(2, -2)
                return (
                  <strong key={index} className="text-sunset-gold font-semibold">
                    {boldText}
                  </strong>
                )
              }
              return part
            })}
          </p>
        </div>
      )} */}
    </div>
  )
}