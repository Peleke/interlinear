import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (existingEnrollment) {
      return NextResponse.json({
        message: 'Already enrolled',
        enrollment: existingEnrollment
      })
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('user_courses')
      .insert({
        user_id: user.id,
        course_id: courseId,
        enrolled_at: new Date().toISOString()
      })
      .select()
      .single()

    if (enrollError) {
      console.error('Enrollment error:', enrollError)
      return NextResponse.json(
        { error: 'Failed to enroll in course' },
        { status: 500 }
      )
    }

    // Revalidate course and course list pages
    revalidatePath('/courses', 'page')
    revalidatePath(`/courses/${courseId}`, 'page')

    return NextResponse.json({
      message: 'Enrolled successfully',
      enrollment
    })
  } catch (error) {
    console.error('Enroll API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // First, get all lesson IDs for this course
    const { data: courseLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)

    if (lessonsError) {
      console.error('Error fetching course lessons:', lessonsError)
      return NextResponse.json(
        { error: 'Failed to fetch course lessons' },
        { status: 500 }
      )
    }

    // Delete lesson completions for this course if any lessons exist
    if (courseLessons && courseLessons.length > 0) {
      const lessonIds = courseLessons.map(lesson => lesson.id)

      const { error: completionsError } = await supabase
        .from('lesson_completions')
        .delete()
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds)

      if (completionsError) {
        console.error('Error deleting lesson completions:', completionsError)
        return NextResponse.json(
          { error: 'Failed to clean up lesson progress' },
          { status: 500 }
        )
      }
    }

    // First check what enrollment records exist before deletion
    const { data: existingEnrollments, error: checkError } = await supabase
      .from('user_courses')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)

    console.log('[Unenroll] Pre-delete check:', {
      userId: user.id,
      courseId,
      courseIdType: typeof courseId,
      existingEnrollments,
      checkError
    })

    // Delete enrollment with debugging
    console.log('[Unenroll] Deleting enrollment for user:', user.id, 'course:', courseId)

    const { data: deletedEnrollment, error: unenrollError } = await supabase
      .from('user_courses')
      .delete()
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .select()

    console.log('[Unenroll] Delete result:', { deletedEnrollment, unenrollError })

    if (unenrollError) {
      console.error('Unenrollment error:', unenrollError)
      return NextResponse.json(
        { error: 'Failed to unenroll from course' },
        { status: 500 }
      )
    }

    if (!deletedEnrollment || deletedEnrollment.length === 0) {
      console.warn('[Unenroll] No enrollment record was deleted - user may not have been enrolled')
      return NextResponse.json(
        { error: 'No enrollment found to delete' },
        { status: 404 }
      )
    }

    // Revalidate course and course list pages
    revalidatePath('/courses', 'page')
    revalidatePath(`/courses/${courseId}`, 'page')

    return NextResponse.json({
      message: 'Unenrolled successfully'
    })
  } catch (error) {
    console.error('Unenroll API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
