import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')

    const supabase = await createClient()

    // Build query
    let query = supabase.from('courses').select('*')

    if (level) {
      query = query.eq('level', level)
    }

    const { data: courses, error } = await query.order('level', {
      ascending: true
    })

    if (error) {
      console.error('Courses fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Courses API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
