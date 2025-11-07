# EPIC-06: Publish Workflow

**Priority**: P1
**Estimated Points**: 13
**Dependencies**: EPIC-05 (Content Builders)
**Status**: 📋 Planned

---

## Epic Goal

Implement validation, preview, and publish workflow for lesson authoring.

**Success Criteria**:
- ✅ Publish validation (minimum requirements)
- ✅ Quality score calculation
- ✅ Preview mode (see as learner)
- ✅ Publish action (draft → published)
- ✅ Post-publish editing workflow

---

## User Stories

### Story 6.1: Publish Validation (3 pts)

**Acceptance Criteria**:
- ✅ Minimum requirements check:
  - Title present
  - At least 1 component (dialog OR vocab OR exercise)
  - Language specified
- ✅ Show validation errors (red indicators)
- ✅ Block publish if validation fails
- ✅ Allow save as draft regardless

**UI Mockup**: See [Publish Panel](../../claudedocs/lesson_authoring_implementation_spec.md#mockup-8-publish-panel-validation--quality-score)

### Story 6.2: Quality Score Calculator (5 pts)

**Acceptance Criteria**:
- ✅ Calculate score (0-100%) based on:
  - Has overview? +10%
  - Has dialog? +20%
  - Has vocabulary (5+)? +20%
  - Has grammar concept? +15%
  - Has exercises (3+)? +20%
  - Has reading? +15%
- ✅ Show progress bar with score
- ✅ Recommendations for improvement
- ✅ Does NOT block publish (encouragement only)

**Formula**:
```typescript
quality_score = (
  (overview ? 10 : 0) +
  (dialogs > 0 ? 20 : 0) +
  (vocab >= 5 ? 20 : vocab * 4) +
  (grammar > 0 ? 15 : 0) +
  (exercises >= 3 ? 20 : exercises * 6.67) +
  (readings > 0 ? 15 : 0)
)
```

### Story 6.3: Preview Mode (3 pts)

**Acceptance Criteria**:
- ✅ "Preview" button in editor
- ✅ Render lesson as learner would see it
- ✅ Hide authoring controls
- ✅ Show all components (dialogs, vocab, exercises, etc.)
- ✅ "Exit preview" button returns to editor

**UI Mockup**: See [Preview Mode](../../claudedocs/lesson_authoring_implementation_spec.md#mockup-9-preview-mode-learner-view)

### Story 6.4: Publish Action (2 pts)

**Acceptance Criteria**:
- ✅ "Publish" button (disabled if validation fails)
- ✅ Confirmation dialog: "Are you sure? This will make the lesson visible to learners."
- ✅ Updates status: draft → published
- ✅ Success message with link to published lesson
- ✅ Redirects to MyLessons or lesson view

---

## Definition of Done

- [ ] All 4 workflow components implemented
- [ ] Quality score formula tested
- [ ] Preview mode renders all component types
- [ ] Publish action tested (status transition)
- [ ] Accessibility: keyboard navigation, screen reader
- [ ] Code review approved
- [ ] Ready for EPIC-07 (Learner Integration)
