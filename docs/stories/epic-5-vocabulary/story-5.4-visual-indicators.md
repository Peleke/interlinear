# Story 5.4: Visual Indicators for Saved Words

## Story
**As a** user
**I want** to see which words I've already saved
**So that** I can track my learning progress at a glance

## Priority
**P1 - Day 2 PM, Hour 7 (Optional Polish)**

## Acceptance Criteria
- [ ] Saved words have visual indicator (dotted underline)
- [ ] Indicator persists across sessions
- [ ] Different styling from selected words (gold highlight)
- [ ] Indicator shows in both reading panel and sidebar
- [ ] Click count visible on hover (tooltip)
- [ ] Smooth animation when word is first saved
- [ ] Accessible (ARIA labels, keyboard navigation)

## Technical Details

### Visual Hierarchy

**Design Tokens**:
```typescript
// Already defined in tailwind.config.ts
colors: {
  gold: {
    DEFAULT: '#D4A574',  // Links, accents
    100: '#FEF3C7',      // Sentence highlight (TTS)
    200: '#F4E4C1',      // Word selection (clicked)
  },
  sepia: {
    400: '#B8A88F',      // Saved word underline
    700: '#574634',      // Saved word text
  }
}
```

**Visual States**:
1. **Default word**: `text-sepia-800` (dark gray)
2. **Saved word** (not selected): `text-sepia-700 border-b-2 border-dotted border-sepia-400`
3. **Selected word**: `bg-gold-200 text-sepia-900 font-semibold shadow-sm`
4. **Playing sentence**: `bg-gold-100` (parent span)

### Updated ClickableWord Component

**File**: `components/reader/ClickableWord.tsx`

Already implemented with `isSaved` prop! Just needs persistence from TextRenderPanel.

Current implementation:
```typescript
className={`
  inline-block transition-all duration-150
  ${disabled ? 'cursor-default' : 'cursor-pointer hover:bg-sepia-100 hover:scale-105'}
  ${
    isSelected
      ? 'bg-gold-200 text-sepia-900 font-semibold shadow-sm'
      : isSaved
      ? 'text-sepia-700 border-b-2 border-dotted border-sepia-400'
      : 'text-sepia-800'
  }
  px-0.5 rounded
`}
```

### Tooltip for Click Count (Optional Enhancement)

**File**: `components/reader/ClickableWord.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Token } from '@/types'

interface ClickableWordProps {
  token: Token
  isSelected: boolean
  isSaved: boolean
  clickCount?: number // New prop
  onClick: (token: Token) => void
  disabled?: boolean
}

export function ClickableWord({
  token,
  isSelected,
  isSaved,
  clickCount,
  onClick,
  disabled = false,
}: ClickableWordProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!token.isWord) {
    return <span>{token.text}</span>
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => isSaved && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        id={token.id}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && onClick(token)}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick(token)
          }
        }}
        className={`
          inline-block transition-all duration-150
          ${disabled ? 'cursor-default' : 'cursor-pointer hover:bg-sepia-100 hover:scale-105'}
          ${
            isSelected
              ? 'bg-gold-200 text-sepia-900 font-semibold shadow-sm'
              : isSaved
              ? 'text-sepia-700 border-b-2 border-dotted border-sepia-400'
              : 'text-sepia-800'
          }
          px-0.5 rounded
        `}
        aria-label={`Word: ${token.cleanText}${isSaved ? ` (saved ${clickCount || 1} ${clickCount === 1 ? 'time' : 'times'})` : ''}`}
        aria-pressed={isSelected}
        aria-disabled={disabled}
      >
        {token.text}
      </span>

      {/* Tooltip */}
      {showTooltip && isSaved && clickCount && (
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-sepia-800 text-white text-xs rounded whitespace-nowrap z-10">
          Saved {clickCount} {clickCount === 1 ? 'time' : 'times'}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-sepia-800" />
        </span>
      )}
    </span>
  )
}
```

### Enhanced TextRenderPanel with Click Counts

**File**: `components/reader/TextRenderPanel.tsx`

