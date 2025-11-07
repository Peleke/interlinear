# Lesson Authoring: Implementation Roadmap

**Date Created**: 2025-11-06
**PM Agent**: Planning Complete
**Status**: ✅ Ready for Implementation

---

## 🎯 Quick Start

**Start Here**:
1. Read [Epic Overview](./README.md)
2. Review [EPIC-01: Database Foundation](./EPIC-01-database-foundation.md)
3. Begin implementation with first migration

**Estimated Timeline**: 6 weeks (MVP - includes Week 0 testing infrastructure)
**Total Work**: 8 epics, 52 stories, ~168 story points

---

## 📊 Epic Breakdown

| Epic | Title | Stories | Points | Status |
|------|-------|---------|--------|--------|
| [EPIC-00](./EPIC-00-Testing-Infrastructure.md) | Testing Infrastructure Foundation | 8 | 45 | 📋 Planned |
| [EPIC-01](./EPIC-01-database-foundation.md) | Database Foundation | 5 | 13 | ✅ Complete |
| [EPIC-02](./EPIC-02-vocabulary-integration.md) | Vocabulary Integration | 6 | 21 | 📋 Planned |
| [EPIC-03](./EPIC-03-lesson-crud-api.md) | Lesson CRUD API | 8 | 21 | 📋 Planned |
| [EPIC-04](./EPIC-04-authoring-ui-core.md) | Authoring UI Core | 6 | 13 | 📋 Planned |
| [EPIC-05](./EPIC-05-content-builders.md) | Content Builders | 11 | 34 | 📋 Planned |
| [EPIC-06](./EPIC-06-publish-workflow.md) | Publish Workflow | 4 | 13 | 📋 Planned |
| [EPIC-07](./EPIC-07-learner-integration.md) | Learner Integration | 4 | 8 | 📋 Planned |

**Total**: 8 epics, 52 stories, ~168 story points

---

## 🗓️ Week-by-Week Plan

### Week 0: Testing Infrastructure (EPIC-00) - **PRIORITY**
**Goal**: Automated E2E testing foundation

