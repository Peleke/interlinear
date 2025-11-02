# Epic 9: Course & Gamification System - Story Summary

**Generated:** 2025-11-02
**Status:** Ready for Implementation
**Total Stories:** 16 stories across 4 epics

---

## Epic Breakdown

### ✅ Epic 1: Database Foundation & Content Authoring (⏱️ 4 hours)
Foundation for course system with database schema and content tooling.

**Stories:**
- **1.1** Database Schema Migration (9 tables + RLS + indexes)
- **1.2** YAML Lesson Parser (YAML → Supabase seeding script)
- **1.3** Sample Course Content Authoring (3 A1 lessons in YAML)

**Dependencies:** None (start here)
**Output:** Database ready, 3 sample lessons seeded

---

### ✅ Epic 2: AI Onboarding Flow (⏱️ 4 hours)
Personalized onboarding with AI-powered level assessment.

**Stories:**
- **2.1** Welcome & Goal Selection Page (goal picker UI)
- **2.2** AI Assessment Chat (conversational placement test)
- **2.3** Onboarding API Routes (assessment + profile creation)
- **2.4** Onboarding Middleware Redirect (force incomplete users to onboard)

**Dependencies:** Requires Epic 1 (database schema)
**Output:** New users assessed and profiled

---

### ✅ Epic 3: Course Navigation & Lesson Viewer (⏱️ 6 hours)
Dashboard, course browsing, and lesson content viewing with auto-enrollment.

**Stories:**
- **3.1** Dashboard Page with Course Overview (XP/streak widgets + course cards)
- **3.2** Course List Page (browse all courses with level filter)
- **3.3** Lesson List Page (course detail with lesson cards + progress)
- **3.4** Lesson Viewer Page (Markdown content + grammar + vocabulary)
- **3.5** Course & Lesson Card Components (reusable UI components)
- **3.6** Auto-Enrollment System (seamless course enrollment on first lesson click)

**Dependencies:** Requires Epic 1 (data), Epic 2 (user profiles)
**Output:** Full course navigation flow with auto-enrollment

---

### ✅ Epic 4: Interactive Exercise System (⏱️ 3 hours)
Exercise validation and interactive practice components.

**Stories:**
- **4.1** Exercise Validation API (server-side answer checking + XP awards)
- **4.2** Fill-in-Blank Exercise Component (grammar practice UI)
- **4.3** Multiple Choice Exercise Component (vocabulary quiz UI)
- **4.4** Exercise Result Feedback UI (success/error messaging)

**Dependencies:** Requires Epic 1 (exercises table), Epic 3 (lesson viewer integration)
**Output:** Interactive exercises with validation and XP awards

---

## Story File Locations

All story files in `docs/stories/epic-9-course-system/`:

```
├── README.md                        # Epic overview
├── EPIC-STORIES-SUMMARY.md          # This file
├── 1.1.database-schema.md
├── 1.2.yaml-parser.md
├── 1.3.sample-content.md
├── 2.1.welcome-page.md
├── 2.2.ai-chat.md
├── 2.3.onboarding-api.md
├── 2.4.onboarding-middleware.md
├── 3.1.dashboard.md
├── 3.2.course-list.md
├── 3.3.lesson-list.md
├── 3.4.lesson-viewer.md
├── 3.5.course-lesson-cards.md
├── 3.6.course-enrollment.md
├── 4.1.exercise-api.md
├── 4.2.fill-blank-component.md
├── 4.3.multiple-choice-component.md
└── 4.4.exercise-feedback.md
```

---

## Implementation Timeline

### Day 1 (8 hours)
**Morning (4 hours): Epic 1**
- Story 1.1: Database migration (1.5 hrs)
- Story 1.2: YAML parser (1.5 hrs)
- Story 1.3: Sample content (1 hr)

**Afternoon (4 hours): Epic 2**
- Story 2.1: Welcome page (1 hr)
- Story 2.2: AI chat (1.5 hrs)
- Story 2.3: Onboarding API (1 hr)
- Story 2.4: Middleware (0.5 hr)

### Day 2 (8 hours)
**Morning (4 hours): Epic 3**
- Story 3.5: Card components (1 hr)
- Story 3.1: Dashboard (1 hr)
- Story 3.2: Course list (0.5 hr)
- Story 3.3: Lesson list (0.75 hr)
- Story 3.4: Lesson viewer (0.75 hr)
- Story 3.6: Auto-enrollment (1 hr)

**Afternoon (4 hours): Epic 4**
- Story 4.1: Exercise API (1 hr)
- Story 4.2: Fill-blank component (1 hr)
- Story 4.3: Multiple choice component (0.75 hr)
- Story 4.4: Exercise feedback (0.5 hr)
- **Buffer**: Testing & polish (0.75 hr)

---

## Critical Path

```
Epic 1 (Database) → MUST COMPLETE FIRST
  ↓
Epic 2 (Onboarding) → Can run parallel with Epic 3
  ↓
Epic 3 (Navigation) → Needs database
  ↓
Epic 4 (Exercises) → Needs navigation for integration
```

**Parallel Opportunities:**
- Epic 2 and Epic 3 can be developed in parallel (different developers)
- Epic 3.5 (card components) should be done early for use in other stories

---

## Success Criteria (MVP Complete)

After completing Epics 1-4:

✅ **Database:**
- 9 new tables deployed to Supabase
- 3 sample A1 lessons seeded
- RLS policies enforced

✅ **Onboarding:**
- New users complete 3-5 turn AI chat
- Level assessment (A1/A2/B1) working
- Profile created with goals + timezone

✅ **Navigation:**
- Dashboard displays XP/streak
- Course list with level filtering
- Lesson viewer shows Markdown + vocab + grammar

✅ **Exercises:**
- Fill-blank and multiple choice functional
- Server-side validation secure
- XP awards on correct answers

**Ready for:** Epic 5 (Gamification - XP/streak system), Epic 6 (Integration with reader/tutor), Epic 7 (Polish & Deploy)

---

## Key Architectural Decisions (from Epics 1-4)

1. **Database Schema:** 9 new tables, JSONB for vocabulary/options, TIMESTAMPTZ for timezone-aware dates
2. **Onboarding:** Middleware-based redirect (Option A), AI assessment via OpenAI
3. **Exercise Validation:** Server-side API routes (Option B) - security over client-side
4. **Content Authoring:** YAML + Markdown format for developer-friendly lesson creation
5. **Component Reuse:** DialogView from tutor reused for onboarding chat
6. **Timezone Handling:** IANA timezone stored in user_profiles for accurate streak tracking

---

## Next Steps

1. **Review Stories:** Scrum Master reviews all 16 stories for completeness
2. **Assign Epic 1:** Assign to developer for database foundation
3. **Parallel Work:** Once Epic 1 complete, assign Epic 2 + Epic 3 in parallel
4. **Sequential Finish:** Complete Epic 4 after Epic 3
5. **QA:** E2E testing of full onboarding → lesson completion flow
6. **Deploy:** Staging deployment for user testing

---

## Story Template Compliance

All stories follow `.bmad-core/templates/story-tmpl.yaml`:

- ✅ Status, Story (As a/I want/so that), Acceptance Criteria
- ✅ Tasks/Subtasks with AC references
- ✅ Dev Notes with architecture references
- ✅ Testing section with file locations and test examples
- ✅ Change Log, Dev Agent Record, QA Results sections

---

**🏃 Bob (Scrum Master) - Ready to kickstart implementation!**
