/**
 * Dialog Generation API Route
 *
 * POST /api/content-generation/dialogs
 *
 * Generates conversational dialogs using LLM based on content
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateDialogs, DialogInput } from '@/lib/content-generation/tools/generate-dialogs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const input: DialogInput = {
      content: body.content,
      targetLevel: body.targetLevel || 'A1',
      language: body.language || 'es',
      dialogCount: body.dialogCount || 2,
      turnsPerDialog: body.turnsPerDialog || 6,
      complexity: body.complexity || 'intermediate',
    }

    if (!input.content) {
      return NextResponse.json(
        { error: 'Missing required field: content' },
        { status: 400 }
      )
    }

    // Generate dialogs
    const result = await generateDialogs(input)

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: 'Dialog generation failed', result },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      dialogs: result.dialogs,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error('Dialog generation API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
