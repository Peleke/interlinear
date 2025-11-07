# Lesson Authoring: User Interaction Flows

**Companion to**: lesson_authoring_implementation_spec.md
**Purpose**: Detailed interaction flows and edge cases for authoring workflows

---

## Flow 1: Quick Lesson Creation (Minimal Path)

**Goal**: Create and publish a simple lesson in <15 minutes

### User Journey
```
1. Dashboard → "New Lesson" button
2. Modal appears
   ├─ Enter title: "Basic Greetings"
   ├─ Select course: "Spanish A1"
   └─ Click "Create Lesson" (skip template)
3. Redirects to Editor (Overview tab)
   ├─ Title already filled
   ├─ Add overview: "Learn basic greetings in Spanish"
   └─ Auto-saves
4. Navigate to "Dialogs" tab
   ├─ Click "+ Add Dialog"
   ├─ Context: "Meeting a friend"
   ├─ Setting: "Street"
   ├─ Add exchanges:
   │  ├─ Ana: "¡Hola! ¿Cómo estás?" / "Hi! How are you?"
   │  └─ Carlos: "Bien, ¿y tú?" / "Good, and you?"
   └─ Click "Save Dialog"
5. Navigate to "Vocabulary" tab
   ├─ Quick add: hola → hello, interjection, A1, New
   ├─ Quick add: cómo → how, adverb, A1, New
   └─ Auto-saves
6. Navigate to "Exercises" tab
   ├─ Select "Fill in the Blank"
   ├─ Prompt: "___! ¿Cómo estás?"
   ├─ Answer: "Hola"
   └─ Click "Add Exercise"
7. Navigate to "Publish" tab
   ├─ Validation shows: ✅ All requirements met
   ├─ Quality score: 7/10 (missing grammar, readings)
   ├─ Click "Publish Lesson"
   └─ Confirmation → "Yes, Publish"
8. Success screen
   └─ Click "View Live Lesson"
```

**Time Estimate**: 10-12 minutes
**Components Created**: 1 dialog, 2 vocab, 1 exercise
**Validation**: Passes (has title + 1 component)

---

## Flow 2: Template-Based Creation (Dialog Focused)

**Goal**: Use template to accelerate content creation

### User Journey
```
1. Dashboard → "New Lesson"
2. Modal:
   ├─ Title: "Restaurant Conversation"
   ├─ Course: "Spanish A2"
   └─ Select "Dialog Focused" template → Creates 3 dialog placeholders
3. Editor opens on "Dialogs" tab (3 empty dialogs pre-created)
4. Edit Dialog 1:
   ├─ Context: "Ordering food"
   ├─ Setting: "Restaurant"
   ├─ Fill exchanges...
   └─ Save
5. Repeat for Dialogs 2 & 3
6. Auto-generated suggestions (future enhancement):
   ├─ "Vocabulary used in dialogs: menu, cuenta, plato..."
   └─ Click "Add All" → Adds to Vocabulary tab
7. Publish (quality score higher due to template completeness)
```

**Time Saved**: Template pre-creates structure, reduces cognitive load
**Advantage**: Focus on content, not organization

---

## Flow 3: Iterative Authoring (Study → Document → Publish)

**Goal**: Document lesson while studying Old Norse

### Session 1: Initial Creation
```
Day 1 - 20 minutes:
1. Create lesson: "Old Norse Pronouns"
2. Add overview from study notes
3. Add 5 pronouns encountered today
4. Save as draft, close
```

### Session 2: Add Dialog
```
Day 3 - 15 minutes:
1. Open "Old Norse Pronouns" draft
2. Navigate to "Dialogs"
3. Add dialog from saga reading
4. Auto-saves, continue studying
```

### Session 3: Add Exercises
```
Day 5 - 10 minutes:
1. Open draft
2. Navigate to "Exercises"
3. Create fill-blank from practice sentences
4. Still missing grammar concept
5. Save draft, not ready to publish yet
```

