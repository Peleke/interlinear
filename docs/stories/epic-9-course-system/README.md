# Epic 9: Course & Gamification System

**Epic Owner:** Scrum Master (Bob)
**Status:** Ready for Implementation
**Timeline:** 24 hours (Epics 1-4: 16 hours)
**Based on:** `docs/prd/course-gamification-system.md` + `docs/architecture-v2-course-system.md`

---

## Epic Overview

Transform Interlinear from a reading tool into a complete adaptive language learning platform by adding:
- Structured courses with grammar lessons
- Gamified progression (XP, streaks, levels)
- AI-powered onboarding and placement
- Interactive exercises with validation
- Seamless integration with existing reader/tutor/flashcard features

---

## Epic Breakdown

### **Epic 1: Database Foundation & Content Authoring** ⏱️ 4 hours
Database schema, YAML lesson parser, sample content authoring

**Stories:**
- 1.1: Database Schema Migration
- 1.2: YAML Lesson Parser
- 1.3: Sample Course Content Authoring

---

### **Epic 2: AI Onboarding Flow** ⏱️ 4 hours
Welcome screen, AI assessment, level placement, profile creation

**Stories:**
- 2.1: Welcome & Goal Selection Page
- 2.2: AI Assessment Chat
- 2.3: Onboarding API Routes
- 2.4: Onboarding Middleware Redirect

---

### **Epic 3: Course Navigation & Lesson Viewer** ⏱️ 5 hours
Dashboard, course list, lesson list, lesson content viewer

**Stories:**
- 3.1: Dashboard Page with Course Overview
- 3.2: Course List Page
- 3.3: Lesson List Page
- 3.4: Lesson Viewer Page
- 3.5: Course & Lesson Card Components

---

### **Epic 4: Interactive Exercise System** ⏱️ 3 hours
Exercise components, validation API, feedback UI

**Stories:**
- 4.1: Exercise Validation API
- 4.2: Fill-in-Blank Exercise Component
- 4.3: Multiple Choice Exercise Component
- 4.4: Exercise Result Feedback UI

---

## Story Files

All story files are located in `docs/stories/epic-9-course-system/`:

- `1.1.database-schema.md`
- `1.2.yaml-parser.md`
- `1.3.sample-content.md`
- `2.1.welcome-page.md`
- `2.2.ai-chat.md`
- `2.3.onboarding-api.md`
- `2.4.onboarding-middleware.md`
- `3.1.dashboard.md`
- `3.2.course-list.md`
- `3.3.lesson-list.md`
- `3.4.lesson-viewer.md`
- `3.5.course-lesson-cards.md`
- `4.1.exercise-api.md`
- `4.2.fill-blank-component.md`
- `4.3.multiple-choice-component.md`
- `4.4.exercise-feedback.md`

---

## Success Criteria

**MVP Success (Epics 1-4 Complete):**
- ✅ Database schema deployed to Supabase
- ✅ 3 sample A1 lessons authored and seeded
- ✅ Onboarding flow functional (welcome → AI chat → placement)
- ✅ Course/lesson navigation working
- ✅ Lessons viewable with grammar/vocab sections
- ✅ Interactive exercises validate and provide feedback
- ✅ All components mobile-responsive

**Ready for Epic 5 (Gamification):** XP/streak system, progress tracking widgets
