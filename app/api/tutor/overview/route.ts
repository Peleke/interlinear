import { NextRequest, NextResponse } from 'next/server'
import { generateOverviewTool } from '@/lib/tutor-tools'
import { getCachedOverview, setCachedOverview } from '@/lib/overview-cache'
import { tutorLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

const OverviewRequestSchema = z.object({
  textId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = OverviewRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Rate limiting (10 requests per minute per text)
    try {
      await tutorLimiter.check(10, parsed.data.textId)
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Check cache first
    const cached = getCachedOverview(parsed.data.textId)
    if (cached) {
      return NextResponse.json({ overview: cached, cached: true })
    }

    // Generate fresh overview
    const overview = await generateOverviewTool.invoke(parsed.data)

    // Cache the result
    setCachedOverview(parsed.data.textId, overview)

    return NextResponse.json({ overview, cached: false })
  } catch (error) {
    console.error('Generate overview error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to generate overview' },
      { status: 500 }
    )
  }
}