### Session 4: Complete & Publish
```
Day 7 - 15 minutes:
1. Open draft
2. Add grammar concept (pronoun declensions)
3. Review all components
4. Publish
```

**Total Time**: 60 minutes across 1 week
**Pattern**: Incremental addition as material is encountered
**Key Feature**: Draft persistence across sessions

---

## Flow 4: Bulk Import Workflow

**Goal**: Import 50 vocabulary items from spreadsheet

### User Journey
```
1. Editor → "Vocabulary" tab
2. Click "Bulk Import ⬇"
3. Modal opens
4. Paste from spreadsheet:
   ┌─────────────────────────────┐
   │ ser    to be       verb     │
   │ estar  to be       verb     │
   │ hola   hello       interj   │
   │ ...47 more rows...          │
   └─────────────────────────────┘
5. Set defaults:
   ├─ Level: A1
   └─ Mark as new: ✓
6. Click "Import 50 Items"
7. Processing:
   ├─ Checks for duplicates in library
   ├─ Creates new items as needed
   ├─ Links all to lesson
   └─ Shows success: "50 items imported"
8. Vocabulary tab now shows all 50 items
```

**Time Saved**: Bulk import vs individual entry
- Individual: ~2 min/item × 50 = 100 minutes
- Bulk: ~5 minutes total
- **Savings**: 95 minutes (95% reduction)

---

## Flow 5: Grammar Concept Reuse

**Goal**: Link existing grammar concept across multiple lessons

### Scenario: Lesson 1 creates concept
```
Lesson: "Introduction to SER"
1. Navigate to "Grammar" tab
2. Click "+ Create New Concept"
3. Fill form:
   ├─ Name: verb_ser_present
   ├─ Display: "SER - Present Tense"
   ├─ Content: [Full conjugation table in markdown]
   └─ Click "Create & Link"
4. Concept saved to library + linked to lesson
```

### Scenario: Lesson 2 reuses concept
```
Lesson: "SER vs ESTAR"
1. Navigate to "Grammar" tab
2. Click "+ Link Existing Concept"
3. Search: "ser"
4. Results show:
   ├─ SER - Present Tense ← Select this
   ├─ SER - Preterite Tense
   └─ SER with Professions
5. Click "Link Selected"
6. Concept now available in both lessons
```

**Advantage**: Write once, use many times
**Consistency**: Same explanation across related lessons
**Maintenance**: Update in one place, reflects everywhere

---

## Flow 6: Validation & Error Recovery

**Goal**: Understand why lesson can't be published

### Scenario: Attempt to publish incomplete lesson
```
1. Create lesson with title only
2. Navigate to "Publish" tab
3. Validation shows:
   ┌─────────────────────────────────────────┐
   │ ✅ Has title                            │
   │ ❌ Has overview (REQUIRED)              │
   │    → Add in Overview tab                │
   │ ❌ Has at least one component (REQUIRED)│
   │    → Add dialog, vocab, grammar,        │
   │      exercise, or reading               │
   └─────────────────────────────────────────┘
4. "Publish Lesson" button is disabled
5. User clicks "Overview" tab (from error link)
6. Adds overview text
7. Returns to "Publish" tab:
   ┌─────────────────────────────────────────┐
   │ ✅ Has title                            │
   │ ✅ Has overview                         │
   │ ❌ Has at least one component (REQUIRED)│
   └─────────────────────────────────────────┘
8. Button still disabled
9. Navigate to "Exercises" tab
10. Add one exercise
11. Return to "Publish":
    ┌─────────────────────────────────────────┐
    │ ✅ Has title                            │
    │ ✅ Has overview                         │
    │ ✅ Has at least one component           │
    │ ⚠️  Recommendation: Add grammar/vocab   │
    └─────────────────────────────────────────┘
12. "Publish Lesson" button now enabled
13. Quality score: 5/10 (functional but minimal)
14. User can publish or add more content
```

