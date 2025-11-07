# Testing Strategy for Lesson Authoring Epics

**Date Created**: 2025-11-06
**Status**: ✅ Active
**Applies To**: All epics (EPIC-00 through EPIC-07)

---

## 🎯 Overview

This document defines the testing approach for all lesson authoring feature epics, ensuring comprehensive test coverage and quality from day one.

**Core Principle**: Every feature epic includes E2E tests as part of "Definition of Done"

---

## 🏗️ Testing Infrastructure (EPIC-00)

### Foundation Requirements

Before any epic can write comprehensive tests, **EPIC-00 must complete Stories 1-6**:

✅ **Story 1**: Test User Factory & Supabase Service Client
✅ **Story 2**: Auth Setup Enhancement
✅ **Story 3**: Database State Management
✅ **Story 4**: Test Environment Configuration
✅ **Story 5**: Shared Test Fixtures & Utilities
✅ **Story 6**: Page Object Models

**Timeline**: Complete Stories 1-4 in Week 0 (critical path)

### What EPIC-00 Provides

1. **Automated Test User Management**
   - `createTestUser()` - No more manual user creation
   - `deleteTestUser()` - Automatic cleanup
   - Random email generation for parallel tests

2. **Database State Management**
   - Test data factories: `createCourse()`, `createLesson()`, `createVocab()`
   - Fixtures for common test scenarios
   - Global teardown for cleanup

3. **Playwright Enhancements**
   - Custom fixtures: `authenticatedUser`, `enrolledUser`
   - Helper functions: `enrollInCourse()`, `completeLesson()`
   - Page Object Models for major flows

4. **Test Environment**
   - `.env.test` configuration
   - Environment detection utilities
   - CI/CD integration

---

## 📋 Testing Requirements Per Epic

### EPIC-01: Database Foundation

**Test Focus**: Schema validation, RLS policies, data integrity

**Required Tests**:
1. **Schema Tests** (`tests/e2e/database/schema.spec.ts`)
   - Verify lesson status enum values (draft, published, archived)
   - Verify author_id foreign key constraint
   - Verify language column exists on all tables
   - Verify default values (status='draft', language='spanish')

2. **RLS Policy Tests** (`tests/e2e/database/rls-policies.spec.ts`)
   - Draft lessons only visible to author
   - Published lessons visible to all authenticated users
   - Authors can CRUD their own drafts
   - Authors cannot modify others' drafts
   - Non-authors can read published lessons only

3. **Component Table Tests** (`tests/e2e/database/components.spec.ts`)
   - Verify lesson_dialogs has author visibility inheritance
   - Verify lesson_vocabulary has author visibility inheritance
   - Verify lesson_grammar has author visibility inheritance
   - Verify lesson_exercises has author visibility inheritance

**Example Test**:
```typescript
// tests/e2e/database/rls-policies.spec.ts
import { test, expect } from '@playwright/test'
import { createTestUser, createTestCourse, createDraftLesson } from '@/tests/utils/test-data-factory'
import { getAdminClient } from '@/lib/test-utils/supabase-admin'

test('draft lessons only visible to author', async () => {
  const author = await createTestUser()
  const otherUser = await createTestUser()
  const course = await createTestCourse()
  const draftLesson = await createDraftLesson({
    courseId: course.id,
    authorId: author.id
  })

  // Author can see their draft
  const admin = getAdminClient()
  const { data: authorView } = await admin
    .from('lessons')
    .select()
    .eq('id', draftLesson.id)
    .eq('author_id', author.id)
    .single()

  expect(authorView).toBeTruthy()

  // Other user cannot see the draft
  const { data: otherView } = await admin
    .from('lessons')
    .select()
    .eq('id', draftLesson.id)
    .eq('author_id', otherUser.id)
    .single()

  expect(otherView).toBeNull()
})
```

**Test Coverage Target**: >95% (critical infrastructure)

---

### EPIC-02: Vocabulary Integration

**Test Focus**: Linked vocabulary, autocomplete API, usage tracking

**Required Tests**:
1. **Language Support** (`tests/e2e/vocabulary/language-support.spec.ts`)
   - Verify lesson_vocabulary has language column
   - Verify user_vocabulary has language column
   - Verify Spanish vocabulary works
   - Verify Icelandic vocabulary works

