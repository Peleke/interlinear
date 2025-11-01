import { NextRequest, NextResponse } from 'next/server'
import { continueDialogTool, analyzeUserMessageTool } from '@/lib/tutor-tools'
import { tutorLimiter } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const TurnRequestSchema = z.object({
  sessionId: z.string().uuid(),
  userResponse: z.string().min(1).max(1000)
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

    const parsed = TurnRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Get session to retrieve level
    const supabase = await createClient()
    const { data: session } = await supabase
      .from('tutor_sessions')
      .select('level')
      .eq('id', parsed.data.sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Execute in parallel for performance
    const [dialogResult, correction] = await Promise.all([
      continueDialogTool.invoke(parsed.data),
      analyzeUserMessageTool.invoke({
        userMessage: parsed.data.userResponse,
        level: session.level
      })
    ])

    return NextResponse.json({
      ...dialogResult,
      correction
    })
  } catch (error) {
    console.error('Continue dialog error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'Session not found') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to continue dialog' },
      { status: 500 }
    )
  }
}
