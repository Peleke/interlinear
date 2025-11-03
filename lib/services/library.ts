import { createClient } from '@/lib/supabase/server'

export interface LibraryText {
  id: string
  user_id: string
  title: string
  content: string
  language: string
  created_at: string
}

export interface LibraryTextInsert {
  title: string
  content: string
  language?: string
}

export class LibraryService {
  /**
   * Create a new library text
   */
  static async createText(
    data: LibraryTextInsert
  ): Promise<LibraryText> {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Unauthorized')

    const { data: text, error } = await supabase
      .from('library_texts')
      .insert({
        user_id: user.user.id,
        title: data.title,
        content: data.content,
        language: data.language || 'es'
      })
      .select()
      .single()

    if (error) throw error
    return text
  }

  /**
   * Get all texts for current user
   */
  static async getTexts(): Promise<LibraryText[]> {
    const supabase = await createClient()

    const { data: texts, error } = await supabase
      .from('library_texts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return texts || []
  }

  /**
   * Get single text by ID - checks both library_texts and library_readings tables
   */
  static async getText(id: string): Promise<LibraryText> {
    const supabase = await createClient()

    // First try library_texts
    const { data: libraryText, error: libraryError } = await supabase
      .from('library_texts')
      .select('*')
      .eq('id', id)
      .single()

    if (libraryText) return libraryText

    // If not found in library_texts, try library_readings
    const { data: reading, error: readingError } = await supabase
      .from('library_readings')
      .select('id, title, content')
      .eq('id', id)
      .single()

    if (reading) {
      // Transform library_readings format to match LibraryText interface
      return {
        id: reading.id,
        user_id: '', // Readings don't have user_id, but it's okay for tutor purposes
        title: reading.title,
        content: reading.content,
        language: 'es',
        created_at: new Date().toISOString()
      }
    }

    // If not found in either table, throw the original error
    if (libraryError) throw libraryError
    if (readingError) throw readingError
    throw new Error('Text not found')
  }

  /**
   * Delete text by ID
   */
  static async deleteText(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('library_texts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get all vocabulary entries for a specific text (works for both library_texts and library_readings)
   */
  static async getVocabularyForText(textId: string): Promise<any[]> {
    const supabase = await createClient()

    const { data: entries, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('source_text_id', textId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return entries || []
  }
}
