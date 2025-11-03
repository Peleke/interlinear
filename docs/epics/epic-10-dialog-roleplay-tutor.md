# 🎭 EPIC 10: Dialog Roleplay Tutor

**Status:** Ready for Implementation
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Existing tutor system, Dialog data structure, LangChain integration

---

## Epic Goal

Enable students to practice lesson dialogs by roleplaying as one character while AI plays the other, with real-time corrections and post-session review.

## Business Value

Bridges passive dialog reading with active conversation practice, creating a low-pressure environment for students to practice realistic dialog exchanges. This completes the learning loop: read → understand → practice → master.

---

## User Stories

1. **Story 10.1:** Role Selection Interface
2. **Story 10.2:** Session Initialization
3. **Story 10.3:** Interactive Conversation Loop
4. **Story 10.4:** End Dialog & Error Collection
5. **Story 10.5:** Professor Review
6. **Story 10.6:** Error Playback Transcript
7. **Story 10.7:** Database Schema Extensions
8. **Story 10.8:** Integration & Polish

See individual story documents in `docs/stories/epic-10/` for detailed requirements.

---

## Technical Architecture

### Components
- `DialogRoleplayPanel.tsx` - Main roleplay interface
- `RoleSelector.tsx` - Character selection component
- Reuse: `ProfessorReview`, `ErrorPlayback`, `LevelSelector`

### API Routes
- `POST /api/tutor/dialog/start` - Initialize roleplay session
- `POST /api/tutor/dialog/turn` - Process conversation turn
- `POST /api/tutor/dialog/review` - Generate post-session review

### Database Schema
```sql
-- Extensions to tutor_sessions table
ALTER TABLE tutor_sessions
ADD COLUMN dialog_id UUID REFERENCES lesson_dialogs(id),
ADD COLUMN selected_role TEXT;
```

### AI Integration
- **Model:** GPT-4o for dialog generation
- **Tools:** LangChain structured output
- **Correction:** Per-turn analysis using `analyzeUserMessageTool`
- **Review:** Professor review generation with encouraging tone

---

## Implementation Phases

### Sprint 1: Foundation (Stories 10.7, 10.1, 10.2)
**Goal:** Database + UI foundation + session start
- Database schema migration
- Role selection interface
- Session initialization API

### Sprint 2: Core Loop (Stories 10.3, 10.4)
**Goal:** Interactive conversation
- Conversation turn API
- Dialog history UI
- End session flow

### Sprint 3: Review (Stories 10.5, 10.6)
**Goal:** Post-session analysis
- Review generation API
- Professor review display
- Error playback transcript

### Sprint 4: Polish (Story 10.8)
**Goal:** Production-ready UX
- Error handling
- Loading states
- Toast notifications
- Responsive design

---

## Epic Acceptance Criteria

- [ ] User can select character and CEFR level
- [ ] User can practice full dialog with AI
- [ ] Per-turn corrections provided in real-time
- [ ] Session ends with comprehensive professor review
- [ ] Error playback transcript with highlighted mistakes
- [ ] All data persisted to database
- [ ] No console errors
- [ ] Smooth, responsive UX
- [ ] Mobile-friendly design

---

## Success Metrics

**Engagement:**
- 70%+ of students who view a dialog try the roleplay feature
- Average session length: 5-8 turns
- 60%+ completion rate (reach review stage)

**Learning Outcomes:**
- Error rate decreases by 20% in repeated dialog practice
- Students rate feature 4.5+ stars for helpfulness

**Technical:**
- API response time < 2s per turn
- Zero session data loss
- 99%+ uptime

---

## Risks & Mitigation

**Risk:** AI responses too formal/unnatural
**Mitigation:** Craft system prompts with conversational examples, iterate based on user feedback

**Risk:** Per-turn corrections slow down conversation flow
**Mitigation:** Show corrections inline without blocking next turn, allow dismissal

**Risk:** Students intimidated by error feedback
**Mitigation:** Use encouraging language, emphasize learning over perfection

---

## Future Enhancements (Out of Scope)

- Support for 3+ character dialogs
- Voice input/output for audio practice
- Adaptive difficulty (AI adjusts based on error patterns)
- Dialog library browsing by difficulty level
- Multiplayer roleplay (student vs student)

---

## Related Documentation

- Existing tutor system: `components/reader/TutorPanel.tsx`
- Dialog viewer: `components/dialogs/DialogViewer.tsx`
- Tutor tools: `lib/tutor-tools.ts`
- Story details: `docs/stories/epic-10/*.md`
