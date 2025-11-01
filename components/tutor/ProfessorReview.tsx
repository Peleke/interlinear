'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Award, TrendingUp, Target, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ProfessorReviewData {
  rating: 'Excelente' | 'Muy Bien' | 'Bien' | 'Necesita Práctica'
  summary: string
  strengths: string[]
  improvements: string[]
  errorBreakdown: {
    grammar: number
    vocabulary: number
    syntax: number
  }
}

interface ErrorAnalysis {
  turn: number
  errorText: string
  correction: string
  explanation: string
  category?: 'grammar' | 'vocabulary' | 'syntax'
}

interface ProfessorReviewProps {
  review: ProfessorReviewData
  errors: ErrorAnalysis[]
}

export function ProfessorReview({ review, errors }: ProfessorReviewProps) {
  const [expanded, setExpanded] = useState(true)

  // Get rating colors and icon
  const getRatingStyles = (rating: string) => {
    switch (rating) {
      case 'Excelente':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          badgeBg: 'bg-green-500',
          badgeText: 'text-white'
        }
      case 'Muy Bien':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          badgeBg: 'bg-blue-500',
          badgeText: 'text-white'
        }
      case 'Bien':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          badgeBg: 'bg-amber-500',
          badgeText: 'text-white'
        }
      case 'Necesita Práctica':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          badgeBg: 'bg-orange-500',
          badgeText: 'text-white'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          badgeBg: 'bg-gray-500',
          badgeText: 'text-white'
        }
    }
  }

  const styles = getRatingStyles(review.rating)

  return (
    <Card className={`mb-6 ${styles.bg} ${styles.border}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-sepia-900">
            <Award className="h-6 w-6" />
            Evaluación del Profesor
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-lg ${styles.badgeBg} ${styles.badgeText} font-semibold text-lg`}>
              {review.rating}
            </div>
            <div className={`flex-1 text-sm ${styles.text}`}>
              Calificación General
            </div>
          </div>

          {/* Encouraging Summary */}
          <div className="p-4 bg-white rounded-lg border border-sepia-200">
            <p className={`leading-relaxed ${styles.text}`}>
              {review.summary}
            </p>
          </div>

          {/* Strengths */}
          {review.strengths.length > 0 && (
            <div>
              <h3 className="font-semibold text-sepia-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Fortalezas
              </h3>
              <ul className="space-y-2">
                {review.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sepia-700">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {review.improvements.length > 0 && (
            <div>
              <h3 className="font-semibold text-sepia-900 mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-600" />
                Áreas de Mejora
              </h3>
              <ul className="space-y-2">
                {review.improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sepia-700">
                    <span className="text-amber-600 mt-1">→</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error Breakdown */}
          {errors.length > 0 && (
            <div>
              <h3 className="font-semibold text-sepia-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Desglose de Errores ({errors.length} total)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 border border-sepia-200 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {review.errorBreakdown.grammar}
                  </div>
                  <div className="text-sm text-sepia-600">Gramática</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-sepia-200 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {review.errorBreakdown.vocabulary}
                  </div>
                  <div className="text-sm text-sepia-600">Vocabulario</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-sepia-200 text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {review.errorBreakdown.syntax}
                  </div>
                  <div className="text-sm text-sepia-600">Sintaxis</div>
                </div>
              </div>
            </div>
          )}

          {/* Scrollable Error List */}
          {errors.length > 0 && (
            <div>
              <h3 className="font-semibold text-sepia-900 mb-3">
                Errores Específicos
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-3 bg-white rounded-lg p-4 border border-sepia-200">
                {errors.map((error, idx) => (
                  <div
                    key={idx}
                    className="pb-3 border-b border-sepia-100 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-xs font-medium text-sepia-500">
                        Turno {error.turn}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        error.category === 'grammar' ? 'bg-purple-100 text-purple-700' :
                        error.category === 'vocabulary' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {error.category === 'grammar' ? 'Gramática' :
                         error.category === 'vocabulary' ? 'Vocabulario' :
                         'Sintaxis'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="text-red-600 line-through">
                        {error.errorText}
                      </div>
                      <div className="text-green-600 font-medium">
                        → {error.correction}
                      </div>
                      <div className="text-sepia-600 text-xs mt-1">
                        {error.explanation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
