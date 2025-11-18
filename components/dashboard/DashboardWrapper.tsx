'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLoader from './DashboardLoader'

interface DashboardWrapperProps {
  children: React.ReactNode
}

export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)

  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  if (isLoading) {
    return <DashboardLoader onComplete={handleLoadingComplete} />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}