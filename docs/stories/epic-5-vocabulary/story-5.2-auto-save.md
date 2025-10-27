# Story 5.2: Auto-Save on Word Click

## Story
**As a** user
**I want** words to auto-save when I click them
**So that** I can build my vocabulary effortlessly

## Priority
**P0 - Day 2 PM, Hour 6**

## Acceptance Criteria
- [ ] Word auto-saves to database on click
- [ ] Click count increments on repeated clicks
- [ ] No duplicate entries (upsert behavior)
- [ ] Visual feedback on save (toast notification)
- [ ] Graceful error handling with user feedback
- [ ] Works offline (queues for later sync)
- [ ] Definition stored with vocabulary entry

## Technical Details

### Integration with ClickableWord

**File**: `components/reader/TextRenderPanel.tsx`

```typescript
'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { tokenizeText, getSentences } from '@/lib/tokenize'
import { VocabularyService } from '@/lib/vocabulary'
import { ClickableWord } from './ClickableWord'
import { DefinitionSidebar } from './DefinitionSidebar'
import { AudioPlayer } from './AudioPlayer'
import type { Token, Sentence, DictionaryResponse } from '@/types'

export function TextRenderPanel({ text, onEditClick }: TextRenderPanelProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [lookupWord, setLookupWord] = useState<string | null>(null)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [currentDefinition, setCurrentDefinition] = useState<DictionaryResponse | null>(null)

  // ... existing state

  // Load saved words on mount
  useEffect(() => {
    loadSavedWords()
  }, [])

  const loadSavedWords = async () => {
    try {
      const entries = await VocabularyService.getAll()
      const wordSet = new Set(entries.map(e => e.word))
      setSavedWords(wordSet)
    } catch (error) {
      console.error('Failed to load saved words:', error)
    }
  }

  // Handle word click with auto-save
  const handleWordClick = useCallback(async (token: Token) => {
    if (isPlaying) return

    // Toggle sidebar
    if (token.id === selectedTokenId) {
      setSelectedTokenId(null)
      setLookupWord(null)
      setCurrentDefinition(null)
      return
    }

    setSelectedTokenId(token.id)
    setLookupWord(token.cleanText)

    // Auto-save word (fire and forget - don't block UI)
    saveWordToVocabulary(token.cleanText)
  }, [selectedTokenId, isPlaying])

  const saveWordToVocabulary = async (word: string) => {
    try {
      // Save word with current definition if available
      await VocabularyService.saveWord(word, currentDefinition || undefined)

      // Update local saved words set
      setSavedWords(prev => new Set([...prev, word.toLowerCase()]))

      // Optional: Show success toast
      // toast.success(`Saved "${word}"`)
    } catch (error) {
      console.error('Failed to save word:', error)
      // Optional: Show error toast
      // toast.error('Failed to save word')
    }
  }

  // Update current definition when sidebar loads definition
  const handleDefinitionLoaded = useCallback((definition: DictionaryResponse) => {
    setCurrentDefinition(definition)

    // Update saved word with definition
    if (lookupWord) {
      VocabularyService.saveWord(lookupWord, definition).catch(console.error)
    }
  }, [lookupWord])

  // ... rest of component
}
```

### Updated DefinitionSidebar

**File**: `components/reader/DefinitionSidebar.tsx`

```typescript
interface DefinitionSidebarProps {
  word: string | null
  onClose: () => void
  onDefinitionLoaded?: (definition: DictionaryResponse) => void // New prop
}

export function DefinitionSidebar({
  word,
  onClose,
  onDefinitionLoaded
}: DefinitionSidebarProps) {
  // ... existing state

  useEffect(() => {
    if (!word) {
      setData(null)
      return
    }

    // ... existing cache check and fetch logic

    if (result.found) {
      DictionaryCache.set(word, result)
      setData(result)

      // Notify parent of loaded definition
      onDefinitionLoaded?.(result)
    }
  }, [word, onDefinitionLoaded])

  // ... rest of component
}
```

### Optimistic Updates

For better UX, update the saved words set immediately before database confirmation:

