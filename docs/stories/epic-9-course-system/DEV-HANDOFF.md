# Developer Handoff: Epic 9 Course System

**Date:** 2025-11-02
**From:** Bob (Scrum Master)
**To:** Dev Agent
**Status:** Ready for Implementation

---

## 🎯 Mission

Implement the Course & Gamification System for Interlinear, transforming it from a reading tool into a complete adaptive language learning platform.

**Epic Scope:** Epics 1-4 (16 stories, ~16 hours)

---

## 📋 Implementation Order

### **Phase 1: Foundation (Epic 1)** - START HERE
**Must complete before all other work**

```
1. Story 1.1: Database Schema Migration
   → File: docs/stories/epic-9-course-system/1.1.database-schema.md
   → Output: supabase/migrations/20251102_course_system.sql
   → Critical: Run migration on Supabase before proceeding

2. Story 1.2: YAML Lesson Parser
   → File: docs/stories/epic-9-course-system/1.2.yaml-parser.md
   → Output: scripts/parse-lessons.ts + npm run seed:lessons

3. Story 1.3: Sample Course Content Authoring
   → File: docs/stories/epic-9-course-system/1.3.sample-content.md
   → Output: lessons/a1/lesson-01.yaml, lesson-02.yaml, lesson-03.yaml
```

**Verification:** Run `npm run seed:a1` → 3 lessons in Supabase

---

### **Phase 2: Onboarding (Epic 2)** - After Epic 1
**Can run in parallel with Epic 3 if multiple devs**

```
4. Story 2.1: Welcome & Goal Selection Page
   → File: docs/stories/epic-9-course-system/2.1.welcome-page.md
   → Output: app/onboarding/page.tsx + components/onboarding/GoalSelector.tsx

5. Story 2.2: AI Assessment Chat
   → File: docs/stories/epic-9-course-system/2.2.ai-chat.md
   → Output: app/onboarding/chat/page.tsx + lib/prompts/onboarding-assessment.ts

6. Story 2.3: Onboarding API Routes
   → File: docs/stories/epic-9-course-system/2.3.onboarding-api.md
   → Output: app/api/onboarding/assess/route.ts + complete/route.ts

7. Story 2.4: Onboarding Middleware Redirect
   → File: docs/stories/epic-9-course-system/2.4.onboarding-middleware.md
   → Output: middleware.ts (updated)
```

**Verification:** New user signup → onboarding → AI chat → profile created → redirect to dashboard

---

### **Phase 3: Navigation (Epic 3)** - After Epic 1
**Can run in parallel with Epic 2**

```
8. Story 3.5: Course & Lesson Card Components (DO FIRST)
   → File: docs/stories/epic-9-course-system/3.5.course-lesson-cards.md
   → Output: components/courses/CourseCard.tsx, LessonCard.tsx, ProgressBar.tsx

9. Story 3.1: Dashboard Page
   → File: docs/stories/epic-9-course-system/3.1.dashboard.md
   → Output: app/dashboard/page.tsx + components/dashboard/*

10. Story 3.2: Course List Page
    → File: docs/stories/epic-9-course-system/3.2.course-list.md
    → Output: app/courses/page.tsx + components/courses/CourseList.tsx

11. Story 3.3: Lesson List Page
    → File: docs/stories/epic-9-course-system/3.3.lesson-list.md
    → Output: app/courses/[id]/page.tsx + components/courses/LessonList.tsx

12. Story 3.4: Lesson Viewer Page
    → File: docs/stories/epic-9-course-system/3.4.lesson-viewer.md
    → Output: app/lessons/[id]/page.tsx + components/lessons/LessonContent.tsx
```

**Verification:** Navigate dashboard → course → lesson → view content

---

### **Phase 4: Exercises (Epic 4)** - After Epic 3
**Must follow Epic 3 for integration**

```
13. Story 4.1: Exercise Validation API (DO FIRST)
    → File: docs/stories/epic-9-course-system/4.1.exercise-api.md
    → Output: app/api/exercises/[id]/validate/route.ts

14. Story 4.2: Fill-in-Blank Exercise Component
    → File: docs/stories/epic-9-course-system/4.2.fill-blank-component.md
    → Output: components/exercises/FillBlankExercise.tsx

15. Story 4.3: Multiple Choice Exercise Component
    → File: docs/stories/epic-9-course-system/4.3.multiple-choice-component.md
    → Output: components/exercises/MultipleChoiceExercise.tsx

16. Story 4.4: Exercise Result Feedback UI
    → File: docs/stories/epic-9-course-system/4.4.exercise-feedback.md
    → Output: components/exercises/ExerciseResult.tsx
```

**Verification:** View lesson → complete exercises → validate answers → earn XP

---

## 🗂️ Key Reference Documents

**Architecture:**
- Primary: `docs/architecture-v2-course-system.md` (complete technical spec)
- PRD: `docs/prd/course-gamification-system.md` (product requirements)

**Story Files:**
- All stories: `docs/stories/epic-9-course-system/*.md`
- Summary: `docs/stories/epic-9-course-system/EPIC-STORIES-SUMMARY.md`

