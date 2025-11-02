# PRD: Course & Gamification System with AI Onboarding

**Version:** 2.0
**Date:** 2025-11-02
**Timeline:** 1.5 days (MVP) + Month 1 (expansion)
**Status:** Ready for Implementation

---

## Executive Summary

Transform Interlinear from a reading tool into a **complete adaptive language learning platform** by adding structured courses, gamified progression, and AI-powered onboarding. Users will experience personalized placement, guided lessons with grammar instruction, interactive exercises, and XP-based progression—all while leveraging existing reader, flashcard, and tutor features.

**Core Value:** Structured learning path with measurable progress and adaptive personalization.

---

## Problem Statement

**Current State:**
- Users have powerful reading tools but no guided curriculum
- No clear progression path or learning structure
- Difficult for beginners to know where to start
- No feedback loop or motivation system for continued engagement

**Impact:**
- Users abandon after initial exploration (no retention hook)
- Beginners feel overwhelmed without structure
- No data on user progress or weak areas for adaptive support

---

## Proposed Solution

A **Course & Gamification System** that:

1. **AI Onboarding:** Assesses level and goals through conversational placement test
2. **Structured Courses:** Lessons with grammar points, vocabulary, exercises, and readings
3. **Gamification:** XP, streaks, mastery tracking for engagement
4. **Integration:** Seamlessly connects to existing reader, tutor, and flashcards
5. **Extensibility:** YAML-based authoring for easy content expansion

---

## Target Users

**Primary:** Spanish learners (A1-B1) seeking structured guidance
- Learning for travel, conversation, heritage, or general skill-building
- Need clear progression and motivation
- Value AI-powered personalization

**Secondary:** Self-directed learners wanting flexible practice
- Use courses as scaffolding around reading practice
- Appreciate gamification but prioritize content quality

---

## Epic Breakdown

### **Epic 0: AI Onboarding Flow** ⏱️ 4 hours
**User Story:** As a new user, I want personalized course recommendation based on my level and goals.

**Features:**
- Welcome screen with goal selection (travel, work, heritage, conversation, academic)
- AI placement chat (3-5 turn conversation assessing grammar/vocab)
- Level assignment (A1, A2, B1)
- Course recommendation based on level + goals
- Profile creation with onboarding data stored

**Acceptance Criteria:**
- New user completes onboarding in <3 minutes
- AI correctly assesses basic level distinctions (A1 vs A2)
- User lands in recommended course with "Recommended for you" badge

---

### **Epic 1: Data Foundation** ⏱️ 4 hours
**User Story:** As a developer, I need schemas for courses, lessons, and user progress.

**Features:**
- Supabase schema design (courses, lessons, grammar_points, exercises, user_profiles)
- YAML authoring format for lessons (front-matter + Markdown)
- Parser script: YAML → Supabase
- 3 sample A1 lessons authored
- 1 A1 course definition

**Acceptance Criteria:**
- All tables have RLS policies
- YAML parser validates structure and inserts correctly
- Sample data seeds successfully

---

### **Epic 2: Course Navigation UI** ⏱️ 5 hours
**User Story:** As a learner, I want to browse courses and view lesson content.

**Features:**
- `/courses` page - Course cards with metadata
- `/courses/[id]` page - Lesson list with progress
- `/lessons/[id]` page - Lesson viewer (Markdown + grammar + vocab)
- Responsive mobile design
- Loading states and transitions

**Acceptance Criteria:**
- Can navigate course → lesson → back
- Lesson content renders cleanly (Markdown + structured sections)
- Mobile-friendly horizontal scroll for tabs

---

### **Epic 3: Gamification Core** ⏱️ 4 hours
**User Story:** As a learner, I want visible progress tracking and rewards.

**Features:**
- XP system (100 XP per lesson, 10 XP per exercise)
- Streak counter (daily activity tracking)
- User profile dashboard widgets (XP bar, streak, level)
- "Complete Lesson" button with XP award
- Toast notifications for XP gains

**Acceptance Criteria:**
- XP persists to Supabase in real-time
- Streak increments on first activity of day
- Dashboard updates immediately after XP award

---

### **Epic 4: Exercise System** ⏱️ 3 hours
**User Story:** As a learner, I want interactive practice to reinforce grammar.

**Features:**
- Fill-in-blank exercise component
- Multiple-choice exercise component
- Exercise validation and immediate feedback
- Partial XP awards (10 XP per correct answer)
- 2-3 exercises per lesson

**Acceptance Criteria:**
- Exercises validate answers correctly
- Incorrect answers show expected answer
- XP awards on correct submission

---

### **Epic 5: Integration Layer** ⏱️ 2 hours
**User Story:** As a learner, I want seamless flow between courses and existing tools.

