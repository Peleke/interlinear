'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface TypewriterMessageProps {
  message: string
  delay?: number
  speed?: number
  className?: string
}

export default function TypewriterMessage({
  message,
  delay = 0,
  speed = 30,
  className = ''
}: TypewriterMessageProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!message) return

    // Reset state when message changes
    setDisplayedText('')
    setIsComplete(false)

    let index = 0
    let timeoutId: NodeJS.Timeout

    const startTyping = () => {
      if (index < message.length) {
        setDisplayedText(message.slice(0, index + 1))
        index++
        timeoutId = setTimeout(startTyping, speed)
      } else {
        setIsComplete(true)
      }
    }

    const initialTimeout = setTimeout(startTyping, delay)

    return () => {
      clearTimeout(initialTimeout)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [message, speed, delay])

  // Parse markdown-style bold text
  const parseText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2)
        return (
          <strong key={index} className="text-sunset-gold font-semibold">
            {boldText}
          </strong>
        )
      }
      return part
    })
  }

  if (!message) return null

  return (
    <motion.div
      className={`${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 }}
    >
      <div className="bg-sepia-50/80 backdrop-blur-sm border border-sepia-200 rounded-lg p-4 shadow-sm">
        <p className="text-sepia-700 text-center leading-relaxed">
          {parseText(displayedText)}
          {!isComplete && (
            <motion.span
              className="inline-block w-0.5 h-5 bg-sunset-gold ml-1"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </p>
      </div>
    </motion.div>
  )
}