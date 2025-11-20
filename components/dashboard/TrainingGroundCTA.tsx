'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Play } from 'lucide-react'
import Link from 'next/link'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface TrainingGroundCTAProps {
  currentCourse?: {
    id: string
    title: string
    progress: number
  } | null
  nextLesson?: {
    id: string
    title: string
    courseId: string
  } | null
  className?: string
}

export default function TrainingGroundCTA({
  currentCourse,
  nextLesson,
  className = ''
}: TrainingGroundCTAProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showContinueTooltip, setShowContinueTooltip] = useState(false)
  const [showTutorialTooltip, setShowTutorialTooltip] = useState(true) // Show tutorial tooltip by default

  // Check if user has any enrolled courses (simplified logic)
  const hasEnrolledCourses = !!nextLesson

  if (hasEnrolledCourses && nextLesson) {
    // User has enrolled courses - show "Continue your adventure" button
    return (
      <div className={`relative ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Books Animation */}
          <div className="flex justify-center relative">
            <Link href="/courses" className="block">
              <div
                className="w-32 h-32 cursor-pointer hover:scale-105 transition-transform duration-300"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <DotLottieReact
                  src="/assets/lottie/book.lottie"
                  loop
                  autoplay
                />
              </div>
            </Link>

            {/* Tooltip */}
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full mt-2 bg-sepia-900 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg z-10"
              >
                Browse all courses
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-sepia-900 rotate-45"></div>
              </motion.div>
            )}
          </div>

          <Link
            href={`/courses/${nextLesson.courseId}/lessons/${nextLesson.id}`}
            className="block"
          >
            <motion.div
              className="group relative bg-sepia-50 border border-sepia-200 text-sepia-900 rounded-lg p-4 cursor-pointer overflow-hidden shadow-sm hover:shadow-md"
              onHoverStart={() => {
                setIsHovering(true)
                setShowContinueTooltip(true)
              }}
              onHoverEnd={() => {
                setIsHovering(false)
                setShowContinueTooltip(false)
              }}
              whileHover={{ scale: 1.005, y: -1 }}
              whileTap={{ scale: 0.995 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-2 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                    animate={{ rotate: isHovering ? 15 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Play className="h-5 w-5 text-green-700" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-lg text-sepia-900">Continue your adventure</h4>
                    <p className="text-sepia-600 text-sm">{nextLesson.title}</p>
                  </div>
                </div>
                <motion.div
                  animate={{ x: isHovering ? 5 : 0 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="text-sepia-700"
                >
                  →
                </motion.div>
              </div>

              {/* Continue Button Tooltip */}
              {showContinueTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg z-10"
                >
                  Resume your language learning journey
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-700 rotate-45"></div>
                </motion.div>
              )}
            </motion.div>
          </Link>
        </motion.div>
      </div>
    )
  }

  // User has no enrolled courses - show HR + Panda + signup message
  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        className="space-y-6"
      >
        {/* HR Separator */}
        <hr className="border-sepia-300" />

        {/* Panda Animation */}
        <div className="flex justify-center">
          <div className="w-32 h-32">
            <DotLottieReact
              src="/assets/lottie/panda.lottie"
              loop
              autoplay
            />
          </div>
        </div>

        {/* Signup Message */}
        <div className="text-center relative">
          <Link href="/courses" className="block">
            <motion.div
              className="group cursor-pointer"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
              onMouseEnter={() => setShowTutorialTooltip(false)}
              onMouseLeave={() => setShowTutorialTooltip(true)}
            >
              <p className="text-lg text-sepia-700 group-hover:text-sepia-900 transition-colors">
                Don't keep sleeping on it...
                <br />
                <span className="font-semibold text-sunset-gold group-hover:text-sunset-red">
                  Sign up for a course today!
                </span>
              </p>
            </motion.div>
          </Link>

          {/* Tutorial Tooltip - Shows by default for first-time users */}
          {showTutorialTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ delay: 1.5, duration: 0.5 }} // Show after 1.5s delay
              className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap shadow-lg z-20 max-w-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">👋</span>
                <span>Get your adventure started by browsing courses!</span>
              </div>
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-purple-600"></div>

              {/* Dismiss button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowTutorialTooltip(false)
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-white text-purple-600 rounded-full flex items-center justify-center text-xs font-bold hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}