**UX Pattern**: Progressive disclosure of errors
**Guidance**: Clear, actionable steps to fix
**Flexibility**: Can publish with warnings, blocked only on errors

---

## Flow 7: Collaborative Editing (Future Enhancement)

**Goal**: Two authors work on same lesson

### Scenario: Primary author starts
```
Author A (Day 1):
1. Creates "Verb Conjugations" lesson
2. Adds overview and grammar concepts
3. Saves as draft
```

### Scenario: Co-author adds content
```
Author B (Day 2):
1. Opens "Verb Conjugations" draft
2. Adds exercises based on grammar concepts
3. Auto-saves
4. (Future) Comment: "Added 5 exercises, need dialogs"
```

### Scenario: Primary author completes
```
Author A (Day 3):
1. Opens lesson
2. (Future) Sees notification: "Author B added exercises"
3. Reviews exercises
4. Adds dialogs
5. Publishes
```

**Conflict Resolution** (Future):
- Real-time conflict detection
- Last-write-wins with notification
- Manual merge tools for complex conflicts

---

## Flow 8: Preview Before Publish

**Goal**: Verify lesson looks correct to learners

### User Journey
```
1. Complete all lesson components
2. Navigate to "Publish" tab
3. Click "Preview First" button
4. Page transitions to Preview Mode:
   ┌────────────────────────────────────────┐
   │ PREVIEW MODE          [Exit Preview]   │
   │ You're viewing as a learner would      │
   ├────────────────────────────────────────┤
   │ [Lesson content renders exactly as     │
   │  learner would see it]                 │
   │                                        │
   │ - Dialog with play buttons            │
   │ - Vocabulary list                      │
   │ - Grammar explanation                  │
   │ - Interactive exercises                │
   └────────────────────────────────────────┘
5. Author interacts:
   ├─ Clicks play button → Hears TTS
   ├─ Tries exercise → Submits answer
   └─ Checks all components render correctly
6. Finds issue: Dialog exchange order is wrong
7. Click "Exit Preview"
8. Returns to Editor on "Dialogs" tab
9. Reorder exchanges (drag & drop)
10. Preview again → Looks good
11. Publish
```

**Value**: Catch visual/interaction issues before learners see them
**Time Saved**: Avoiding post-publish fixes

---

## Flow 9: Post-Publish Editing

**Goal**: Fix typo in published lesson

### Scenario: Learner reports typo
```
1. Dashboard shows both draft and published lessons
2. Find "Introduction to SER" [PUBLISHED]
3. Click "Edit"
4. Editor opens (same as drafts, but status shows PUBLISHED)
5. Navigate to "Dialogs"
6. Find exchange with typo: "Hola, syo Ana" → "Hola, soy Ana"
7. Fix typo
8. Auto-saves
9. Change is immediately live to learners
10. (Future) Option to "Save as new version" instead
```

**Warning Display**:
```
┌──────────────────────────────────────────────────┐
│ ⚠️  This lesson is PUBLISHED                     │
│ Changes you make will be immediately visible     │
│ to all learners.                                 │
└──────────────────────────────────────────────────┘
```

**Safety**: Clear indication of published status throughout editing

---

## Flow 10: Archiving Old Lessons

**Goal**: Remove outdated lesson from learner view without deleting

### User Journey
```
1. Dashboard → Find old lesson "[PUBLISHED] Old Approach"
2. Click "Edit"
3. Navigate to "Publish" tab
4. New option: "Archive Lesson" button
5. Click "Archive Lesson"
6. Confirmation:
   ┌──────────────────────────────────────────────┐
   │ Archive "Old Approach"?                      │
   │                                              │
   │ This will:                                   │
   │ • Remove from learner course view           │
   │ • Preserve all content and progress data    │
   │ • You can un-archive later                  │
   │                                              │
   │         [Cancel]  [Yes, Archive]            │
   └──────────────────────────────────────────────┘
7. Click "Yes, Archive"
8. Status changes to [ARCHIVED]
9. Lesson no longer visible to learners
10. Still visible to author in Dashboard (filter: Archived)
```