**Existing Codebase:**
- Database migrations: `supabase/migrations/`
- Existing tutor chat: `components/tutor/DialogView.tsx` (reuse for onboarding)
- Existing styles: `components/ui/` (button, card, dialog, etc.)

---

## 🔑 Critical Success Factors

### 1. **Database First**
- Epic 1 (database) MUST be complete before any other work
- Run migration locally first, verify in Supabase dashboard
- Seed sample lessons before building UI

### 2. **Component Reuse**
- Story 3.5 (card components) before other Epic 3 stories
- Reuse existing `DialogView` from tutor for onboarding chat (Story 2.2)
- Follow existing Tailwind patterns in `components/ui/`

### 3. **Server-Side Validation**
- Exercise validation (Story 4.1) must be server-side (security)
- XP awards happen server-side only
- Client-side is for UI only

### 4. **Testing as You Go**
- Each story has test requirements (see "Testing" section)
- Run E2E tests after each epic complete
- Verify on staging Supabase before proceeding

### 5. **Timezone Awareness**
- Capture user timezone during onboarding (Story 2.3)
- Store in `user_profiles.timezone` (IANA format)
- Use for streak calculation (not in Epics 1-4, but setup for Epic 5)

---

## 🧪 Testing Strategy

**Unit Tests:**
- Each component story has unit test examples
- Test file locations specified in story "Testing" sections
- Use Vitest + React Testing Library (existing setup)

**Integration Tests:**
- Test database operations with real Supabase staging instance
- Test API routes with mock Supabase responses
- Test component integration with API routes

**E2E Tests:**
- `tests/e2e/onboarding-flow.spec.ts` - Epic 2 complete flow
- `tests/e2e/course-navigation.spec.ts` - Epic 3 navigation
- `tests/e2e/lesson-completion.spec.ts` - Epic 4 exercises

**E2E Test Pattern:**
```typescript
test('complete first lesson', async ({ page }) => {
  await page.goto('/login');
  // ... login
  await page.goto('/dashboard');
  await page.click('text=Spanish A1 Course');
  await page.click('text=Lesson 1');
  // ... complete exercises
  await page.click('text=Complete Lesson');
  await expect(page.locator('text=+100 XP')).toBeVisible();
});
```

---

## 🚨 Blockers & Dependencies

### External Dependencies (Install as Needed)
```bash
npm install gray-matter marked @types/marked
```

**gray-matter**: YAML front-matter parsing (Story 1.2)
**marked**: Markdown rendering (Story 3.4)

### Supabase Requirements
- Service role key for parser script (Story 1.2)
- Staging instance access for testing
- Production instance for final deployment

### OpenAI Requirements
- API key for onboarding assessment (Story 2.2, 2.3)
- Reuse existing integration from `/lib/tutor-tools.ts`

---

## 📊 Progress Tracking

**Use TodoWrite for each story:**
```
Story 1.1 (In Progress):
- [x] Create migration file
- [x] Add courses table
- [ ] Add lessons table
- [ ] Add RLS policies
...
```

**Mark stories complete when:**
1. All tasks/subtasks checked off
2. All acceptance criteria met
3. Tests passing (unit + integration)
4. Code reviewed (if applicable)
5. Deployed to staging and verified

---

## 🎯 Definition of Done (Epic 1-4)

**Epic 1 Complete:**
- ✅ Database migration applied to staging
- ✅ 3 sample lessons seeded
- ✅ YAML parser script working

**Epic 2 Complete:**
- ✅ Onboarding flow functional end-to-end
- ✅ New users assessed and profiled
- ✅ Middleware redirect working

**Epic 3 Complete:**
- ✅ Dashboard displays user stats
- ✅ Course navigation working
- ✅ Lesson content renders correctly

**Epic 4 Complete:**
- ✅ Exercises validate server-side
- ✅ XP awarded on correct answers
- ✅ Fill-blank and multiple choice functional

**MVP Ready:**
- All Epics 1-4 complete
- E2E tests passing
- Staging deployment verified
- Ready for user testing

---

## 🔄 Handoff Back to Scrum Master

When complete, provide:

1. **File List:** All files created/modified
2. **Completion Notes:** Any deviations from stories
3. **Known Issues:** Bugs or incomplete items
4. **Testing Results:** Test pass/fail summary
5. **Deployment Status:** Staging URL + verification steps

**Update Each Story:**
- Fill in "Dev Agent Record" section
- Mark "Status" as "Done"
- Add to "Change Log"

---

## 🚀 Ready to Start!

**First Command:**
```bash
# Start with Story 1.1
cat docs/stories/epic-9-course-system/1.1.database-schema.md
```

**Good luck, Dev Agent! Let's ship this thing! 🎉**

---

**Questions?** Ask Scrum Master (Bob) before proceeding if anything unclear.
**Blockers?** Escalate immediately, don't work around story requirements.
**Scope Creep?** Stick to AC and tasks only, no extra features.
