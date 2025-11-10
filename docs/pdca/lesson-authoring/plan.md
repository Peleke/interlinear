# Plan: Lesson Authoring System

**Date**: 2025-11-06
**Author**: PM Agent
**Status**: Planning Complete → Ready for Implementation

---

## Hypothesis

**What**: Build an incremental lesson authoring system with vocabulary integration
**Why**: Enable content creation as you study/teach, support Icelandic course development
**Approach**: Draft-first workflow with linked vocabulary (Option B)

---

## Expected Outcomes (Quantitative)

### Technical Metrics
- **Implementation Time**: ~5 weeks (MVP)
  - Phase 1 (Foundation): 1 week
  - Phase 2 (Backend): 1 week
  - Phase 3 (Frontend): 2 weeks
  - Phase 4 (Polish): 1 week
- **Test Coverage**: ≥90% (backend), ≥80% (frontend)
- **Performance**: API responses <100ms, UI interactions <200ms
- **Database**: All migrations reversible, zero data loss

### User Experience Metrics
- **Time to Create Lesson**: <15min (quick creation flow)
- **Vocabulary Reuse**: 30% reduction in duplicate vocab entries
- **Auto-Vocab Tracking**: 100% (vs manual clicking)
- **Quality Score**: Encourage >70% completeness

---

## Architecture Overview

### 7 Epics Breakdown

| Epic | Stories | Points | Priority | Dependencies |
|------|---------|--------|----------|--------------|
| EPIC-01: Database Foundation | 5 | 13 | P0 | None |
| EPIC-02: Vocabulary Integration | 6 | 21 | P0 | EPIC-01 |
| EPIC-03: Lesson CRUD API | 8 | 21 | P0 | EPIC-01, EPIC-02 |
| EPIC-04: Authoring UI Core | 6 | 13 | P0 | EPIC-03 |
| EPIC-05: Content Builders | 11 | 34 | P0 | EPIC-04 |
| EPIC-06: Publish Workflow | 4 | 13 | P1 | EPIC-05 |
| EPIC-07: Learner Integration | 4 | 8 | P1 | EPIC-06 |

**Total**: 44 stories, ~123 story points

### Dependency Flow
```
EPIC-01 (Foundation)
  ↓
  ├─→ EPIC-02 (Vocabulary)
  └─→ EPIC-03 (API)
       ↓
    EPIC-04 (UI Core)
       ↓
    EPIC-05 (Content Builders)
       ↓
    EPIC-06 (Publish)
       ↓
    EPIC-07 (Learner Integration)
```

---

## Key Technical Decisions

### 1. Vocabulary Integration: Option B (Linked Vocabulary)
**Decision**: Connect lesson vocab ↔ user vocab with language support
**Rationale**:
- Enables vocab reuse intelligence ("Used in 5 lessons")
- Auto-populates user vocabulary on lesson completion
- Multi-language support (Spanish, Icelandic)
- Migration path to Option C (Master Vocabulary Database) preserved

**Alternative Considered**: Option A (Keep Separate) - rejected due to duplication and missed intelligence opportunities

### 2. Draft-First Workflow
**Decision**: Allow lesson creation with minimal data (title only)
**Rationale**:
- Supports incremental authoring ("document as you study")
- Reduces friction for content creators
- Nullable `overview` field enables flexibility

### 3. RLS-Based Permissions
**Decision**: Use Supabase RLS for draft visibility control
**Rationale**:
- Database-level security (cannot bypass with API)
- Author sees own drafts, everyone sees published
- Minimal application logic required

### 4. Quality Score (Not Validation)
**Decision**: Encourage completeness without blocking publish
**Rationale**:
- MVP lessons (1 component) still valuable
- Quality score guides improvement
- Avoids gatekeeping legitimate use cases

---

## Risks & Mitigation

### Risk 1: Migration Complexity
**Risk**: Vocabulary schema changes could cause data loss
**Mitigation**:
- Backfill existing data to language='es'
- Test migrations on production-sized dataset
- Rollback scripts prepared
- **Probability**: Low | **Impact**: High

### Risk 2: Autocomplete Performance
**Risk**: Vocab search slow with 1000+ items
**Mitigation**:
- Database indexes on spanish, english, language
- Query optimization (ILIKE with limits)
- Debounced search (300ms)
- **Probability**: Medium | **Impact**: Medium

