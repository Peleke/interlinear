import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns this course
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, title, created_by, published_at, version')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (fetchError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.published_at) {
      return NextResponse.json({ error: 'Course already published' }, { status: 400 })
    }

    // Publish the course
    const { data: publishedCourse, error: publishError } = await supabase
      .from('courses')
      .update({
        published_at: new Date().toISOString(),
        published_by: user.id,
        version: course.version || 1
      })
      .eq('id', id)
      .select('*')
      .single()

    if (publishError) {
      console.error('Failed to publish course:', publishError)
      return NextResponse.json({ error: 'Failed to publish course' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Course published successfully',
      course: publishedCourse
    })

  } catch (error) {
    console.error('Course publish error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Unpublish course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns this course
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, title, created_by, published_at')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (fetchError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (!course.published_at) {
      return NextResponse.json({ error: 'Course not published' }, { status: 400 })
    }

    // Unpublish the course
    const { data: unpublishedCourse, error: unpublishError } = await supabase
      .from('courses')
      .update({
        published_at: null,
        published_by: null
      })
      .eq('id', id)
      .select('*')
      .single()

    if (unpublishError) {
      console.error('Failed to unpublish course:', unpublishError)
      return NextResponse.json({ error: 'Failed to unpublish course' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Course unpublished successfully',
      course: unpublishedCourse
    })

  } catch (error) {
    console.error('Course unpublish error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}