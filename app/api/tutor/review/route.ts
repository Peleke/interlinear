import { NextResponse } from 'next/server'
import { generateProfessorReviewTool } from '@/lib/tutor-tools'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, level, language = 'es', errors } = body

    if (!sessionId || !level || !Array.isArray(errors)) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, level, errors' },
        { status: 400 }
      )
    }

    // Call the tool
    const review = await generateProfessorReviewTool.invoke({
      sessionId,
      level,
      language,
      errors
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Professor review generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate professor review' },
      { status: 500 }
    )
  }
}
