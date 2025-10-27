# Story 3.3: Click Handler & State Integration

## Story
**As a** user
**I want** clicking a word to trigger dictionary lookup automatically
**So that** I get instant definitions without extra steps

## Priority
**P0 - Day 1 PM, Hour 9**

## Acceptance Criteria
- [ ] Click word → sidebar opens with loading state
- [ ] Word highlights while definition loads
- [ ] Click same word → sidebar closes
- [ ] Click different word → switch to new definition
- [ ] Keyboard navigation works (Tab + Enter)
- [ ] State management for selected word + lookup
- [ ] No double-fetching on rapid clicks

## Technical Details

### State Management Strategy

**Local State (TextRenderPanel):**
```typescript
const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
const [lookupWord, setLookupWord] = useState<string | null>(null)
```

**Why separate states:**
- `selectedTokenId`: Visual highlight (immediate)
- `lookupWord`: Dictionary fetch (async)
- Allows click to highlight instantly while fetch runs

### Implementation (`components/reader/TextRenderPanel.tsx`)

```typescript
'use client'

import { useState, useMemo, useCallback } from 'react'
import { tokenizeText } from '@/lib/tokenize'
import { ClickableWord } from './ClickableWord'
import { DefinitionSidebar } from './DefinitionSidebar'
import type { Token } from '@/types'

interface TextRenderPanelProps {
  text: string
  onEditClick: () => void
}

export function TextRenderPanel({ text, onEditClick }: TextRenderPanelProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [lookupWord, setLookupWord] = useState<string | null>(null)
  const [savedWords] = useState<Set<string>>(new Set())

  // Tokenize text once when text changes
  const tokens = useMemo(() => tokenizeText(text), [text])

  // Handle word click with debouncing
  const handleWordClick = useCallback((token: Token) => {
    // If clicking same word, close sidebar
    if (token.id === selectedTokenId) {
      setSelectedTokenId(null)
      setLookupWord(null)
      return
    }

    // Otherwise, select new word and trigger lookup
    setSelectedTokenId(token.id)
    setLookupWord(token.cleanText)
  }, [selectedTokenId])

  // Handle sidebar close
  const handleSidebarClose = useCallback(() => {
    setSelectedTokenId(null)
    setLookupWord(null)
  }, [])

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 lg:mb-0 lg:absolute lg:top-0 lg:left-0 lg:right-0">
        <h2 className="text-2xl font-serif text-sepia-900">Interactive Reading</h2>
        <button
          onClick={onEditClick}
          className="px-4 py-2 text-sepia-700 border border-sepia-700 rounded-md hover:bg-sepia-50 transition-colors"
        >
          ← Edit Text
        </button>
      </div>

      {/* Main Reading Panel */}
      <div className={`flex-1 transition-all duration-300 ${lookupWord ? 'lg:mr-96' : ''}`}>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-sepia-200 min-h-96 mt-16 lg:mt-0">
          <p className="text-lg font-serif text-ink leading-relaxed">
            {tokens.map((token) => (
              <ClickableWord
                key={token.id}
                token={token}
                isSelected={token.id === selectedTokenId}
                isSaved={savedWords.has(token.cleanText)}
                onClick={handleWordClick}
              />
            ))}
          </p>
        </div>
      </div>

      {/* Definition Sidebar */}
      <DefinitionSidebar
        word={lookupWord}
        onClose={handleSidebarClose}
      />
    </div>
  )
}
```

### Click Flow

```
1. User clicks word "hola"
   ↓
2. handleWordClick(token)
   ↓
3. Check: same word? → close sidebar
   OR new word? → continue
   ↓
4. setSelectedTokenId(token.id) → highlight word (gold background)
   ↓
5. setLookupWord(token.cleanText) → trigger fetch
   ↓
6. DefinitionSidebar useEffect detects word change
   ↓
7. Sidebar shows loading spinner
   ↓
8. fetch('/api/dictionary/hola')
   ↓
9. Response arrives → sidebar shows definition
```

### Debouncing (Prevent Double-Fetch)

**Problem**: Rapid clicks could trigger multiple fetches

**Solution**: `useCallback` with `selectedTokenId` dependency
- Click same word → early return (no fetch)
- Click new word → cancel previous, start new fetch

### Sidebar State Management (`DefinitionSidebar.tsx`)

```typescript
useEffect(() => {
  if (!word) {
    setData(null)
    setError(null)
    return
  }

  // Create AbortController for fetch cancellation
  const controller = new AbortController()

  const fetchDefinition = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/dictionary/${encodeURIComponent(word)}`,
        { signal: controller.signal }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch definition')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      // Ignore abort errors (user clicked another word)
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  fetchDefinition()

  // Cleanup: abort fetch if word changes before response
  return () => controller.abort()
}, [word])
```

### Layout Adjustment

**Desktop:**
- Sidebar open → main panel width adjusts (`lg:mr-96`)
- Smooth transition (300ms)
- No layout shift

**Mobile:**
- Sidebar overlays main panel
- No layout adjustment needed
- Backdrop dims main content

### Keyboard Interaction

**Enhanced ClickableWord:**
```typescript
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    onClick(token)
  }
  // Escape key to close sidebar (if selected)
  if (e.key === 'Escape' && isSelected) {
    onClick(token) // Toggle off
  }
}}
```

**Global Escape Handler:**
```typescript
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && lookupWord) {
      handleSidebarClose()
    }
  }

  window.addEventListener('keydown', handleEscape)
  return () => window.removeEventListener('keydown', handleEscape)
}, [lookupWord, handleSidebarClose])
```

### Performance Optimization

1. **useMemo** for tokenization (don't re-tokenize on state changes)
2. **useCallback** for handlers (prevent unnecessary re-renders)
3. **AbortController** for fetch cancellation
4. **Conditional rendering** (only render sidebar when needed)

## Architecture References
- `/docs/architecture/frontend-architecture.md` - State management
- `/docs/prd/user-stories.md` - US-301

## Definition of Done
- [ ] Click word triggers lookup
- [ ] Click same word closes sidebar
- [ ] Click different word switches definition
- [ ] Keyboard navigation works
- [ ] No double-fetching
- [ ] Smooth layout transitions
- [ ] Escape key closes sidebar
- [ ] TypeScript fully typed
