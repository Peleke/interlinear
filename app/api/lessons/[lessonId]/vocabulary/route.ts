import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/lessons/[lessonId]/vocabulary
 * Fetch all vocabulary for a lesson with MW data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch vocabulary with items
    const { data: vocabLinks, error: vocabError } = await supabase
      .from('lesson_vocabulary')
      .select(
        `
        is_new,
        vocabulary_id,
        lesson_vocabulary_items!inner (
          id,
          spanish,
          english,
          part_of_speech,
          difficulty_level,
          mw_id,
          mw_data,
          mw_fetched_at
        )
      `
      )
      .eq('lesson_id', lessonId)

    if (vocabError) {
      throw vocabError
    }

    // Flatten the structure
    const vocabulary = vocabLinks?.map((link: any) => ({
      ...link.lesson_vocabulary_items,
      is_new: link.is_new,
    }))

    return NextResponse.json({ vocabulary })
  } catch (error) {
    console.error('Error fetching vocabulary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/lessons/[lessonId]/vocabulary
 * Replace all vocabulary for a lesson (bulk update with MW lookup)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vocabulary } = await request.json()

    // Verify lesson ownership
    const { data: lesson } = await supabase
      .from('lessons')
      .select('id, author_id')
      .eq('id', lessonId)
      .maybeSingle()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    if (lesson.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to edit this lesson' },
        { status: 403 }
      )
    }

    // Delete all existing vocabulary links
    await supabase.from('lesson_vocabulary').delete().eq('lesson_id', lessonId)

    // Process each vocabulary item
    const results = []
    for (const item of vocabulary) {
      // Check if vocabulary item already exists
      let { data: existingItem } = await supabase
        .from('lesson_vocabulary_items')
        .select('*')
        .eq('spanish', item.spanish)
        .eq('english', item.english)
        .maybeSingle()

      if (existingItem) {
        // Reuse existing item (already has MW data cached)
        results.push(existingItem)
      } else {
        // New item - lookup in MW dictionary
        let mwData = null
        let mwId = null
        let partOfSpeech = item.part_of_speech || null

        try {
          // Call existing dictionary API
          const dictResponse = await fetch(
            `${request.nextUrl.origin}/api/dictionary/${encodeURIComponent(item.spanish)}`
          )

          if (dictResponse.ok) {
            const dictData = await dictResponse.json()
            if (dictData.found) {
              mwData = dictData
              mwId = item.spanish // Use spanish word as ID for now
              partOfSpeech =
                partOfSpeech ||
                dictData.definitions?.[0]?.partOfSpeech ||
                null
            }
          }
        } catch (err) {
          console.warn('MW lookup failed for', item.spanish, err)
        }

        // Create vocabulary item with MW data
        const { data: newItem, error: itemError } = await supabase
          .from('lesson_vocabulary_items')
          .insert({
            spanish: item.spanish,
            english: item.english,
            part_of_speech: partOfSpeech,
            difficulty_level: item.difficulty_level || null,
            mw_id: mwId,
            mw_data: mwData,
            mw_fetched_at: mwData ? new Date().toISOString() : null,
          })
          .select()
          .single()

        if (itemError) {
          console.error('Vocabulary item insert error:', itemError)
          throw itemError
        }

        results.push(newItem)
      }

      // Link to lesson
      const lastItem = results[results.length - 1]
      const { error: linkError } = await supabase
        .from('lesson_vocabulary')
        .insert({
          lesson_id: lessonId,
          vocabulary_id: lastItem.id,
          is_new: item.is_new ?? true,
        })

      if (linkError) {
        throw linkError
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Error saving vocabulary:', error)
    return NextResponse.json(
      { error: 'Failed to save vocabulary' },
      { status: 500 }
    )
  }
}
