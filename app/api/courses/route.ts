import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '@/lib/services/course'

export async function GET() {
  try {
    const courses = await CourseService.getCourses()
    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Failed to fetch courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, language, difficulty_level } = body

    if (!title || !language || !difficulty_level) {
      return NextResponse.json(
        { error: 'Title, language, and difficulty are required' },
        { status: 400 }
      )
    }

    const course = await CourseService.createCourse({
      title,
      description,
      language,
      difficulty_level,
    })

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Failed to create course:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
