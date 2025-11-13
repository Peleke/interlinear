'use client'

import { useState, useEffect } from 'react'
import { X, BookmarkPlus, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface FlashcardSaveData {
  front: string
  back: string
  notes?: string
  source: 'tutor_session' | 'dialog_roleplay'
  sourceId?: string
  deckId?: string
}

interface FlashcardSaveModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
  saveData: FlashcardSaveData
  errorText: string
  correction: string
  explanation: string
  category?: 'grammar' | 'vocabulary' | 'syntax'
}

export function FlashcardSaveModal({
  isOpen,
  onClose,
  onSave,
  saveData,
  errorText,
  correction,
  explanation,
  category
}: FlashcardSaveModalProps) {
  const [saving, setSaving] = useState(false)
  const [decks, setDecks] = useState<Array<{ id: string; name: string }>>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      loadDecks()
    }
  }, [isOpen])

  const loadDecks = async () => {
    try {
      const response = await fetch('/api/flashcards/decks')
      if (!response.ok) return

      const data = await response.json()
      setDecks(data.decks || [])

      // Use provided deckId or auto-select appropriate deck
      if (saveData.deckId) {
        setSelectedDeckId(saveData.deckId)
      } else {
        // Auto-select "Tutor Corrections" or similar deck if it exists
        const tutorDeck = data.decks.find((d: any) =>
          d.name.toLowerCase().includes('tutor') ||
          d.name.toLowerCase().includes('correction') ||
          d.name.toLowerCase().includes('error')
        )
        if (tutorDeck) {
          setSelectedDeckId(tutorDeck.id)
        } else if (data.decks.length > 0) {
          setSelectedDeckId(data.decks[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load decks:', error)
    }
  }

  const handleSave = async () => {
    if (!selectedDeckId) {
      toast.error('Please select a deck first')
      return
    }

    try {
      setSaving(true)

      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deck_id: selectedDeckId,
          card_type: 'basic',
          front: saveData.front,
          back: saveData.back,
          notes: saveData.notes || (category ? `${category}: ${explanation}` : explanation),
          source: saveData.source,
          source_id: saveData.sourceId
        })
      })

      if (!response.ok) throw new Error('Failed to save flashcard')

      toast.success('Flashcard saved!')
      onSave?.()
      onClose()
    } catch (err) {
      console.error('Save flashcard error:', err)
      toast.error('Failed to save flashcard')
    } finally {
      setSaving(false)
    }
  }

  const categoryColors = {
    grammar: 'text-red-700',
    vocabulary: 'text-blue-700',
    syntax: 'text-purple-700'
  }

  const categoryIcons = {
    grammar: '📝',
    vocabulary: '📚',
    syntax: '🔧'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-sepia-900">Save as Flashcard</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Display */}
          <div className="space-y-2">
            <h4 className="font-semibold text-red-700 flex items-center gap-2">
              {category && <span className="text-lg">{categoryIcons[category]}</span>}
              Your error:
              {category && (
                <span className={`text-xs px-2 py-0.5 bg-gray-100 rounded ${categoryColors[category]}`}>
                  {category}
                </span>
              )}
            </h4>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-900 font-medium">{errorText}</p>
            </div>
          </div>

          {/* Correction */}
          <div className="space-y-2">
            <h4 className="font-semibold text-green-700">Correction:</h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-900 font-medium">{correction}</p>
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sepia-700">Explanation:</h4>
            <div className="bg-sepia-50 border border-sepia-200 rounded-lg p-3">
              <p className="text-sepia-900 leading-relaxed text-sm">
                {explanation}
              </p>
            </div>
          </div>

          {/* Deck Selection */}
          {decks.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sepia-700">Select Deck:</h4>
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="w-full px-3 py-2 border border-sepia-300 rounded-md text-sm bg-white text-sepia-900 focus:outline-none focus:ring-2 focus:ring-sepia-500"
              >
                <option value="">Choose a deck...</option>
                {decks.map(deck => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedDeckId}
            className="bg-sepia-700 hover:bg-sepia-800"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <BookmarkPlus className="mr-2 h-4 w-4" />
                Save Flashcard
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}