# Story 7.6.1: Professor Review Panel

**Epic**: 7.6 - Tutor Polish & Audio
**Status**: 🚧 Not Started
**Priority**: P0
**Estimated Effort**: 2 hours
**Dependencies**: Epic 7.5 Complete ✅

---

## User Story

**As a** language learner
**I want to** receive a comprehensive, encouraging review of my performance after the conversation
**So that** I understand my progress and feel motivated to continue learning

---

## Acceptance Criteria

- [ ] Professor Review displays after clicking "Terminar Diálogo"
- [ ] Shows before the ErrorPlayback transcript
- [ ] Includes overall performance rating (Excelente/Muy Bien/Bien/Necesita Práctica)
- [ ] Displays encouraging summary paragraph
- [ ] Lists 2-3 strengths identified
- [ ] Lists 1-2 areas for improvement
- [ ] Shows scrollable list of all errors with corrections
- [ ] Breakdown by category (Grammar/Vocabulary/Syntax)
- [ ] Positive, encouraging tone throughout
- [ ] Mobile responsive layout
- [ ] Loading state while generating

---

## Technical Specification

### Component Structure

**File**: `components/tutor/ProfessorReview.tsx`

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import type { ErrorAnalysis } from '@/types/tutor'

interface ProfessorReview {
  overallScore: 'excelente' | 'muy_bien' | 'bien' | 'necesita_practica'
  summary: string
  strengths: string[]
  areasForImprovement: string[]
  errorBreakdown: {
    grammar: number
    vocabulary: number
    syntax: number
  }
  encouragement: string
}

interface ProfessorReviewProps {
  review: ProfessorReview
  errors: ErrorAnalysis[]
}