**Features:**
- "Practice Reading" button → existing `/reader` with recommended text
- "Ask Tutor" button → existing `/tutor` with grammar context
- Auto-create flashcards from lesson vocabulary
- Lesson completion updates user vocabulary graph

**Acceptance Criteria:**
- Reader opens with correct text pre-loaded
- Tutor chat seeds with lesson grammar points
- Flashcards appear in user's deck automatically

---

### **Epic 6: Polish & Deploy** ⏱️ 2 hours
**User Story:** As a user, I want a polished, production-ready experience.

**Features:**
- Page transitions and animations
- Mobile-responsive course cards
- Loading states throughout
- Toast notifications for achievements
- Final QA and staging deploy

**Acceptance Criteria:**
- No console errors
- Mobile navigation smooth
- All flows tested end-to-end

---

## User Flows

### **Flow 1: New User Onboarding**
```
Sign up → Welcome screen → Select goals → AI placement chat →
Level assessment → Course recommendation → Dashboard → Lesson 1
```

### **Flow 2: Complete First Lesson**
```
Dashboard → Course card → Lesson 1 → Read grammar →
Try exercise → Get XP → Practice reading → Ask tutor →
Complete lesson → +100 XP → Streak +1 → Next lesson unlocks
```

### **Flow 3: Daily Return**
```
Login → Dashboard shows streak → Continue last lesson →
Complete exercise → XP update → Review flashcards
```

---

## Technical Architecture

### **Stack**
- **Frontend:** Next.js 15 (existing)
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **AI:** OpenAI GPT-4 (existing integration)
- **Storage:** Supabase for all data
- **Deployment:** Google Cloud Run (staging already live)

### **Database Schema**
```sql
courses (id, title, description, level, xp_total)
lessons (id, course_id, title, overview, xp_value, sequence_order)
grammar_points (id, name, overview, examples[])
lesson_grammar_points (lesson_id, grammar_point_id)
exercises (id, lesson_id, type, prompt, answer, options[], xp_value)
user_profiles (user_id, xp, streak, level, last_activity_date, goals[], assessed_level, onboarding_completed)
lesson_completions (user_id, lesson_id, xp_earned, completed_at)
exercise_attempts (user_id, exercise_id, is_correct, xp_earned)
grammar_mastery (user_id, grammar_point_id, confidence, last_practiced)
```

### **YAML Lesson Format**
```yaml
---
id: lesson_a1_01
title: "Saludos y Presentaciones"
level: A1
xp_value: 100
grammar_points:
  - id: gp_ser_present
    name: "El verbo SER"
    examples: ["Yo soy estudiante", "Ella es de México"]
vocabulary:
  - {word: "hola", translation: "hello"}
exercises:
  - {type: fill_blank, prompt: "Yo ___ estudiante", answer: "soy"}
---
[Markdown lesson content]
```

---

## Success Metrics

### **MVP Success (1.5 days)**
- ✅ Onboarding flow functional
- ✅ 3 lessons viewable and completable
- ✅ XP/streak system working
- ✅ Integration with reader/tutor operational
- ✅ Deployed to staging

### **User Success (Month 1)**
- 70% onboarding completion rate
- 40% complete first lesson
- 20% complete 3+ lessons
- 5-day average streak for active users

---

## Implementation Phases

### **Day 1 (8 hours)**
- Hour 0-4: Data foundation (schema + YAML parser + seed data)
- Hour 4-8: Onboarding flow (welcome + AI chat + profile creation)

### **Day 2 (12 hours)**
- Hour 0-4: Course navigation UI (dashboard + lesson viewer)
- Hour 4-7: Gamification (XP/streak system)
- Hour 7-9: Exercises (fill-blank + validation)
- Hour 9-10: Integration (reader/tutor links)
- Hour 10-12: Polish + deploy

---

## Future Roadmap (Month 1)

**Phase 2 Features:**
- Real pronunciation scoring (Whisper STT + phoneme analysis)
- Adaptive lesson generation (LLM creates new exercises from templates)
- Spaced repetition for grammar review
- Badge system (visual achievements)
- Leaderboards (optional social layer)

**Phase 3 Features:**
- Course authoring UI (web-based lesson creator)
- Analytics dashboard (time-per-grammar-point, weak areas)
- Multi-turn dialog scenarios (structured conversations)
- Daily quests (auto-generated from weakness matrix)

---

## Open Questions

- [ ] Should we include audio assets in lessons (TTS for examples)?
- [ ] Do we need admin dashboard for manual course curation?
- [ ] Should streak freeze on weekends?
- [ ] Leaderboard privacy settings?

---

## Next Steps

1. **Architecture Review:** Load system-architect agent to validate schema design
2. **Implementation:** Begin Epic 0 (onboarding flow)
3. **Testing:** Create Playwright tests for critical paths
4. **Deployment:** Staging → production after QA

---

**Ready for handoff to system-architect for technical validation and implementation planning.**
