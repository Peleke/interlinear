import { createClient } from '@/lib/supabase/server'
import type { Lesson, LessonWithComponents } from '@/types'

export interface CreateLessonParams {
  title: string
  author_id: string
  overview?: string
  language?: 'es' | 'la'
  xp_value?: number
  sequence_order?: number
}

export interface UpdateLessonParams {
  title?: string
  overview?: string
  language?: 'es' | 'la'
  course_id?: string | null
  xp_value?: number
  sequence_order?: number
}

export interface ListLessonsParams {
  author_id?: string
  status?: 'draft' | 'published' | 'archived'
  language?: 'es' | 'la'
  sort_by?: 'updated_at' | 'title' | 'sequence_order'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export class LessonService {
  /**
   * Create a new draft lesson
   * Story 3.1: Minimal data required, defaults to draft status
   */
  static async create(params: CreateLessonParams): Promise<Lesson> {
    const supabase = await createClient()

    const lessonData = {
      title: params.title,
      author_id: params.author_id,
      overview: params.overview || null,
      language: params.language || 'es',
      xp_value: params.xp_value || 100,
      sequence_order: params.sequence_order || 0,
      status: 'draft' as const,
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single()

    if (error) throw error
    return data as Lesson
  }

  /**
   * Get lesson by ID with component counts
   * Story 3.2: Full lesson data with all component counts
   */
  static async getById(
    lessonId: string,
    userId?: string
  ): Promise<LessonWithComponents | null> {
    const supabase = await createClient()

    // Get lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single()

    if (lessonError) {
      if (lessonError.code === 'PGRST116') return null // Not found
      throw lessonError
    }

    // RLS enforcement: drafts only visible to author
    if (lesson.status === 'draft' && lesson.author_id !== userId) {
      return null
    }

    // Get component counts in parallel
    const [dialogCount, vocabCount, grammarCount, exerciseCount, readingCount] =
      await Promise.all([
        supabase
          .from('lesson_dialogs')
          .select('id', { count: 'exact', head: true })
          .eq('lesson_id', lessonId),
        supabase
          .from('lesson_vocabulary')
          .select('id', { count: 'exact', head: true })
          .eq('lesson_id', lessonId),
        supabase
          .from('lesson_grammar')
          .select('id', { count: 'exact', head: true })
          .eq('lesson_id', lessonId),
        supabase
          .from('lesson_exercises')
          .select('id', { count: 'exact', head: true })
          .eq('lesson_id', lessonId),
        supabase
          .from('lesson_readings')
          .select('id', { count: 'exact', head: true })
          .eq('lesson_id', lessonId),
      ])

    return {
      ...lesson,
      dialog_count: dialogCount.count || 0,
      vocabulary_count: vocabCount.count || 0,
      grammar_count: grammarCount.count || 0,
      exercise_count: exerciseCount.count || 0,
      reading_count: readingCount.count || 0,
    }
  }

  /**
   * Update lesson metadata
   * Story 3.3: Author-only updates, cannot change author_id
   */
  static async update(
    lessonId: string,
    userId: string,
    params: UpdateLessonParams
  ): Promise<Lesson> {
    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('lessons')
      .select('author_id')
      .eq('id', lessonId)
      .single()

    if (!existing || existing.author_id !== userId) {
      throw new Error('Not authorized to update this lesson')
    }

    const updateData = {
      ...params,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', lessonId)
      .select()
      .single()

    if (error) throw error
    return data as Lesson
  }

  /**
   * Delete a draft lesson
   * Story 3.4: Only drafts can be deleted, author-only
   */
  static async delete(lessonId: string, userId: string): Promise<void> {
    const supabase = await createClient()

    // Verify ownership and draft status
    const { data: existing } = await supabase
      .from('lessons')
      .select('author_id, status')
      .eq('id', lessonId)
      .single()

    if (!existing) {
      throw new Error('Lesson not found')
    }

    if (existing.author_id !== userId) {
      throw new Error('Not authorized to delete this lesson')
    }

    if (existing.status !== 'draft') {
      throw new Error('Only draft lessons can be deleted')
    }

    // Delete (cascades to components via FK constraints)
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId)

    if (error) throw error
  }

  /**
   * List lessons with filtering
   * Story 3.5: Filter by status, author, language; sort; paginate
   */
  static async list(
    params: ListLessonsParams
  ): Promise<{ lessons: Lesson[]; total: number }> {
    const supabase = await createClient()

    let query = supabase.from('lessons').select('*', { count: 'exact' })

    // Apply filters
    if (params.author_id) {
      query = query.eq('author_id', params.author_id)
    }

    if (params.status) {
      query = query.eq('status', params.status)
    }

    if (params.language) {
      query = query.eq('language', params.language)
    }

    // Apply sorting
    const sortBy = params.sort_by || 'updated_at'
    const sortOrder = params.sort_order || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    if (params.limit) {
      query = query.limit(params.limit)
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      lessons: data || [],
      total: count || 0,
    }
  }
}
