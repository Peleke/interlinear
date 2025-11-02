# Quick Start Guide - Epic 9 Implementation

**For:** Dev Agent
**Created:** 2025-11-02

---

## 🚀 Start Here (5 Minutes)

### Step 1: Read Core Documents
```bash
# Read these in order:
1. docs/stories/epic-9-course-system/DEV-HANDOFF.md          # Your mission
2. docs/stories/epic-9-course-system/EPIC-STORIES-SUMMARY.md # Overview
3. docs/stories/epic-9-course-system/1.1.database-schema.md  # First story
```

### Step 2: Verify Environment
```bash
# Check you have access to:
✓ Supabase staging instance
✓ OpenAI API key (existing, for onboarding AI)
✓ Local development environment running

# Verify:
npm run dev         # Should start on localhost:3000
npm run type-check  # Should pass
npm run test        # Existing tests should pass
```

### Step 3: Install New Dependencies
```bash
npm install gray-matter marked @types/marked
```

---

## 📝 Implementation Checklist

### Epic 1: Database Foundation (START HERE)
- [ ] **Story 1.1**: Create `supabase/migrations/20251102_course_system.sql`
  - [ ] Copy SQL from architecture doc (lines 342-613)
  - [ ] Run migration locally: `supabase db push`
  - [ ] Verify in Supabase dashboard (9 new tables visible)

- [ ] **Story 1.2**: Create `scripts/parse-lessons.ts`
  - [ ] Implement YAML parser
  - [ ] Add npm script: `"seed:lessons": "npx tsx scripts/parse-lessons.ts"`
  - [ ] Test with sample YAML

- [ ] **Story 1.3**: Author 3 sample lessons
  - [ ] Create `lessons/a1/lesson-01.yaml` (Saludos)
  - [ ] Create `lessons/a1/lesson-02.yaml` (Familia)
  - [ ] Create `lessons/a1/lesson-03.yaml` (Números)
  - [ ] Run: `npm run seed:a1`
  - [ ] Verify 3 lessons in Supabase

**Epic 1 Done?** → Database ready, 3 lessons seeded ✅

---

### Epic 2: AI Onboarding
- [ ] **Story 2.1**: Create `app/onboarding/page.tsx`
  - [ ] Create `components/onboarding/GoalSelector.tsx`
  - [ ] Test: Navigate to `/onboarding`, select goals

- [ ] **Story 2.2**: Create `app/onboarding/chat/page.tsx`
  - [ ] Reuse `components/tutor/DialogView.tsx`
  - [ ] Create `lib/prompts/onboarding-assessment.ts`
  - [ ] Test: Chat with AI, 3-5 turns

- [ ] **Story 2.3**: Create API routes
  - [ ] `app/api/onboarding/assess/route.ts`
  - [ ] `app/api/onboarding/complete/route.ts`
  - [ ] Test: POST to both endpoints

- [ ] **Story 2.4**: Update `middleware.ts`
  - [ ] Add onboarding_completed check
  - [ ] Test: Login redirects to onboarding if incomplete

**Epic 2 Done?** → Onboarding flow working end-to-end ✅

---

### Epic 3: Course Navigation
- [ ] **Story 3.5**: Create card components FIRST
  - [ ] `components/courses/CourseCard.tsx`
  - [ ] `components/lessons/LessonCard.tsx`
  - [ ] `components/courses/ProgressBar.tsx`

- [ ] **Story 3.1**: Create `app/dashboard/page.tsx`
  - [ ] Create `components/dashboard/StatsWidget.tsx`
  - [ ] Create `lib/services/profile.ts`
  - [ ] Test: Dashboard shows XP/streak

- [ ] **Story 3.2**: Create `app/courses/page.tsx`
  - [ ] Create `components/courses/CourseList.tsx`
  - [ ] Test: Course list with level filter

- [ ] **Story 3.3**: Create `app/courses/[id]/page.tsx`
  - [ ] Create `components/courses/LessonList.tsx`
  - [ ] Test: Lesson list with progress

- [ ] **Story 3.4**: Create `app/lessons/[id]/page.tsx`
  - [ ] Create `components/lessons/LessonContent.tsx`
  - [ ] Create `components/lessons/GrammarSection.tsx`
  - [ ] Create `components/lessons/VocabularySection.tsx`
  - [ ] Test: Lesson content renders Markdown

**Epic 3 Done?** → Full course navigation working ✅

---

### Epic 4: Interactive Exercises
- [ ] **Story 4.1**: Create `app/api/exercises/[id]/validate/route.ts`
  - [ ] Server-side validation logic
  - [ ] XP award on correct answer
  - [ ] Test: POST with correct/incorrect answers

- [ ] **Story 4.2**: Create `components/exercises/FillBlankExercise.tsx`
  - [ ] Input field with submit
  - [ ] Call validation API
  - [ ] Test: Complete fill-blank exercise

- [ ] **Story 4.3**: Create `components/exercises/MultipleChoiceExercise.tsx`
  - [ ] Option selection UI
  - [ ] Call validation API
  - [ ] Test: Complete multiple choice

- [ ] **Story 4.4**: Create `components/exercises/ExerciseResult.tsx`
  - [ ] Success/error messaging
  - [ ] Celebration animation
  - [ ] Test: Render success and error states

**Epic 4 Done?** → Exercises functional with XP awards ✅

---

## ✅ Final Verification

Run this E2E test manually:

```
1. Sign up new user
2. Complete onboarding (select goals, chat with AI)
3. Redirected to dashboard (see XP/streak widgets)
4. Click course card → view lesson list
5. Click lesson → view content (Markdown, grammar, vocab)
6. Complete fill-blank exercise → earn 10 XP
7. Complete multiple choice exercise → earn 10 XP
8. See XP update in real-time
9. Navigate back to dashboard → progress updated
```

**All steps work?** → MVP COMPLETE! 🎉

---

## 🆘 If You Get Stuck

**Database Issues?**
- Check Supabase connection: `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- Verify RLS policies in Supabase dashboard
- Check migration applied: Query `courses` table

**TypeScript Errors?**
- Run: `npm run type-check`
- Check types defined in `types/` directory
- Verify imports match file structure

**API Route Not Working?**
- Check authentication: `supabase.auth.getSession()`
- Verify request body format
- Check server logs: `npm run dev` output

**Component Not Rendering?**
- Verify Server vs Client Component (`'use client'`)
- Check props passed correctly
- Inspect browser console for errors

---

## 📞 Escalation

**Can't proceed?** Ask Scrum Master (user) before:
- Deviating from story AC
- Skipping tests
- Adding features not in stories
- Changing architecture decisions

**Ready to ship?** Report back with:
- All files created/modified
- Test results
- Staging deployment verification
- Any known issues

---

**Good luck! Start with Story 1.1 and work sequentially through Epic 1. 🚀**
