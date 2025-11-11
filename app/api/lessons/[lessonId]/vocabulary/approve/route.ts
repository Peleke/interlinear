/**
 * Approve Vocabulary API
 *
 * POST /api/lessons/[lessonId]/vocabulary/approve
 *
 * Saves approved vocabulary items to lesson_vocabulary table
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const vocabularyItemSchema = z.object({
  word: z.string(),
  english_translation: z.string(),
  part_of_speech: z.enum(['noun', 'verb', 'adjective', 'adverb', 'other']),
  difficulty_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  example_sentence: z.string(),
  appears_in_reading: z.boolean(),
  frequency: z.number(),
  normalized_form: z.string(),
})

const approveRequestSchema = z.object({
  vocabulary: z.array(vocabularyItemSchema),
  language: z.enum(['es', 'la']).default('es'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params

    // Authenticate
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify lesson ownership
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, author_id')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    if (lesson.author_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Parse and validate request
    const body = await request.json()
    const validationResult = approveRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.format(),
        },
        { status: 400 }
      )
    }

    const { vocabulary, language } = validationResult.data

    console.log(`[API] Approving ${vocabulary.length} vocabulary items for lesson ${lessonId}`)

    // Insert vocabulary items into lesson_vocabulary table
    const vocabularyRecords = vocabulary.map((item) => ({
      lesson_id: lessonId,
      spanish: item.word, // word column
      english: item.english_translation,
      part_of_speech: item.part_of_speech,
      difficulty_level: item.difficulty_level,
      example_sentence: item.example_sentence,
      frequency_score: item.frequency,
      appears_in_reading: item.appears_in_reading,
      normalized_form: item.normalized_form,
      language: language,
      ai_generated: true, // Mark as AI-generated
      ai_metadata: {
        source: 'vocabulary-extraction-workflow',
        timestamp: new Date().toISOString(),
        approved_by: user.id,
      },
    }))

    const { data: insertedVocab, error: insertError } = await supabase
      .from('lesson_vocabulary')
      .insert(vocabularyRecords)
      .select()

    if (insertError) {
      console.error('[API] Failed to insert vocabulary:', insertError)
      return NextResponse.json(
        { error: 'Failed to save vocabulary', details: insertError.message },
        { status: 500 }
      )
    }

    console.log(`[API] Successfully saved ${insertedVocab.length} vocabulary items`)

    return NextResponse.json({
      success: true,
      count: insertedVocab.length,
      vocabulary: insertedVocab,
    })
  } catch (error) {
    console.error('[API] Approve vocabulary error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
