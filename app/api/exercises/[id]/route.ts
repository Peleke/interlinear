import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: exerciseId } = await params

    // Verify ownership through lesson
    const { data: exercise } = await supabase
      .from('lesson_exercises')
      .select('lesson_id')
      .eq('id', exerciseId)
      .single()

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    const { data: lesson } = await supabase
      .from('lessons')
      .select('author_id')
      .eq('id', exercise.lesson_id)
      .single()

    if (!lesson || lesson.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete exercises from your own lessons' },
        { status: 403 }
      )
    }

    // Delete the exercise
    const { error: deleteError } = await supabase
      .from('lesson_exercises')
      .delete()
      .eq('id', exerciseId)

    if (deleteError) {
      console.error('Error deleting exercise:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete exercise' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unexpected error in exercise DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
