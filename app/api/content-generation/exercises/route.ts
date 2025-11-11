/**
 * Exercise Generation API Route
 *
 * POST /api/content-generation/exercises
 *
 * Generates exercises using LLM based on content
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateExercises, ExerciseInput } from '@/lib/content-generation/tools/generate-exercises'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const input: ExerciseInput = {
      content: body.content,
      type: body.type,
      count: body.count || 3,
      targetLevel: body.targetLevel || 'A1',
      language: body.language || 'es',
    }

    if (!input.content || !input.type) {
      return NextResponse.json(
        { error: 'Missing required fields: content, type' },
        { status: 400 }
      )
    }

    // Generate exercises
    const result = await generateExercises(input)

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: 'Exercise generation failed', result },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      exercises: result.exercises,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error('Exercise generation API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
