# Epic Planning: Post-Epic 7 Roadmap

**Date**: 2025-10-31
**Current**: Epic 7 Complete
**Priority**: Tutor Polish → Flashcards → Games

---

## Epic 7.5: Real-Time Tutor Feedback ⭐ HIGH PRIORITY

**Goal**: Make conversation experience responsive with per-turn corrections

**User Value**: "I want to see corrections as I chat, not wait until the end"

**Stories**:
1. **Loading States** (1 hour)
   - Add spinner to "Terminar Dialog" button
   - Show "Analyzing conversation..." text
   - Disable button during processing
   - Add toast notification on completion

2. **Per-Turn Error Correction** (3 hours)
   - Create `analyzeUserMessage()` in `tutor-tools.ts`
   - Modify `/api/tutor/turn` to return correction data
   - Update response type: `{ aiMessage, turnNumber, correction }`
   - Test with GPT-4o (ensure < 2s response time)

3. **Collapsible Feedback Component** (2 hours)
   - Create `MessageCorrection.tsx` component
   - Show original user text (unchanged)
   - Display corrected version below (collapsible)
   - Add positive emoji 😊 for error-free messages
   - Make subtle/ignorable by default

4. **Integrate into DialogView** (1 hour)
   - Update message rendering to include corrections
   - Store correction data in message history
   - Test collapse/expand interaction
   - Verify mobile responsiveness

5. **Fix Error Playback Bug** (1 hour)
   - Debug `highlightErrors()` function
   - Verify error text matching
   - Test `dangerouslySetInnerHTML` rendering
   - Fix CSS styling for `<mark>` tags

**Total Estimate**: 8 hours
**Dependencies**: None (improves existing)
**Blocks**: Nothing (parallel with other work)

**Success Criteria**:
- ✅ Send message → correction appears below within 2 seconds
- ✅ No errors → see 😊 emoji
- ✅ Has errors → see collapsible correction
- ✅ Can expand/collapse without disrupting flow
- ✅ "Terminar Dialog" shows loading state

---

## Epic 7.6: Professor Review System

**Goal**: Post-conversation learning summary with personalized advice

**User Value**: "I want to know my most common mistakes and what to focus on next"

**Stories**:
1. **Review API Endpoint** (2 hours)
   - Create `/api/tutor/review` route
   - Add `generateProfessorReview()` to `tutor-tools.ts`
   - Use GPT-4o to analyze full conversation + corrections
   - Return: summary, common mistakes, strengths, next steps

2. **ProfessorReview Component** (2 hours)
   - Create component matching ProfessorOverview style
   - Display conversation summary
   - Show common mistake categories with counts
   - List strength areas
   - Provide personalized learning advice
   - Suggest follow-up topics

3. **Toggle Between Pre/Post Summaries** (1 hour)
   - Add arrow buttons (← →) to panel footer
   - Store both overview and review in state
   - Allow switching between panels
   - Persist selection in localStorage

4. **Database Integration** (1 hour)
   - Add `review_data` JSONB column to `tutor_sessions`
   - Store review on first generation
   - Return cached review on subsequent loads

**Total Estimate**: 6 hours
**Dependencies**: Epic 7.5 (uses correction data)
**Blocks**: Nothing

**Success Criteria**:
- ✅ After dialog ends, review generates automatically
- ✅ Can toggle between overview ↔️ review
- ✅ Review shows actionable learning advice
- ✅ Common mistakes grouped by category
- ✅ Data persists across page reloads

---

## Epic 8: Flashcard System (Baseline) ⭐ CRITICAL PATH

**Goal**: Basic flashcard CRUD with simple SRS algorithm

**User Value**: "I want to turn my tutor corrections into flashcards for practice"

