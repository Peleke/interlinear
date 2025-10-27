# Story 2.1: Reader Page Layout & Mode Switcher

## Story
**As a** developer
**I want to** create the reader page layout with mode switching
**So that** users can toggle between input, render, and vocabulary modes

## Priority
**P0 - Day 1 PM, Hour 5**

## Acceptance Criteria
- [x] Reader page at `/reader` (protected route)
- [x] Mode state managed (input/render/vocabulary)
- [x] Mode switcher UI (tabs or buttons)
- [x] Layout adapts based on current mode
- [x] Server Component for layout, Client Component for interactive parts
- [x] Smooth transitions between modes

## Technical Details

### Implementation (`app/reader/page.tsx` - Server Component)
```typescript
import { ReaderClient } from './reader-client'

export default async function ReaderPage() {
  // Server Component - no interactivity needed here
  return (
    <div className="min-h-screen bg-parchment">
      <ReaderClient />
    </div>
  )
}
```

### Reader Client Component (`app/reader/reader-client.tsx`)
```typescript
'use client'

import { useState } from 'react'
import { TextInputPanel } from '@/components/reader/TextInputPanel'
import { TextRenderPanel } from '@/components/reader/TextRenderPanel'
import { VocabularyPanel } from '@/components/reader/VocabularyPanel'

type Mode = 'input' | 'render' | 'vocabulary'

export function ReaderClient() {
  const [mode, setMode] = useState<Mode>('input')
  const [text, setText] = useState('')

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Mode Switcher */}
      <div className="flex gap-2 mb-6 border-b border-sepia-300">
        <button
          onClick={() => setMode('input')}
          className={`px-6 py-3 font-serif transition-colors ${
            mode === 'input'
              ? 'border-b-2 border-sepia-700 text-sepia-900'
              : 'text-sepia-600 hover:text-sepia-800'
          }`}
        >
          Input Text
        </button>
        <button
          onClick={() => setMode('render')}
          disabled={!text}
          className={`px-6 py-3 font-serif transition-colors ${
            mode === 'render'
              ? 'border-b-2 border-sepia-700 text-sepia-900'
              : 'text-sepia-600 hover:text-sepia-800 disabled:opacity-50'
          }`}
        >
          Read
        </button>
        <button
          onClick={() => setMode('vocabulary')}
          className={`px-6 py-3 font-serif transition-colors ${
            mode === 'vocabulary'
              ? 'border-b-2 border-sepia-700 text-sepia-900'
              : 'text-sepia-600 hover:text-sepia-800'
          }`}
        >
          Vocabulary
        </button>
      </div>

      {/* Content Panel */}
      <div className="transition-opacity duration-200">
        {mode === 'input' && (
          <TextInputPanel
            text={text}
            onTextChange={setText}
            onRenderClick={() => setMode('render')}
          />
        )}
        {mode === 'render' && (
          <TextRenderPanel
            text={text}
            onEditClick={() => setMode('input')}
          />
        )}
        {mode === 'vocabulary' && <VocabularyPanel />}
      </div>
    </div>
  )
}
```

### Tasks
1. Create `app/reader/page.tsx` (Server Component)
2. Create `app/reader/reader-client.tsx` (Client Component)
3. Implement mode state with useState
4. Create mode switcher UI with Tailwind
5. Add transitions between modes
6. Create placeholder components for each panel
7. Test mode switching

## Architecture References
- `/docs/architecture/frontend-architecture.md` - App Router patterns
- `/docs/architecture/components.md` - Component structure
- `/docs/prd/user-stories.md` - US-201, US-202
- `/docs/prd/design-system.md` - Parchment theme colors

## Next.js 15 Patterns Used
- Server Components for static layout
- Client Components for interactivity (`'use client'`)
- State management with React hooks
- Component composition

## Definition of Done
- [x] Reader page accessible at `/reader`
- [x] Mode switching works smoothly
- [x] UI matches design system (serif fonts, warm colors)
- [x] Transitions are smooth (200ms)
- [x] TypeScript fully typed
- [x] No console errors

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (20250929)

### Tasks Completed
- [x] Created app/reader/page.tsx (Server Component with parchment bg)
- [x] Created app/reader/reader-client.tsx (Client Component with mode state)
- [x] Implemented mode switcher UI (tab-style buttons)
- [x] Created TextInputPanel placeholder component
- [x] Created TextRenderPanel placeholder component
- [x] Created VocabularyPanel placeholder component
- [x] Mode state managed with useState (input/render/vocabulary)
- [x] Layout conditionally renders based on current mode
- [x] Read button disabled when no text present
- [x] Smooth transitions (duration-200 opacity)
- [x] TypeScript type checking passed
- [x] Dev server compiled successfully

### File List
- `app/reader/page.tsx` - Server Component wrapper
- `app/reader/reader-client.tsx` - Client Component with mode switcher
- `components/reader/TextInputPanel.tsx` - Text input interface placeholder
- `components/reader/TextRenderPanel.tsx` - Render mode placeholder
- `components/reader/VocabularyPanel.tsx` - Vocabulary mode placeholder

### Implementation Details

**Mode Switcher:**
- Tab-style buttons with border-b-2 for active state
- Sepia color scheme (700 for active, 600/800 for hover)
- "Read" button disabled when text is empty
- Smooth transitions with Tailwind duration-200

**Component Architecture:**
- Server Component (page.tsx) - Static parchment background wrapper
- Client Component (reader-client.tsx) - Interactive mode switching
- Panel components - Modular, swappable based on mode
- Props passed: text, onTextChange, mode switching callbacks

**Design System Consistency:**
- font-serif for headings and buttons
- Parchment background (#F9F6F0)
- Sepia text colors (600, 700, 800, 900)
- Rounded corners (rounded-lg, rounded-md)
- Hover states on interactive elements

### Next Steps
Story 2.1 complete - provides foundation for:
- Story 2.2: Full TextInputPanel implementation (word count, session storage)
- Story 2.3: Tokenization engine
- Story 2.4: Clickable word components
- Story 2.5: Already implemented (mode switcher integrated in 2.1)

### Completion Notes
- Dev server running successfully at http://localhost:3000
- /reader route now accessible (protected by middleware)
- TypeScript strict mode validation passed
- No console errors
- Ready for Story 2.2

### Change Log
- 2025-10-25: Reader layout and mode switcher implemented

### Status
**Ready for Review**
