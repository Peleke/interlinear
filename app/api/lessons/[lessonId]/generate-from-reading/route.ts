/**
 * Generate Lesson from Reading - Orchestration API
 *
 * POST /api/lessons/[lessonId]/generate-from-reading
 *
 * Sequentially executes all enabled LLM generators and saves content to lesson
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executeContentGeneration } from '@/lib/content-generation/workflows/content-generation'
import { identifyGrammar } from '@/lib/content-generation/tools/identify-grammar'
import { generateExercises } from '@/lib/content-generation/tools/generate-exercises'
import { generateDialogs } from '@/lib/content-generation/tools/generate-dialogs'

interface GeneratorConfig {
  enabled: boolean
  config: any
}

interface RequestBody {
  readingId: string
  generators: {
    vocabulary: GeneratorConfig | null
    grammar: GeneratorConfig | null
    exercises: GeneratorConfig | null
    dialogs: GeneratorConfig | null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: RequestBody = await request.json()
    const { readingId, generators } = body

    // Fetch reading content
    const { data: readingData, error: readingError } = await supabase
      .from('library_readings')
      .select('content, language, difficulty_level')
      .eq('id', readingId)
      .single()

    if (readingError || !readingData?.content) {
      return NextResponse.json(
        { error: 'Reading not found or has no content' },
        { status: 404 }
      )
    }

    const readingContent = readingData.content
    const language = readingData.language || 'es'
    const targetLevel = readingData.difficulty_level || 'A1'

    // Create generation job record
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        lesson_id: lessonId,
        reading_id: readingId,
        status: 'pending',
        progress: {},
        results: {},
        created_by: user.id,
      })
      .select()
      .single()

    if (jobError || !job) {
      console.error('Failed to create generation job:', jobError)
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }

    console.log(`[Orchestration] Created job ${job.id} for lesson ${lessonId}`)

    // Update job status to processing
    await supabase
      .from('generation_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', job.id)

    const results: any = {
      vocabulary: null,
      grammar: null,
      exercises: null,
      dialogs: null,
    }

    const progress: any = {}

    // 1. VOCABULARY EXTRACTION
    if (generators.vocabulary?.enabled) {
      console.log(`[Orchestration] Starting vocabulary extraction...`)
      progress.vocabulary = { status: 'processing' }
      await supabase.from('generation_jobs').update({ progress }).eq('id', job.id)

      const startTime = Date.now()

      const vocabResult = await executeContentGeneration({
        lessonId,
        readingText: readingContent,
        targetLevel: generators.vocabulary.config.cefrLevel || targetLevel,
        language: language as 'es' | 'is',
        maxVocabularyItems: generators.vocabulary.config.maxVocabItems || 20,
        userId: user.id,
      })

      if (vocabResult.status === 'completed') {
        results.vocabulary = {
          count: vocabResult.metadata.vocabularyCount,
          executionTime: Date.now() - startTime,
        }
        progress.vocabulary = { status: 'completed', count: vocabResult.metadata.vocabularyCount }
        await supabase.from('generation_jobs').update({ progress }).eq('id', job.id)

        // Log AI generation
        await supabase.from('ai_generations').insert({
          lesson_id: lessonId,
          generation_type: 'vocabulary',
          status: 'completed',
          input_data: {
            readingId,
            targetLevel: generators.vocabulary.config.cefrLevel,
            maxItems: generators.vocabulary.config.maxVocabItems,
          },
          output_data: { vocabulary: vocabResult.vocabulary },
          created_by: user.id,
          completed_at: new Date().toISOString(),
        })
      } else {
        progress.vocabulary = { status: 'failed', error: 'Vocabulary extraction failed' }
        await supabase.from('generation_jobs').update({ progress }).eq('id', job.id)
      }
    }

    // 2. GRAMMAR CONCEPTS
    if (generators.grammar?.enabled) {
      console.log(`[Orchestration] Starting grammar identification...`)
      progress.grammar = { status: 'processing' }
      await supabase.from('generation_jobs').update({ progress }).eq('id', job.id)

      const startTime = Date.now()

      const grammarResult = await identifyGrammar({
        content: readingContent,
        targetLevel: targetLevel as any,
        language: language as 'es' | 'is',
        maxConcepts: generators.grammar.config.maxConcepts || 5,
      })

      if (grammarResult.status === 'completed' && grammarResult.grammar_concepts) {
        // Save grammar concepts
        const savedConcepts = []

        for (const concept of grammarResult.grammar_concepts) {
          // Check if concept exists
          const { data: existing } = await supabase
            .from('grammar_concepts')
            .select('id')
            .eq('name', concept.name)
            .maybeSingle()

          let conceptId = existing?.id

          if (!conceptId) {
            // Create new concept
            const { data: newConcept, error: createError } = await supabase
              .from('grammar_concepts')
              .insert({
                name: concept.name,
                display_name: concept.display_name,
                description: concept.description,
                content: concept.content,
              })
              .select('id')
              .single()

            if (createError) {
              console.error('Failed to create grammar concept:', createError)
              continue
            }

            conceptId = newConcept.id
          }

          // Link to lesson
          const { error: linkError } = await supabase
            .from('lesson_grammar_concepts')
            .insert({
              lesson_id: lessonId,
              grammar_concept_id: conceptId,
            })
            .onConflict('lesson_id,grammar_concept_id')
            .ignoreDuplicates()

          if (!linkError) {
            savedConcepts.push(conceptId)
          }
        }

        results.grammar = {
          count: savedConcepts.length,
          executionTime: Date.now() - startTime,
        }
        progress.grammar = { status: 'completed', count: savedConcepts.length }
        await supabase.from('generation_jobs').update({ progress }).eq('id', job.id)

        // Log AI generation
        await supabase.from('ai_generations').insert({
          lesson_id: lessonId,
          generation_type: 'grammar',
          status: 'completed',
          input_data: {
            readingId,
            targetLevel,
            maxConcepts: generators.grammar.config.maxConcepts,
          },
          output_data: { concepts: grammarResult.grammar_concepts },
          tokens_used: grammarResult.metadata.totalTokens,
          created_by: user.id,
          completed_at: new Date().toISOString(),
        })
      } else {
        progress.grammar = { status: 'failed', error: 'Grammar identification failed' }
        await supabase.from('generation_jobs').update({ progress }).eq('id', job.id)
      }
    }

    // 3. EXERCISES
    if (generators.exercises?.enabled) {
      console.log(`[Orchestration] Starting exercise generation...`)
      progress.exercises = { status: 'processing' }
      await supabase.from('generation_jobs').update({ progress }).eq('id', job.id)

      const exerciseTypes =
        generators.exercises.config.exerciseTypes || ['fill_blank', 'multiple_choice', 'translation']
      const exercisesPerType = generators.exercises.config.exercisesPerType || 3
      const startTime = Date.now()
      let totalExercises = 0

      for (const type of exerciseTypes) {
        const exerciseResult = await generateExercises({
          content: readingContent,
          type: type as 'fill_blank' | 'multiple_choice' | 'translation',
          count: exercisesPerType,
          targetLevel: targetLevel as any,
          language: language as 'es' | 'is',
        })

        if (exerciseResult.status === 'completed' && exerciseResult.exercises) {
          // Save exercises
          for (const exercise of exerciseResult.exercises) {
            const { error: insertError } = await supabase
              .from('lesson_exercises')
              .insert({
                lesson_id: lessonId,
                exercise_type: type,
                question: exercise.question,
                answer: exercise.answer,
                options: exercise.options || null,
                difficulty_level: targetLevel,
              })

            if (!insertError) {
              totalExercises++
            }
          }
        }
      }

      results.exercises = {
        count: totalExercises,
        executionTime: Date.now() - startTime,
      }
      progress.exercises = { status: 'completed', count: totalExercises }
      await supabase.from('generation_jobs').update({ progress }).eq('id', job.id)

      // Log AI generation
      await supabase.from('ai_generations').insert({
        lesson_id: lessonId,
        generation_type: 'exercises',
        status: 'completed',
        input_data: {
          readingId,
          exerciseTypes,
          exercisesPerType,
        },
        output_data: { totalExercises },
        created_by: user.id,
        completed_at: new Date().toISOString(),
      })
    }

    // 4. DIALOGS
    if (generators.dialogs?.enabled) {
      console.log(`[Orchestration] Starting dialog generation...`)
      progress.dialogs = { status: 'processing' }
      await supabase.from('generation_jobs').update({ progress }).eq('id', job.id)

      const startTime = Date.now()

      const dialogResult = await generateDialogs({
        content: readingContent,
        targetLevel: targetLevel as any,
        language: language as 'es' | 'is',
        dialogCount: generators.dialogs.config.dialogCount || 2,
        complexity: generators.dialogs.config.dialogComplexity || 'intermediate',
      })

      if (dialogResult.status === 'completed' && dialogResult.dialogs) {
        let savedDialogs = 0

        for (const dialog of dialogResult.dialogs) {
          // Insert dialog
          const { data: dialogData, error: dialogError } = await supabase
            .from('lesson_dialogs')
            .insert({
              lesson_id: lessonId,
              title: dialog.title,
              context: dialog.context,
              difficulty_level: dialog.difficulty_level,
            })
            .select('id')
            .single()

          if (dialogError || !dialogData) {
            console.error('Failed to save dialog:', dialogError)
            continue
          }

          // Insert exchanges
          if (dialog.turns) {
            for (let i = 0; i < dialog.turns.length; i++) {
              const turn = dialog.turns[i]
              await supabase.from('dialog_exchanges').insert({
                dialog_id: dialogData.id,
                speaker: turn.speaker,
                text: turn.text,
                translation: turn.translation,
                notes: turn.notes || null,
                sequence_order: i + 1,
              })
            }
          }

          savedDialogs++
        }

        results.dialogs = {
          count: savedDialogs,
          executionTime: Date.now() - startTime,
        }
        progress.dialogs = { status: 'completed', count: savedDialogs }
        await supabase.from('generation_jobs').update({ progress }).eq('id', job.id)

        // Log AI generation
        await supabase.from('ai_generations').insert({
          lesson_id: lessonId,
          generation_type: 'dialogs',
          status: 'completed',
          input_data: {
            readingId,
            dialogCount: generators.dialogs.config.dialogCount,
            complexity: generators.dialogs.config.dialogComplexity,
          },
          output_data: { dialogs: savedDialogs },
          tokens_used: dialogResult.metadata.totalTokens,
          created_by: user.id,
          completed_at: new Date().toISOString(),
        })
      } else {
        progress.dialogs = { status: 'failed', error: 'Dialog generation failed' }
        await supabase.from('generation_jobs').update({ progress }).eq('id', job.id)
      }
    }

    // Mark job as completed
    await supabase
      .from('generation_jobs')
      .update({
        status: 'completed',
        results,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    console.log(`[Orchestration] Job ${job.id} completed successfully`)

    return NextResponse.json({
      status: 'completed',
      jobId: job.id,
      results,
    })
  } catch (error) {
    console.error('[Orchestration] Generation error:', error)

    // Try to mark job as failed
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Find the job (we might not have jobId in outer scope if error was early)
        const { data: jobs } = await supabase
          .from('generation_jobs')
          .select('id')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (jobs && jobs.length > 0) {
          await supabase
            .from('generation_jobs')
            .update({
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              completed_at: new Date().toISOString(),
            })
            .eq('id', jobs[0].id)
        }
      }
    } catch (updateError) {
      console.error('[Orchestration] Failed to update job status:', updateError)
    }

    return NextResponse.json(
      {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
