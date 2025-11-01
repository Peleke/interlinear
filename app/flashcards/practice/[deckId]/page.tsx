'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import Link from 'next/link'
import type { PracticeCard } from '@/lib/services/flashcards'

export default function PracticePage() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.deckId as string

  const [cards, setCards] = useState<PracticeCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionComplete, setSessionComplete] = useState(false)

  const loadPracticeCards = async () => {
    try {
      const response = await fetch(`/api/flashcards/practice?deckId=${deckId}`)
      if (!response.ok) throw new Error('Failed to load practice cards')

      const data = await response.json()

      if (data.cards.length === 0) {
        toast.info('No cards due for review!')
        setSessionComplete(true)
      } else {
        setCards(data.cards)
      }
    } catch (error) {
      console.error('Load practice cards error:', error)
      toast.error('Failed to load practice cards')
    } finally {
      setLoading(false)
    }
  }

  const recordReview = useCallback(async (quality: 0 | 1 | 2 | 3) => {
    const currentCard = cards[currentIndex]

    try {
      const response = await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: currentCard.card_id,
          card_index: currentCard.card_index,
          quality
        })
      })

      if (!response.ok) throw new Error('Failed to record review')

      // Move to next card
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex(currentIndex + 1)
        setRevealed(false)
      } else {
        setSessionComplete(true)
      }
    } catch (error) {
      console.error('Record review error:', error)
      toast.error('Failed to record review')
    }
  }, [cards, currentIndex])

  useEffect(() => {
    loadPracticeCards()
  }, [deckId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Escape to exit practice
      if (e.key === 'Escape' && !loading) {
        router.push('/flashcards')
        return
      }

      // Space to reveal
      if (e.code === 'Space' && !revealed && !loading && !sessionComplete) {
        e.preventDefault()
        setRevealed(true)
      }

      // 1-4 for rating (only when revealed)
      if (revealed && !loading && !sessionComplete) {
        if (e.key === '1') {
          e.preventDefault()
          recordReview(0)
        } else if (e.key === '2') {
          e.preventDefault()
          recordReview(1)
        } else if (e.key === '3') {
          e.preventDefault()
          recordReview(2)
        } else if (e.key === '4') {
          e.preventDefault()
          recordReview(3)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [revealed, loading, sessionComplete, recordReview, router])

  const highlightAnswer = (fullContent: string, answer: string): React.ReactElement => {
    const index = fullContent.indexOf(answer)
    if (index === -1) {
      return <>{fullContent}</>
    }

    const before = fullContent.substring(0, index)
    const after = fullContent.substring(index + answer.length)

    return (
      <>
        {before}
        <mark className="bg-blue-200 font-semibold">{answer}</mark>
        {after}
      </>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-sepia-600">Loading practice session...</div>
        </div>
      </div>
    )
  }

  if (sessionComplete) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-sepia-900 mb-2">
              {cards.length === 0 ? 'All caught up!' : 'Session Complete!'}
            </h2>
            <p className="text-sepia-600 mb-6">
              {cards.length === 0
                ? 'No cards are due for review right now.'
                : `You've reviewed ${cards.length} ${cards.length === 1 ? 'card' : 'cards'}.`}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="default">
                <Link href="/flashcards">Back to Decks</Link>
              </Button>
              <Button
                onClick={() => {
                  setSessionComplete(false)
                  setCurrentIndex(0)
                  setRevealed(false)
                  loadPracticeCards()
                }}
                variant="outline"
              >
                Practice Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentCard = cards[currentIndex]
  const progress = ((currentIndex + 1) / cards.length) * 100

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          asChild
          variant="ghost"
          className="mb-4"
        >
          <Link href="/flashcards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit Practice
          </Link>
        </Button>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-serif text-sepia-900">
            {currentCard.deck_name}
          </h1>
          <span className="text-sm text-sepia-600">
            Card {currentIndex + 1} / {cards.length}
          </span>
        </div>

        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <Card className="mb-6 min-h-[300px] flex items-center justify-center">
        <CardContent className="pt-12 pb-12 text-center w-full">
          {!revealed ? (
            /* Question State */
            <div className="space-y-6">
              <div className="text-2xl text-sepia-900 leading-relaxed">
                {currentCard.prompt}
              </div>

              {currentCard.card_type === 'cloze' && (
                <div className="text-sm text-sepia-500">
                  Fill in the blank
                </div>
              )}

              <Button
                onClick={() => setRevealed(true)}
                size="lg"
                className="mt-8"
                autoFocus
              >
                Show Answer
              </Button>
            </div>
          ) : (
            /* Answer State */
            <div className="space-y-6">
              <div className="text-2xl text-sepia-900 leading-relaxed">
                {currentCard.card_type === 'cloze'
                  ? highlightAnswer(currentCard.full_content, currentCard.answer)
                  : currentCard.full_content}
              </div>

              {currentCard.extra && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <div className="text-sm font-medium text-blue-900 mb-1">
                    Context
                  </div>
                  <div className="text-sepia-700">{currentCard.extra}</div>
                </div>
              )}

              {currentCard.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                  <div className="text-sm font-medium text-amber-900 mb-1">
                    Notes
                  </div>
                  <div className="text-sepia-700 italic">{currentCard.notes}</div>
                </div>
              )}

              <div className="pt-4">
                <div className="text-sm font-medium text-sepia-700 mb-3">
                  How well did you know this?
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    onClick={() => recordReview(0)}
                    variant="outline"
                    className="border-red-200 hover:bg-red-50 hover:border-red-400"
                  >
                    <div>
                      <div className="font-semibold">Again</div>
                      <div className="text-xs text-sepia-500">1 day</div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => recordReview(1)}
                    variant="outline"
                    className="border-amber-200 hover:bg-amber-50 hover:border-amber-400"
                  >
                    <div>
                      <div className="font-semibold">Hard</div>
                      <div className="text-xs text-sepia-500">3 days</div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => recordReview(2)}
                    variant="outline"
                    className="border-green-200 hover:bg-green-50 hover:border-green-400"
                  >
                    <div>
                      <div className="font-semibold">Good</div>
                      <div className="text-xs text-sepia-500">7 days</div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => recordReview(3)}
                    variant="outline"
                    className="border-blue-200 hover:bg-blue-50 hover:border-blue-400"
                  >
                    <div>
                      <div className="font-semibold">Easy</div>
                      <div className="text-xs text-sepia-500">30 days</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyboard Hints */}
      <div className="text-center text-sm text-sepia-500">
        {!revealed ? (
          <div>
            <kbd className="px-2 py-1 bg-sepia-100 rounded">Space</kbd> to reveal •{' '}
            <kbd className="px-2 py-1 bg-sepia-100 rounded">Esc</kbd> to exit
          </div>
        ) : (
          <div>
            <kbd className="px-2 py-1 bg-sepia-100 rounded">1</kbd> Again •{' '}
            <kbd className="px-2 py-1 bg-sepia-100 rounded">2</kbd> Hard •{' '}
            <kbd className="px-2 py-1 bg-sepia-100 rounded">3</kbd> Good •{' '}
            <kbd className="px-2 py-1 bg-sepia-100 rounded">4</kbd> Easy •{' '}
            <kbd className="px-2 py-1 bg-sepia-100 rounded">Esc</kbd> to exit
          </div>
        )}
      </div>
    </div>
  )
}
