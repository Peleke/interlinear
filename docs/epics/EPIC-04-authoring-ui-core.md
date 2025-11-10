# EPIC-04: Authoring UI Core

**Priority**: P0
**Estimated Points**: 13
**Dependencies**: EPIC-03 (Lesson CRUD API)
**Status**: 📋 Planned

---

## Epic Goal

Build core authoring interface with lesson editor layout and navigation.

**Success Criteria**:
- ✅ MyLessons dashboard shows user's lessons
- ✅ Lesson editor with tab-based navigation
- ✅ Auto-save functionality (debounced)
- ✅ Status indicators (draft/published)
- ✅ Responsive design (desktop-first, mobile-friendly)

---

## User Stories

### Story 4.1: MyLessons Dashboard (3 pts)
**Route**: `/author/lessons`

**Acceptance Criteria**:
- ✅ List all user's lessons
- ✅ Filter: All | Drafts | Published | Archived
- ✅ Sort: Recent | Alphabetical | Course
- ✅ Lesson cards show: title, status, course, last updated, component counts
- ✅ "New Lesson" button opens template selector
- ✅ Edit/Delete actions per lesson

**UI Mockup**: See [lesson_authoring_implementation_spec.md - MyLessons Dashboard](../../claudedocs/lesson_authoring_implementation_spec.md#mockup-1-mylessons-dashboard)

### Story 4.2: New Lesson Modal (2 pts)

**Acceptance Criteria**:
- ✅ Template selector (Blank | Dialog-focused | Grammar-focused | Vocab-focused)
- ✅ Title input (required)
- ✅ Language selector (es|is)
- ✅ Course selector
- ✅ Creates lesson → redirects to editor

**UI Mockup**: See [lesson_authoring_implementation_spec.md - New Lesson Modal](../../claudedocs/lesson_authoring_implementation_spec.md#mockup-2-new-lesson-modal-template-selector)

### Story 4.3: Lesson Editor Layout (3 pts)
**Route**: `/author/lessons/:id/edit`

**Acceptance Criteria**:
- ✅ Sidebar navigation (Metadata | Dialogs | Vocab | Grammar | Exercises | Readings)
- ✅ Main content area (tab content)
- ✅ Top bar: Title, Status badge, Save indicator, Preview/Publish buttons
- ✅ Responsive sidebar (collapsible on mobile)

**UI Mockup**: See [lesson_authoring_implementation_spec.md - Lesson Editor](../../claudedocs/lesson_authoring_implementation_spec.md#mockup-3-lesson-editor-main-layout)

### Story 4.4: Metadata Panel (2 pts)

**Acceptance Criteria**:
- ✅ Title input (required)
- ✅ Language selector (es|is)
- ✅ Overview textarea (markdown support)
- ✅ Course selector
- ✅ XP value, Sequence order inputs

### Story 4.5: Auto-Save Functionality (2 pts)

**Acceptance Criteria**:
- ✅ Debounced save (500ms after last edit)
- ✅ Visual indicator: "Saving..." → "Saved" → "Unsaved changes"
- ✅ Handles network errors gracefully
- ✅ Conflict resolution (if multiple tabs open)

### Story 4.6: Status Management UI (1 pt)

**Acceptance Criteria**:
- ✅ Status badge (Draft | Published | Archived)
- ✅ Color-coded (Draft=blue, Published=green, Archived=gray)
- ✅ Shows last updated timestamp
- ✅ Cannot edit published lessons directly (show warning)

---

## Definition of Done

- [ ] All 6 UI components implemented
- [ ] Auto-save tested (network errors, conflicts)
- [ ] Responsive design verified (desktop + tablet)
- [ ] Accessibility: keyboard navigation, ARIA labels
- [ ] Code review approved
- [ ] Ready for EPIC-05 (Content Builders)
