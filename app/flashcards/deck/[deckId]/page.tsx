'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Flashcard, CardType } from '@/lib/services/flashcards'
import { parseClozeText, renderClozeText } from '@/lib/services/flashcards'

interface Deck {
  id: string
  name: string
  description?: string
}

export default function DeckManagementPage() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.deckId as string

  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCard, setShowAddCard] = useState(false)

  // New card form state
  const [cardType, setCardType] = useState<CardType>('cloze')
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [clozeText, setClozeText] = useState('')
  const [extra, setExtra] = useState('')
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadDeck()
    loadCards()
  }, [deckId])

  const loadDeck = async () => {
    // For now, we'll just use the deckId. In a real app, fetch deck details
    setDeck({ id: deckId, name: 'Loading...' })
  }

  const loadCards = async () => {
    try {
      const response = await fetch(`/api/flashcards/deck/${deckId}/cards`)
      if (!response.ok) throw new Error('Failed to load cards')

      const data = await response.json()
      setCards(data.cards)
    } catch (error) {
      console.error('Load cards error:', error)
      toast.error('Failed to load cards')
    } finally {
      setLoading(false)
    }
  }

  const createCard = async () => {
    try {
      setCreating(true)

      // Validate based on card type
      if (cardType === 'cloze') {
        if (!clozeText.trim()) {
          toast.error('Cloze text is required')
          return
        }
        // Check for valid cloze syntax
        const matches = parseClozeText(clozeText)
        if (matches.length === 0) {
          toast.error('No cloze deletions found. Use {{c1::word}} syntax.')
          return
        }
      } else {
        if (!front.trim() || !back.trim()) {
          toast.error('Front and back are required')
          return
        }
      }

      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deck_id: deckId,
          card_type: cardType,
          front: front.trim() || null,
          back: back.trim() || null,
          cloze_text: clozeText.trim() || null,
          extra: extra.trim() || null,
          notes: notes.trim() || null
        })
      })

      if (!response.ok) throw new Error('Failed to create card')

      const data = await response.json()
      setCards([data.card, ...cards])

      // Reset form
      setFront('')
      setBack('')
      setClozeText('')
      setExtra('')
      setNotes('')
      setShowAddCard(false)
      toast.success('Card created successfully')
    } catch (error) {
      console.error('Create card error:', error)
      toast.error('Failed to create card')
    } finally {
      setCreating(false)
    }
  }

  const deleteCard = async (cardId: string) => {
    if (!confirm('Delete this card?')) return

    try {
      const response = await fetch(`/api/flashcards/${cardId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete card')

      setCards(cards.filter(c => c.id !== cardId))
      toast.success('Card deleted')
    } catch (error) {
      console.error('Delete card error:', error)
      toast.error('Failed to delete card')
    }
  }

  // Helper: Insert cloze syntax at cursor
  const insertCloze = () => {
    const textarea = document.getElementById('cloze-textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = clozeText.substring(start, end)

    if (!selectedText) {
      toast.error('Select text first')
      return
    }

    // Find next cloze index
    const matches = parseClozeText(clozeText)
    const nextIndex = matches.length > 0
      ? Math.max(...matches.map(m => m.index)) + 1
      : 1

    const clozeWrapper = `{{c${nextIndex}::${selectedText}}}`
    const newText = clozeText.substring(0, start) + clozeWrapper + clozeText.substring(end)

    setClozeText(newText)
  }

  // Helper: Preview cloze cards
  const previewClozeCards = () => {
    const matches = parseClozeText(clozeText)
    if (matches.length === 0) return null

    return matches.map(match => {
      const prompt = renderClozeText(clozeText, [match.index], true)
      const answer = match.word
      return (
        <div key={match.index} className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="text-sm font-medium text-blue-900 mb-1">
            Card {match.index}
          </div>
          <div className="text-sepia-700">
            <div className="font-medium">Prompt:</div>
            <div className="mb-2">{prompt}</div>
            <div className="font-medium">Answer:</div>
            <div className="text-blue-600">{answer}</div>
          </div>
        </div>
      )
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-sepia-600">Loading cards...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          asChild
          variant="ghost"
          className="mb-4"
        >
          <Link href="/flashcards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Decks
          </Link>
        </Button>

        <h1 className="text-3xl font-serif text-sepia-900 mb-2">
          {deck?.name || 'Deck'}
        </h1>
        <p className="text-sepia-600">{cards.length} cards</p>
      </div>

      {/* Add Card Button */}
      {!showAddCard && (
        <Button
          onClick={() => setShowAddCard(true)}
          className="mb-6"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Card
        </Button>
      )}

      {/* Add Card Form */}
      {showAddCard && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Add New Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Card Type Selector */}
            <Tabs value={cardType} onValueChange={(v) => setCardType(v as CardType)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="basic_reversed">Reversed</TabsTrigger>
                <TabsTrigger value="basic_with_text">With Text</TabsTrigger>
                <TabsTrigger value="cloze">Cloze ⭐</TabsTrigger>
              </TabsList>

              {/* Basic Card */}
              <TabsContent value="basic" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-sepia-700 mb-2">
                    Front *
                  </label>
                  <Input
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    placeholder="e.g., perro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sepia-700 mb-2">
                    Back *
                  </label>
                  <Input
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    placeholder="e.g., dog"
                  />
                </div>
              </TabsContent>

              {/* Basic Reversed Card */}
              <TabsContent value="basic_reversed" className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900 mb-4">
                  ℹ️ This creates 2 cards: Front→Back AND Back→Front
                </div>
                <div>
                  <label className="block text-sm font-medium text-sepia-700 mb-2">
                    Front *
                  </label>
                  <Input
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    placeholder="e.g., perro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sepia-700 mb-2">
                    Back *
                  </label>
                  <Input
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    placeholder="e.g., dog"
                  />
                </div>
              </TabsContent>

              {/* Basic with Text Card */}
              <TabsContent value="basic_with_text" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-sepia-700 mb-2">
                    Front *
                  </label>
                  <Input
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    placeholder="e.g., el perro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sepia-700 mb-2">
                    Back *
                  </label>
                  <Input
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    placeholder="e.g., the dog"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sepia-700 mb-2">
                    Context (shown after answer)
                  </label>
                  <Textarea
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    placeholder="e.g., El perro corre en el parque."
                    rows={2}
                  />
                </div>
              </TabsContent>

              {/* Cloze Card */}
              <TabsContent value="cloze" className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-900 mb-4">
                  ⭐ <strong>Cloze cards are the most powerful for language learning!</strong>
                  <br />
                  Select text and click &quot;Wrap as Cloze&quot; or type {'{{'}c1::word{'}}'}
                </div>

                <div>
                  <label className="block text-sm font-medium text-sepia-700 mb-2">
                    Cloze Text *
                  </label>
                  <Textarea
                    id="cloze-textarea"
                    value={clozeText}
                    onChange={(e) => setClozeText(e.target.value)}
                    placeholder="El {{c1::perro}} corre en el {{c2::parque}}."
                    rows={4}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={insertCloze}
                    >
                      Wrap Selection as {'{{'}c{parseClozeText(clozeText).length + 1}::{'}}'}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sepia-700 mb-2">
                    Context (optional)
                  </label>
                  <Textarea
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    placeholder="e.g., The dog runs in the park."
                    rows={2}
                  />
                </div>

                {/* Preview */}
                {clozeText && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-sepia-600" />
                      <span className="text-sm font-medium text-sepia-700">
                        Preview Cards
                      </span>
                    </div>
                    <div className="space-y-2">
                      {previewClozeCards()}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Shared Notes Field */}
            <div>
              <label className="block text-sm font-medium text-sepia-700 mb-2">
                Notes (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for this card"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={createCard}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Add Card'}
              </Button>
              <Button
                onClick={() => {
                  setShowAddCard(false)
                  setFront('')
                  setBack('')
                  setClozeText('')
                  setExtra('')
                  setNotes('')
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

      {/* Card List */}
      {cards.length === 0 ? (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6 text-center">
            <p className="text-sepia-600 mb-4">
              No cards yet. Add your first card to start practicing!
            </p>
            {!showAddCard && (
              <Button onClick={() => setShowAddCard(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <Card key={card.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-sepia-500 mb-2">
                      {card.card_type === 'cloze' && '⭐ '}
                      {card.card_type.replace('_', ' ').toUpperCase()}
                    </div>

                    {card.card_type === 'cloze' ? (
                      <div>
                        <div className="text-sepia-900 mb-2">
                          {(card as any).cloze_text}
                        </div>
                        {card.extra && (
                          <div className="text-sm text-sepia-600">
                            Context: {card.extra}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-sepia-500">Front:</span>
                          <span className="text-sepia-900">{(card as any).front}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-sepia-500">Back:</span>
                          <span className="text-sepia-900">{(card as any).back}</span>
                        </div>
                        {card.extra && (
                          <div className="text-sm text-sepia-600 mt-2">
                            {card.extra}
                          </div>
                        )}
                      </div>
                    )}

                    {card.notes && (
                      <div className="text-sm text-sepia-600 mt-2 italic">
                        {card.notes}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCard(card.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
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
