import { NextRequest, NextResponse } from 'next/server'
import { generateProfessorReviewTool } from '@/lib/tutor-tools'
import { tutorLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

const GenerateReviewRequestSchema = z.object({
  sessionId: z.string().uuid(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  language: z.enum(['es', 'la']).default('es'),
  errors: z.array(z.object({
    turn: z.number(),
    errorText: z.string(),
    correction: z.string(),
    explanation: z.string(),
    category: z.enum(['grammar', 'vocabulary', 'syntax'])
  }))
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Rate limiting (10 requests per minute per IP/user)
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    try {
      await tutorLimiter.check(10, identifier)
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Validate request
    const parsed = GenerateReviewRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Invoke tool
    const result = await generateProfessorReviewTool.invoke(parsed.data)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Generate review error:', error)

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === 'Session not found') {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate professor review' },
      { status: 500 }
    )
  }
}
