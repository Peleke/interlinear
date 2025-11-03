import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Get reading from library_readings table
  const { data: reading, error } = await supabase
    .from('library_readings')
    .select('id, title, content, word_count')
    .eq('id', id)
    .single()

  if (error || !reading) {
    return NextResponse.json(
      { error: 'Reading not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(reading)
}
