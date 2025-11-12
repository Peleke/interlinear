import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const supabase = createClient()
    const { lessonId } = params

    const { data: readings, error } = await supabase
      .from('readings')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch readings:', error)
      return NextResponse.json({ error: 'Failed to fetch readings' }, { status: 500 })
    }

    return NextResponse.json({ readings: readings || [] })
  } catch (error) {
    console.error('Readings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}