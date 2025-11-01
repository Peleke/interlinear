'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Play, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface FlashcardsPanelProps {
  textId: string | null
  textTitle?: string
}

interface Deck {
  id: string
  name: string
  card_count: number
  due_count?: number
}

export function FlashcardsPanel({ textId, textTitle }: FlashcardsPanelProps) {
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDecks()
  }, [textId, textTitle])

  const loadDecks = async () => {
    try {
      const response = await fetch('/api/flashcards/decks')
      if (!response.ok) throw new Error('Failed to load decks')

      const data = await response.json()
      const allDecks = data.decks || []
      setDecks(allDecks)

      // Try to find deck for this text
      if (textTitle) {
        const textDeck = allDecks.find((d: Deck) =>
          d.name.toLowerCase().includes(textTitle.toLowerCase()) ||
          textTitle.toLowerCase().includes(d.name.toLowerCase())
        )

        if (textDeck) {
          setSelectedDeckId(textDeck.id)
        } else if (allDecks.length > 0) {
          // No matching deck, select first one
          setSelectedDeckId(allDecks[0].id)
        }
      } else if (allDecks.length > 0) {
        setSelectedDeckId(allDecks[0].id)
      }
    } catch (error) {
      console.error('Failed to load decks:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedDeck = decks.find(d => d.id === selectedDeckId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sepia-700" />
        <span className="ml-3 text-sepia-600">Loading flashcards...</span>
      </div>
    )
  }

  if (decks.length === 0) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6 text-center space-y-4">
          <BookOpen className="h-12 w-12 text-amber-600 mx-auto" />
          <h3 className="text-lg font-semibold text-sepia-900">
            No Flashcard Decks Yet
          </h3>
          <p className="text-sepia-600">
            Create a deck from the Tutor or Reader mode to start practicing
          </p>
          <Button asChild>
            <Link href="/flashcards">
              Go to Flashcards
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Check if there's a deck matching this text
  const hasTextDeck = textTitle && decks.some(d =>
    d.name.toLowerCase().includes(textTitle.toLowerCase()) ||
    textTitle.toLowerCase().includes(d.name.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Deck Info */}
      {!hasTextDeck && textTitle && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              💡 <strong>No deck found for "{textTitle}"</strong>
              <br />
              Showing all your decks instead. Create flashcards from words in Reader mode to build a deck for this text.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Deck Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Select Deck</span>
            <Button asChild variant="outline" size="sm">
              <Link href="/flashcards">
                <Settings className="h-4 w-4 mr-1" />
                Manage All Decks
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            value={selectedDeckId || ''}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="w-full border border-sepia-300 rounded-md px-3 py-2 text-sm"
          >
            {decks.map(deck => (
              <option key={deck.id} value={deck.id}>
                {deck.name} ({deck.card_count} cards
                {deck.due_count !== undefined && `, ${deck.due_count} due`})
              </option>
            ))}
          </select>

          {selectedDeck && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-center p-4 bg-sepia-50 rounded-lg">
                <div>
                  <p className="text-2xl font-bold text-sepia-900">{selectedDeck.card_count}</p>
                  <p className="text-xs text-sepia-600">Total Cards</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedDeck.due_count !== undefined ? selectedDeck.due_count : '—'}
                  </p>
                  <p className="text-xs text-sepia-600">Due Now</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button asChild className="flex-1" size="lg">
                  <Link href={`/flashcards/practice/${selectedDeck.id}`}>
                    <Play className="mr-2 h-5 w-5" />
                    Practice Now
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1" size="lg">
                  <Link href={`/flashcards/deck/${selectedDeck.id}`}>
                    <Settings className="mr-2 h-5 w-5" />
                    Edit Deck
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Instructions */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6 text-sm text-green-900 space-y-2">
          <p><strong>💡 Tip:</strong> Create flashcards while reading:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Click any word in Reader mode → "Create Flashcard"</li>
            <li>Use "Generate Examples" for context sentences</li>
            <li>In Tutor mode, save corrections as flashcards</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
