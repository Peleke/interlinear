# Epic 9: Flashcard-Tutor Deep Integration

**Status**: 📋 Planned
**Priority**: 🔥 High
**Estimated Effort**: 3-4 days

## Vision

Create seamless flashcard generation from every learning interaction in the tutor - corrections, errors, vocabulary, and examples. Make saving flashcards so effortless that it becomes the default learning behavior.

---

## Problem Statement

Currently:
- ✅ Users can save AI messages as flashcards
- ❌ No quick-save for corrections/errors
- ❌ Vocabulary definitions lack flashcard integration
- ❌ Generated examples can't be saved as flashcards
- ❌ No deck-specific saving for lessons

**Result**: Friction in the learning→flashcard→practice loop, missed opportunities for spaced repetition.

---

## Epic Goals

1. **Zero-friction correction saves** - Turn mistakes into cloze cards instantly
2. **Vocabulary integration** - Add flashcard buttons to all definition cards
3. **Example generation loop** - Generate + save examples as flashcards
4. **Deck context awareness** - Auto-associate cards with lesson decks

---

## User Stories

### Story 9.1: Error-to-Flashcard Quick Save ⭐⭐⭐
**As a** language learner
**I want to** save my corrected errors as flashcards
**So that** I can practice my mistakes through SRS

**Acceptance Criteria**:
- [ ] Each error in "Errores Específicos" has a "Save as Card" button
- [ ] Click opens FlashcardSaver modal pre-filled with:
  - Card type: Cloze
  - Cloze text: My original sentence with error wrapped as {{c1::}}
  - Answer: The correction
  - Notes: Error explanation + category
  - Context: Correct full sentence
- [ ] Deck auto-selects to "Deck: {textTitle}" if exists
- [ ] Toast confirms: "Error saved as flashcard!"
- [ ] Button shows checkmark after save

**Technical Notes**:
- Error data structure already has: errorText, correction, explanation, category
- Need to construct cloze syntax: wrap errorText as {{c1::errorText}}
- Answer should be the correction
- Full corrected sentence goes in extra field

**UX Flow**:
```
Error displayed:
  "Yo como pizza" → "Yo comí pizza"
  Explanation: "Past tense needed"

User clicks "Save as Card" →
Modal opens:
  Type: Cloze
  Sentence: "Yo {{c1::como}} pizza"
  Answer: "comí"
  Context: "Yo comí pizza"
  Notes: "grammar: Past tense needed"

User clicks "Save" →
Toast: "Error saved!"
Button: ✓ Saved
```

---

### Story 9.2: Correction Summary Save Button ⭐⭐
**As a** language learner
**I want to** save my entire corrected sentence as a flashcard
**So that** I can practice the correct form

**Acceptance Criteria**:
- [ ] MessageCorrection component has "Save Corrected Sentence" button
- [ ] Opens FlashcardSaver with:
  - Type: Cloze
  - Text: Corrected sentence with all errors as cloze deletions
  - Multiple {{cN::}} for each error
  - Context: English translation (if available)
- [ ] Works even if multiple errors in one sentence

**Technical Notes**:
- Iterate through all errors in correction.errors
- Build cloze text with {{c1::error1}}, {{c2::error2}}, etc.
- Each cloze deletion = the corrected word

**UX Flow**:
```
Correction:
  Original: "Yo como mucho pizza ayer"
  Corrected: "Yo comí mucha pizza ayer"
  Errors: [como→comí, mucho→mucha]

User clicks "Save Corrected Sentence" →
Modal:
  Cloze: "Yo {{c1::comí}} {{c2::mucha}} pizza ayer"
  Context: "I ate a lot of pizza yesterday"
```

---

### Story 9.3: Vocabulary Definition Flashcard Integration ⭐⭐⭐
**As a** language learner
**I want to** save vocabulary definitions as flashcards
**So that** I can memorize new words through SRS

**Acceptance Criteria**:
- [ ] Each definition card in Vocab tab has two buttons:
  - "Save as Flashcard" button
  - "Generate Examples..." button
- [ ] "Save as Flashcard" opens FlashcardSaver with:
  - Type: basic_with_text (default)
  - Front: Spanish word
  - Back: English definition
  - Context: Example sentence
  - Option to switch to Cloze with example sentence
- [ ] "Generate Examples..." button:
  - Calls AI to generate 3 example sentences using the word
  - Shows modal with generated examples
  - Each example has checkbox + "Save" button
  - Can save selected examples as cloze cards

**Technical Notes**:
- Definition cards already have: word, definition, example
- Need new API endpoint: `/api/vocabulary/generate-examples`
- Generate examples with OpenAI: "Generate 3 Spanish sentences using '{word}'"
- Each generated example becomes a cloze card with word as deletion

