/**
 * Content Generation Workflow API
 *
 * POST /api/workflows/content-generation
 *
 * Executes vocabulary extraction workflow
 *
 * @see lib/content-generation/workflows/content-generation.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  executeContentGeneration,
  contentGenerationInputSchema,
  type ContentGenerationOutput,
} from '@/lib/content-generation/workflows/content-generation'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()

    // Validate input
    const validationResult = contentGenerationInputSchema.safeParse({
      ...body,
      userId: user.id,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validationResult.error.format(),
        },
        { status: 400 }
      )
    }

    const input = validationResult.data

    console.log(`[API] Starting content generation for lesson ${input.lessonId}`)
    console.log(`[API] Language: ${input.language}, Level: ${input.targetLevel}`)

    // Execute workflow
    const result: ContentGenerationOutput = await executeContentGeneration(input)

    console.log(`[API] Workflow completed: ${result.status}`)
    console.log(`[API] Vocabulary items: ${result.metadata.vocabularyCount}`)
    console.log(`[API] Execution time: ${result.metadata.executionTime}ms`)

    // Log to database (ai_generations table)
    if (result.status === 'completed') {
      await supabase.from('ai_generations').insert({
        lesson_id: input.lessonId,
        generation_type: 'vocabulary',
        status: 'completed',
        input_data: {
          readingText: input.readingText,
          targetLevel: input.targetLevel,
          language: input.language,
          maxItems: input.maxVocabularyItems,
        },
        output_data: {
          vocabulary: result.vocabulary,
        },
        tokens_used: null, // Dictionary API doesn't use tokens
        cost_usd: result.metadata.cost,
        created_by: user.id,
        completed_at: new Date().toISOString(),
      })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[API] Content generation error:', error)

    return NextResponse.json(
      {
        error: 'Content generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
