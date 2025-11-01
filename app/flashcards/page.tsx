'use client'

import { useEffect, useState } from 'react'
import { Plus, BookOpen, Trash2, Edit2, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'

interface FlashcardDeck {
  id: string
  name: string
  description?: string
  card_count: number
  due_count?: number
}

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDeck, setShowCreateDeck] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [newDeckDescription, setNewDeckDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [todayReviewed, setTodayReviewed] = useState(0)

  useEffect(() => {
    loadDecks()
    loadTodayStats()
  }, [])

  const loadDecks = async () => {
    try {
      const response = await fetch('/api/flashcards/decks')
      if (!response.ok) throw new Error('Failed to load decks')

      const data = await response.json()
      setDecks(data.decks)
    } catch (error) {
      console.error('Load decks error:', error)
      toast.error('Failed to load decks')
    } finally {
      setLoading(false)
    }
  }

  const loadTodayStats = async () => {
    try {
      const response = await fetch('/api/flashcards/stats/today')
      if (!response.ok) return

      const data = await response.json()
      setTodayReviewed(data.reviewed_count || 0)
    } catch (error) {
      console.error('Load stats error:', error)
    }
  }

  const createDeck = async () => {
    if (!newDeckName.trim()) {
      toast.error('Deck name is required')
      return
    }

    try {
      setCreating(true)

      const response = await fetch('/api/flashcards/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeckName.trim(),
          description: newDeckDescription.trim() || null
        })
      })

      if (!response.ok) throw new Error('Failed to create deck')

      const data = await response.json()
      setDecks([data.deck, ...decks])
      setNewDeckName('')
      setNewDeckDescription('')
      setShowCreateDeck(false)
      toast.success('Deck created successfully')
    } catch (error) {
      console.error('Create deck error:', error)
      toast.error('Failed to create deck')
    } finally {
      setCreating(false)
    }
  }

  const deleteDeck = async (deckId: string) => {
    if (!confirm('Are you sure you want to delete this deck? All cards will be deleted.')) {
      return
    }

    try {
      const response = await fetch(`/api/flashcards/decks/${deckId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete deck')

      setDecks(decks.filter(d => d.id !== deckId))
      toast.success('Deck deleted')
    } catch (error) {
      console.error('Delete deck error:', error)
      toast.error('Failed to delete deck')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-sepia-600">Loading decks...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Navigation />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-serif text-sepia-900 mb-2">Flashcards</h1>
        <p className="text-sepia-600">Practice with spaced repetition</p>
      </div>

      {/* Today's Stats */}
      {todayReviewed > 0 && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="pt-6 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sepia-700">
                <span className="font-semibold text-2xl text-green-700">{todayReviewed}</span> cards reviewed today
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Deck Button */}
      {!showCreateDeck && (
        <Button
          onClick={() => setShowCreateDeck(true)}
          className="mb-6"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create New Deck
        </Button>
      )}

      {/* Create Deck Form */}
      {showCreateDeck && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Create New Deck</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-sepia-700 mb-2">
                Deck Name *
              </label>
              <Input
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="e.g., Spanish Verbs, Tutor Corrections"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sepia-700 mb-2">
                Description (optional)
              </label>
              <Textarea
                value={newDeckDescription}
                onChange={(e) => setNewDeckDescription(e.target.value)}
                placeholder="What's this deck for?"
                rows={2}
                maxLength={500}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createDeck}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Deck'}
              </Button>
              <Button
                onClick={() => {
                  setShowCreateDeck(false)
                  setNewDeckName('')
                  setNewDeckDescription('')
                }}
                variant="outline"
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deck List */}
      {decks.length === 0 ? (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-sepia-900 mb-2">
              No decks yet
            </h3>
            <p className="text-sepia-600 mb-4">
              Create your first deck to start practicing with flashcards
            </p>
            {!showCreateDeck && (
              <Button onClick={() => setShowCreateDeck(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Deck
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <Card key={deck.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="text-sepia-900">{deck.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => deleteDeck(deck.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardTitle>
                {deck.description && (
                  <p className="text-sm text-sepia-600">{deck.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm text-sepia-600">
                  <span>{deck.card_count} cards</span>
                  {deck.due_count !== undefined && (
                    <span className="text-blue-600 font-medium">
                      {deck.due_count} due
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="default"
                    className="flex-1"
                  >
                    <Link href={`/flashcards/practice/${deck.id}`}>
                      Practice
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1"
                  >
                    <Link href={`/flashcards/deck/${deck.id}`}>
                      Manage
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