2. **Autocomplete API** (`tests/api/vocabulary-autocomplete.spec.ts`)
   - Returns vocab with usage counts
   - Shows "Used in 5 lessons" indicator
   - Filters by language
   - Returns results within 100ms (performance)
   - Handles empty queries gracefully

3. **Usage Count Tracking** (`tests/e2e/vocabulary/usage-tracking.spec.ts`)
   - Adding vocab to lesson increments usage_count
   - Removing vocab from lesson decrements usage_count
   - Usage count accurate across multiple lessons
   - Trigger handles concurrent updates correctly

4. **Auto-Population** (`tests/e2e/vocabulary/auto-population.spec.ts`)
   - Completing lesson adds vocab to user_vocabulary
   - lesson_id attribution set correctly
   - Doesn't duplicate if vocab already in user_vocabulary
   - Works for both Spanish and Icelandic

**Example Test**:
```typescript
// tests/api/vocabulary-autocomplete.spec.ts
import { test, expect } from '@playwright/test'
import { createTestUser, createTestVocab } from '@/tests/utils/test-data-factory'

test('autocomplete shows usage counts', async ({ request }) => {
  const user = await createTestUser()
  const vocab = await createTestVocab({
    word: 'hola',
    language: 'spanish',
    usageCount: 5
  })

  const response = await request.get('/api/vocabulary/autocomplete', {
    params: { q: 'hol', language: 'spanish' }
  })

  expect(response.status()).toBe(200)
  const results = await response.json()

  expect(results[0].word).toBe('hola')
  expect(results[0].usage_count).toBe(5)
  expect(results[0].usage_label).toBe('Used in 5 lessons')
})
```

**Test Coverage Target**: >90% (API + database interactions)

---

### EPIC-03: Lesson CRUD API

**Test Focus**: RESTful API endpoints, authorization, validation

**Required Tests**:
1. **Create Draft Lesson** (`tests/api/lessons/create.spec.ts`)
   - POST /api/lessons creates draft with minimal data
   - Sets author_id from authenticated user
   - Returns 401 if not authenticated
   - Validates required fields (title, language)

2. **Read Lesson** (`tests/api/lessons/read.spec.ts`)
   - GET /api/lessons/:id returns lesson with components
   - Includes nested dialogs, vocab, grammar, exercises, readings
   - Author can read their drafts
   - Non-author cannot read others' drafts
   - Anyone can read published lessons

3. **Update Lesson** (`tests/api/lessons/update.spec.ts`)
   - PATCH /api/lessons/:id updates metadata
   - Only author can update their lessons
   - Returns 403 if not author
   - Preserves components during metadata update

4. **Delete Lesson** (`tests/api/lessons/delete.spec.ts`)
   - DELETE /api/lessons/:id soft-deletes (sets status='archived')
   - Only author can delete
   - Cascades to components (or sets status)
   - Cannot delete published lessons (validation)

5. **List Lessons** (`tests/api/lessons/list.spec.ts`)
   - GET /api/lessons returns user's lessons
   - Filters by status (draft, published, archived)
   - Sorts by updated_at desc
   - Pagination works correctly

6. **Component Management** (`tests/api/lessons/components.spec.ts`)
   - POST /api/lessons/:id/dialogs creates dialog
   - PATCH /api/lessons/:id/dialogs/:dialogId updates
   - DELETE /api/lessons/:id/dialogs/:dialogId removes
   - Same for vocab, grammar, exercises, readings

**Example Test**:
```typescript
// tests/api/lessons/create.spec.ts
import { test, expect } from '@playwright/test'
import { createTestUser } from '@/tests/utils/test-data-factory'
import { createAuthenticatedRequest } from '@/tests/utils/api-helpers'

test('POST /api/lessons creates draft lesson', async ({ request }) => {
  const user = await createTestUser()
  const headers = await createAuthenticatedRequest(request, user.id)

  const response = await request.post('/api/lessons', {
    ...headers,
    data: {
      title: 'Test Lesson',
      language: 'spanish',
      course_id: 1
    }
  })

  expect(response.status()).toBe(201)
  const lesson = await response.json()

  expect(lesson.title).toBe('Test Lesson')
  expect(lesson.status).toBe('draft')
  expect(lesson.author_id).toBe(user.id)
  expect(lesson.language).toBe('spanish')
})

test('POST /api/lessons requires authentication', async ({ request }) => {
  const response = await request.post('/api/lessons', {
    data: { title: 'Test', language: 'spanish' }
  })

  expect(response.status()).toBe(401)
})
```

