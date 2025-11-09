import { createClient } from '@/lib/supabase/client'
import type { VocabularyEntry, DictionaryResponse, VocabularyStats } from '@/types'

export class VocabularyService {
  /**
   * Get all vocabulary entries for current user
   * Sorted by last_seen descending (most recent first)
   * EPIC-02: Added language parameter support
   */
  static async getAll(language?: 'es' | 'is'): Promise<VocabularyEntry[]> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    let query = supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.id)

    // Filter by language if specified
    if (language) {
      query = query.eq('language', language)
    }

    const { data, error } = await query.order('last_seen', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get vocabulary entries filtered by language
   * EPIC-02 Story 2.5: VocabularyService Language Support
   */
  static async getByLanguage(language: 'es' | 'is'): Promise<VocabularyEntry[]> {
    return this.getAll(language)
  }

  /**
   * Get vocabulary entries from a specific lesson
   * EPIC-02 Story 2.5: VocabularyService Language Support
   */
  static async getByLesson(lessonId: string): Promise<VocabularyEntry[]> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .eq('source_lesson_id', lessonId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Get vocabulary entry by word
   */
  static async getByWord(word: string): Promise<VocabularyEntry | null> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error} = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .eq('word', word.toLowerCase())
      .maybeSingle()

    if (error) throw error
    return data
  }

  /**
   * Save word to vocabulary
   * If word exists: increment click_count, update last_seen
   * If new: create entry with click_count = 1
   * EPIC-02: Added language parameter (defaults to 'es' for backward compatibility)
   */
  static async saveWord(
    word: string,
    definition?: DictionaryResponse,
    sourceTextId?: string,
    originalSentence?: string,
    language: 'es' | 'is' = 'es', // EPIC-02: Language support
    sourceLessonId?: string, // EPIC-02: Lesson tracking
    lessonVocabularyId?: string, // EPIC-02: Link to lesson vocab
    learnedFromLesson: boolean = false // EPIC-02: Auto-population flag
  ): Promise<VocabularyEntry> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const normalizedWord = word.toLowerCase()

    // Check if word exists for this user and language
    const existing = await this.getByWord(normalizedWord)

    if (existing && existing.language === language) {
      // Update existing entry
      const { data, error } = await supabase
        .from('vocabulary')
        .update({
          click_count: existing.click_count + 1,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Update definition if provided and different
          ...(definition && { definition }),
          // Skip source_text_id updates to avoid FK errors with readings
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Extract spanish/english from definition or word
      const spanish = normalizedWord
      const english = definition?.translations?.[0] || definition?.translation || 'translation missing'

      // Create new entry
      const { data, error } = await supabase
        .from('vocabulary')
        .insert({
          user_id: user.id,
          word: normalizedWord,
          spanish, // EPIC-02: Denormalized
          english, // EPIC-02: Denormalized
          definition: definition || null,
          click_count: 1,
          language, // EPIC-02: Language support
          source_lesson_id: sourceLessonId || null, // EPIC-02: Lesson tracking
          lesson_vocabulary_id: lessonVocabularyId || null, // EPIC-02: Link to lesson vocab
          learned_from_lesson: learnedFromLesson, // EPIC-02: Auto-population flag
          source_text_id: null,  // Set to null to avoid FK constraint errors
          original_sentence: originalSentence
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  }

  /**
   * Delete vocabulary entry
   */
  static async deleteWord(id: string): Promise<void> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('vocabulary')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  }

  /**
   * Clear all vocabulary for current user
   */
  static async clearAll(): Promise<void> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('vocabulary')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error
  }

  /**
   * Get vocabulary statistics
   */
  static async getStats(): Promise<VocabularyStats> {
    const allWords = await this.getAll()

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentWords = allWords.filter(
      (entry) => new Date(entry.last_seen) >= sevenDaysAgo
    )

    // Get top 10 most clicked words
    const topWords = [...allWords]
      .sort((a, b) => b.click_count - a.click_count)
      .slice(0, 10)
      .map((entry) => ({
        word: entry.word,
        count: entry.click_count,
      }))

    return {
      totalWords: allWords.length,
      recentWords: recentWords.length,
      topWords,
    }
  }

  /**
   * Check if word is saved
   */
  static async isSaved(word: string): Promise<boolean> {
    const entry = await this.getByWord(word)
    return !!entry
  }
}
