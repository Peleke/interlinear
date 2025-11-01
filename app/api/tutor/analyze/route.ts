import { NextRequest, NextResponse } from 'next/server'
import { analyzeErrorsTool } from '@/lib/tutor-tools'
import { tutorLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

const AnalyzeRequestSchema = z.object({
  sessionId: z.string().uuid()
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

    const parsed = AnalyzeRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const errors = await analyzeErrorsTool.invoke(parsed.data)

    return NextResponse.json({ errors })
  } catch (error) {
    console.error('Analyze errors error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'Session not found') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to analyze errors' },
      { status: 500 }
    )
  }
}