```typescript
const saveWordToVocabulary = async (word: string) => {
  const normalizedWord = word.toLowerCase()

  // Optimistic update
  setSavedWords(prev => new Set([...prev, normalizedWord]))

  try {
    await VocabularyService.saveWord(normalizedWord, currentDefinition || undefined)
  } catch (error) {
    // Rollback on error
    setSavedWords(prev => {
      const next = new Set(prev)
      next.delete(normalizedWord)
      return next
    })

    console.error('Failed to save word:', error)
    // Show error feedback
  }
}
```

### Offline Support (Optional Enhancement)

**File**: `lib/vocabulary-queue.ts`

```typescript
interface QueuedWord {
  word: string
  definition?: DictionaryResponse
  timestamp: number
}

export class VocabularyQueue {
  private static QUEUE_KEY = 'vocabulary_save_queue'

  static add(word: string, definition?: DictionaryResponse): void {
    const queue = this.getQueue()
    queue.push({
      word: word.toLowerCase(),
      definition,
      timestamp: Date.now(),
    })
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue))
  }

  static async processQueue(): Promise<void> {
    const queue = this.getQueue()
    if (queue.length === 0) return

    const failures: QueuedWord[] = []

    for (const item of queue) {
      try {
        await VocabularyService.saveWord(item.word, item.definition)
      } catch (error) {
        console.error('Failed to sync word:', item.word, error)
        failures.push(item)
      }
    }

    // Keep failures in queue for retry
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(failures))
  }

  private static getQueue(): QueuedWord[] {
    const stored = localStorage.getItem(this.QUEUE_KEY)
    return stored ? JSON.parse(stored) : []
  }

  static clear(): void {
    localStorage.removeItem(this.QUEUE_KEY)
  }
}

// Process queue on app mount and when coming online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    VocabularyQueue.processQueue()
  })
}
```

### Error Handling

```typescript
const saveWordToVocabulary = async (word: string) => {
  try {
    await VocabularyService.saveWord(word, currentDefinition || undefined)
    setSavedWords(prev => new Set([...prev, word.toLowerCase()]))
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Not authenticated')) {
        // Redirect to login or show auth modal
        console.error('User not authenticated')
      } else if (error.message.includes('network')) {
        // Queue for offline sync
        VocabularyQueue.add(word, currentDefinition || undefined)
      } else {
        // Generic error handling
        console.error('Failed to save word:', error)
      }
    }
  }
}
```

## User Feedback Patterns

### Success States
- Word already in saved words → Show dotted underline immediately
- New word saved → Subtle animation or color change
- Click count updated → No additional feedback (silent update)

### Error States
- Network error → Queue for later, show "Saved offline" badge
- Auth error → Redirect to login with return URL
- Database error → Show retry option with error message

### Visual Indicators
```typescript
// In ClickableWord component
className={`
  ${isSaved ? 'text-sepia-700 border-b-2 border-dotted border-sepia-400' : 'text-sepia-800'}
  ${justSaved ? 'animate-pulse' : ''}
`}
```

## Performance Optimization

1. **Debounce rapid clicks**: Prevent duplicate saves for double-clicks
2. **Batch updates**: Group multiple saves in single transaction
3. **Local cache**: Maintain Set of saved words in memory
4. **Lazy loading**: Load saved words only when needed

## Edge Cases

1. **Rapid clicking**: Use debounce to prevent duplicate saves
2. **Offline mode**: Queue saves for when connection restored
3. **Session expiry**: Detect auth errors and prompt re-login
4. **Definition not loaded yet**: Save word with null definition, update later
5. **Word already saved**: Increment count silently, no duplicate entry

## Architecture References
- `/docs/architecture/state-management.md` - Local state patterns
- `/docs/architecture/error-handling.md` - Error handling strategy
- `/docs/prd/user-stories.md` - US-501

## Definition of Done
- [ ] Words auto-save on click
- [ ] Click count increments correctly
- [ ] No duplicate entries in database
- [ ] Visual feedback (saved word indicator)
- [ ] Error handling with user feedback
- [ ] Offline support (queued saves)
- [ ] Definition stored with entry
- [ ] Optimistic UI updates
- [ ] TypeScript fully typed
- [ ] Performance optimized (debounce, batching)
