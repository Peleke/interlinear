# Story 7.5.1: Fix Error Playback Highlighting Bug

**Epic**: 7.5 - Real-Time Tutor Feedback
**Status**: ✅ Completed
**Priority**: P0 (BLOCKER)
**Estimated Effort**: 1 hour
**Dependencies**: None

---

## User Story

**As a** language learner
**I want to** see my errors highlighted in the conversation transcript
**So that** I can easily identify what mistakes I made

---

## Acceptance Criteria

- [ ] After ending dialog, errors are visibly highlighted with underlines
- [ ] Error text matches exactly with message content
- [ ] Clicking highlighted error shows tooltip with details
- [ ] All error types (grammar, vocab, syntax) are highlighted
- [ ] CSS styling renders correctly in all browsers
- [ ] No console errors or React warnings

---

## Current Bug

**Symptom**: After clicking "Terminar Dialog", UI says "Found 5 errors to review" but no text is underlined/highlighted.

**Component**: `components/tutor/ErrorPlayback.tsx` (lines 54-62)

**Suspected Causes**:
1. `highlightErrors()` function not working correctly
2. `dangerouslySetInnerHTML` not rendering `<mark>` tags
3. Error text from API doesn't match message content exactly
4. CSS not loading for `.bg-red-100.border-b-2.border-red-500`

---

## Technical Specification

### Debug Steps

1. **Console Log Error Data**
   ```typescript
   console.log('Errors received:', errors)
   console.log('Message content:', message.content)
   console.log('Highlighted HTML:', highlightedContent)
   ```

2. **Test `highlightErrors()` Function**
   ```typescript
   function highlightErrors(content: string, errors: Error[]): string {
     let highlighted = content

     // Sort errors by position (longest first to avoid nested replacements)
     const sortedErrors = errors.sort((a, b) =>
       b.errorText.length - a.errorText.length
     )

     for (const error of sortedErrors) {
       const regex = new RegExp(escapeRegex(error.errorText), 'g')
       highlighted = highlighted.replace(
         regex,
         `<mark class="bg-red-100 border-b-2 border-red-500 cursor-pointer" data-error-id="${error.errorText}">
           ${error.errorText}
         </mark>`
       )
     }

     return highlighted
   }

   function escapeRegex(str: string): string {
     return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
   }
   ```

3. **Verify `dangerouslySetInnerHTML` Rendering**
   - Check browser inspector for `<mark>` tags in DOM
   - Verify Tailwind CSS classes are applied
   - Check for any HTML sanitization that might remove tags

4. **Test with Hardcoded Data**
   ```typescript
   const testHighlight = '<mark class="bg-red-100">test error</mark>'
   <div dangerouslySetInnerHTML={{ __html: testHighlight }} />
   ```

---

## Implementation Steps

1. **Add Debug Logging**
   - Log errors array structure
   - Log message content before/after highlighting
   - Log HTML output

2. **Fix `highlightErrors()` Function**
   - Implement regex escaping for special characters
   - Sort errors by length to avoid nested replacements
   - Test with edge cases (punctuation, accents, quotes)

3. **Verify CSS Classes**
   - Check Tailwind config includes required classes
   - Test styling in browser inspector
   - Add fallback styles if needed

4. **Update ErrorTooltip Click Handler**
   - Match `data-error-id` attribute
   - Find corresponding error in array
   - Display tooltip at correct position

5. **Add Error Boundary**
   - Wrap ErrorPlayback in error boundary
   - Graceful fallback if highlighting fails
   - Show raw errors as fallback

---

## Testing Checklist

### Unit Tests
- [ ] `highlightErrors()` with single error
- [ ] `highlightErrors()` with multiple errors
- [ ] `highlightErrors()` with special characters (¿, ¡, á, ñ)
- [ ] `highlightErrors()` with overlapping errors
- [ ] `escapeRegex()` handles all special chars

### Integration Tests
- [ ] End dialog → errors highlighted correctly
- [ ] Click highlighted text → tooltip appears
- [ ] Tooltip shows correct error details
- [ ] Multiple errors in same message highlighted
- [ ] Long messages with many errors render correctly

### E2E Tests
- [ ] Complete tutor session with intentional errors
- [ ] Verify all errors highlighted in playback
- [ ] Test on Chrome, Firefox, Safari
- [ ] Mobile responsive layout works

---

## Technical Notes

### API Response Format
```typescript
interface AnalysisResult {
  errors: Array<{
    errorText: string      // Exact text from user message
    correction: string     // Corrected version
    explanation: string    // Why it's wrong
    category: 'grammar' | 'vocabulary' | 'syntax'
  }>
}
```

### Expected HTML Output
```html
<div class="space-y-2">
  <p><strong>User:</strong></p>
  <p>
    Yo <mark class="bg-red-100 border-b-2 border-red-500">voy</mark> al tienda.
  </p>
</div>
```

### Edge Cases to Handle
- Errors with punctuation: "hola!" → "¡Hola!"
- Multiple occurrences: "yo voy, tú voy" (only second "voy" is error)
- Accented characters: "cafe" → "café"
- Apostrophes in error text
- Very long error spans (>50 chars)

---

## Success Criteria

**Story Complete When**:
- ✅ Errors visibly highlighted with red underline
- ✅ Click error → tooltip shows explanation
- ✅ Works with all error types and edge cases
- ✅ No console errors or warnings
- ✅ Manually tested with real tutor session
- ✅ Code reviewed and merged

---

## Related Files

```
components/tutor/ErrorPlayback.tsx    # Main component with bug
components/tutor/ErrorTooltip.tsx     # Tooltip display
app/api/tutor/analyze/route.ts        # Error data source
types/tutor.ts                         # TypeScript interfaces
```

---

## Performance Considerations

- Highlighting should be < 100ms for 1000-word transcript
- Use memoization if re-rendering is slow
- Lazy load ErrorPlayback if transcript is very long

---

**Created**: 2025-10-31
**Author**: James (Dev Agent)
