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