### Risk 3: Scope Creep
**Risk**: Feature requests expand beyond MVP
**Mitigation**:
- Clear P0 vs P1 prioritization
- Epic/story discipline (acceptance criteria)
- User feedback only after MVP
- **Probability**: High | **Impact**: Medium

### Risk 4: RLS Policy Errors
**Risk**: Draft lessons leak to non-authors
**Mitigation**:
- Comprehensive RLS tests (multiple users)
- Security audit before production
- Monitoring for unauthorized access
- **Probability**: Low | **Impact**: Critical

---

## Implementation Phases

### Phase 1: Foundation (EPIC-01, EPIC-02) - Week 1
**Goal**: Database schema + vocabulary system ready
**Deliverables**:
- [ ] Migrations applied (status, author_id, language)
- [ ] RLS policies tested
- [ ] Vocabulary integration complete
- [ ] Autocomplete API functional

**Success Criteria**: Can create draft lessons, autocomplete shows vocab reuse

---

### Phase 2: Backend (EPIC-03) - Week 2
**Goal**: All lesson CRUD endpoints functional
**Deliverables**:
- [ ] 8 API endpoint groups implemented
- [ ] Integration tests (>90% coverage)
- [ ] OpenAPI documentation
- [ ] Error handling standardized

**Success Criteria**: Postman/Thunder Client can perform full lesson CRUD workflow

---

### Phase 3: Frontend Core (EPIC-04, EPIC-05) - Weeks 3-4
**Goal**: Authoring interface with content builders
**Deliverables**:
- [ ] MyLessons dashboard
- [ ] Lesson editor with tabs
- [ ] All content builders (Dialog, Vocab, Grammar, Exercise, Reading)
- [ ] Auto-save functionality

**Success Criteria**: Can author complete lesson from UI, all components functional

---

### Phase 4: Polish (EPIC-06, EPIC-07) - Week 5
**Goal**: Publish workflow + learner experience
**Deliverables**:
- [ ] Publish validation + quality score
- [ ] Preview mode
- [ ] Lesson completion → vocab population
- [ ] User vocabulary attribution

**Success Criteria**: End-to-end flow tested: Author → Publish → Learner → Complete → Vocab

---

## Success Metrics

### Phase 1 Metrics
- Migration success rate: 100% (zero data loss)
- Vocab autocomplete performance: <100ms
- RLS policy test coverage: 100%

### Phase 2 Metrics
- API test coverage: >90%
- API response time: <100ms (p95)
- Error handling: All 4xx/5xx cases covered

### Phase 3 Metrics
- UI responsiveness: <200ms interactions
- Autocomplete debounce: 300ms
- Auto-save reliability: >99%

### Phase 4 Metrics
- Quality score accuracy: ±5% of expected
- Preview mode render time: <500ms
- Vocab population success rate: >99%

### Overall Success Criteria
- [ ] Can create lesson in <15min
- [ ] Vocab reuse reduces duplicates by 30%
- [ ] 100% of lesson vocab auto-populated on completion
- [ ] Spanish + Icelandic courses both functional
- [ ] Zero critical security issues (RLS enforced)

---

## Documentation Deliverables

- [x] Implementation spec (1,540 lines)
- [x] Vocabulary integration spec (547 lines)
- [x] UX interaction flows (650 lines)
- [x] Product vision (644 lines)
- [x] Epic breakdown (7 epics, 44 stories)
- [ ] API documentation (OpenAPI/Swagger) - TBD
- [ ] User guide (authoring workflow) - TBD
- [ ] Migration runbook - TBD

---

## Next Steps

1. **Review & Approve**: User reviews epic breakdown
2. **Start EPIC-01**: Database foundation migrations
3. **Iterative Development**: Follow epic dependency order
4. **Continuous Testing**: TDD approach for backend, integration tests for frontend
5. **User Feedback**: After MVP, gather feedback for P2 enhancements

---

## PDCA Workflow

This document represents the **Plan** phase of PDCA for Lesson Authoring:

- **Plan** (仮説): This document
- **Do** (実験): Implementation tracked in `do.md` (trial-and-error log)
- **Check** (評価): Analysis in `check.md` (results vs expectations)
- **Act** (改善): Formalization in `act.md` (patterns, mistakes, next actions)

**Status**: Planning Complete → Implementation Start
