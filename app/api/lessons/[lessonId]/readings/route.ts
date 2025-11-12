import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const supabase = await createClient()
    const { lessonId } = await params

    const { data: readings, error } = await supabase
      .from('lesson_readings')
      .select('reading_id, library_readings(id, title, content, word_count)')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch readings:', error)
      return NextResponse.json({ error: 'Failed to fetch readings' }, { status: 500 })
    }

    // Transform joined data to flat reading objects
    const transformedReadings = readings?.map(item => ({
      id: item.library_readings?.id,
      title: item.library_readings?.title,
      content: item.library_readings?.content,
      word_count: item.library_readings?.word_count
    })).filter(r => r.id) || []

    return NextResponse.json({ readings: transformedReadings })
  } catch (error) {
    console.error('Readings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const supabase = await createClient()
    const { lessonId } = await params
    const body = await request.json()
    const readingId = body.reading_id || body.readingId

    if (!readingId) {
      return NextResponse.json({ error: 'Reading ID is required' }, { status: 400 })
    }

    // Check if lesson exists
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Check if reading exists
    const { data: reading, error: readingError } = await supabase
      .from('library_readings')
      .select('id')
      .eq('id', readingId)
      .single()

    if (readingError || !reading) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    // Check if relationship already exists
    const { data: existing, error: checkError } = await supabase
      .from('lesson_readings')
      .select('id')
      .eq('lesson_id', lessonId)
      .eq('reading_id', readingId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Reading already linked to lesson' }, { status: 409 })
    }

    // Create the lesson-reading relationship
    const { data: lessonReading, error } = await supabase
      .from('lesson_readings')
      .insert({
        lesson_id: lessonId,
        reading_id: readingId
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to link reading to lesson:', error)
      return NextResponse.json({ error: 'Failed to link reading to lesson' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      lessonReading,
      message: 'Reading linked to lesson successfully'
    })
  } catch (error) {
    console.error('Link reading API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}