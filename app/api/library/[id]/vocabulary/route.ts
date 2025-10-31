import { NextRequest, NextResponse } from 'next/server'
import { LibraryService } from '@/lib/services/library'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const vocabulary = await LibraryService.getVocabularyForText(id)
    return NextResponse.json({ vocabulary })
  } catch (error) {
    console.error('Failed to fetch vocabulary:', error)

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch vocabulary' },
      { status: 500 }
    )
  }
}
