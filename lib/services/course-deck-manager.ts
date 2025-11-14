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
    // Get authenticated user first
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      console.error('No authenticated user')
      return null
    }

    const deckName = `${courseTitle} - Flashcards`
    const deckDescription = `Auto-generated flashcard deck for ${courseTitle} course lessons`

    console.log('[CourseDeck] Getting or creating deck for course:', courseId)

    // Use INSERT with ON CONFLICT to handle race conditions gracefully
    // The unique constraint ensures only one deck per user+course combination
    const { error: insertError } = await supabase
      .from('flashcard_decks')
      .insert({
        user_id: user.user.id,
        name: deckName,
        description: deckDescription,
        course_id: courseId
      })
      // Handle conflict gracefully - do nothing if duplicate exists
      .onConflict('user_id, course_id')

    if (insertError && insertError.code !== '23505') { // 23505 is unique violation
      console.error('[CourseDeck] Error creating course deck:', insertError)
      return null
    }

    // Now fetch the deck (either the one we just created or the existing one)
    const { data: deck, error: fetchError } = await supabase
      .from('flashcard_decks')
      .select('id, name, description, course_id')
      .eq('user_id', user.user.id)
      .eq('course_id', courseId)
      .single()

    if (fetchError) {
      console.error('[CourseDeck] Error fetching course deck after insert:', fetchError)
      return null
    }

    console.log('[CourseDeck] Deck ready:', deck.id)
    return deck as CourseDeck
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
