'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ProfessorOverviewType {
  summary: string
  grammarConcepts: string[]
  vocabThemes: string[]
  syntaxPatterns: string[]
}

interface ProfessorOverviewProps {
  textId: string
  language: 'es' | 'la'
}

export function ProfessorOverview({ textId, language }: ProfessorOverviewProps) {
  const [overview, setOverview] = useState<ProfessorOverviewType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    async function fetchOverview() {
      try {
        const response = await fetch('/api/tutor/overview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ textId, language })
        })

        if (!response.ok) throw new Error('Failed to load overview')

        const data = await response.json()
        setOverview(data.overview)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load overview')
      } finally {
        setLoading(false)
      }
    }

    fetchOverview()
  }, [textId, language])

  if (loading) {
    return (
      <Card className="mb-6 bg-sepia-50 border-sepia-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sepia-900">
            <BookOpen className="h-5 w-5" />
{language === 'la' ? "Professor's Overview" : "Resumen del Profesor"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 animate-pulse">
          <div className="h-4 bg-sepia-200 rounded w-full"></div>
          <div className="h-4 bg-sepia-200 rounded w-5/6"></div>
          <div className="h-4 bg-sepia-200 rounded w-4/6"></div>
        </CardContent>
      </Card>
    )
  }

  if (error || !overview) {
    return (
      <Card className="mb-6 bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-700 text-sm">
            {error || 'Could not load overview'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 bg-sepia-50 border-sepia-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sepia-900">
            <BookOpen className="h-5 w-5" />
{language === 'la' ? "Professor's Overview" : "Resumen del Profesor"}
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
          {/* Summary */}
          <div>
            <h3 className="font-semibold text-sepia-900 mb-2">{language === 'la' ? 'Summary' : 'Resumen'}</h3>
            <p className="text-sepia-700 leading-relaxed">{overview.summary || 'No summary available'}</p>
          </div>

          {/* Grammar Concepts */}
          {overview.grammarConcepts && overview.grammarConcepts.length > 0 && (
            <div>
              <h3 className="font-semibold text-sepia-900 mb-2">
                {language === 'la' ? 'Grammar Concepts' : 'Conceptos Gramaticales'}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sepia-700">
                {overview.grammarConcepts.map((concept, idx) => (
                  <li key={idx}>{concept}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Vocabulary Themes */}
          {overview.vocabThemes && overview.vocabThemes.length > 0 && (
            <div>
              <h3 className="font-semibold text-sepia-900 mb-2">
                {language === 'la' ? 'Vocabulary Themes' : 'Temas de Vocabulario'}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sepia-700">
                {overview.vocabThemes.map((theme, idx) => (
                  <li key={idx}>{theme}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Syntax Patterns */}
          {overview.syntaxPatterns && overview.syntaxPatterns.length > 0 && (
            <div>
              <h3 className="font-semibold text-sepia-900 mb-2">
                {language === 'la' ? 'Syntax Patterns' : 'Patrones de Sintaxis'}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sepia-700">
                {overview.syntaxPatterns.map((pattern, idx) => (
                  <li key={idx}>{pattern}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