**UX Flow**:
```
Definition card shows:
  perro: dog
  Example: "El perro corre en el parque"

Two buttons:
  [📖 Save as Flashcard] [✨ Generate Examples...]

User clicks "Generate Examples" →
Modal opens:
  "Generating examples for 'perro'..."

Shows:
  ☑ "Mi perro es muy grande"
  ☑ "El perro ladra mucho"
  ☐ "Los perros necesitan agua"

  [Save 2 Selected as Flashcards]

User clicks "Save" →
Creates 2 cloze cards:
  "Mi {{c1::perro}} es muy grande"
  "El {{c1::perro}} ladra mucho"
```

---

### Story 9.4: Review Panel Error Flashcard Buttons ⭐⭐
**As a** language learner
**I want to** save errors from the review panel
**So that** I can study them after the session

**Acceptance Criteria**:
- [ ] Each error in "Errores Específicos" section has icon button
- [ ] Icon: Bookmark or flashcard symbol
- [ ] Same behavior as Story 9.1 (opens pre-filled modal)
- [ ] Visual confirmation when saved

**Technical Notes**:
- Review panel already displays errors in ErrorPlayback component
- Add FlashcardSaver button next to each error
- Same pre-fill logic as Story 9.1

---

### Story 9.5: Deck Context Awareness ⭐
**As a** language learner
**I want** flashcards to auto-associate with the current lesson
**So that** I can practice lesson-specific cards

**Acceptance Criteria**:
- [ ] When in tutor for specific text, detect text title
- [ ] All FlashcardSaver calls pass textTitle and textId
- [ ] If deck "Deck: {textTitle}" exists, auto-select it
- [ ] If no deck exists, show "Create Deck for This Lesson" button (✅ DONE)
- [ ] Created cards tagged with source: 'tutor_error' / 'tutor_vocab' / 'tutor_example'

**Technical Notes**:
- DialogView needs access to textTitle (may need to pass as prop)
- All FlashcardSaver instances need textTitle/textId props
- Source tracking helps filter by card origin later

---

### Story 9.6: Example Generation API ⭐⭐
**As a** system
**I need** an AI-powered example generation endpoint
**So that** users can get contextual examples for vocabulary

**Acceptance Criteria**:
- [ ] POST `/api/vocabulary/generate-examples`
- [ ] Input: { word: string, count?: number }
- [ ] Output: { examples: string[] }
- [ ] Uses OpenAI with prompt: "Generate {count} natural Spanish sentences using the word '{word}'"
- [ ] Rate limited to 10 requests/minute per user
- [ ] Examples validated (must contain the word)

**Technical Implementation**:
```typescript
// app/api/vocabulary/generate-examples/route.ts
export async function POST(request: Request) {
  const { word, count = 3 } = await request.json()

  const prompt = `Generate ${count} natural Spanish sentences using the word "${word}".
  Each sentence should be different and use the word in context.
  Return ONLY the sentences, one per line.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  })

  const examples = response.choices[0].message.content
    .split('\n')
    .filter(line => line.trim() && line.includes(word))

  return NextResponse.json({ examples })
}
```

---

## Technical Design

### Component Updates

#### 1. MessageCorrection.tsx
**Changes**:
```typescript
// Add FlashcardSaver for individual errors
{error && (
  <div className="flex items-center justify-between">
    <span>{error.errorText} → {error.correction}</span>
    <FlashcardSaver
      defaultClozeText={buildClozeFromError(error, originalSentence)}
      defaultExtra={error.correctedText}
      defaultNotes={`${error.category}: ${error.explanation}`}
      textTitle={textTitle}
      textId={textId}
      buttonSize="sm"
      buttonVariant="ghost"
      buttonLabel="Save"
    />
  </div>
)}

// Helper function
function buildClozeFromError(error, sentence) {
  // Replace error.errorText with {{c1::errorText}} in sentence
  return sentence.replace(error.errorText, `{{c1::${error.errorText}}}`)
}
```

#### 2. VocabularyView.tsx
**Changes**:
```typescript
// Add buttons to definition cards
<div className="flex gap-2 mt-2">
  <FlashcardSaver
    defaultFront={word}
    defaultBack={definition}
    defaultExtra={example}
    textTitle={textTitle}
    buttonLabel="Save as Flashcard"
    buttonSize="sm"
  />
  <Button
    onClick={() => openExampleGenerator(word)}
    size="sm"
    variant="outline"
  >
    ✨ Generate Examples...
  </Button>
</div>
```

#### 3. ExampleGeneratorModal.tsx (New Component)
```typescript
interface Props {
  word: string
  open: boolean
  onClose: () => void
  textTitle?: string
  textId?: string
}