**Critical Path** (Stories 1-4, complete first):
- [ ] EPIC-00.1: Test User Factory & Supabase Service Client (5pts) - [#14](https://github.com/Peleke/interlinear/issues/14)
- [ ] EPIC-00.2: Auth Setup Enhancement (3pts) - [#15](https://github.com/Peleke/interlinear/issues/15)
- [ ] EPIC-00.3: Database State Management (8pts) - [#16](https://github.com/Peleke/interlinear/issues/16)
- [ ] EPIC-00.4: Test Environment Configuration (3pts) - [#17](https://github.com/Peleke/interlinear/issues/17)

**Secondary** (Can proceed in parallel after critical path):
- [ ] EPIC-00.5: Shared Test Fixtures & Utilities (5pts) - [#18](https://github.com/Peleke/interlinear/issues/18)
- [ ] EPIC-00.6: Page Object Models (8pts) - [#19](https://github.com/Peleke/interlinear/issues/19)
- [ ] EPIC-00.7: API Route Testing Framework (5pts) - [#20](https://github.com/Peleke/interlinear/issues/20)
- [ ] EPIC-00.8: CI/CD Integration (8pts) - [#21](https://github.com/Peleke/interlinear/issues/21)

**Deliverable**: ✅ Zero manual setup for tests, automated user creation/cleanup, tests run in CI

**Why Week 0?** This infrastructure unblocks testing for ALL feature epics. Without it, we can't write reliable E2E tests or enforce testing in PRs.

---

### Week 1: Foundation (EPIC-01, EPIC-02)
**Goal**: Database schema + vocabulary system

**Tasks**:
- [ ] EPIC-01.1: Lesson status & authorship schema (5pts)
- [ ] EPIC-01.2: Multi-language support schema (3pts)
- [ ] EPIC-01.3: Author permission RLS policies (3pts)
- [ ] EPIC-01.4: Component table RLS updates (2pts)
- [ ] EPIC-02.1: Lesson vocabulary language support (3pts)
- [ ] EPIC-02.2: User vocabulary lesson tracking (3pts)
- [ ] EPIC-02.3: Usage count trigger (2pts)
- [ ] EPIC-02.6: Migration & backfill (5pts)

**Deliverable**: ✅ Migrations applied, RLS tested, vocab tracking functional

---

### Week 2: Backend (EPIC-03 + EPIC-02 APIs)
**Goal**: All lesson CRUD endpoints

**Tasks**:
- [ ] EPIC-02.4: Vocabulary autocomplete API (5pts)
- [ ] EPIC-02.5: VocabularyService language support (3pts)
- [ ] EPIC-03.1: Create draft lesson (3pts)
- [ ] EPIC-03.2: Get lesson with components (3pts)
- [ ] EPIC-03.3: Update lesson metadata (2pts)
- [ ] EPIC-03.4: Delete draft lesson (2pts)
- [ ] EPIC-03.5: List user's lessons (3pts)
- [ ] EPIC-03.6: Dialog management (2pts)
- [ ] EPIC-03.7: Vocabulary management (3pts)
- [ ] EPIC-03.8: Grammar/Exercise/Reading management (3pts)

**Deliverable**: ✅ API complete with >90% test coverage

---

### Week 3: Frontend Core (EPIC-04)
**Goal**: Authoring interface skeleton

**Tasks**:
- [ ] EPIC-04.1: MyLessons dashboard (3pts)
- [ ] EPIC-04.2: New lesson modal (2pts)
- [ ] EPIC-04.3: Lesson editor layout (3pts)
- [ ] EPIC-04.4: Metadata panel (2pts)
- [ ] EPIC-04.5: Auto-save functionality (2pts)
- [ ] EPIC-04.6: Status management UI (1pt)

**Deliverable**: ✅ Can navigate authoring UI, create/edit lessons

---

### Week 4: Content Builders (EPIC-05)
**Goal**: All content creation interfaces

**Tasks**:
- [ ] EPIC-05.1: Dialog builder - list view (3pts)
- [ ] EPIC-05.2: Dialog builder - edit view (5pts)
- [ ] EPIC-05.3: Vocabulary manager - autocomplete (5pts)
- [ ] EPIC-05.4: Vocabulary manager - quick add (3pts)
- [ ] EPIC-05.5: Vocabulary manager - list view (2pts)
- [ ] EPIC-05.6: Grammar concept selector (3pts)
- [ ] EPIC-05.7: Exercise builder - fill-in-blank (3pts)
- [ ] EPIC-05.8: Exercise builder - multiple choice (3pts)
- [ ] EPIC-05.9: Exercise builder - translation (3pts)
- [ ] EPIC-05.10: Exercise builder - list & CRUD (2pts)
- [ ] EPIC-05.11: Reading linker (2pts)

**Deliverable**: ✅ Can author complete lesson with all components

---

### Week 5: Polish (EPIC-06, EPIC-07)
**Goal**: Publish workflow + learner integration

**Tasks**:
- [ ] EPIC-06.1: Publish validation (3pts)
- [ ] EPIC-06.2: Quality score calculator (5pts)
- [ ] EPIC-06.3: Preview mode (3pts)
- [ ] EPIC-06.4: Publish action (2pts)
- [ ] EPIC-07.1: Published lesson visibility (2pts)
- [ ] EPIC-07.2: Lesson completion API (3pts)
- [ ] EPIC-07.3: User vocabulary attribution (2pts)
- [ ] EPIC-07.4: Spaced repetition opportunity (1pt)

**Deliverable**: ✅ End-to-end flow: Author → Publish → Learner → Complete → Vocab

---

## 🎯 Success Criteria

### Technical Metrics
- [ ] All migrations reversible (zero data loss)
- [ ] API response time <100ms (p95)
- [ ] UI interactions <200ms
- [ ] Test coverage: Backend >90%, Frontend >80%
- [ ] RLS policies enforce draft visibility
- [ ] Autocomplete performance <100ms

### User Experience Metrics
- [ ] Time to create lesson: <15min (quick creation flow)
- [ ] Vocab reuse: 30% reduction in duplicates
- [ ] Auto-vocab tracking: 100% (vs manual clicking)
- [ ] Quality score encourages >70% completeness
- [ ] Spanish + Icelandic courses both functional

### Acceptance Criteria
- [ ] Can create draft lesson with minimal data (title only)
- [ ] Can add all component types (dialogs, vocab, grammar, exercises, readings)
- [ ] Autocomplete shows vocab reuse ("Used in 5 lessons")
- [ ] Publish validation prevents incomplete lessons
- [ ] Preview mode renders lesson as learner sees it
- [ ] Published lessons visible to all learners
- [ ] Lesson completion auto-populates user vocabulary

---

## 📁 Documentation Structure

```
docs/
├── epics/
│   ├── README.md (this overview)
│   ├── IMPLEMENTATION_ROADMAP.md (you are here)
│   ├── EPIC-01-database-foundation.md
│   ├── EPIC-02-vocabulary-integration.md
│   ├── EPIC-03-lesson-crud-api.md
│   ├── EPIC-04-authoring-ui-core.md
│   ├── EPIC-05-content-builders.md
│   ├── EPIC-06-publish-workflow.md
│   └── EPIC-07-learner-integration.md
├── pdca/
│   └── lesson-authoring/
│       ├── plan.md (PDCA planning doc)
│       ├── do.md (TBD - implementation log)
│       ├── check.md (TBD - results analysis)
│       └── act.md (TBD - lessons learned)
└── claudedocs/ (existing specs)
    ├── lesson_authoring_implementation_spec.md
    ├── vocabulary_integration_spec.md
    ├── lesson_authoring_interaction_flows.md
    └── README_product_vision.md
```

---

## 🚀 Getting Started

### Step 1: Review Documentation
- [ ] Read [Epic Overview](./README.md)
- [ ] Read [PDCA Plan](../pdca/lesson-authoring/plan.md)
- [ ] Review [Vocabulary Integration Spec](../../claudedocs/vocabulary_integration_spec.md)

### Step 2: Environment Setup
- [ ] Local Supabase running
- [ ] Node.js & dependencies installed
- [ ] Test database ready for migrations

### Step 3: Start EPIC-01
- [ ] Create migration file: `supabase/migrations/YYYYMMDD_lesson_authoring_foundation.sql`
- [ ] Implement schema changes (status, author_id, language)
- [ ] Apply migration locally
- [ ] Test RLS policies with multiple users

### Step 4: Track Progress
- [ ] Update story status in epic markdown files
- [ ] Log implementation progress in `docs/pdca/lesson-authoring/do.md`
- [ ] Create checklists for recurring validation tasks

---

## 🎓 Learning Objectives

### Technical Skills
- Supabase RLS policy design
- Multi-language schema architecture
- Linked data modeling (vocabulary integration)
- React form builder patterns
- Autocomplete with debouncing

### Product Skills
- Draft-first authoring workflows
- Quality encouragement without gatekeeping
- Incremental content creation UX
- Vocabulary intelligence & reuse patterns

---

## ⚠️ Risk Mitigation

### High Priority Risks
1. **RLS Policy Errors** (Critical Impact)
   - Mitigation: Comprehensive multi-user testing
   - Validation: Security audit before production

2. **Migration Data Loss** (High Impact)
   - Mitigation: Backfill scripts + rollback plans
   - Validation: Test on production-sized dataset

3. **Scope Creep** (Medium Impact)
   - Mitigation: Strict P0/P1 discipline
   - Validation: User feedback only after MVP

---

## 📞 Questions or Blockers?

**For Clarification**:
- Review [Implementation Spec](../../claudedocs/lesson_authoring_implementation_spec.md)
- Review [UX Flows](../../claudedocs/lesson_authoring_interaction_flows.md)
- Check epic-specific acceptance criteria

**For Technical Decisions**:
- Consult [PDCA Plan](../pdca/lesson-authoring/plan.md) for architecture rationale
- Review risk mitigation strategies

**For Progress Tracking**:
- Update epic markdown files with ✅ or 🚧
- Log in `docs/pdca/lesson-authoring/do.md`

---

**Let's build this! 🚀**
