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

    // AUTO-SAVE: Convert vocabulary to approval format and save to lesson
    if (result.status === 'completed' && result.vocabulary && result.vocabulary.length > 0) {
      try {
        console.log(`[Workflow] Auto-saving ${result.vocabulary.length} vocabulary items...`)

        const vocabularyItems = result.vocabulary.map((item: any) => {
          // Handle both string format (current workflow output) and object format (future)
          const word = typeof item === 'string' ? item : (item.word || item.lemma)
          const definition = typeof item === 'string' ? `Definition for ${item}` : item.definition

          return {
            word: word,
            english_translation: definition || `Definition for ${word}`,
            part_of_speech: 'other', // Default since we don't have detailed POS for workflow
            difficulty_level: input.targetLevel.toLowerCase(),
            example_sentence: `Example: ${word} appears in the text.`,
            appears_in_reading: true,
            frequency: typeof item === 'string' ? 50 : (item.frequency || 50),
            normalized_form: typeof item === 'string' ? word : (item.lemma || item.word),
          }
        })

        // Use same save approach as generate-from-reading endpoint
        const rawVocabularyItems = result.vocabulary.map((item: any) => {
          const word = typeof item === 'string' ? item : (item.word || item.lemma)
          const definition = typeof item === 'string' ? `Definition for ${item}` : item.definition

          return {
            spanish: word,
            english: definition || `Definition for ${word}`,
            part_of_speech: 'other', // Default for workflow
            difficulty_level: input.targetLevel.toLowerCase(),
            is_new: true,
          }
        })

        // Deduplicate vocabulary items by word+translation to avoid constraint conflicts
        const uniqueVocabulary = rawVocabularyItems.reduce((acc, item) => {
          const key = `${item.spanish}|${item.english}|${input.language}`
          if (!acc.has(key)) {
            acc.set(key, item)
          }
          return acc
        }, new Map()).values()

        const vocabularyItemsForSave = Array.from(uniqueVocabulary)
        console.log(`[Workflow] After deduplication: ${rawVocabularyItems.length} → ${vocabularyItemsForSave.length} unique items`)

        // Save vocabulary directly using supabase client (avoid auth issues with internal fetch)
        // Delete all existing vocabulary links first
        await supabase.from('lesson_vocabulary').delete().eq('lesson_id', input.lessonId)

        // Process each vocabulary item
        for (const item of vocabularyItemsForSave) {
          // Check if vocabulary item already exists
          let { data: existingItem } = await supabase
            .from('lesson_vocabulary_items')
            .select('*')
            .eq('spanish', item.spanish)
            .eq('english', item.english)
            .maybeSingle()

          if (existingItem) {
            // Reuse existing item
          } else {
            // Create new vocabulary item
            const { data: newItem, error: itemError } = await supabase
              .from('lesson_vocabulary_items')
              .insert({
                spanish: item.spanish,
                english: item.english,
                part_of_speech: item.part_of_speech,
                difficulty_level: item.difficulty_level,
              })
              .select()
              .single()

            if (itemError) {
              console.error('[Workflow] Failed to create vocabulary item:', itemError)
              throw itemError
            }

            existingItem = newItem
          }

          // Link to lesson
          const { error: linkError } = await supabase
            .from('lesson_vocabulary')
            .insert({
              lesson_id: input.lessonId,
              vocabulary_id: existingItem.id,
              is_new: item.is_new,
            })

          if (linkError) {
            console.error('[Workflow] Failed to link vocabulary to lesson:', linkError)
            throw linkError
          }
        }

        console.log(`[Workflow] Successfully saved ${vocabularyItemsForSave.length} vocabulary items (${rawVocabularyItems.length} original → ${vocabularyItemsForSave.length} unique → ${vocabularyItemsForSave.length} saved)`)
      } catch (saveError) {
        console.error('[Workflow] Auto-save failed:', saveError)
      }
    }

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