export function ExampleGeneratorModal({ word, open, onClose, textTitle, textId }: Props) {
  const [examples, setExamples] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) generateExamples()
  }, [open])

  const generateExamples = async () => {
    setGenerating(true)
    const response = await fetch('/api/vocabulary/generate-examples', {
      method: 'POST',
      body: JSON.stringify({ word, count: 3 })
    })
    const data = await response.json()
    setExamples(data.examples)
    setSelected(new Set([0, 1, 2])) // All selected by default
    setGenerating(false)
  }

  const saveSelected = async () => {
    setSaving(true)
    for (const idx of selected) {
      const clozeText = examples[idx].replace(word, `{{c1::${word}}}`)
      await fetch('/api/flashcards', {
        method: 'POST',
        body: JSON.stringify({
          card_type: 'cloze',
          cloze_text: clozeText,
          source: 'vocabulary_example'
        })
      })
    }
    toast.success(`Saved ${selected.size} examples!`)
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Examples for "{word}"</DialogTitle>
        </DialogHeader>

        {generating ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            {examples.map((ex, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(idx)}
                  onChange={() => toggleSelection(idx)}
                />
                <span>{ex}</span>
              </div>
            ))}

            <Button onClick={saveSelected} disabled={selected.size === 0 || saving}>
              {saving ? 'Saving...' : `Save ${selected.size} as Flashcards`}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

## API Endpoints

### POST /api/vocabulary/generate-examples
**Request**:
```json
{
  "word": "perro",
  "count": 3
}
```

**Response**:
```json
{
  "examples": [
    "Mi perro es muy grande",
    "El perro ladra mucho",
    "Los perros necesitan agua"
  ]
}
```

**Rate Limiting**: 10 requests/minute per user

---

## Database Changes

None required! Existing schema supports all features.

Optional enhancement:
```sql
-- Add source tracking to flashcards table
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS source TEXT;

COMMENT ON COLUMN public.flashcards.source IS
'Source of card creation: tutor_error, tutor_vocab, tutor_example, manual, etc.';
```

---

## UX Principles

1. **Reduce clicks**: Most common action (save error) = 1 click
2. **Smart defaults**: Pre-fill everything possible
3. **Visual feedback**: Show saved state, confirm actions
4. **Progressive disclosure**: Don't show example generator until requested
5. **Keyboard support**: Enter to save, Esc to cancel

---

## Success Metrics

**Engagement**:
- % of errors saved as flashcards (target: 60%+)
- % of vocab looked up → saved as flashcards (target: 40%+)
- Examples generated per session (target: 3+)

**Retention**:
- Users who save >5 cards/session more likely to return (hypothesis)
- Average cards/session increases over time

**Quality**:
- Error cards reviewed have 70%+ "Good" or better ratings
- Generated examples feel natural (user feedback)

---

## Implementation Phases

### Phase 1: Error Flashcards (1-2 days) ⭐⭐⭐
- Story 9.1: Error-to-Flashcard quick save
- Story 9.2: Correction summary save
- Story 9.4: Review panel buttons

**Deliverable**: Can save errors as cloze flashcards from anywhere

### Phase 2: Vocabulary Integration (1 day) ⭐⭐⭐
- Story 9.3: Definition flashcard buttons
- Story 9.6: Example generation API
- ExampleGeneratorModal component

**Deliverable**: Can save vocab + generate examples

### Phase 3: Polish & Context (0.5-1 day) ⭐
- Story 9.5: Deck context awareness
- Source tracking
- Analytics/metrics

**Deliverable**: Smart deck selection, usage tracking

---

## Testing Plan

### Manual Testing
- [ ] Save error from dialog → appears in deck
- [ ] Save error from review → appears in deck
- [ ] Save corrected sentence with multiple errors → multiple cloze deletions
- [ ] Generate examples → valid sentences
- [ ] Save generated examples → practice works
- [ ] Create deck for lesson → auto-selects in future saves

### Edge Cases
- [ ] Sentence with no errors (shouldn't show save button)
- [ ] Word not in generated examples (filter out)
- [ ] Deck doesn't exist → shows create option
- [ ] Rate limit hit → shows error message

---

## Future Enhancements (Epic 10+)

1. **Bulk save**: Select multiple errors/vocab → save all at once
2. **Smart suggestions**: AI suggests which errors to save based on frequency
3. **Progress tracking**: Show "X errors practiced, Y remaining"
4. **Shared decks**: Share lesson decks with other learners
5. **AI card generation**: "Generate 10 cards about this topic"
6. **Contextual hints**: Show where error occurred in conversation

---

## Dependencies

**Completed (Epic 8)**:
- ✅ Flashcard system with 4 card types
- ✅ Cloze parsing and rendering
- ✅ FlashcardSaver component
- ✅ Practice mode with SRS

**Required for Epic 9**:
- Access to textTitle/textId in tutor components
- OpenAI API for example generation
- Rate limiting for generation endpoint

**Nice to Have**:
- Analytics/metrics tracking
- Source field in database

---

## Notes

**Why This Matters**:
- Spaced repetition only works if cards are created
- Friction = fewer cards = less learning
- Errors are the best learning opportunities
- Context-aware saves = better organization

**Design Philosophy**:
"Make it so easy to save flashcards that NOT saving feels like extra work."

---

*Epic Created*: 2025-10-31
*Target Completion*: 4 days
*Status*: 📋 Ready for Implementation
