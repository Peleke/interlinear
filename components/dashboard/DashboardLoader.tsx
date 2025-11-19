'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface DashboardLoaderProps {
  onComplete: () => void
}

export default function DashboardLoader({ onComplete }: DashboardLoaderProps) {
  useEffect(() => {
    // Minimum 2.5 second loading time (25% slower)
    const timer = setTimeout(() => {
      onComplete()
    }, 2500)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="min-h-screen bg-gradient-to-br from-desert-sand via-sepia-50 to-desert-warm flex items-center justify-center">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-sunset-gold/5 via-transparent to-sunset-red/5 pointer-events-none" />

      <motion.div
        className="relative flex flex-col items-center space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Mandala Animation */}
        <div className="w-32 h-32">
          <DotLottieReact
            src="/assets/lottie/mandala.lottie"
            loop
            autoplay
          />
        </div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-xl font-medium text-sepia-700">
            Loading...
          </h2>
        </motion.div>

        {/* Optional pulsing dots animation */}
        <motion.div
          className="flex space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-sunset-gold rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}