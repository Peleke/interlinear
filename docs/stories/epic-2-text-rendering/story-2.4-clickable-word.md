# Story 2.4: Clickable Word Component

## Story
**As a** user
**I want to** see each word as a clickable element
**So that** I can select words to get definitions

## Priority
**P0 - Day 1 PM, Hour 7**

## Acceptance Criteria
- [ ] Each word rendered as clickable span
- [ ] Hover state shows word is clickable
- [ ] Click highlights the word
- [ ] Active/selected state visually distinct
- [ ] Saved words have different visual indicator
- [ ] Smooth transitions on state changes
- [ ] Accessible (keyboard navigation, ARIA)

## Technical Details

### Implementation (`components/reader/ClickableWord.tsx`)
```typescript
'use client'

import { Token } from '@/types'

interface ClickableWordProps {
  token: Token
  isSelected: boolean
  isSaved: boolean
  onClick: (token: Token) => void
}

export function ClickableWord({
  token,
  isSelected,
  isSaved,
  onClick,
}: ClickableWordProps) {
  // Don't make whitespace/punctuation clickable
  if (!token.isWord) {
    return <span>{token.text}</span>
  }

  return (
    <span
      id={token.id}
      role="button"
      tabIndex={0}
      onClick={() => onClick(token)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(token)
        }
      }}
      className={`
        inline-block cursor-pointer transition-all duration-150
        hover:bg-sepia-100 hover:scale-105
        ${
          isSelected
            ? 'bg-gold-200 text-sepia-900 font-semibold shadow-sm'
            : isSaved
            ? 'text-sepia-700 border-b-2 border-dotted border-sepia-400'
            : 'text-sepia-800'
        }
        px-0.5 rounded
      `}
      aria-label={`Word: ${token.cleanText}${isSaved ? ' (saved)' : ''}`}
      aria-pressed={isSelected}
    >
      {token.text}
    </span>
  )
}
```

### Visual States
1. **Default:** Dark sepia text, subtle hover
2. **Hover:** Light sepia background, slight scale
3. **Selected:** Gold background, bold font, shadow
4. **Saved:** Dotted underline, darker text

### Design System Colors (from `/docs/prd/design-system.md`)
```css
--sepia-100: #faf8f3
--sepia-400: #d4c5a9
--sepia-700: #6b5d4f
--sepia-800: #504437
--sepia-900: #3d3429
--gold-200: #f4e4c1
```

### Accessibility Features
- `role="button"` for screen readers
- `tabIndex={0}` for keyboard focus
- `onKeyDown` for Enter/Space activation
- `aria-label` with word and saved status
- `aria-pressed` for selection state
- Focus visible with default browser outline

### Tasks
1. Create `components/reader/ClickableWord.tsx`
2. Implement token prop interface
3. Add click handler with keyboard support
4. Style different states (default, hover, selected, saved)
5. Add smooth transitions
6. Implement ARIA attributes
7. Test keyboard navigation
8. Test with screen reader

## Architecture References
- `/docs/architecture/components.md` - ClickableWord spec
- `/docs/prd/design-system.md` - Color palette
- `/docs/prd/user-stories.md` - US-202
- `/docs/architecture/coding-standards.md` - Accessibility rules

## Definition of Done
- [ ] Words are clickable
- [ ] Hover state works
- [ ] Selected state visually distinct
- [ ] Saved words show indicator
- [ ] Keyboard accessible (Tab, Enter, Space)
- [ ] Screen reader friendly
- [ ] Transitions smooth (150ms)
- [ ] TypeScript fully typed
