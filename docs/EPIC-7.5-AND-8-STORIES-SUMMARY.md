# Epic 7.5 & 8 Story Planning Complete

**Date**: 2025-10-31
**Status**: ✅ All Stories Created
**Next Step**: Begin Implementation

---

## Summary

Created comprehensive story documentation for:
- **Epic 7.5**: Real-Time Tutor Feedback (5 stories, 8 hours)
- **Epic 8**: Flashcard System with Mock SRS (6 stories, 12 hours)

**Total**: 11 stories, ~20 hours of work

---

## Epic 7.5: Real-Time Tutor Feedback (8 hours)

### Stories Created

1. **Story 7.5.1: Fix Error Highlighting Bug** (1 hour)
   - Debug `highlightErrors()` function
   - Fix `dangerouslySetInnerHTML` rendering
   - Test with real error data
   - **Blocks**: Testing of real-time feedback

2. **Story 7.5.2: Add Loading States** (1 hour)
   - "Terminar Dialog" loading spinner
   - Message sending loading state
   - Voice input recording/processing states
   - Toast notifications (sonner library)

3. **Story 7.5.3: Per-Turn Correction API** (2 hours)
   - New `analyzeUserMessageTool` in tutor-tools.ts
   - Update `/api/tutor/turn` to return correction data
   - Parallel execution (AI response + correction)
   - Uses GPT-4o mini for cost efficiency

4. **Story 7.5.4: Collapsible Feedback Component** (2 hours)
   - New `MessageCorrection.tsx` component
   - Collapsed by default (subtle presence)
   - Expand to see full correction details
   - Color-coded by error category
   - Positive feedback (😊) when no errors

5. **Story 7.5.5: Integrate Real-Time Feedback** (2 hours)
   - Update DialogView to display corrections
   - Store correction data in message history
   - Connect to MessageCorrection component
   - Prepare data for flashcard creation

### Key Decisions

- **Cost**: +$0.01 per session (acceptable for 10x better UX)
- **Performance**: Per-turn latency < 2 seconds target
- **Architecture**: Corrections stored in message state, ready for Epic 8

---

## Epic 8: Flashcard System (12 hours)

### Stories Created

1. **Story 8.1: Database Schema** (1 hour)
   - Three tables: `flashcard_decks`, `flashcards`, `review_history`
   - RLS policies for user isolation
   - Indexes for performance
   - Helper function: `get_due_flashcards()`

2. **Story 8.2: Flashcard Service Layer** (2 hours)
   - FlashcardService with CRUD operations
   - **Modular SRS Interface** (easy scheduler swap)
   - MockScheduler implementation (fixed intervals)
   - TypeScript types and interfaces

3. **Story 8.3: Flashcard API Routes** (2 hours)
   - 13 REST endpoints
   - Deck CRUD
   - Flashcard CRUD
   - Due cards query
   - Review recording
   - Statistics endpoint

4. **Story 8.4: Deck Management UI** (3 hours)
   - `/flashcards` page listing all decks
   - Create/edit/delete decks
   - View cards in deck
   - Add/edit/delete individual cards
   - Statistics display

5. **Story 8.5: Practice Interface** (3 hours)
   - `/flashcards/[deckId]/practice` page
   - Flip animation (front → back)
   - Rating buttons (Again, Hard, Good, Easy)
   - Progress indicator
   - Completion summary
   - Keyboard shortcuts

6. **Story 8.6: Tutor Integration** (1 hour)
   - "Save as Flashcard" button in ErrorTooltip
   - Auto-populate from tutor correction
   - Source tracking ('tutor_session')
   - Default "Tutor Corrections" deck

### Key Decisions

- **Mock SRS Scheduler**: Simple fixed intervals initially
  - Again: 1 day
  - Hard: 3 days
  - Good: 7 days
  - Easy: 30 days
- **Modular Design**: Easy swap to SM-2 later via interface
- **Source Tracking**: Link flashcards back to tutor sessions
- **No LLM Costs**: Pure CRUD operations, no API calls

---

## Modular SRS Architecture

### Interface Definition
```typescript
export interface SRSScheduler {
  calculateNextReview(
    card: FlashcardState,
    quality: ReviewQuality
  ): ScheduleResult
}
```

### Current Implementation
```typescript
// lib/flashcards/srs/index.ts
export const scheduler: SRSScheduler = new MockScheduler()
```

### To Upgrade to SM-2
```typescript
// Just change one line:
export const scheduler: SRSScheduler = new SM2Scheduler()
```

**No other code changes needed!**

---

## File Structure Created