**Stories**:
1. **Database Schema** (1 hour)
   ```sql
   CREATE TABLE flashcard_decks (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES auth.users,
     name TEXT,
     description TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE flashcards (
     id UUID PRIMARY KEY,
     deck_id UUID REFERENCES flashcard_decks,
     user_id UUID REFERENCES auth.users,
     front TEXT NOT NULL,
     back TEXT NOT NULL,
     notes TEXT,
     source TEXT, -- 'tutor_session', 'vocabulary', 'manual'
     source_id UUID,

     -- SRS fields (SM-2 algorithm)
     ease_factor DECIMAL DEFAULT 2.5,
     interval_days INTEGER DEFAULT 0,
     repetitions INTEGER DEFAULT 0,
     next_review_date TIMESTAMPTZ DEFAULT NOW(),

     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE review_history (
     id UUID PRIMARY KEY,
     flashcard_id UUID REFERENCES flashcards,
     user_id UUID REFERENCES auth.users,
     quality INTEGER, -- 0-5 rating
     reviewed_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Flashcard API Endpoints** (3 hours)
   - `POST /api/flashcards` - Create flashcard
   - `GET /api/flashcards` - List all cards
   - `GET /api/flashcards/due` - Get cards due for review
   - `PUT /api/flashcards/[id]` - Update card
   - `DELETE /api/flashcards/[id]` - Delete card
   - `POST /api/flashcards/[id]/review` - Record review + update SRS

3. **SRS Algorithm Implementation** (2 hours)
   - Implement SM-2 algorithm in `lib/srs.ts`
   - Calculate next review date based on quality rating
   - Update ease factor and interval
   - Handle first review vs subsequent reviews

4. **Flashcard Deck UI** (4 hours)
   - Create `/flashcards` page
   - List all decks
   - Show deck statistics (total cards, due today)
   - Create/edit/delete decks
   - View cards in deck

5. **Practice Interface** (3 hours)
   - Show flashcard front → flip → show back
   - Rate quality (Again, Hard, Good, Easy)
   - Update SRS on each rating
   - Show progress (X of Y cards)
   - Completion summary

6. **Tutor Integration** (2 hours)
   - Add "Save as Flashcard" button in ErrorTooltip
   - Create flashcard from correction data:
     - Front: Original error text
     - Back: Corrected version
     - Notes: Explanation
     - Source: tutor_session
   - Show success toast on save
   - Option to edit before saving

**Total Estimate**: 15 hours
**Dependencies**: None (can start anytime)
**Blocks**: Epic 9 (Games need flashcard data)

**Success Criteria**:
- ✅ Can create flashcard decks
- ✅ Can add flashcards manually or from tutor
- ✅ Due cards appear based on SRS algorithm
- ✅ Practice interface works smoothly
- ✅ Ratings update next review date correctly
- ✅ Statistics track progress

---

## Epic 9: Games Tab 🎮 (Future)

**Goal**: Duolingo-style interactive exercises using flashcard deck

**User Value**: "I want to practice in a fun, game-like way"

**Stories**:
1. **Games Tab UI** (2 hours)
   - Add "Games" tab to reader navigation
   - Game selection screen
   - Progress tracking UI
   - XP/streak display

2. **Translation Game** (3 hours)
   - Show Spanish → translate to English
   - Or English → translate to Spanish
   - Use flashcard front/back as questions
   - Check answer correctness
   - Award points for correct answers

3. **Fill-in-the-Blank** (3 hours)
   - Take sentence from flashcard notes
   - Remove key word → user fills in
   - Multiple choice or text input
   - Validate answer

4. **Multiple Choice Vocabulary** (2 hours)
   - Show word → pick correct definition
   - 4 options (1 correct, 3 distractors)
   - Timed mode optional
   - Track accuracy

5. **Sentence Building** (4 hours)
   - Show shuffled words
   - User drags to correct order
   - Validate against flashcard data
   - More advanced than fill-in-blank

6. **Progress & Gamification** (2 hours)
   - XP system (points per correct answer)
   - Daily streak tracking
   - Level progression
   - Achievements/badges

**Total Estimate**: 16 hours
**Dependencies**: Epic 8 (needs flashcard system)
**Priority**: P2 (after flashcards working)

**Success Criteria**:
- ✅ Can select game type
- ✅ Games pull from flashcard deck
- ✅ Progress tracked across sessions
- ✅ XP and streaks motivate daily practice
- ✅ Mobile-friendly interface

---

## Timeline Estimate

### Sprint 1: Tutor Polish (1 week)
- **Days 1-2**: Epic 7.5 (Real-Time Feedback)
- **Days 3-4**: Epic 7.6 (Professor Review)
- **Day 5**: Testing, bug fixes, polish

### Sprint 2: Flashcards (1 week)
- **Days 1-2**: Database + API endpoints
- **Days 3-4**: Deck UI + Practice interface
- **Day 5**: Tutor integration + testing

### Sprint 3: Games (1 week) - Future
- **Days 1-2**: Translation + Multiple choice
- **Days 3-4**: Fill-in-blank + Sentence building
- **Day 5**: Gamification + polish

**Total MVP Timeline**: 2 weeks (Tutor + Flashcards)
**With Games**: 3 weeks total

---

## Priority Matrix

```
High Impact, Low Effort:
- Epic 7.5 Story 1 (Loading states) ⭐
- Epic 7.5 Story 5 (Fix error playback bug) ⭐

High Impact, High Effort:
- Epic 7.5 Story 2-4 (Real-time feedback) ⭐
- Epic 8 (Flashcard system) ⭐

Medium Impact, Low Effort:
- Epic 7.6 (Professor review)

Low Impact, High Effort:
- Epic 9 (Games) - only after flashcards work
```

---

## Risk Assessment

### Technical Risks
1. **Real-time correction latency** - GPT-4o might be too slow
   - Mitigation: Test with streaming, optimize prompt

2. **Error matching accuracy** - LLM might not identify exact text spans
   - Mitigation: Use fuzzy matching, allow manual correction

3. **SRS algorithm complexity** - SM-2 needs careful implementation
   - Mitigation: Use existing library or well-tested code

### UX Risks
1. **Correction overload** - Too much feedback might overwhelm
   - Mitigation: Make collapsible, subtle by default

2. **Flashcard fatigue** - Users might not review daily
   - Mitigation: Start with small daily goals (5 cards)

---

## Next Session Checklist

**Before Starting Epic 7.5**:
- [ ] Read `SESSION-HANDOFF-2.md`
- [ ] Read `TUTOR-MODE-IMPROVEMENTS.md`
- [ ] Verify app running at localhost:3000
- [ ] Test current tutor flow end-to-end
- [ ] Fix error highlighting bug (if time)
- [ ] Review API response times (tutor endpoints)

**Starting Epic 7.5**:
- [ ] Create feature branch: `git checkout -b epic-7.5-realtime-feedback`
- [ ] Start with Story 1 (loading states) - quick win
- [ ] Then Story 5 (fix bug) - unblock testing
- [ ] Then Stories 2-4 (real-time corrections) - main feature
- [ ] Test thoroughly before merging

---

**🎯 Recommended Start**: Epic 7.5 Story 1 + Story 5 (bug fixes + loading) → 2 hours → Quick wins before tackling real-time feedback.
