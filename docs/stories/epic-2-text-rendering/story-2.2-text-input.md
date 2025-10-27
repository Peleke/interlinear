# Story 2.2: Text Input Component

## Story
**As a** user
**I want to** paste Spanish text into a textarea
**So that** I can prepare it for interactive reading

## Priority
**P0 - Day 1 PM, Hour 5**

## Acceptance Criteria
- [x] Large textarea for text input
- [x] Placeholder text guides user
- [x] Character/word count displayed
- [x] "Render Text" button enabled when text present
- [x] Soft limit warning at 2,000 words
- [x] Text persists in session storage
- [x] Accessible labels and ARIA attributes

## Technical Details

### Implementation (`components/reader/TextInputPanel.tsx`)
```typescript
'use client'

import { useEffect } from 'react'

interface TextInputPanelProps {
  text: string
  onTextChange: (text: string) => void
  onRenderClick: () => void
}

const WORD_LIMIT = 2000
const SESSION_KEY = 'interlinear_text'

export function TextInputPanel({
  text,
  onTextChange,
  onRenderClick,
}: TextInputPanelProps) {
  // Load from session storage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved && !text) {
      onTextChange(saved)
    }
  }, [])

  // Save to session storage on change
  useEffect(() => {
    if (text) {
      sessionStorage.setItem(SESSION_KEY, text)
    }
  }, [text])

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const charCount = text.length
  const isOverLimit = wordCount > WORD_LIMIT

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="text-input"
          className="block text-lg font-serif text-sepia-900 mb-2"
        >
          Paste your Spanish text here
        </label>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Pega tu texto en español aquí...

For example:
El español es un idioma hermoso y melodioso..."
          className="w-full h-96 px-4 py-3 text-lg font-serif border-2 border-sepia-300 rounded-lg focus:border-sepia-600 focus:ring-2 focus:ring-sepia-200 resize-none bg-white"
          aria-describedby="text-stats text-limit-warning"
        />
      </div>

      {/* Stats */}
      <div
        id="text-stats"
        className="flex items-center justify-between text-sm text-sepia-600"
      >
        <span>
          {wordCount} {wordCount === 1 ? 'word' : 'words'} • {charCount}{' '}
          characters
        </span>

        {isOverLimit && (
          <span
            id="text-limit-warning"
            className="text-amber-600 font-medium"
            role="alert"
          >
            ⚠️ Text is quite long ({wordCount} words). Consider shorter passages
            for better performance.
          </span>
        )}
      </div>

      {/* Render Button */}
      <button
        onClick={onRenderClick}
        disabled={!text.trim()}
        className="w-full py-3 px-6 bg-sepia-700 text-white font-serif text-lg rounded-lg hover:bg-sepia-800 disabled:bg-sepia-300 disabled:cursor-not-allowed transition-colors"
      >
        Render Interactive Text →
      </button>
    </div>
  )
}
```

### Session Storage Pattern
- Key: `interlinear_text`
- Saves automatically on text change
- Loads on component mount if no text
- Persists across page refreshes
- Clears on browser close (sessionStorage)

### Tasks
1. Create `components/reader/TextInputPanel.tsx`
2. Implement textarea with controlled input
3. Add word/character counting logic
4. Implement session storage persistence
5. Add 2,000 word warning
6. Style with Tailwind (parchment theme)
7. Add ARIA attributes for accessibility
8. Test with long/short text

## Architecture References
- `/docs/prd/user-stories.md` - US-201
- `/docs/architecture/coding-standards.md` - React patterns
- `/docs/prd/design-system.md` - Typography specs

## Definition of Done
- [x] Textarea accepts Spanish text
- [x] Word/char count displays accurately
- [x] Warning appears > 2000 words
- [x] Text persists in session storage
- [x] Render button disabled when empty
- [x] Accessible (screen readers work)
- [x] Styled per design system

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (20250929)

### Tasks Completed
- [x] Enhanced TextInputPanel with word/character counting
- [x] Implemented real-time word count (split by whitespace)
- [x] Implemented character count display
- [x] Added 2,000 word soft limit with warning
- [x] Implemented session storage persistence
- [x] Load saved text on component mount
- [x] Auto-save text on every change
- [x] Added ARIA attributes (aria-describedby linking to stats and warning)
- [x] Warning uses role="alert" for screen readers
- [x] Word count handles singular/plural ("1 word" vs "N words")
- [x] TypeScript validation passed
- [x] Hot reload successful

### Implementation Details

**Word Counting:**
- Split by whitespace: `text.trim().split(/\s+/)`
- Filter empty strings: `.filter(Boolean)`
- Handles multiple spaces, tabs, newlines correctly

**Character Counting:**
- Simple length: `text.length`
- Includes all characters (spaces, punctuation, accents)

**Session Storage:**
- Key: `interlinear_text`
- Load on mount: Only if no text already present
- Save on change: Auto-saves every keystroke
- Persists across page refreshes
- Clears when browser closes (sessionStorage)

**2,000 Word Warning:**
- Soft limit (not enforced, just warning)
- Shows amber-colored alert: `⚠️ Text is quite long (N words)`
- Suggests shorter passages for better performance
- Uses `role="alert"` for accessibility

**Accessibility:**
- `aria-describedby="text-stats text-limit-warning"`
- Links textarea to stats and warning
- Screen readers announce word count and warnings
- Warning has `role="alert"` for immediate announcement

**Design System:**
- Stats: text-sm text-sepia-600
- Warning: text-amber-600 font-medium
- Maintains serif fonts and warm colors
- Subtle, non-intrusive UI

### File Modified
- `components/reader/TextInputPanel.tsx` - Added counting, storage, warnings

### Session Storage Pattern
```typescript
// Load on mount
useEffect(() => {
  const saved = sessionStorage.getItem('interlinear_text')
  if (saved && !text) {
    onTextChange(saved)
  }
}, [])

// Save on change
useEffect(() => {
  if (text) {
    sessionStorage.setItem('interlinear_text', text)
  }
}, [text])
```

### Completion Notes
- Dev server hot-reloaded successfully
- TypeScript strict mode passed
- No console errors
- /reader route working with full functionality
- Ready for Story 2.3: Tokenization Engine

### Change Log
- 2025-10-25: Text input component enhanced with counting, storage, warnings

### Status
**Ready for Review**
