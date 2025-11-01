'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface ErrorDetail {
  errorText: string
  correction: string
  explanation: string
  category: 'grammar' | 'vocabulary' | 'syntax'
}

interface TurnCorrection {
  hasErrors: boolean
  correctedText: string
  errors: ErrorDetail[]
}

interface MessageCorrectionProps {
  correction: TurnCorrection
}

export function MessageCorrection({ correction }: MessageCorrectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const { hasErrors, correctedText, errors } = correction

  // No errors - show positive feedback
  if (!hasErrors) {
    return (
      <div className="flex items-center gap-2 mt-1 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>¡Perfecto!</span>
      </div>
    )
  }

  // Has errors - show collapsible correction
  return (
    <Card className="mt-2 border-l-4 border-l-amber-500 bg-amber-50/50">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-amber-100/50 transition-colors rounded"
        aria-expanded={isExpanded}
        aria-label={`${errors.length} correction${errors.length > 1 ? 's' : ''} available`}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            {errors.length} correction{errors.length > 1 ? 's' : ''}
          </span>
          <span className="text-xs text-amber-600 bg-white px-2 py-0.5 rounded-full">
            Click to review
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-amber-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-2">
          {/* Corrected Version */}
          <div className="pt-2 border-t border-amber-200">
            <p className="text-xs font-medium text-amber-800 mb-1">
              Corrected:
            </p>
            <p className="text-sm text-gray-700 italic">
              {correctedText}
            </p>
          </div>

          {/* Individual Errors */}
          <div className="space-y-2">
            {errors.map((error, idx) => (
              <ErrorDetailComponent key={idx} error={error} />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// Individual Error Display
function ErrorDetailComponent({ error }: { error: ErrorDetail }) {
  const categoryColors = {
    grammar: 'bg-red-100 text-red-800 border-red-200',
    vocabulary: 'bg-blue-100 text-blue-800 border-blue-200',
    syntax: 'bg-purple-100 text-purple-800 border-purple-200'
  }

  const categoryIcons = {
    grammar: '📝',
    vocabulary: '📚',
    syntax: '🔧'
  }

  return (
    <div className={`p-2 rounded border ${categoryColors[error.category]}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{categoryIcons[error.category]}</span>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 bg-white rounded">
              {error.category}
            </span>
            <span className="text-xs line-through opacity-70">
              {error.errorText}
            </span>
            <span className="text-xs">→</span>
            <span className="text-xs font-medium">
              {error.correction}
            </span>
          </div>
          <p className="text-xs leading-relaxed">
            {error.explanation}
          </p>
        </div>
      </div>
    </div>
  )
}
