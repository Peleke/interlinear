# Story 6.2: Accessibility Audit

## Summary
Add missing ARIA labels and ensure keyboard navigation works.

## Status: PARTIAL ✅
Some ARIA labels already exist (ClickableWord, buttons)

## What to Add

### ARIA Labels Needed
```typescript
// TextInputPanel
<textarea aria-label="Text input for reading" />

// AudioPlayer
<button aria-label="Play audio narration" />
<button aria-label="Pause audio" />

// VocabularyList
<input aria-label="Search vocabulary" />
<select aria-label="Sort vocabulary by" />

// VocabularyCard (already has some)
✅ aria-label="Delete word"
✅ aria-pressed for expanded state
```

### Keyboard Navigation Test
```bash
Tab navigation:
- [ ] Login form (email → password → submit)
- [ ] Reader tabs (Input → Read → Vocabulary)
- [ ] Clickable words (already has onKeyDown ✅)
- [ ] Definition sidebar close (Escape ✅)
- [ ] Vocabulary search → sort → cards

Focus visible:
- [ ] All interactive elements have focus ring
- [ ] Tab order is logical
```

### Screen Reader Test (Optional)
- Page titles meaningful
- Form labels associated
- Error messages announced

## Implementation

### Quick Wins
```typescript
// Add to forms
<label htmlFor="email">Email</label>
<input id="email" aria-required="true" />

// Add to buttons without text
<button aria-label="Description">
  <IconComponent />
</button>

// Add to interactive elements
<div role="button" tabIndex={0} aria-label="Action" />
```

## Expected Effort
⚡ **45 minutes** - Add labels, test keyboard nav