export function ProfessorReview({ review, errors }: ProfessorReviewProps) {
  const scoreColors = {
    excelente: 'bg-green-100 text-green-800 border-green-500',
    muy_bien: 'bg-blue-100 text-blue-800 border-blue-500',
    bien: 'bg-yellow-100 text-yellow-800 border-yellow-500',
    necesita_practica: 'bg-orange-100 text-orange-800 border-orange-500'
  }

  const scoreLabels = {
    excelente: '¡Excelente!',
    muy_bien: 'Muy Bien',
    bien: 'Bien',
    necesita_practica: 'Necesitas Más Práctica'
  }

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className={`border-l-4 ${scoreColors[review.overallScore]}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            {scoreLabels[review.overallScore]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sepia-700 leading-relaxed">{review.summary}</p>
        </CardContent>
      </Card>

      {/* Strengths */}
      {review.strengths.length > 0 && (
        <Card className="border-l-4 border-l-green-500 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Fortalezas (Strengths)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {review.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-sepia-700">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Areas for Improvement */}
      {review.areasForImprovement.length > 0 && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <TrendingUp className="h-5 w-5" />
              Áreas de Mejora (Areas for Growth)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {review.areasForImprovement.map((area, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">→</span>
                  <span className="text-sepia-700">{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Error Breakdown */}
      <Card className="border-sepia-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sepia-900">
            <AlertCircle className="h-5 w-5" />
            Detalles de Errores (Error Details)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Category Counts */}
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="bg-red-100 px-3 py-2 rounded">
              <span className="text-xs font-medium text-red-800">
                📝 Grammar: {review.errorBreakdown.grammar}
              </span>
            </div>
            <div className="bg-blue-100 px-3 py-2 rounded">
              <span className="text-xs font-medium text-blue-800">
                📚 Vocabulary: {review.errorBreakdown.vocabulary}
              </span>
            </div>
            <div className="bg-purple-100 px-3 py-2 rounded">
              <span className="text-xs font-medium text-purple-800">
                🔧 Syntax: {review.errorBreakdown.syntax}
              </span>
            </div>
          </div>

          {/* Scrollable Error List */}
          <div className="max-h-64 overflow-y-auto space-y-2 border-t pt-4">
            {errors.map((error, idx) => (
              <ErrorDetailItem key={idx} error={error} index={idx + 1} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Encouragement */}
      <Card className="bg-gradient-to-r from-sepia-50 to-amber-50 border-sepia-200">
        <CardContent className="pt-6">
          <p className="text-center text-sepia-800 font-medium italic">
            {review.encouragement}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Individual Error Item
function ErrorDetailItem({ error, index }: { error: ErrorAnalysis; index: number }) {
  const categoryIcons = {
    grammar: '📝',
    vocabulary: '📚',
    syntax: '🔧'
  }

  return (
    <div className="flex items-start gap-2 p-2 bg-sepia-50 rounded">
      <span className="text-xs font-medium text-sepia-500 min-w-[24px]">
        {index}.
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span>{categoryIcons[error.category || 'grammar']}</span>
          <span className="text-xs line-through text-sepia-600">
            {error.errorText}
          </span>
          <span className="text-xs">→</span>
          <span className="text-xs font-medium text-green-700">
            {error.correction}
          </span>
        </div>
        <p className="text-xs text-sepia-600 ml-6">
          {error.explanation}
        </p>
      </div>
    </div>
  )
}
```

---

## API Implementation

### Generate Review Tool

**File**: `lib/tutor-tools.ts` (add new tool)

```typescript
// Zod schema
const ProfessorReviewOutputSchema = z.object({
  overallScore: z.enum(['excelente', 'muy_bien', 'bien', 'necesita_practica']),
  summary: z.string().min(50),
  strengths: z.array(z.string()).min(1).max(3),
  areasForImprovement: z.array(z.string()).min(0).max(2),
  encouragement: z.string().min(30)
})

export const generateProfessorReviewTool = tool(
  async ({ sessionId }) => {
    const supabase = await createClient()

    // Get session and errors
    const { data: session } = await supabase
      .from('tutor_sessions')
      .select('*, library_texts(*)')
      .eq('id', sessionId)
      .single()

    // Get all turns with user responses
    const { data: turns } = await supabase
      .from('dialog_turns')
      .select('*')
      .eq('session_id', sessionId)
      .not('user_response', 'is', null)

    // Calculate error breakdown from turns
    const errors = extractErrorsFromTurns(turns)
    const errorBreakdown = {
      grammar: errors.filter(e => e.category === 'grammar').length,
      vocabulary: errors.filter(e => e.category === 'vocabulary').length,
      syntax: errors.filter(e => e.category === 'syntax').length
    }

    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.7
    }).withStructuredOutput(ProfessorReviewOutputSchema)

    const systemPrompt = `Eres un profesor de español amable y alentador evaluando el desempeño de un estudiante nivel ${session.level}.

Conversación:
${turns.map(t => `Turno ${t.turn_number}: ${t.user_response}`).join('\n')}

Errores encontrados: ${errors.length}
- Grammar: ${errorBreakdown.grammar}
- Vocabulary: ${errorBreakdown.vocabulary}
- Syntax: ${errorBreakdown.syntax}

Genera una evaluación POSITIVA y ALENTADORA:

1. **Overall Score**: Basado en errores:
   - 0-2 errores: "excelente"
   - 3-5 errores: "muy_bien"
   - 6-10 errores: "bien"
   - 11+ errores: "necesita_practica"

2. **Summary**: 2-3 oraciones positivas sobre el desempeño general

3. **Strengths**: 2-3 aspectos positivos específicos (ej: "Usaste el subjuntivo correctamente", "Buen vocabulario relacionado con comida")

4. **Areas for Improvement**: 1-2 áreas constructivas (siempre con tono positivo)

5. **Encouragement**: Mensaje final motivador

IMPORTANTE: Mantén un tono POSITIVO y ALENTADOR en todo momento. Enfatiza el progreso y el esfuerzo.`

    const review = await model.invoke([
      { role: "system", content: systemPrompt }
    ]) as {
      overallScore: string
      summary: string
      strengths: string[]
      areasForImprovement: string[]
      encouragement: string
    }

    return {
      ...review,
      errorBreakdown
    }
  },
  {
    name: "generate_professor_review",
    description: "Generate encouraging performance review after conversation",
    schema: z.object({
      sessionId: z.string().uuid()
    })
  }
)
```

---

## Implementation Steps

1. **Create ProfessorReview Component**
   - Build UI structure with cards
   - Implement scrollable error list
   - Add responsive styling

2. **Create generateProfessorReviewTool**
   - Add to tutor-tools.ts
   - Implement scoring logic
   - Test with various error counts

3. **Update TutorPanel handleEndDialog**
   - Call generateProfessorReviewTool
   - Store review in state
   - Pass to ProfessorReview component

4. **Update UI Flow**
   - Show loading state: "El profesor está revisando..."
   - Display ProfessorReview first
   - Then show ErrorPlayback transcript

---

## Testing Checklist

- [ ] Review generates for 0 errors (perfect score)
- [ ] Review generates for 1-5 errors (good scores)
- [ ] Review generates for 10+ errors (needs practice)
- [ ] Strengths are specific and relevant
- [ ] Tone is consistently positive
- [ ] Error list scrolls properly
- [ ] Category breakdown accurate
- [ ] Mobile layout works
- [ ] Loading state shows
- [ ] Error handling graceful

---

## Success Criteria

**Story Complete When**:
- ✅ ProfessorReview component created and styled
- ✅ generateProfessorReviewTool implemented
- ✅ Review displays after conversation
- ✅ Tone is positive and encouraging
- ✅ All error details visible
- ✅ Tests passing
- ✅ Manually tested with real conversation

---

**Created**: 2025-10-31
**Author**: Claude (Dev Agent)
