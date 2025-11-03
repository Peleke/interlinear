/**
 * Course Deck Manager
 * Manages automatic course-specific flashcard deck creation and association
 */

import { createClient } from '@/lib/supabase/client'

export interface CourseDeck {
  id: string
  name: string
  description?: string
  course_id: string
  card_count?: number
}

/**
 * Get or create a flashcard deck for a specific course
 * - First lesson view creates the deck automatically
 * - Subsequent views return existing deck
 * - Deck name: "{Course Title} - Flashcards"
 */
export async function getOrCreateCourseDeck(
  courseId: string,
  courseTitle: string
): Promise<CourseDeck | null> {
  const supabase = createClient()

  try {
    // Check if course deck already exists
    const { data: existingDeck, error: fetchError } = await supabase
      .from('flashcard_decks')
      .select('id, name, description, course_id')
      .eq('course_id', courseId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching course deck:', fetchError)
      return null
    }

    // Return existing deck if found
    if (existingDeck) {
      console.log('[CourseDeck] Found existing deck:', existingDeck.id, 'for course:', courseId)
      return existingDeck as CourseDeck
    }

    // Create new course deck
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      console.error('No authenticated user')
      return null
    }

    const deckName = `${courseTitle} - Flashcards`
    const deckDescription = `Auto-generated flashcard deck for ${courseTitle} course lessons`

    console.log('[CourseDeck] Creating new deck for course:', courseId, 'user:', user.user.id)

    const { data: newDeck, error: createError } = await supabase
      .from('flashcard_decks')
      .insert({
        user_id: user.user.id,
        name: deckName,
        description: deckDescription,
        course_id: courseId
      })
      .select('id, name, description, course_id')
      .single()

    if (createError) {
      console.error('[CourseDeck] Error creating course deck:', createError)
      return null
    }

    console.log('[CourseDeck] Created new deck:', newDeck.id, 'for course:', courseId)
    return newDeck as CourseDeck
  } catch (error) {
    console.error('Unexpected error in getOrCreateCourseDeck:', error)
    return null
  }
}

/**
 * Get card count for a course deck
 */
export async function getCourseDeckCardCount(deckId: string): Promise<number> {
  const supabase = createClient()

  try {
    const { count, error } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('deck_id', deckId)

    if (error) {
      console.error('Error counting cards:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Unexpected error counting cards:', error)
    return 0
  }
}
