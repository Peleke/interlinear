# Story 2.5: Text Render Panel

## Story
**As a** user
**I want to** see my pasted text rendered as clickable words
**So that** I can start interacting with the text

## Priority
**P0 - Day 1 PM, Hour 7**

## Acceptance Criteria
- [ ] Text rendered with clickable words
- [ ] Layout preserves original spacing
- [ ] "Edit Text" button returns to input mode
- [ ] Reading area has comfortable width/padding
- [ ] Typography matches manuscript theme
- [ ] Smooth transition from input mode
- [ ] Performance: handles 2000+ words without lag

## Technical Details

### Implementation (`components/reader/TextRenderPanel.tsx`)
```typescript
'use client'

import { useState, useMemo } from 'react'
import { tokenizeText } from '@/lib/tokenize'
import { ClickableWord } from './ClickableWord'
import { Token } from '@/types'

interface TextRenderPanelProps {
  text: string
  onEditClick: () => void
}

export function TextRenderPanel({ text, onEditClick }: TextRenderPanelProps) {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())

  // Memoize tokenization to avoid re-computing on every render
  const tokens = useMemo(() => tokenizeText(text), [text])

  const handleWordClick = (token: Token) => {
    setSelectedToken(token)
    // TODO: Open definition sidebar (Story 3.2)
    // TODO: Save to vocabulary (Story 5.2)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif text-sepia-900">
          Interactive Reading
        </h2>
        <button
          onClick={onEditClick}
          className="px-4 py-2 text-sm font-serif text-sepia-700 border border-sepia-300 rounded hover:bg-sepia-50 transition-colors"
        >
          ← Edit Text
        </button>
      </div>

      {/* Reading Area */}
      <div
        className="
          bg-white p-8 rounded-lg shadow-sm border border-sepia-200
          max-w-4xl mx-auto
          text-lg leading-relaxed font-serif
        "
        style={{ lineHeight: 1.8 }}
      >
        {tokens.map((token) => (
          <ClickableWord
            key={token.id}
            token={token}
            isSelected={selectedToken?.id === token.id}
            isSaved={savedWords.has(token.cleanText)}
            onClick={handleWordClick}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="text-center text-sm text-sepia-600">
        {tokens.filter((t) => t.isWord).length} words •{' '}
        {Math.max(...tokens.map((t) => t.sentenceId)) + 1} sentences
      </div>
    </div>
  )
}
```

### Typography Specs (from PRD)
- **Font:** Serif (Merriweather or Georgia fallback)
- **Size:** 18-20px (text-lg in Tailwind)
- **Line height:** 1.6-1.8 (leading-relaxed)
- **Max width:** 65-75 characters (max-w-4xl)
- **Padding:** Generous (p-8)
- **Background:** White on parchment

### Performance Optimization
```typescript
// useMemo prevents re-tokenizing on every render
const tokens = useMemo(() => tokenizeText(text), [text])

// Only tokenize when text changes
// Handles 2000+ words efficiently (<50ms)
```

### Tasks
1. Create `components/reader/TextRenderPanel.tsx`
2. Import tokenization utility
3. Memoize token generation
4. Map tokens to ClickableWord components
5. Implement selected state management
6. Add "Edit Text" button
7. Style reading area (max-width, padding, typography)
8. Add word/sentence stats display
9. Test with long passages (performance)
10. Test transitions from input mode

## Architecture References
- `/docs/architecture/components.md` - Component specs
- `/docs/prd/design-system.md` - Typography guidelines
- `/docs/prd/user-stories.md` - US-202
- `/docs/architecture/frontend-architecture.md` - Performance patterns

## Definition of Done
- [ ] Text renders as clickable words
- [ ] Word selection works
- [ ] Edit button returns to input mode
- [ ] Typography matches design system
- [ ] Reading area comfortable width
- [ ] Performance: no lag with 2000 words
- [ ] Transitions smooth
- [ ] TypeScript fully typed
