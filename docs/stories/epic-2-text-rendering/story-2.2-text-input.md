# Story 2.2: Text Input Component

## Story
**As a** user
**I want to** paste Spanish text into a textarea
**So that** I can prepare it for interactive reading

## Priority
**P0 - Day 1 PM, Hour 5**

## Acceptance Criteria
- [ ] Large textarea for text input
- [ ] Placeholder text guides user
- [ ] Character/word count displayed
- [ ] "Render Text" button enabled when text present
- [ ] Soft limit warning at 2,000 words
- [ ] Text persists in session storage
- [ ] Accessible labels and ARIA attributes

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
- [ ] Textarea accepts Spanish text
- [ ] Word/char count displays accurately
- [ ] Warning appears > 2000 words
- [ ] Text persists in session storage
- [ ] Render button disabled when empty
- [ ] Accessible (screen readers work)
- [ ] Styled per design system
