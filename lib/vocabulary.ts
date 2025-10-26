import { createClient } from '@/lib/supabase/client'
import type { VocabularyEntry, DictionaryResponse, VocabularyStats } from '@/types'

export class VocabularyService {
  /**
   * Get all vocabulary entries for current user
   * Sorted by last_seen descending (most recent first)
   */
  static async getAll(): Promise<VocabularyEntry[]> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .order('last_seen', { ascending: false })

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
   */
  static async saveWord(
    word: string,
    definition?: DictionaryResponse
  ): Promise<VocabularyEntry> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const normalizedWord = word.toLowerCase()

    // Check if word exists
    const existing = await this.getByWord(normalizedWord)

    if (existing) {
      // Update existing entry
      const { data, error } = await supabase
        .from('vocabulary')
        .update({
          click_count: existing.click_count + 1,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Update definition if provided and different
          ...(definition && { definition }),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from('vocabulary')
        .insert({
          user_id: user.id,
          word: normalizedWord,
          definition: definition || null,
          click_count: 1,
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
