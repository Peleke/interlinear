# Story 3.2: Definition Sidebar Component

## Story
**As a** user
**I want to** see word definitions in a sidebar when I click a word
**So that** I can understand Spanish vocabulary without leaving the reading interface

## Priority
**P0 - Day 1 PM, Hour 9**

## Acceptance Criteria
- [ ] Sidebar appears on right side of reading panel
- [ ] Shows word, part of speech, definitions
- [ ] Displays pronunciation if available
- [ ] Shows loading state while fetching
- [ ] Shows error state for failed lookups
- [ ] Shows spelling suggestions for misspelled words
- [ ] Close button to dismiss sidebar
- [ ] Smooth slide-in animation
- [ ] Mobile: slides up from bottom

## Technical Details

### Implementation (`components/reader/DefinitionSidebar.tsx`)

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { DictionaryResponse } from '@/types'

interface DefinitionSidebarProps {
  word: string | null
  onClose: () => void
}

export function DefinitionSidebar({ word, onClose }: DefinitionSidebarProps) {
  const [data, setData] = useState<DictionaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!word) {
      setData(null)
      setError(null)
      return
    }

    const fetchDefinition = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/dictionary/${encodeURIComponent(word)}`)

        if (!response.ok) {
          throw new Error('Failed to fetch definition')
        }

        const result: DictionaryResponse = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchDefinition()
  }, [word])

  if (!word) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`
          fixed z-50 bg-white shadow-2xl
          lg:relative lg:shadow-lg

          /* Mobile: bottom drawer */
          bottom-0 left-0 right-0 rounded-t-2xl
          max-h-[80vh] lg:max-h-none

          /* Desktop: right sidebar */
          lg:top-0 lg:bottom-0 lg:right-0 lg:left-auto
          lg:w-96 lg:rounded-none

          /* Animation */
          transform transition-transform duration-300
          ${word ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-x-full'}

          overflow-y-auto
        `}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-sepia-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-serif text-sepia-900">Definition</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-sepia-100 rounded-md transition-colors"
            aria-label="Close definition"
          >
            <svg className="w-5 h-5 text-sepia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sepia-700" />
              <span className="ml-3 text-sepia-600">Loading definition...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-medium">Error loading definition</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && data && !data.found && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 font-medium">Word not found: "{word}"</p>
              </div>

              {data.suggestions && data.suggestions.length > 0 && (
                <div>
                  <p className="text-sm text-sepia-600 mb-2">Did you mean:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        className="px-3 py-1 bg-sepia-100 hover:bg-sepia-200 text-sepia-800 rounded-md text-sm transition-colors"
                        onClick={() => {/* TODO: handle suggestion click */}}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !error && data && data.found && (
            <div className="space-y-6">
              {/* Word Header */}
              <div>
                <h3 className="text-3xl font-serif text-sepia-900 mb-2">{data.word}</h3>

                {/* Pronunciation */}
                {data.pronunciations && data.pronunciations.length > 0 && (
                  <div className="flex items-center gap-3 text-sepia-600">
                    <span className="text-sm font-mono">{data.pronunciations[0].text}</span>
                    {data.pronunciations[0].audio && (
                      <button
                        className="p-1 hover:bg-sepia-100 rounded transition-colors"
                        onClick={() => {
                          const audio = new Audio(data.pronunciations![0].audio!)
                          audio.play()
                        }}
                        aria-label="Play pronunciation"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Definitions */}
              {data.definitions && data.definitions.map((def, idx) => (
                <div key={idx}>
                  <div className="text-xs uppercase tracking-wide text-sepia-500 mb-2">
                    {def.partOfSpeech}
                  </div>
                  <ol className="list-decimal list-inside space-y-2">
                    {def.meanings.map((meaning, mIdx) => (
                      <li key={mIdx} className="text-sepia-800 leading-relaxed">
                        {meaning}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
```

### Layout Integration (`components/reader/TextRenderPanel.tsx`)

```typescript
'use client'

import { useState, useMemo } from 'react'
import { tokenizeText } from '@/lib/tokenize'
import { ClickableWord } from './ClickableWord'
import { DefinitionSidebar } from './DefinitionSidebar'
import type { Token } from '@/types'

export function TextRenderPanel({ text, onEditClick }: TextRenderPanelProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [lookupWord, setLookupWord] = useState<string | null>(null)
  const tokens = useMemo(() => tokenizeText(text), [text])

  const handleWordClick = (token: Token) => {
    setSelectedTokenId(token.id === selectedTokenId ? null : token.id)
    setLookupWord(token.cleanText)
  }

  return (
    <div className="flex gap-6">
      {/* Main Reading Panel */}
      <div className="flex-1">
        {/* ... existing render panel content ... */}
      </div>

      {/* Definition Sidebar */}
      <DefinitionSidebar
        word={lookupWord}
        onClose={() => {
          setLookupWord(null)
          setSelectedTokenId(null)
        }}
      />
    </div>
  )
}
```

### Visual States

1. **Hidden**: `translate-x-full` (desktop) / `translate-y-full` (mobile)
2. **Loading**: Spinner + loading message
3. **Error**: Red alert with error message
4. **Not Found**: Amber alert + spelling suggestions
5. **Success**: Word header + pronunciations + definitions

### Responsive Design

**Desktop (lg+):**
- Fixed right sidebar (w-96)
- Slides in from right
- No backdrop

**Mobile (<lg):**
- Bottom drawer (80vh max height)
- Slides up from bottom
- Dark backdrop overlay
- Rounded top corners

### Accessibility

- Close button with `aria-label`
- Pronunciation button with `aria-label`
- Keyboard navigation support
- Focus management on open/close
- Screen reader announcements for loading/error states

## Architecture References
- `/docs/architecture/components.md` - DefinitionSidebar spec
- `/docs/prd/design-system.md` - Sidebar styling
- `/docs/prd/user-stories.md` - US-301

## Definition of Done
- [ ] Sidebar component created
- [ ] Fetches from API route on word click
- [ ] Shows loading/error/success states
- [ ] Displays pronunciations with audio playback
- [ ] Shows spelling suggestions
- [ ] Smooth animations (300ms)
- [ ] Responsive (desktop + mobile)
- [ ] Accessible
- [ ] TypeScript fully typed
