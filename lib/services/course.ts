import { createClient } from '@/lib/supabase/server'

export interface Course {
  id: string
  title: string
  description: string
  language: string
  difficulty_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  created_by: string
  created_at: string
  xp_total?: number
  updated_at?: string
  lesson_count?: number
}

export interface CourseInsert {
  title: string
  description?: string
  language: string
  difficulty_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
}

export interface CourseUpdate {
  title?: string
  description?: string
  language?: string
  difficulty_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
}

export interface LessonOrderingEntry {
  lesson_id: string
  display_order: number
  lesson: {
    id: string
    title: string
    status: 'draft' | 'published' | 'archived'
    overview: string
  }
}

export interface CourseWithLessons extends Course {
  lessons: LessonOrderingEntry[]
}

export class CourseService {
  /**
   * Create a new course
   */
  static async createCourse(data: CourseInsert): Promise<Course> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const courseData = {
      title: data.title,
      description: data.description || '',
      language: data.language,
      difficulty_level: data.difficulty_level,
      created_by: user.id,
    }

    const { data: course, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single()

    if (error) throw error
    return course
  }

  /**
   * Get all courses for current user with lesson counts
   */
  static async getCourses(): Promise<Course[]> {
    const supabase = await createClient()

    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        lesson_course_ordering(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform count to number
    return (courses || []).map((course) => ({
      ...course,
      lesson_count: course.lesson_course_ordering?.[0]?.count || 0,
    }))
  }

  /**
   * Get single course with ordered lessons
   */
  static async getCourse(id: string): Promise<CourseWithLessons> {
    const supabase = await createClient()

    // Get course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()

    if (courseError) throw courseError

    // Get ordered lessons
    const { data: orderings, error: orderError } = await supabase
      .from('lesson_course_ordering')
      .select(`
        lesson_id,
        display_order,
        lesson:lessons!inner(id, title, status, overview)
      `)
      .eq('course_id', id)
      .order('display_order', { ascending: true })

    if (orderError) throw orderError

    // Transform: Supabase returns lesson as array, we need single object
    const lessons: LessonOrderingEntry[] = (orderings || []).map((item: any) => ({
      lesson_id: item.lesson_id,
      display_order: item.display_order,
      lesson: Array.isArray(item.lesson) ? item.lesson[0] : item.lesson,
    }))

    return {
      ...course,
      lessons,
    }
  }

  /**
   * Update course metadata
   */
  static async updateCourse(id: string, data: CourseUpdate): Promise<Course> {
    const supabase = await createClient()

    const { data: course, error } = await supabase
      .from('courses')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return course
  }

  /**
   * Delete course (orphans lessons)
   */
  static async deleteCourse(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.from('courses').delete().eq('id', id)

    if (error) throw error
  }

  /**
   * Add lesson to course
   */
  static async addLesson(
    courseId: string,
    lessonId: string,
    order?: number
  ): Promise<void> {
    const supabase = await createClient()

    // Get max order if not provided
    if (order === undefined) {
      const { data: maxOrder } = await supabase
        .from('lesson_course_ordering')
        .select('display_order')
        .eq('course_id', courseId)
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle()

      order = (maxOrder?.display_order || 0) + 1
    }

    const { error } = await supabase.from('lesson_course_ordering').insert({
      course_id: courseId,
      lesson_id: lessonId,
      display_order: order,
    })

    if (error) throw error
  }

  /**
   * Remove lesson from course
   */
  static async removeLesson(courseId: string, lessonId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('lesson_course_ordering')
      .delete()
      .eq('course_id', courseId)
      .eq('lesson_id', lessonId)

    if (error) throw error
  }

  /**
   * Reorder lessons in course
   * @param lessonIds Array of lesson IDs in desired order
   */
  static async reorderLessons(
    courseId: string,
    lessonIds: string[]
  ): Promise<void> {
    const supabase = await createClient()

    // Update each lesson's display_order
    const updates = lessonIds.map((lessonId, index) => ({
      course_id: courseId,
      lesson_id: lessonId,
      display_order: index + 1,
    }))

    // Use upsert to update display_order
    const { error } = await supabase
      .from('lesson_course_ordering')
      .upsert(updates, { onConflict: 'course_id,lesson_id' })

    if (error) throw error
  }

  /**
   * Get lessons for a course
   */
  static async getLessonsForCourse(
    courseId: string
  ): Promise<LessonOrderingEntry[]> {
    const supabase = await createClient()

    const { data: orderings, error } = await supabase
      .from('lesson_course_ordering')
      .select(`
        lesson_id,
        display_order,
        lesson:lessons!inner(id, title, status, overview)
      `)
      .eq('course_id', courseId)
      .order('display_order', { ascending: true })

    if (error) throw error

    // Transform: Supabase returns lesson as array, we need single object
    return (orderings || []).map((item: any) => ({
      lesson_id: item.lesson_id,
      display_order: item.display_order,
      lesson: Array.isArray(item.lesson) ? item.lesson[0] : item.lesson,
    }))
  }
}
