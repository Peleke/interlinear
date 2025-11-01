'use client'

import { useState, useEffect } from 'react'
import { BookmarkPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface WordSaverProps {
  sentence: string
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon'
  buttonVariant?: 'default' | 'outline' | 'ghost'
}

export function WordSaver({
  sentence,
  buttonSize = 'sm',
  buttonVariant = 'outline'
}: WordSaverProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Deck selection
  const [decks, setDecks] = useState<Array<{ id: string; name: string }>>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string>('')

  // Form fields
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState('')
  const [context, setContext] = useState(sentence)

  useEffect(() => {
    if (open) {
      loadDecks()
      setContext(sentence)
    }
  }, [open, sentence])

  const loadDecks = async () => {
    try {
      const response = await fetch('/api/flashcards/decks')
      if (!response.ok) return

      const data = await response.json()
      setDecks(data.decks || [])

      // Auto-select "Vocabulary" or "Tutor" deck
      const vocabDeck = data.decks.find((d: any) =>
        d.name.toLowerCase().includes('vocab') || d.name.toLowerCase().includes('tutor')
      )
      if (vocabDeck) {
        setSelectedDeckId(vocabDeck.id)
      } else if (data.decks.length > 0) {
        setSelectedDeckId(data.decks[0].id)
      }
    } catch (error) {
      console.error('Failed to load decks:', error)
    }
  }

  const saveWord = async () => {
    if (!selectedDeckId) {
      toast.error('Please select a deck')
      return
    }

    if (!word.trim() || !translation.trim()) {
      toast.error('Word and translation are required')
      return
    }

    try {
      setSaving(true)

      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deck_id: selectedDeckId,
          card_type: 'basic_with_text',
          front: word.trim(),
          back: translation.trim(),
          extra: context.trim() || null,
          source: 'tutor_vocabulary'
        })
      })

      if (!response.ok) throw new Error('Failed to save word')

      toast.success('Word saved to flashcards!')
      setOpen(false)
      setWord('')
      setTranslation('')
    } catch (err) {
      console.error('Save word error:', err)
      toast.error('Failed to save word')
    } finally {
      setSaving(false)
    }
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
          Save Word
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Decks Available</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-sepia-600 mb-4">
              You need to create a flashcard deck first.
            </p>
            <Button asChild>
              <a href="/flashcards" target="_blank">Go to Flashcards</a>
            </Button>
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
        Save Word
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Save Word to Flashcards</DialogTitle>
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

            {/* Word */}
            <div>
              <label className="block text-sm font-medium text-sepia-700 mb-2">
                Spanish Word/Phrase *
              </label>
              <Input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="e.g., el perro"
                autoFocus
              />
            </div>

            {/* Translation */}
            <div>
              <label className="block text-sm font-medium text-sepia-700 mb-2">
                English Translation *
              </label>
              <Input
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="e.g., the dog"
              />
            </div>

            {/* Context */}
            <div>
              <label className="block text-sm font-medium text-sepia-700 mb-2">
                Example Sentence
              </label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Sentence where this word appeared"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={saveWord}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Word'}
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
