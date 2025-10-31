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
   * Get single text by ID
   */
  static async getText(id: string): Promise<LibraryText> {
    const supabase = await createClient()

    const { data: text, error } = await supabase
      .from('library_texts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return text
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
   * Get all vocabulary entries for a specific text
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
