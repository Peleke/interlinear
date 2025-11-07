# EPIC-05: Content Builders

**Priority**: P0
**Estimated Points**: 34
**Dependencies**: EPIC-04 (Authoring UI Core)
**Status**: 📋 Planned

---

## Epic Goal

Implement content creation interfaces for all lesson components (dialogs, vocabulary, grammar, exercises, readings).

**Success Criteria**:
- ✅ Dialog builder with multi-exchange support
- ✅ Vocabulary manager with autocomplete reuse
- ✅ Grammar concept selector/creator
- ✅ Exercise builder (3 types: fill-in-blank, multiple-choice, translation)
- ✅ Reading linker
- ✅ All builders support CRUD operations

---

## User Stories

### Story 5.1: Dialog Builder - List View (3 pts)

**Acceptance Criteria**:
- ✅ Show all dialogs for lesson
- ✅ Display: context, setting, exchange count
- ✅ Add/Edit/Delete actions
- ✅ Reorder dialogs (drag & drop)

**UI Mockup**: See [Dialog Builder Tab](../../claudedocs/lesson_authoring_implementation_spec.md#mockup-4-dialog-builder-tab)

### Story 5.2: Dialog Builder - Edit View (5 pts)

**Acceptance Criteria**:
- ✅ Context/setting inputs
- ✅ Exchange list with sequence order
- ✅ Add/remove exchanges
- ✅ Speaker name input
- ✅ Spanish/English text inputs
- ✅ Reorder exchanges (drag & drop)
- ✅ Real-time preview

### Story 5.3: Vocabulary Manager - Autocomplete (5 pts)

**Acceptance Criteria**:
- ✅ Search existing vocab (Spanish OR English)
- ✅ Filter by language (es|is)
- ✅ Show reuse indicators ("⭐ Used in 5 lessons")
- ✅ Rank results by usage_count
- ✅ Click to add existing vocab
- ✅ Debounced search (300ms)

**UI Mockup**: See [Vocabulary Manager Tab](../../claudedocs/lesson_authoring_implementation_spec.md#mockup-5-vocabulary-manager-tab)

### Story 5.4: Vocabulary Manager - Quick Add (3 pts)

**Acceptance Criteria**:
- ✅ Inline form (Spanish, English, POS, Difficulty)
- ✅ "Is new?" checkbox (auto-set if usage_count=0)
- ✅ Create new vocab item
- ✅ Add to lesson immediately

### Story 5.5: Vocabulary Manager - List View (2 pts)

**Acceptance Criteria**:
- ✅ Show all vocab for lesson
- ✅ Display: Spanish, English, POS, "Is new?" badge
- ✅ Show reuse info ("Also in: Lesson 1.2, 1.5")
- ✅ Remove from lesson action

### Story 5.6: Grammar Concept Selector (3 pts)

**Acceptance Criteria**:
- ✅ Search existing grammar concepts
- ✅ Display: name, display_name, description
- ✅ Link existing concept
- ✅ Create new concept inline
- ✅ Show linked concepts with unlink action

**UI Mockup**: See [Grammar Selector Tab](../../claudedocs/lesson_authoring_implementation_spec.md#mockup-6-grammar-concept-selector-tab)

### Story 5.7: Exercise Builder - Fill-in-Blank (3 pts)

**Acceptance Criteria**:
- ✅ Prompt input ("Yo ___ estudiante")
- ✅ Answer input ("soy")
- ✅ XP value input
- ✅ Preview with answer hidden

**UI Mockup**: See [Exercise Builder Tab](../../claudedocs/lesson_authoring_implementation_spec.md#mockup-7-exercise-builder-tab)

### Story 5.8: Exercise Builder - Multiple Choice (3 pts)

**Acceptance Criteria**:
- ✅ Prompt input
- ✅ Options input (4 options)
- ✅ Correct answer selector
- ✅ XP value input

### Story 5.9: Exercise Builder - Translation (3 pts)

**Acceptance Criteria**:
- ✅ Spanish text input
- ✅ English text input
- ✅ Direction selector (es→en OR en→es)
- ✅ XP value input

### Story 5.10: Exercise Builder - List & CRUD (2 pts)

**Acceptance Criteria**:
- ✅ Show all exercises for lesson
- ✅ Display: type, prompt/snippet, XP value
- ✅ Edit/Delete actions
- ✅ Reorder exercises (sequence)

### Story 5.11: Reading Linker (2 pts)

**Acceptance Criteria**:
- ✅ Search library_readings
- ✅ Display: title, author, difficulty
- ✅ Link reading to lesson
- ✅ Show linked readings with unlink action
- ✅ Mark as required/optional

---

## Definition of Done

- [ ] All 11 builder components implemented
- [ ] Autocomplete performance <200ms
- [ ] Drag & drop tested (Chrome, Firefox, Safari)
- [ ] Accessibility: keyboard shortcuts, ARIA
- [ ] Mobile responsiveness verified
- [ ] Code review approved
- [ ] Ready for EPIC-06 (Publish Workflow)