**Test Coverage Target**: >90% (critical business logic)

---

### EPIC-04: Authoring UI Core

**Test Focus**: UI navigation, auto-save, status management

**Required Tests**:
1. **MyLessons Dashboard** (`tests/e2e/authoring/my-lessons.spec.ts`)
   - Lists all user's lessons (drafts + published)
   - Shows status badges (Draft, Published)
   - Filter by status works
   - Sort by date works
   - "New Lesson" button visible

2. **New Lesson Modal** (`tests/e2e/authoring/new-lesson-modal.spec.ts`)
   - Opens on "New Lesson" click
   - Template selector shows options
   - Creates lesson on submit
   - Redirects to lesson editor

3. **Lesson Editor Layout** (`tests/e2e/authoring/lesson-editor.spec.ts`)
   - Tab navigation works (Metadata, Dialogs, Vocab, etc.)
   - Tabs persist on refresh
   - Back button navigates to MyLessons
   - Status indicator shows current status

4. **Auto-Save** (`tests/e2e/authoring/auto-save.spec.ts`)
   - Debounces input changes (500ms)
   - Saves to backend automatically
   - Shows "Saving..." indicator
   - Shows "Saved" confirmation
   - Handles save errors gracefully

**Example Test**:
```typescript
// tests/e2e/authoring/auto-save.spec.ts
import { test, expect } from '@/tests/fixtures'
import { LessonAuthoringPage } from '@/tests/page-objects/LessonAuthoringPage'

test('auto-saves lesson metadata changes', async ({ page, authenticatedUser }) => {
  const lessonPage = new LessonAuthoringPage(page)
  await lessonPage.createNewLesson('Test Lesson', 'spanish')

  // Change title
  await lessonPage.titleInput.fill('Updated Title')

  // Wait for auto-save (debounced 500ms)
  await expect(lessonPage.saveIndicator).toHaveText('Saving...')
  await expect(lessonPage.saveIndicator).toHaveText('Saved', { timeout: 2000 })

  // Refresh page - should persist
  await page.reload()
  await expect(lessonPage.titleInput).toHaveValue('Updated Title')
})
```

**Test Coverage Target**: >80% (UI interactions)

---

### EPIC-05: Content Builders

**Test Focus**: Component creation, drag-drop, autocomplete

**Required Tests**:
1. **Dialog Builder** (`tests/e2e/authoring/dialog-builder.spec.ts`)
   - Creates multi-exchange dialog
   - Adds speaker names
   - Adds translations
   - Drag-drop reordering works
   - Delete exchange works

2. **Vocabulary Manager** (`tests/e2e/authoring/vocabulary-manager.spec.ts`)
   - Autocomplete shows existing vocab
   - Shows usage indicators ("Used in 5 lessons")
   - Quick add creates new vocab
   - List view shows all lesson vocab
   - Filters by added/suggested

3. **Grammar Selector** (`tests/e2e/authoring/grammar-selector.spec.ts`)
   - Shows available grammar concepts
   - Multi-select works
   - Selected concepts appear in list
   - Remove concept works

4. **Exercise Builder** (`tests/e2e/authoring/exercise-builder.spec.ts`)
   - Fill-in-blank: Creates cloze exercises
   - Multiple choice: Creates 4-option questions
   - Translation: Creates translation exercises
   - List view shows all exercises
   - CRUD operations work for all types

5. **Reading Linker** (`tests/e2e/authoring/reading-linker.spec.ts`)
   - Shows available readings
   - Links reading to lesson
   - Preview shows reading content
   - Unlink reading works

**Example Test**:
```typescript
// tests/e2e/authoring/vocabulary-manager.spec.ts
import { test, expect } from '@/tests/fixtures'
import { LessonAuthoringPage } from '@/tests/page-objects/LessonAuthoringPage'
import { createTestVocab } from '@/tests/utils/test-data-factory'

test('autocomplete shows existing vocab with usage counts', async ({ page, authenticatedUser }) => {
  // Create existing vocab
  await createTestVocab({
    word: 'hola',
    language: 'spanish',
    usageCount: 5
  })

  const lessonPage = new LessonAuthoringPage(page)
  await lessonPage.createNewLesson('Test', 'spanish')
  await lessonPage.goToVocabularyTab()

  // Type in autocomplete
  await lessonPage.vocabInput.fill('hol')

  // Should show suggestion with usage count
  await expect(lessonPage.vocabSuggestion).toContainText('hola')
  await expect(lessonPage.vocabSuggestion).toContainText('Used in 5 lessons')

  // Select suggestion
  await lessonPage.vocabSuggestion.click()

  // Should add to lesson vocabulary
  await expect(lessonPage.vocabList).toContainText('hola')
})
```