```
docs/stories/
├── epic-7.5-realtime-feedback/
│   ├── epic-overview.md
│   ├── story-7.5.1-fix-error-highlighting.md
│   ├── story-7.5.2-loading-states.md
│   ├── story-7.5.3-per-turn-correction-api.md
│   ├── story-7.5.4-collapsible-feedback-component.md
│   └── story-7.5.5-integrate-realtime-feedback.md
└── epic-8-flashcards/
    ├── epic-overview.md
    ├── story-8.1-database-schema.md
    ├── story-8.2-flashcard-service.md
    ├── story-8.3-flashcard-api-routes.md
    ├── story-8.4-deck-management-ui.md
    ├── story-8.5-practice-interface.md
    └── story-8.6-tutor-integration.md
```

---

## Implementation Timeline

### Week 1: Epic 7.5 (Tutor Polish)
**Day 1**:
- Morning: Story 7.5.1 (Fix bug)
- Afternoon: Story 7.5.2 (Loading states)
- Testing & validation

**Day 2**:
- Morning: Story 7.5.3 (API)
- Afternoon: Story 7.5.4 (Component)

**Day 3**:
- Morning: Story 7.5.5 (Integration)
- Afternoon: End-to-end testing
- Bug fixes & polish

### Week 2: Epic 8 (Flashcards)
**Day 1**:
- Morning: Story 8.1 (Database)
- Afternoon: Story 8.2 (Service)

**Day 2**:
- Morning: Story 8.3 (API)
- Afternoon: Story 8.4 (Deck UI) - Start

**Day 3**:
- Morning: Story 8.4 (Deck UI) - Finish
- Afternoon: Story 8.5 (Practice)

**Day 4**:
- Morning: Story 8.6 (Tutor Integration)
- Afternoon: End-to-end testing
- Bug fixes & polish

**Total**: ~2 weeks (20 hours)

---

## Dependencies Graph

```
Epic 7.5:
Story 7.5.1 (Fix bug) ─┐
Story 7.5.2 (Loading) ─┼─→ Story 7.5.5 (Integration)
Story 7.5.3 (API)    ──┤
Story 7.5.4 (Component)┘

Epic 8:
Story 8.1 (DB) → Story 8.2 (Service) → Story 8.3 (API) ─┬→ Story 8.4 (Deck UI)
                                                         ├→ Story 8.5 (Practice)
                                                         └→ Story 8.6 (Tutor)

Cross-Epic:
Epic 7.5 (corrections data) → Epic 8 Story 8.6 (flashcard creation)
```

---

## Testing Strategy

### Epic 7.5
- **Unit Tests**: `highlightErrors()`, `analyzeUserMessageTool`, MessageCorrection
- **Integration Tests**: API returns correction data, DialogView displays correctly
- **E2E Tests**: Complete conversation with real-time feedback

### Epic 8
- **Unit Tests**: MockScheduler, FlashcardService methods
- **Integration Tests**: API routes, database operations
- **E2E Tests**: Create deck → Add cards → Practice → Review

---

## Cost Analysis

### Epic 7.5
- **Before**: $0.03 per session
- **After**: $0.04 per session (+$0.01)
- **100 users × 10 sessions**: $40/month
- **Acceptable**: Yes (10x better UX for 33% cost increase)

### Epic 8
- **Storage**: 1000 cards × 200 bytes = 200KB per user (negligible)
- **API Costs**: $0 (no LLM calls)
- **Performance**: <10ms queries (indexed)
- **Total**: No additional costs

---

## Deferred Work (Not in MVP)

### Epic 7.5
- Professor review system (Epic 7.6)
- Post-conversation summary

### Epic 8
- Full SM-2 algorithm (modular, easy swap)
- Image support on cards
- Audio pronunciation
- Anki import/export
- Shared decks (community)
- Gamification (streaks, XP)

### Epic 9 (Deferred Entirely)
- Games tab (Duolingo-style exercises)
- Translation game
- Fill-in-the-blank
- Multiple choice vocabulary
- **Blocked by**: Epic 8 (needs flashcard data)

---

## Next Steps

1. **Review stories with user** - Confirm approach
2. **Start Epic 7.5 Story 7.5.1** - Fix critical bug first
3. **Follow story order** - Each builds on previous
4. **Test incrementally** - Don't wait for full epic completion
5. **Deploy to dev** - Test in real environment

---

## Success Metrics

### Epic 7.5
- ✅ Per-turn correction latency < 2 seconds
- ✅ 90%+ positive user feedback on real-time experience
- ✅ No performance degradation with corrections

### Epic 8
- ✅ Can create and practice flashcards
- ✅ SRS scheduler updates next review correctly
- ✅ Tutor integration saves errors as cards
- ✅ 80%+ users engage with flashcards weekly

---

**Ready to implement!** All stories follow template structure, include acceptance criteria, technical specs, and testing checklists.

**Created**: 2025-10-31
**Author**: James (Dev Agent)
