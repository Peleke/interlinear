# Story 2.1: Reader Page Layout & Mode Switcher

## Story
**As a** developer
**I want to** create the reader page layout with mode switching
**So that** users can toggle between input, render, and vocabulary modes

## Priority
**P0 - Day 1 PM, Hour 5**

## Acceptance Criteria
- [ ] Reader page at `/reader` (protected route)
- [ ] Mode state managed (input/render/vocabulary)
- [ ] Mode switcher UI (tabs or buttons)
- [ ] Layout adapts based on current mode
- [ ] Server Component for layout, Client Component for interactive parts
- [ ] Smooth transitions between modes

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
- [ ] Reader page accessible at `/reader`
- [ ] Mode switching works smoothly
- [ ] UI matches design system (serif fonts, warm colors)
- [ ] Transitions are smooth (200-300ms)
- [ ] TypeScript fully typed
- [ ] No console errors
