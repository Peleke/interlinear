import { NextRequest, NextResponse } from 'next/server'
import { LibraryService } from '@/lib/services/library'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const text = await LibraryService.getText(id)
    return NextResponse.json({ text })
  } catch (error) {
    console.error('Failed to fetch text:', error)

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Text not found' },
      { status: 404 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await LibraryService.deleteText(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete text:', error)

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete text' },
      { status: 500 }
    )
  }
}
