import { NextRequest, NextResponse } from 'next/server'
import { LibraryService } from '@/lib/services/library'

export async function GET() {
  try {
    const texts = await LibraryService.getTexts()
    return NextResponse.json({ texts })
  } catch (error) {
    console.error('Failed to fetch library texts:', error)

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch texts' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, content, language } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Validate length constraints
    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      )
    }

    if (content.length > 50000) {
      return NextResponse.json(
        { error: 'Content must be 50,000 characters or less' },
        { status: 400 }
      )
    }

    const text = await LibraryService.createText({ title, content, language })
    return NextResponse.json({ text }, { status: 201 })
  } catch (error) {
    console.error('Failed to create library text:', error)

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create text' },
      { status: 500 }
    )
  }
}
