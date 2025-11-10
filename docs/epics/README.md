# Epic & Story Breakdown: Lesson Authoring System

**Project**: Incremental Lesson Creation + Vocabulary Integration
**Date Created**: 2025-11-06
**Status**: Planning → Ready for Implementation

---

## Epic Overview

This breakdown organizes the complete lesson authoring system into manageable epics and user stories.

### Documentation Structure
```
docs/epics/
├── README.md (this file)
├── EPIC-01-database-foundation.md
├── EPIC-02-vocabulary-integration.md
├── EPIC-03-lesson-crud-api.md
├── EPIC-04-authoring-ui.md
├── EPIC-05-content-builders.md
├── EPIC-06-publish-workflow.md
└── EPIC-07-learner-integration.md
```

### Epic Dependency Graph
```
┌─────────────────────────────────────────┐
│ EPIC-01: Database Foundation           │
│ (Schema, RLS, Triggers)                 │
└─────────────────┬───────────────────────┘
                  │
         ┌────────┴────────┐
         ↓                 ↓
┌────────────────┐  ┌─────────────────────┐
│ EPIC-02:       │  │ EPIC-03:            │
│ Vocabulary     │  │ Lesson CRUD API     │
│ Integration    │  │ (Backend Routes)    │
└────────┬───────┘  └──────┬──────────────┘
         │                 │
         └────────┬────────┘
                  ↓
         ┌────────────────────┐
         │ EPIC-04:           │
         │ Authoring UI       │
         │ (Core Interface)   │
         └────────┬───────────┘
                  ↓
         ┌────────────────────┐
         │ EPIC-05:           │
         │ Content Builders   │
         │ (Dialog, Vocab,    │
         │  Grammar, Exercise)│
         └────────┬───────────┘
                  ↓
         ┌────────────────────┐
         │ EPIC-06:           │
         │ Publish Workflow   │
         │ (Validation, Preview)│
         └────────┬───────────┘
                  ↓
         ┌────────────────────┐
         │ EPIC-07:           │
         │ Learner Integration│
         │ (Completion, Vocab)│
         └────────────────────┘
```

---

## Epic Summary

| Epic | Title | Stories | Priority | Est. Points | Status |
|------|-------|---------|----------|-------------|--------|
| EPIC-01 | Database Foundation | 5 | P0 | 13 | 📋 Planned |
| EPIC-02 | Vocabulary Integration | 6 | P0 | 21 | 📋 Planned |
| EPIC-03 | Lesson CRUD API | 8 | P0 | 21 | 📋 Planned |
| EPIC-04 | Authoring UI Core | 7 | P0 | 13 | 📋 Planned |
| EPIC-05 | Content Builders | 12 | P0 | 34 | 📋 Planned |
| EPIC-06 | Publish Workflow | 5 | P1 | 13 | 📋 Planned |
| EPIC-07 | Learner Integration | 4 | P1 | 8 | 📋 Planned |

**Total**: 47 stories, ~123 story points

---

## Implementation Phases

### Phase 1: Foundation (EPIC-01, EPIC-02)
**Goal**: Database schema + vocabulary system ready
**Duration**: ~1 week
**Deliverable**: Migrations applied, vocab API working

### Phase 2: Backend (EPIC-03)
**Goal**: All lesson CRUD endpoints functional
**Duration**: ~1 week
**Deliverable**: API complete with tests

### Phase 3: Frontend Core (EPIC-04, EPIC-05)
**Goal**: Authoring interface with content builders
**Duration**: ~2 weeks
**Deliverable**: Can create/edit lessons with all components

### Phase 4: Polish (EPIC-06, EPIC-07)
**Goal**: Publish workflow + learner experience
**Duration**: ~1 week
**Deliverable**: End-to-end authoring → learning flow

**Total Timeline**: ~5 weeks (MVP)

---

## Story Point Legend

- **1 point**: < 2 hours (trivial change)
- **2 points**: 2-4 hours (small feature)
- **3 points**: 4-8 hours (medium feature)
- **5 points**: 1-2 days (large feature)
- **8 points**: 2-3 days (complex feature)
- **13 points**: 3-5 days (epic-level feature)

---

## Acceptance Criteria Standards

All stories must include:
- **Given/When/Then** format
- **Test coverage requirements** (unit + integration)
- **Documentation requirements** (inline + user-facing)
- **Success metrics** (quantifiable outcomes)

---

## Links

- [Implementation Spec](../../claudedocs/lesson_authoring_implementation_spec.md)
- [Vocabulary Integration Spec](../../claudedocs/vocabulary_integration_spec.md)
- [UX Flows](../../claudedocs/lesson_authoring_interaction_flows.md)
- [Product Vision](../../claudedocs/README_product_vision.md)
