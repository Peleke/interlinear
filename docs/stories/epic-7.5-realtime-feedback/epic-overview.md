# Epic 7.5: Real-Time Tutor Feedback

**Status**: ✅ Completed
**Priority**: P0 (HIGH)
**Estimated Effort**: 8 hours
**Dependencies**: Epic 7 (AI Tutor Mode UI) - Complete ✅

---

## Vision

Transform the tutor conversation experience from batch error correction (post-conversation) to real-time, per-turn feedback. Users should see corrections immediately after each message, creating a more engaging and responsive learning experience.

---

## User Value

**As a** language learner
**I want to** see corrections for my mistakes immediately after each message
**So that** I can learn from errors in real-time without waiting for the conversation to end

---

## Success Metrics

- ✅ Per-turn correction latency < 2 seconds
- ✅ User sees positive reinforcement (😊) when error-free
- ✅ Feedback is subtle and non-intrusive (collapsible)
- ✅ All corrections stored for flashcard generation
- ✅ Error playback highlighting works correctly

---

## Stories

### Story 7.5.1: Fix Error Playback Highlighting Bug
**Priority**: P0 (BLOCKER)
**Effort**: 1 hour
**Status**: 🚧 Not Started

Bug where error highlighting doesn't show after ending dialog.

### Story 7.5.2: Add Loading States to Dialog
**Priority**: P1
**Effort**: 1 hour
**Status**: 🚧 Not Started

Loading feedback for "Terminar Dialog" button and API calls.

### Story 7.5.3: Per-Turn Error Correction API
**Priority**: P0
**Effort**: 2 hours
**Status**: 🚧 Not Started

Backend logic to analyze user messages and return corrections in real-time.

### Story 7.5.4: Collapsible Feedback Component
**Priority**: P0
**Effort**: 2 hours
**Status**: 🚧 Not Started

UI component to display corrections below user messages.

### Story 7.5.5: Integrate Real-Time Feedback
**Priority**: P0
**Effort**: 2 hours
**Status**: 🚧 Not Started

Connect per-turn corrections to DialogView, store for flashcards.

---

## Technical Architecture

### Flow Diagram
```
User sends message
    ↓
API: /api/tutor/turn
    ↓
TWO parallel operations:
    1. Generate AI response (conversational)
    2. Analyze user message (correction)
    ↓
Return: { aiMessage, correction: { hasErrors, correctedText, errors[] } }
    ↓
UI: Display both immediately
    - AI response in chat
    - Correction below user's message (collapsible)
```

### Key Components Modified
- `app/api/tutor/turn/route.ts` - Add correction analysis
- `lib/tutor-tools.ts` - New `analyzeUserMessageTool`
- `components/tutor/DialogView.tsx` - Display corrections inline
- `components/tutor/MessageCorrection.tsx` - New collapsible component
- `components/tutor/ErrorPlayback.tsx` - Fix highlighting bug

---

## Cost Impact

### Current (Epic 7)
- Dialog turn: ~500 tokens × $0.005/1K = $0.0025 per turn
- Error analysis (end): ~1500 tokens × $0.005/1K = $0.0075 per session

### With Real-Time (Epic 7.5)
- Dialog turn: ~500 tokens (same)
- **Per-turn correction**: ~300 tokens × $0.005/1K = $0.0015 per turn
- Total per turn: $0.0025 + $0.0015 = $0.004
- 10 turns = $0.04 per session (vs $0.03 before)
- **Increase**: +33% cost but 10x better UX

**Acceptable**: $0.01 increase per session for real-time feedback.

---

## Dependencies

### Must Complete First
- Epic 7 (Tutor UI) - ✅ Complete

### Parallel Work Possible
- Can work alongside Epic 7.6 (Professor Review)
- Does not block Epic 8 (Flashcards)

---

## Testing Strategy

### Unit Tests
- `analyzeUserMessageTool()` function
- `highlightErrors()` utility
- MessageCorrection component rendering

### Integration Tests
- `/api/tutor/turn` returns correction data
- DialogView displays corrections correctly
- Error state handled gracefully

### E2E Tests
- Send message → see correction within 2s
- No errors → see positive feedback
- Has errors → see collapsible correction
- Expand/collapse works smoothly

---

## Rollback Plan

If real-time corrections cause issues:
1. Feature flag to disable per-turn analysis
2. Fall back to batch error correction (end of dialog)
3. Keep UI components but hide/disable
4. Investigate performance issues offline

---

## Timeline

**Day 1**: Stories 7.5.1 + 7.5.2 (Bug fixes + Loading states)
**Day 2**: Stories 7.5.3 + 7.5.4 (API + Component)
**Day 3**: Story 7.5.5 (Integration + Testing)

**Total**: 3 days (8 hours)

---

## Related Documents

- `docs/TUTOR-MODE-IMPROVEMENTS.md` - User feedback and requirements
- `docs/SESSION-HANDOFF-2.md` - Current state and context
- `docs/EPIC-PLANNING-NEXT.md` - Roadmap overview

---

**Created**: 2025-10-31
**Author**: James (Dev Agent)
