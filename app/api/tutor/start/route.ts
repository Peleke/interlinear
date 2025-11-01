import { NextRequest, NextResponse } from 'next/server'
import { startDialogTool } from '@/lib/tutor-tools'
import { tutorLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

const StartRequestSchema = z.object({
  textId: z.string().uuid(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
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
    const parsed = StartRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Invoke tool
    const result = await startDialogTool.invoke(parsed.data)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Start dialog error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to start dialog' },
      { status: 500 }
    )
  }
}
