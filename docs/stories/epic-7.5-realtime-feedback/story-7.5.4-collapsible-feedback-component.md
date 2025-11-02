# Story 7.5.4: Collapsible Feedback Component

**Epic**: 7.5 - Real-Time Tutor Feedback
**Status**: ✅ Completed
**Priority**: P0
**Estimated Effort**: 2 hours
**Dependencies**: Story 7.5.3 (Per-Turn Correction API)

---

## User Story

**As a** language learner
**I want to** see corrections below my messages in a subtle, collapsible way
**So that** I get feedback without disrupting my conversation flow

---

## Acceptance Criteria

- [ ] Corrections appear immediately below user messages
- [ ] Component is collapsed by default (subtle presence)
- [ ] Click to expand shows full correction details
- [ ] Positive feedback (😊) shown when no errors
- [ ] Error count badge visible when collapsed
- [ ] Color-coded by severity (green/yellow/red)
- [ ] Smooth expand/collapse animation
- [ ] Mobile responsive layout
- [ ] Accessible (keyboard navigation, screen readers)

---

## Technical Specification

### Component Structure

**File**: `components/tutor/MessageCorrection.tsx`

```typescript
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { TurnCorrection } from '@/types/tutor'

interface MessageCorrectionProps {
  correction: TurnCorrection
  isUserMessage: boolean
}

export function MessageCorrection({
  correction,
  isUserMessage
}: MessageCorrectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isUserMessage) return null

  const { hasErrors, correctedText, errors } = correction

  // No errors - show positive feedback
  if (!hasErrors) {
    return (
      <div className="flex items-center gap-2 mt-1 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>😊 ¡Perfecto!</span>
      </div>
    )
  }

  // Has errors - show collapsible correction
  return (
    <Card className="mt-2 border-l-4 border-l-yellow-500 bg-yellow-50/50">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-yellow-100/50 transition-colors"
        aria-expanded={isExpanded}
        aria-label={`${errors.length} correction${errors.length > 1 ? 's' : ''} available`}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            {errors.length} correction{errors.length > 1 ? 's' : ''}
          </span>
          <Badge variant="outline" className="text-xs">
            Click to review
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-yellow-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-yellow-600" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-2">
          {/* Corrected Version */}
          <div className="pt-2 border-t border-yellow-200">
            <p className="text-xs font-medium text-yellow-800 mb-1">
              Corrected:
            </p>
            <p className="text-sm text-gray-700 italic">
              {correctedText}
            </p>
          </div>

          {/* Individual Errors */}
          <div className="space-y-2">
            {errors.map((error, idx) => (
              <ErrorDetail key={idx} error={error} />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// Individual Error Display
function ErrorDetail({ error }: { error: ErrorDetail }) {
  const categoryColors = {
    grammar: 'bg-red-100 text-red-800 border-red-200',
    vocabulary: 'bg-blue-100 text-blue-800 border-blue-200',
    syntax: 'bg-purple-100 text-purple-800 border-purple-200'
  }

  const categoryIcons = {
    grammar: '📝',
    vocabulary: '📚',
    syntax: '🔧'
  }

  return (
    <div className={`p-2 rounded border ${categoryColors[error.category]}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{categoryIcons[error.category]}</span>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {error.category}
            </Badge>
            <span className="text-xs line-through opacity-70">
              {error.errorText}
            </span>
            <span className="text-xs">→</span>
            <span className="text-xs font-medium">
              {error.correction}
            </span>
          </div>
          <p className="text-xs leading-relaxed">
            {error.explanation}
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

## UI/UX Design

### Visual States

**Collapsed (No Errors)**
```
┌─────────────────────────────┐
│ User: Hola, ¿cómo estás?    │
│ ✓ 😊 ¡Perfecto!             │
└─────────────────────────────┘
```

**Collapsed (Has Errors)**
```
┌─────────────────────────────┐
│ User: Yo voy al tienda      │
│ ⚠️ 1 correction ▼           │
└─────────────────────────────┘
```

**Expanded (Has Errors)**
```
┌─────────────────────────────┐
│ User: Yo voy al tienda      │
│ ⚠️ 1 correction ▲           │
│ ─────────────────────────── │
│ Corrected:                  │
│ "Yo voy a la tienda"        │
│                             │
│ 📝 grammar                  │
│ al → a la                   │
│ "Tienda" is feminine,       │
│ use "la" not "el"           │
└─────────────────────────────┘
```

### Color Coding

- **Green** - No errors (positive)
- **Yellow** - Minor errors (warning)
- **Red** - Grammar errors (critical)
- **Blue** - Vocabulary errors
- **Purple** - Syntax errors

---

## Implementation Steps

1. **Create MessageCorrection Component**
   - Implement collapsed/expanded states
   - Add positive feedback variant
   - Handle error list rendering
   - Add animations

2. **Create ErrorDetail Subcomponent**
   - Category badges
   - Error → Correction display
   - Explanation text
   - Category icons

3. **Add Required UI Components** (if missing)
   ```bash
   npx shadcn-ui@latest add badge
   ```

4. **Add Animations**
   - Smooth expand/collapse
   - Fade-in for content
   - Hover states

5. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Focus management
   - Screen reader support

---

## Testing Checklist

### Unit Tests
- [ ] Renders positive feedback when no errors
- [ ] Renders collapsed state with error count
- [ ] Expands on click
- [ ] Collapses on second click
- [ ] Displays all error categories correctly
- [ ] Handles single error
- [ ] Handles multiple errors

### Integration Tests
- [ ] Integrates with DialogView message list
- [ ] Receives correction data from API
- [ ] State persists during conversation
- [ ] Animations run smoothly

### Accessibility Tests
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Screen reader announces error count
- [ ] Focus management correct
- [ ] ARIA attributes correct
- [ ] Color contrast meets WCAG AA

### Visual/Responsive Tests
- [ ] Desktop layout correct
- [ ] Mobile layout responsive
- [ ] Animations smooth on mobile
- [ ] Long error explanations wrap correctly
- [ ] Many errors scroll properly

---

## Technical Notes

### Animation Classes

Using Tailwind `animate-in` utilities:
```css
.animate-in {
  animation: enter 150ms ease-out;
}

@keyframes enter {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Mobile Considerations
- Collapse by default to save space
- Larger touch targets (min 44x44px)
- Readable font sizes (14px+)
- Proper spacing between elements

### Performance
- Memoize component if re-rendering is slow
- Lazy load error details on expand
- Limit error list to 5 (show "...and X more")

---

## Success Criteria

**Story Complete When**:
- ✅ Component renders correctly in all states
- ✅ Expand/collapse animations smooth
- ✅ Accessible to keyboard and screen readers
- ✅ Mobile responsive and touch-friendly
- ✅ Integrates seamlessly with DialogView
- ✅ All tests passing
- ✅ Code reviewed and merged

---

## Related Files

```
components/tutor/MessageCorrection.tsx  # New component
components/tutor/DialogView.tsx         # Integration point
components/ui/badge.tsx                  # UI component
components/ui/card.tsx                   # UI component
types/tutor.ts                          # TypeScript interfaces
```

---

**Created**: 2025-10-31
**Author**: James (Dev Agent)