**Test Coverage Target**: >80% (complex UI interactions)

---

### EPIC-06: Publish Workflow

**Test Focus**: Validation, preview, publish action

**Required Tests**:
1. **Publish Validation** (`tests/e2e/authoring/publish-validation.spec.ts`)
   - Blocks publish if missing required fields
   - Shows validation errors clearly
   - Allows publish when all required fields present
   - Validates minimum component requirements

2. **Quality Score** (`tests/e2e/authoring/quality-score.spec.ts`)
   - Calculates score (0-100%)
   - Shows encouragement messages
   - Updates in real-time as components added
   - Does NOT block publish (encouragement only)

3. **Preview Mode** (`tests/e2e/authoring/preview-mode.spec.ts`)
   - Shows lesson as learner sees it
   - Renders all components correctly
   - "Edit" button returns to editor
   - Preview updates on changes

4. **Publish Action** (`tests/e2e/authoring/publish-action.spec.ts`)
   - Changes status from draft to published
   - Shows confirmation dialog
   - Cannot unpublish (one-way action)
   - Published lesson visible to learners

**Example Test**:
```typescript
// tests/e2e/authoring/publish-validation.spec.ts
import { test, expect } from '@/tests/fixtures'
import { LessonAuthoringPage } from '@/tests/page-objects/LessonAuthoringPage'

test('blocks publish if missing required fields', async ({ page, authenticatedUser }) => {
  const lessonPage = new LessonAuthoringPage(page)
  await lessonPage.createNewLesson('Incomplete Lesson', 'spanish')

  // Try to publish without components
  await lessonPage.publishButton.click()

  // Should show validation errors
  await expect(lessonPage.validationError).toContainText('At least 1 dialog required')
  await expect(lessonPage.validationError).toContainText('At least 3 vocabulary words required')

  // Publish button should be disabled
  await expect(lessonPage.publishButton).toBeDisabled()
})
```

**Test Coverage Target**: >85% (critical publish path)

---

### EPIC-07: Learner Integration

**Test Focus**: Published visibility, completion, vocab auto-population

**Required Tests**:
1. **Published Visibility** (`tests/e2e/learner/published-visibility.spec.ts`)
   - Published lessons appear in course view
   - Draft lessons do NOT appear to non-authors
   - Lesson metadata renders correctly
   - Lesson is playable

2. **Completion Flow** (`tests/e2e/learner/lesson-completion.spec.ts`)
   - Complete lesson button works
   - Completion recorded in database
   - User vocabulary auto-populated
   - Completion triggers vocab addition

3. **Vocabulary Attribution** (`tests/e2e/learner/vocab-attribution.spec.ts`)
   - User vocab has lesson_id set
   - "Learned from Lesson 1.2" label shows
   - Can view vocab source lesson
   - Vocab appears in spaced repetition

**Example Test**:
```typescript
// tests/e2e/learner/lesson-completion.spec.ts
import { test, expect } from '@/tests/fixtures'
import { createPublishedLesson, createLessonVocab } from '@/tests/utils/test-data-factory'
import { getAdminClient } from '@/lib/test-utils/supabase-admin'

test('completing lesson auto-populates user vocabulary', async ({ page, authenticatedUser }) => {
  // Create published lesson with vocab
  const lesson = await createPublishedLesson({
    title: 'Test Lesson',
    language: 'spanish'
  })
  await createLessonVocab({
    lessonId: lesson.id,
    word: 'hola'
  })

  // Navigate to lesson
  await page.goto(`/courses/${lesson.course_id}/lessons/${lesson.id}`)

  // Complete lesson
  await page.click('button:has-text("Complete Lesson")')

  // Verify vocab added to user_vocabulary
  const admin = getAdminClient()
  const { data: userVocab } = await admin
    .from('user_vocabulary')
    .select()
    .eq('user_id', authenticatedUser.userId)
    .eq('word', 'hola')
    .single()

  expect(userVocab).toBeTruthy()
  expect(userVocab.lesson_id).toBe(lesson.id)
  expect(userVocab.language).toBe('spanish')
})
```