**Use Cases**:
- Outdated content (grammar explanation improved)
- Seasonal lessons (holiday-themed)
- Experimental lessons (A/B testing)

---

## Edge Cases & Error Handling

### Edge Case 1: Network Interruption During Edit
```
Scenario:
1. Author editing dialog
2. Network drops mid-edit
3. Auto-save fails

Handling:
1. UI shows: "⚠️ Connection lost. Changes saved locally."
2. Edit continues in offline mode
3. Network reconnects
4. Auto-save resumes: "Syncing 3 pending changes..."
5. Success: "✓ All changes saved"

Fallback:
- LocalStorage backup every 10 seconds
- Restore from localStorage if page reloads during offline
```

### Edge Case 2: Duplicate Lesson Titles
```
Scenario:
1. Author creates "Lesson 1" in Course A
2. Later tries to create another "Lesson 1" in Course A

Handling:
- Backend allows (title not unique constraint)
- UI warns: "⚠️ A lesson named 'Lesson 1' already exists in this course"
- Suggestion: "Lesson 1 (Part 2)" or "Lesson 1 - Advanced"
- Author can proceed or rename
```

### Edge Case 3: Deleting Component Referenced by Exercise
```
Scenario:
1. Lesson has vocab: "ser"
2. Exercise references "ser" in fill-blank
3. Author tries to delete "ser" from Vocabulary tab

Handling:
1. Deletion warning modal:
   ┌──────────────────────────────────────────────┐
   │ Delete "ser"?                                │
   │                                              │
   │ ⚠️ This vocabulary is used in:               │
   │ • Exercise 2: Fill blank                    │
   │ • Dialog 1: Exchange 3                      │
   │                                              │
   │ Deleting will not remove from exercises,    │
   │ but it won't be highlighted for learners.   │
   │                                              │
   │     [Cancel]  [Delete Anyway]               │
   └──────────────────────────────────────────────┘
2. Author makes informed choice
```

### Edge Case 4: Browser Tab Closed Mid-Edit
```
Scenario:
1. Author editing lesson
2. Accidentally closes browser tab
3. Reopens /author/lessons/:id/edit

Handling:
1. Page loads
2. Checks localStorage for unsaved changes
3. Modal appears:
   ┌──────────────────────────────────────────────┐
   │ Restore Unsaved Changes?                     │
   │                                              │
   │ We found changes from 2 minutes ago:         │
   │ • Modified overview                          │
   │ • Added 1 vocabulary item                   │
   │                                              │
   │    [Discard]  [Restore Changes]             │
   └──────────────────────────────────────────────┘
4. Author chooses
5. Restored changes auto-save to server
```

### Edge Case 5: Concurrent Edits (Same Author, Multiple Tabs)
```
Scenario:
1. Author opens lesson in Tab A
2. Opens same lesson in Tab B
3. Edits in both tabs

Handling:
1. Tab B detects Tab A has same lesson open
2. Warning banner in Tab B:
   ┌──────────────────────────────────────────────┐
   │ ⚠️ This lesson is open in another tab        │
   │ Changes here may conflict. We recommend      │
   │ closing one tab to avoid data loss.          │
   │                     [Close This Tab]         │
   └──────────────────────────────────────────────┘
3. Author continues at own risk (advanced feature: merge)
```

---

## Accessibility Considerations

### Keyboard Navigation
```
Tab order in Editor:
1. Breadcrumb (Back to My Lessons)
2. Lesson title display
3. Sidebar navigation (Overview → Dialogs → ... → Publish)
4. Main content area (tab-specific fields)
5. Primary actions (Save, Publish, etc.)

Keyboard shortcuts:
- Cmd/Ctrl + S: Save (though autosave active)
- Cmd/Ctrl + P: Jump to Publish tab
- Cmd/Ctrl + Shift + P: Preview mode
- Cmd/Ctrl + 1-7: Switch tabs
- Escape: Close modals, exit edit mode
- Enter: Submit forms (where appropriate)
```