```typescript
export function TextRenderPanel({ text, onEditClick }: TextRenderPanelProps) {
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [clickCounts, setClickCounts] = useState<Map<string, number>>(new Map())

  // Load saved words and click counts
  useEffect(() => {
    loadSavedWords()
  }, [])

  const loadSavedWords = async () => {
    try {
      const entries = await VocabularyService.getAll()
      const wordSet = new Set(entries.map(e => e.word))
      const counts = new Map(entries.map(e => [e.word, e.click_count]))

      setSavedWords(wordSet)
      setClickCounts(counts)
    } catch (error) {
      console.error('Failed to load saved words:', error)
    }
  }

  // Update click count after saving
  const saveWordToVocabulary = async (word: string) => {
    const normalizedWord = word.toLowerCase()

    // Optimistic update
    setSavedWords(prev => new Set([...prev, normalizedWord]))

    try {
      const entry = await VocabularyService.saveWord(normalizedWord, currentDefinition || undefined)

      // Update click count
      setClickCounts(prev => new Map(prev).set(normalizedWord, entry.click_count))
    } catch (error) {
      // Rollback on error
      setSavedWords(prev => {
        const next = new Set(prev)
        next.delete(normalizedWord)
        return next
      })

      console.error('Failed to save word:', error)
    }
  }

  // Render with click counts
  return (
    <div className="text-lg font-serif text-ink leading-relaxed space-y-2">
      {Object.entries(sentenceGroups).map(([sentenceId, sentenceTokens]) => (
        <span
          key={sentenceId}
          data-sentence-id={sentenceId}
          className={`inline-block transition-all duration-300 ${
            activeSentenceId === parseInt(sentenceId)
              ? 'bg-gold-100 px-2 py-1 rounded shadow-sm'
              : ''
          }`}
        >
          {sentenceTokens.map((token) => (
            <ClickableWord
              key={token.id}
              token={token}
              isSelected={token.id === selectedTokenId}
              isSaved={savedWords.has(token.cleanText)}
              clickCount={clickCounts.get(token.cleanText)}
              onClick={handleWordClick}
              disabled={isPlaying}
            />
          ))}
        </span>
      ))}
    </div>
  )
}
```

### Save Animation

Add subtle pulse animation when word is first saved:

**File**: `tailwind.config.ts`

```typescript
theme: {
  extend: {
    animation: {
      'pulse-once': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1)',
    }
  }
}
```

**Usage**:
```typescript
const [justSavedWords, setJustSavedWords] = useState<Set<string>>(new Set())

const saveWordToVocabulary = async (word: string) => {
  const normalizedWord = word.toLowerCase()
  const wasNew = !savedWords.has(normalizedWord)

  // ... save logic

  if (wasNew) {
    // Trigger animation
    setJustSavedWords(prev => new Set(prev).add(normalizedWord))

    // Remove after animation completes
    setTimeout(() => {
      setJustSavedWords(prev => {
        const next = new Set(prev)
        next.delete(normalizedWord)
        return next
      })
    }, 500)
  }
}

// In ClickableWord:
className={`
  ${justSaved ? 'animate-pulse-once' : ''}
  ...
`}
```

## Accessibility Enhancements

### ARIA Labels
Already implemented in ClickableWord:
```typescript
aria-label={`Word: ${token.cleanText}${isSaved ? ' (saved)' : ''}`}
aria-pressed={isSelected}
aria-disabled={disabled}
```

### Keyboard Navigation
- Tab through words: Already supported via `tabIndex`
- Enter/Space to select: Already implemented
- Escape to close sidebar: Already implemented in TextRenderPanel

### Screen Reader Announcements
```typescript
// Announce save success
const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.className = 'sr-only'
  announcement.textContent = message
  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// After saving:
announceToScreenReader(`Saved word: ${word}`)
```

## Visual State Reference

| State | Text Color | Background | Border | Other |
|-------|-----------|------------|--------|-------|
| Default | sepia-800 | transparent | none | - |
| Saved | sepia-700 | transparent | dotted sepia-400 | underline |
| Selected | sepia-900 | gold-200 | none | font-semibold, shadow |
| Disabled | sepia-800 | transparent | none | cursor-default |
| Playing sentence | sepia-800 | gold-100 (parent) | none | - |

## Edge Cases

1. **Word saved while selected**: Keep selected state, add saved indicator after deselection
2. **Hover during playback**: No tooltip (words disabled)
3. **Very long tooltip**: Truncate or wrap text
4. **Tooltip overflow**: Adjust position to stay in viewport
5. **Rapid saves**: Debounce animation to prevent flicker

## Architecture References
- `/docs/architecture/design-system.md` - Visual design tokens
- `/docs/architecture/accessibility.md` - A11y guidelines
- `/docs/prd/user-stories.md` - US-501, US-502

## Definition of Done
- [ ] Saved words show dotted underline
- [ ] Visual styling distinct from selection
- [ ] Indicators persist across sessions
- [ ] Click count tooltip on hover (optional)
- [ ] Save animation for new words (optional)
- [ ] ARIA labels updated
- [ ] Screen reader announcements (optional)
- [ ] Keyboard navigation tested
- [ ] Responsive on mobile/desktop
- [ ] TypeScript fully typed
