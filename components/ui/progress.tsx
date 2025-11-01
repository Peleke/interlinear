import * as React from 'react'

interface ProgressProps {
  value: number
  className?: string
}

export function Progress({ value, className = '' }: ProgressProps) {
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-sepia-200 ${className}`}>
      <div
        className="h-full bg-sepia-700 transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
