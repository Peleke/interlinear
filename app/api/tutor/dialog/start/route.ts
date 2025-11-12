import { NextRequest, NextResponse } from 'next/server'
import { startDialogRoleplayTool } from '@/lib/tutor-tools'
import { tutorLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

const StartDialogRoleplayRequestSchema = z.object({
  dialogId: z.string().uuid(),
  selectedRole: z.string().min(1),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  language: z.enum(['es', 'la']).default('es')
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
    const parsed = StartDialogRoleplayRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Invoke tool
    const result = await startDialogRoleplayTool.invoke(parsed.data)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Start dialog roleplay error:', error)

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === 'Dialog not found') {
        return NextResponse.json({ error: 'Dialog not found' }, { status: 404 })
      }
      if (error.message.includes('Could not determine opposite character')) {
        return NextResponse.json({ error: 'Invalid dialog structure' }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to start dialog roleplay session' },
      { status: 500 }
    )
  }
}