### Screen Reader Support
```
ARIA labels:
- <nav aria-label="Lesson editor navigation">
- <button aria-label="Add dialog">
- <form aria-label="New vocabulary item">
- <div role="alert"> for validation errors
- <div role="status" aria-live="polite"> for autosave indicator

Announcements:
- "Dialog saved" on successful save
- "Validation error: missing overview" on publish fail
- "Lesson published successfully" on publish success
```

### Visual Accessibility
```
Color contrast:
- All text meets WCAG AA standards (4.5:1 minimum)
- Status badges use color + icon (not color alone)
- Error states use red + ❌ icon
- Success states use green + ✅ icon

Focus indicators:
- Visible focus ring on all interactive elements
- High contrast focus ring (3:1 minimum)
- Focus never trapped (can always Escape)
```

---

## Performance Considerations

### Autosave Optimization
```
Strategy:
1. Debounce input: Wait 500ms after last keystroke
2. Detect changes: Compare with last saved state
3. Batch changes: Send delta, not full lesson
4. Optimistic UI: Show "Saved" immediately, retry on fail
5. Background sync: Use Web Workers for large saves

Throttling:
- Maximum 1 save per second
- Queue additional changes during save
- Flush queue when save completes
```

### Large Lesson Handling
```
Scenario: Lesson with 100+ vocabulary items

Optimizations:
1. Virtual scrolling in vocabulary list
2. Lazy load dialogs (collapse by default)
3. Paginate exercises (10 per page)
4. Server-side filtering for searches
5. Partial updates (edit only changed fields)

Load times:
- Initial load: <2 seconds
- Component switch: <100ms
- Autosave: <500ms
```

### Offline Support (Future)
```
Progressive Web App (PWA):
1. Service Worker caches editor UI
2. IndexedDB stores lesson drafts
3. Background Sync API queues changes
4. Resume editing offline
5. Sync when online

Limitations:
- Can't publish offline (requires validation)
- Can't link external resources (grammar concepts, readings)
- LocalStorage fallback for non-PWA browsers
```

---

## Mobile Considerations (Future Enhancement)

Currently desktop-focused, but mobile adaptations:

```
Mobile-Optimized Flows:
1. Dashboard: Card layout (full width)
2. Editor: Bottom navigation vs sidebar
3. Forms: Full-screen modals vs inline
4. Drag & drop: Touch-friendly handles
5. Markdown: Simplified toolbar (essential only)

Progressive Disclosure:
- Show/hide sections on mobile
- Focus on one component at a time
- Larger touch targets (44px minimum)
```

---

## Analytics & Insights (Future)

Track author behavior to improve UX:

```
Metrics to Collect:
1. Time to first publish (by template used)
2. Most used components (dialog vs vocab vs exercises)
3. Abandonment points (where authors stop editing)
4. Feature usage (bulk import, preview, etc.)
5. Error frequency (validation failures)

Insights to Surface:
- "Authors using Dialog template publish 30% faster"
- "85% of lessons include exercises"
- "Preview used by 60% before first publish"
- "Bulk import saves average 45 minutes per lesson"
```

---

## Summary: Critical Interaction Patterns

1. **Incremental Creation**: Save → Resume → Complete over multiple sessions
2. **Progressive Validation**: Errors shown inline, not just at publish
3. **Smart Defaults**: Templates, auto-remembering speakers, level detection
4. **Optimistic UI**: Instant feedback, background saves
5. **Forgiving UX**: LocalStorage backup, restore unsaved changes
6. **Clear Status**: Draft vs Published always visible
7. **Preview First**: See as learner before making live
8. **Reusable Content**: Grammar concepts, vocabulary shared across lessons
9. **Bulk Operations**: Import vocab, duplicate lessons for efficiency
10. **Accessible Throughout**: Keyboard, screen reader, WCAG AA compliance