**Test Coverage Target**: >85% (critical learner flow)

---

## 🎯 Testing Standards

### Test Quality Checklist

Every test must:
- [ ] Use test data factories (not hardcoded data)
- [ ] Clean up after itself (via global teardown)
- [ ] Run independently (no test interdependencies)
- [ ] Have clear, descriptive names
- [ ] Include assertions for both success and error cases
- [ ] Use Page Object Models for UI tests
- [ ] Complete within reasonable time (<5s per test)

### Naming Conventions

**E2E Tests**: `tests/e2e/{feature}/{component}.spec.ts`
- Example: `tests/e2e/authoring/dialog-builder.spec.ts`

**API Tests**: `tests/api/{resource}/{action}.spec.ts`
- Example: `tests/api/lessons/create.spec.ts`

**Test Names**: `should {behavior} when {condition}`
- Example: `should create draft lesson when user is authenticated`

### Coverage Targets

| Epic | Target Coverage | Priority |
|------|----------------|----------|
| EPIC-00 | N/A (infrastructure) | P0 |
| EPIC-01 | >95% | P0 (critical schema) |
| EPIC-02 | >90% | P0 (API + database) |
| EPIC-03 | >90% | P0 (API + auth) |
| EPIC-04 | >80% | P1 (UI) |
| EPIC-05 | >80% | P1 (complex UI) |
| EPIC-06 | >85% | P0 (publish flow) |
| EPIC-07 | >85% | P0 (learner impact) |

---

## 🚦 Definition of Done

A feature epic is **NOT DONE** until:

1. ✅ All acceptance criteria met
2. ✅ E2E tests written and passing
3. ✅ API tests written (if applicable)
4. ✅ Tests run in CI/CD
5. ✅ Coverage targets met
6. ✅ No test flakiness (3 consecutive green runs)
7. ✅ Test documentation updated

**No feature merges to main without passing tests**

---

## 📊 Continuous Testing

### Local Development

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e tests/e2e/authoring/dialog-builder.spec.ts

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug
```

### CI/CD Integration

**GitHub Actions Workflow** (from EPIC-00.8):
- Runs on every PR
- Parallel test execution (sharding)
- HTML reports uploaded as artifacts
- Test results commented on PR
- Failures block merge

### Test Monitoring

Track these metrics:
- **Test count** by epic (should grow with features)
- **Coverage percentage** (should meet targets)
- **Test duration** (should stay <5min total)
- **Flakiness rate** (should be <1%)

---

## 🐛 Debugging Failed Tests

### Common Issues

**Test user authentication fails**:
- Check `SUPABASE_SERVICE_ROLE_KEY` in `.env.test`
- Verify test user creation in `auth.setup.ts`
- Check `.auth/user.json` exists

**Database state conflicts**:
- Run `npm run test:cleanup` to clear test data
- Check global teardown is running
- Verify test isolation (random IDs)

**Timing issues (flakiness)**:
- Increase `timeout` for specific actions
- Use `waitForSelector` instead of fixed delays
- Check auto-save debounce timing

**RLS policy violations**:
- Verify test user has correct role
- Check lesson ownership in test setup
- Review RLS policies in database

---

## 📚 Resources

### Documentation
- [EPIC-00: Testing Infrastructure](./EPIC-00-Testing-Infrastructure.md)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)

### Test Utilities
- `lib/test-utils/supabase-admin.ts` - Admin client & user factory
- `tests/utils/test-data-factory.ts` - Data creation functions
- `tests/utils/api-helpers.ts` - API testing helpers
- `tests/fixtures/index.ts` - Custom Playwright fixtures
- `tests/page-objects/` - Page Object Models

### Example Tests
- `tests/e2e/auth/signup.spec.ts` - Simple E2E test
- `tests/e2e/courses/lesson-completion.spec.ts` - Complex flow test
- `tests/api/vocabulary-autocomplete.spec.ts` - API route test (to be created)

---

**Questions?** Review EPIC-00 documentation or ask in #testing channel.
