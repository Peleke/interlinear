import { NextRequest, NextResponse } from 'next/server'
import { continueDialogRoleplayTool } from '@/lib/tutor-tools'
import { tutorLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

const DialogTurnRequestSchema = z.object({
  sessionId: z.string().uuid(),
  userResponse: z.string().min(1).max(1000),
  language: z.enum(['es', 'la']).default('es')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    try {
      await tutorLimiter.check(20, identifier) // Higher limit for conversation
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Validate request
    const parsed = DialogTurnRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Invoke tool
    const result = await continueDialogRoleplayTool.invoke(parsed.data)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Dialog turn error:', error)

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === 'Session not found') {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      if (error.message === 'Not a roleplay session') {
        return NextResponse.json({ error: 'Invalid session type' }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to process turn' },
      { status: 500 }
    )
  }
}
