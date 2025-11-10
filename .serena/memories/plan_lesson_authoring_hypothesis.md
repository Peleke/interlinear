# Plan: Lesson Authoring System

## Hypothesis
Build incremental lesson authoring with vocabulary integration (Option B)
- Draft-first workflow
- Multi-language support (Spanish, Icelandic)
- Linked vocabulary with autocomplete reuse

## Expected Outcomes
- Implementation: ~5 weeks (7 epics, 44 stories, 123 points)
- Time to create lesson: <15min
- Vocab reuse: 30% reduction in duplicates
- Auto-vocab tracking: 100% (vs manual clicking)

## Architecture
7 Epics:
1. Database Foundation (13pts)
2. Vocabulary Integration (21pts)
3. Lesson CRUD API (21pts)
4. Authoring UI Core (13pts)
5. Content Builders (34pts)
6. Publish Workflow (13pts)
7. Learner Integration (8pts)

## Risks
- Migration complexity (Low prob, High impact) → Backfill + rollback
- Autocomplete performance (Med prob, Med impact) → Indexes + debounce
- Scope creep (High prob, Med impact) → P0/P1 discipline
- RLS policy errors (Low prob, Critical impact) → Comprehensive tests

## Location
docs/epics/ - Full breakdown with user stories
docs/pdca/lesson-authoring/plan.md - This document
