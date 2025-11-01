'use client'

import { useState, useEffect } from 'react'
import { BookmarkPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface FlashcardSaverProps {
  // Pre-filled content
  defaultFront?: string
  defaultBack?: string
  defaultClozeText?: string
  defaultExtra?: string

  // Context
  textTitle?: string
  textId?: string

  // Card type preference
  defaultCardType?: 'basic' | 'cloze'

  // Button customization
  buttonLabel?: string
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon'
  buttonVariant?: 'default' | 'outline' | 'ghost'

  // Callbacks
  onSuccess?: () => void
}

export function FlashcardSaver({
  defaultFront = '',
  defaultBack = '',
  defaultClozeText = '',
  defaultExtra = '',
  textTitle,
  textId,
  defaultCardType = 'cloze',
  buttonLabel = 'Save to Flashcards',
  buttonSize = 'sm',
  buttonVariant = 'outline',
  onSuccess
}: FlashcardSaverProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creatingDeck, setCreatingDeck] = useState(false)

  // Deck selection
  const [decks, setDecks] = useState<Array<{ id: string; name: string }>>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string>('')

  // Card type
  const [cardType, setCardType] = useState<'basic' | 'cloze'>(defaultCardType)

  // Form fields
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [clozeText, setClozeText] = useState('')
  const [extra, setExtra] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      loadDecks()
      // Reset form with defaults
      setCardType(defaultCardType)
      setFront(defaultFront)
      setBack(defaultBack)
      setClozeText(defaultClozeText)
      setExtra(defaultExtra)
      setNotes('')
    }
  }, [open, defaultCardType, defaultFront, defaultBack, defaultClozeText, defaultExtra])

  const loadDecks = async () => {
    try {
      const response = await fetch('/api/flashcards/decks')
      if (!response.ok) return

      const data = await response.json()
      setDecks(data.decks || [])

      // Auto-select "Tutor" deck or first deck
      const tutorDeck = data.decks.find((d: any) =>
        d.name.toLowerCase().includes('tutor')
      )
      if (tutorDeck) {
        setSelectedDeckId(tutorDeck.id)
      } else if (data.decks.length > 0) {
        setSelectedDeckId(data.decks[0].id)
      }
    } catch (error) {
      console.error('Failed to load decks:', error)
    }
  }

  const saveCard = async () => {
    if (!selectedDeckId) {
      toast.error('Please select a deck')
      return
    }

    // Validate based on card type
    if (cardType === 'cloze') {
      if (!clozeText.trim()) {
        toast.error('Cloze text is required')
        return
      }
    } else {
      if (!front.trim() || !back.trim()) {
        toast.error('Front and back are required')
        return
      }
    }

    try {
      setSaving(true)

      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deck_id: selectedDeckId,
          card_type: cardType,
          front: front.trim() || null,
          back: back.trim() || null,
          cloze_text: clozeText.trim() || null,
          extra: extra.trim() || null,
          notes: notes.trim() || null,
          source: 'tutor_session'
        })
      })

      if (!response.ok) throw new Error('Failed to save flashcard')

      toast.success('Flashcard saved!')
      setOpen(false)
      onSuccess?.()
    } catch (err) {
      console.error('Save flashcard error:', err)
      toast.error('Failed to save flashcard')
    } finally {
      setSaving(false)
    }
  }

  // Helper: Create deck for this text
  const createDeckForText = async () => {
    if (!textTitle) return

    try {
      setCreatingDeck(true)

      const deckName = `Deck: ${textTitle}`
      const response = await fetch('/api/flashcards/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deckName,
          description: textId ? `Flashcards for text ${textId}` : undefined
        })
      })

      if (!response.ok) throw new Error('Failed to create deck')

      const data = await response.json()
      toast.success('Deck created!')

      // Reload decks and select the new one
      await loadDecks()
      setSelectedDeckId(data.deck.id)
    } catch (error) {
      console.error('Create deck error:', error)
      toast.error('Failed to create deck')
    } finally {
      setCreatingDeck(false)
    }
  }

  // Helper: Insert cloze syntax
  const insertCloze = () => {
    const textarea = document.getElementById('cloze-textarea-saver') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = clozeText.substring(start, end)

    if (!selectedText) {
      toast.error('Select text first')
      return
    }

    // Find next cloze index
    const regex = /\{\{c(\d+)::/g
    const matches = [...clozeText.matchAll(regex)]
    const nextIndex = matches.length > 0
      ? Math.max(...matches.map(m => parseInt(m[1]))) + 1
      : 1

    const clozeWrapper = `{{c${nextIndex}::${selectedText}}}`
    const newText = clozeText.substring(0, start) + clozeWrapper + clozeText.substring(end)

    setClozeText(newText)
  }

  if (decks.length === 0 && open) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <Button
          onClick={() => setOpen(true)}
          size={buttonSize}
          variant={buttonVariant}
        >
          <BookmarkPlus className="h-4 w-4 mr-1" />
          {buttonLabel}
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Decks Available</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center space-y-4">
            <p className="text-sepia-600">
              You need to create a flashcard deck first.
            </p>

            <div className="flex flex-col gap-2">
              {textTitle && (
                <Button
                  onClick={createDeckForText}
                  disabled={creatingDeck}
                  variant="default"
                  className="w-full"
                >
                  {creatingDeck ? 'Creating...' : `Create Deck for "${textTitle}"`}
                </Button>
              )}

              <Button asChild variant="outline" className="w-full">
                <a href="/flashcards" target="_blank">Go to Flashcards</a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size={buttonSize}
        variant={buttonVariant}
      >
        <BookmarkPlus className="h-4 w-4 mr-1" />
        {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Save to Flashcards</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Deck Selector */}
            <div>
              <label className="block text-sm font-medium text-sepia-700 mb-2">
                Deck *
              </label>
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="w-full border border-sepia-300 rounded-md px-3 py-2 text-sm"
              >
                {decks.map(deck => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Card Type Tabs */}
            <Tabs value={cardType} onValueChange={(v) => setCardType(v as 'basic' | 'cloze')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Card</TabsTrigger>
                <TabsTrigger value="cloze">Cloze Card ⭐</TabsTrigger>
              </TabsList>

              {/* Basic Card */}
              <TabsContent value="basic" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-sepia-700 mb-2">
                    Front (Spanish) *
                  </label>
                  <Input
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    placeholder="e.g., el perro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sepia-700 mb-2">
                    Back (English) *
                  </label>
                  <Input
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    placeholder="e.g., the dog"
                  />
                </div>
              </TabsContent>

              {/* Cloze Card */}
              <TabsContent value="cloze" className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-900">
                  ⭐ Select a word/phrase and click &quot;Wrap as Cloze&quot; or type {'{{'}c1::word{'}}'}
                </div>

                <div>
                  <label className="block text-sm font-medium text-sepia-700 mb-2">
                    Sentence *
                  </label>
                  <Textarea
                    id="cloze-textarea-saver"
                    value={clozeText}
                    onChange={(e) => setClozeText(e.target.value)}
                    placeholder="El {{c1::perro}} corre en el {{c2::parque}}."
                    rows={4}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={insertCloze}
                    className="mt-2"
                  >
                    Wrap Selection as Cloze
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Shared: Context */}
            <div>
              <label className="block text-sm font-medium text-sepia-700 mb-2">
                Context (optional)
              </label>
              <Textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="English translation or additional context"
                rows={2}
              />
            </div>

            {/* Shared: Notes */}
            <div>
              <label className="block text-sm font-medium text-sepia-700 mb-2">
                Notes (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for studying"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={saveCard}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Card'}
              </Button>
              <Button
                onClick={() => setOpen(false)}
                variant="outline"
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
