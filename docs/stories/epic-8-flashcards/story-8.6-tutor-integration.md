# Story 8.6: Tutor Integration

**Epic**: 8 - Flashcard System
**Status**: 🚧 Not Started
**Priority**: P1
**Estimated Effort**: 1 hour
**Dependencies**:
  - Story 8.3 (Flashcard API Routes)
  - Epic 7.5 (Real-Time Tutor Feedback)

---

## User Story

**As a** language learner
**I want** to save tutor corrections as flashcards
**So that** I can practice my mistakes later

---

## Acceptance Criteria

- [ ] "Save as Flashcard" button in ErrorTooltip
- [ ] Button creates flashcard from error data
- [ ] Flashcard fields auto-populated: front=error, back=correction, notes=explanation
- [ ] Source tracked as 'tutor_session'
- [ ] Success toast notification
- [ ] Can select target deck (or default to "Tutor Corrections")
- [ ] Button disabled after saving (prevent duplicates)

---

## Implementation

### Update ErrorTooltip Component

**File**: `components/tutor/ErrorTooltip.tsx`

```typescript
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ErrorTooltip({ error, sessionId }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSaveFlashcard = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: error.errorText,
          back: error.correction,
          notes: error.explanation,
          source: 'tutor_session',
          sourceId: sessionId
        })
      })

      if (response.ok) {
        toast.success('Saved to flashcards!')
        setSaved(true)
      } else {
        throw new Error('Failed to save')
      }
    } catch (err) {
      toast.error('Failed to save flashcard')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Error Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Error:</p>
            <p className="text-sm text-red-600">{error.errorText}</p>
          </div>

          <div>
            <p className="text-sm font-medium">Correction:</p>
            <p className="text-sm text-green-600">{error.correction}</p>
          </div>

          <div>
            <p className="text-sm font-medium">Explanation:</p>
            <p className="text-sm">{error.explanation}</p>
          </div>

          <Button
            onClick={handleSaveFlashcard}
            disabled={saving || saved}
            className="w-full"
          >
            {saved ? (
              <>✓ Saved</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save as Flashcard
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Auto-Create Deck

Create default "Tutor Corrections" deck if doesn't exist:

```typescript
async function ensureTutorDeck(userId: string): Promise<string> {
  const { data: existingDecks } = await supabase
    .from('flashcard_decks')
    .select('id')
    .eq('name', 'Tutor Corrections')
    .eq('user_id', userId)
    .single()

  if (existingDecks) {
    return existingDecks.id
  }

  const { data: newDeck } = await supabase
    .from('flashcard_decks')
    .insert({
      user_id: userId,
      name: 'Tutor Corrections',
      description: 'Errors from AI tutor sessions'
    })
    .select('id')
    .single()

  return newDeck.id
}
```

---

## Success Criteria

**Story Complete When**:
- ✅ Can save error as flashcard
- ✅ Flashcard data correctly populated
- ✅ Source tracking works
- ✅ Toast notifications appear
- ✅ Button states work correctly
- ✅ Default deck created if needed
- ✅ Code reviewed and merged

---

**Created**: 2025-10-31
**Author**: James (Dev Agent)
