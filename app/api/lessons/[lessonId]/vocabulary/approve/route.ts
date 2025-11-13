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

    // Deduplicate vocabulary items by word+translation+language to avoid constraint conflicts
    const uniqueVocabulary = vocabulary.reduce((acc, item) => {
      const key = `${item.word}|${item.english_translation}|${language}`
      if (!acc.has(key)) {
        acc.set(key, item)
      }
      return acc
    }, new Map()).values()

    const deduplicatedVocabulary = Array.from(uniqueVocabulary)
    console.log(`[API] After deduplication: ${deduplicatedVocabulary.length} unique items`)

    // STEP 1: Insert/upsert into normalized lesson_vocabulary_items table
    const vocabularyItemRecords = deduplicatedVocabulary.map((item) => ({
      spanish: item.word,
      english: item.english_translation,
      part_of_speech: item.part_of_speech,
      difficulty_level: item.difficulty_level,
      language: language, // FIXED: Add language column to record
      ai_generated: true,
      ai_metadata: {
        source: 'vocabulary-extraction-workflow',
        timestamp: new Date().toISOString(),
        approved_by: user.id,
        example_sentence: item.example_sentence,
        frequency_score: item.frequency,
        appears_in_reading: item.appears_in_reading,
        normalized_form: item.normalized_form,
        language: language,
      },
    }))

    const { data: insertedVocabItems, error: itemsError } = await supabase
      .from('lesson_vocabulary_items')
      .upsert(vocabularyItemRecords, {
        onConflict: 'spanish,english,language', // FIXED: Include language in conflict resolution
        ignoreDuplicates: false, // Update if exists
      })
      .select('id, spanish, english')

    if (itemsError) {
      console.error('[API] Failed to insert vocabulary items:', itemsError)
      return NextResponse.json(
        { error: 'Failed to save vocabulary items', details: itemsError.message },
        { status: 500 }
      )
    }

    if (!insertedVocabItems || insertedVocabItems.length === 0) {
      console.error('[API] No vocabulary items returned after insert')
      return NextResponse.json(
        { error: 'Failed to create vocabulary items' },
        { status: 500 }
      )
    }

    console.log(`[API] Created/updated ${insertedVocabItems.length} vocabulary items`)

    // STEP 2: Create lesson-vocabulary associations in junction table
    const junctionRecords = insertedVocabItems.map((item) => ({
      lesson_id: lessonId,
      vocabulary_id: item.id,
      is_new: true,
      ai_generated: true,
      ai_metadata: {
        source: 'vocabulary-extraction-workflow',
        timestamp: new Date().toISOString(),
        approved_by: user.id,
      },
    }))

    const { data: insertedAssociations, error: junctionError } = await supabase
      .from('lesson_vocabulary')
      .upsert(junctionRecords, {
        onConflict: 'lesson_id,vocabulary_id',
        ignoreDuplicates: true, // Don't update if already exists
      })
      .select()

    if (junctionError) {
      console.error('[API] Failed to create lesson associations:', junctionError)
      return NextResponse.json(
        { error: 'Failed to link vocabulary to lesson', details: junctionError.message },
        { status: 500 }
      )
    }

    console.log(`[API] Successfully saved ${insertedAssociations?.length || insertedVocabItems.length} vocabulary items`)

    return NextResponse.json({
      success: true,
      count: insertedVocabItems.length,
      originalCount: vocabulary.length,
      deduplicatedCount: deduplicatedVocabulary.length,
      vocabulary: insertedVocabItems,
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
