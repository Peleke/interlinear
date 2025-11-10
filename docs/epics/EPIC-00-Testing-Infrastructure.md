# EPIC-00: Testing Infrastructure Foundation

**Status:** 📋 Planned
**Priority:** P0 (Critical - Blocks all other epics)
**Timeline:** Week 0 (Parallel to EPIC-01)
**Points:** 45 | **Stories:** 8

---

## 🎯 Epic Goal

Establish robust E2E testing infrastructure with automated test user management, database state handling, and CI/CD integration to enable test-driven development across all feature epics.

## 🔍 Problem Statement

**Current State:**
- Playwright configured but tests fail without manual setup
- No automated test user creation/cleanup
- Tests modify dev database without isolation
- No test data fixtures or factories
- Manual user creation required (README: "TODO: Create seed script")
- No CI/CD integration for automated testing

**Pain Points:**
1. Tests require manual user creation at `test@example.com`
2. No way to programmatically create/delete test users
3. Test data pollution (no cleanup between runs)
4. No shared test utilities or Page Object Models
5. Can't run tests in CI without manual database setup
6. No test coverage tracking or reporting

**Impact:**
- Blocks reliable testing for all feature epics
- Manual setup creates friction for contributors
- Test failures hard to debug without proper fixtures
- Can't enforce testing in PR workflows

## 💡 Solution Overview

Build comprehensive testing infrastructure as Sprint 0 foundation:

### Core Components

1. **Test User Management**
   - Supabase service role client (admin API access)
   - Test user factory with random email generation
   - Automatic cleanup after test runs
   - Seeding script for CI/CD environments

2. **Database State Management**
   - Test data fixtures (courses, lessons, vocab)
   - Factory functions for all major entities
   - Global teardown for cleanup
   - Transaction-based isolation where possible

3. **Test Environment Configuration**
   - `.env.test` template with test-specific credentials
   - Environment detection utilities
   - Test database strategy (separate project OR dev isolation)
   - Documentation for local and CI setup

4. **Playwright Enhancement**
   - Global setup/teardown hooks
   - Shared fixtures (authenticated user, enrolled courses)
   - Custom utilities (createLesson, enrollInCourse, etc.)
   - Page Object Models for major flows

5. **API Route Testing**
   - Playwright API testing configuration
   - Test utilities for Next.js route handlers
   - Examples for lesson authoring endpoints

6. **CI/CD Integration**
   - GitHub Actions workflow for E2E tests
   - Parallel test execution strategy
   - Test database provisioning
   - HTML report artifacts and history

## 📊 Success Metrics

- ✅ Zero manual setup required to run tests locally
- ✅ Test user creation/cleanup fully automated
- ✅ Tests run in parallel without database conflicts
- ✅ CI/CD pipeline runs all tests on every PR
- ✅ Test coverage tracked and visible in reports
- ✅ All future epics can write tests with shared utilities

## 🗂️ Stories Breakdown

### Story 1: Test User Factory & Supabase Service Client
**Points:** 5 | **Priority:** P0

**Description:**
Create Supabase admin client using service role key and build test user factory for programmatic user creation/deletion.

**Acceptance Criteria:**
- [ ] `lib/test-utils/supabase-admin.ts` exports service role client
- [ ] `createTestUser()` creates user with random email + known password
- [ ] `deleteTestUser(userId)` removes user and cascades data
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added to `.env.test.example`
- [ ] Error handling for duplicate users and cleanup failures
- [ ] TypeScript types for test user creation options

**Technical Notes:**
```typescript
// lib/test-utils/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'

export const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export const createTestUser = async (options?: {
  email?: string
  password?: string
}) => {
  const admin = getAdminClient()
  const email = options?.email || `test-${Date.now()}@example.com`
  const password = options?.password || 'TestPassword123!'

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true // Auto-confirm for testing
  })

  if (error) throw error
  return { user: data.user!, email, password }
}

export const deleteTestUser = async (userId: string) => {
  const admin = getAdminClient()
  await admin.auth.admin.deleteUser(userId)
}
```

**Dependencies:** None (foundation story)

---

### Story 2: Auth Setup Enhancement
**Points:** 3 | **Priority:** P0

**Description:**
Refactor `auth.setup.ts` to use test user factory, auto-create users if needed, and cleanup on completion.

**Acceptance Criteria:**
- [ ] `auth.setup.ts` uses `createTestUser()` instead of hardcoded credentials
- [ ] Test user created automatically if doesn't exist
- [ ] Auth state saved to `.auth/user.json` successfully
- [ ] Global teardown deletes test users after all tests complete
- [ ] Tests run without "Invalid login credentials" errors
- [ ] Documentation updated to reflect automated setup

**Technical Notes:**
```typescript
// tests/e2e/auth.setup.ts
import { test as setup } from '@playwright/test'
import { createTestUser } from '@/lib/test-utils/supabase-admin'
import path from 'path'

const authFile = path.join(__dirname, '../../.auth/user.json')

setup('authenticate', async ({ page }) => {
  // Create test user programmatically
  const { email, password } = await createTestUser()

  // Store user info for cleanup
  process.env.TEST_USER_EMAIL = email

  // Login flow
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button:has-text("Log In")')

  await page.waitForURL((url) => !url.pathname.includes('/login'))
  await page.context().storageState({ path: authFile })
})
```

**Dependencies:** Story 1

---

### Story 3: Database State Management
**Points:** 8 | **Priority:** P0

**Description:**
Create test data fixtures, factory functions, and cleanup utilities for managing database state across tests.

**Acceptance Criteria:**
- [ ] `tests/fixtures/courses.ts` with sample course data
- [ ] `tests/fixtures/lessons.ts` with sample lesson data
- [ ] `tests/fixtures/vocabulary.ts` with sample vocab data
- [ ] Factory functions: `createCourse()`, `createLesson()`, `createVocab()`
- [ ] Global teardown script cleans up test data
- [ ] `tests/utils/cleanup.ts` with `cleanupTestData()` function
- [ ] Tests can run in parallel without conflicts

**Technical Notes:**
```typescript
// tests/utils/test-data-factory.ts
import { getAdminClient } from '@/lib/test-utils/supabase-admin'

export const createTestCourse = async (overrides?: Partial<Course>) => {
  const admin = getAdminClient()
  const course = {
    title: `Test Course ${Date.now()}`,
    language: 'spanish',
    level: 'beginner',
    ...overrides
  }

  const { data, error } = await admin
    .from('courses')
    .insert(course)
    .select()
    .single()

  if (error) throw error
  return data
}

// Global teardown
export const cleanupTestData = async () => {
  const admin = getAdminClient()

  // Delete test courses (cascades to lessons, components)
  await admin.from('courses').delete().ilike('title', 'Test Course%')

  // Delete test vocabulary
  await admin.from('vocabulary').delete().ilike('word', 'test_%')
}
```

**Dependencies:** Story 1

---

### Story 4: Test Environment Configuration
**Points:** 3 | **Priority:** P0

**Description:**
Create test-specific environment configuration with documentation for local and CI setup.

**Acceptance Criteria:**
- [ ] `.env.test.example` created with all required test env vars
- [ ] `SUPABASE_SERVICE_ROLE_KEY` documented with security notes
- [ ] Test database strategy documented (separate project vs dev isolation)
- [ ] `playwright.config.ts` updated to load `.env.test` in test mode
- [ ] README updated with test environment setup instructions
- [ ] Environment detection utility: `isTestEnvironment()`

**Files Created:**
```bash
# .env.test.example
NEXT_PUBLIC_SUPABASE_URL=your-test-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # NEVER COMMIT THIS

# For CI/CD - store in GitHub Secrets
```

**Dependencies:** None (can run parallel to Story 1)

---

### Story 5: Shared Test Fixtures & Utilities
**Points:** 5 | **Priority:** P1

**Description:**
Build Playwright fixtures for common scenarios and helper functions for test workflows.

**Acceptance Criteria:**
- [ ] Custom fixture: `authenticatedUser` (auto-login)
- [ ] Custom fixture: `enrolledUser` (authenticated + enrolled in course)
- [ ] Helper: `enrollInCourse(page, courseId)`
- [ ] Helper: `completeLesson(page, lessonId)`
- [ ] Helper: `createDraftLesson(page, title)`
- [ ] Custom matchers/assertions for common checks
- [ ] Documentation with usage examples

**Technical Notes:**
```typescript
// tests/fixtures/index.ts
import { test as base } from '@playwright/test'

type CustomFixtures = {
  authenticatedUser: { email: string; userId: string }
  enrolledUser: { email: string; userId: string; courseId: string }
}

export const test = base.extend<CustomFixtures>({
  authenticatedUser: async ({ page }, use) => {
    const { email, password, user } = await createTestUser()
    await page.goto('/login')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button:has-text("Log In")')
    await use({ email, userId: user.id })
  },

  enrolledUser: async ({ authenticatedUser, page }, use) => {
    const course = await createTestCourse()
    await enrollUserInCourse(authenticatedUser.userId, course.id)
    await use({ ...authenticatedUser, courseId: course.id })
  }
})
```

**Dependencies:** Story 2, Story 3

---

### Story 6: Page Object Models
**Points:** 8 | **Priority:** P1

**Description:**
Create Page Object Models for major application flows to reduce duplication and improve test maintainability.

**Acceptance Criteria:**
- [ ] `tests/page-objects/AuthPage.ts` (login, signup, logout)
- [ ] `tests/page-objects/CoursePage.ts` (navigation, enrollment)
- [ ] `tests/page-objects/LessonAuthoringPage.ts` (create, edit, publish)
- [ ] `tests/page-objects/VocabularyPage.ts` (manage, search, practice)
- [ ] Each POM has comprehensive JSDoc documentation
- [ ] Examples of POM usage in test files
- [ ] Consistent naming conventions across all POMs

**Technical Notes:**
```typescript
// tests/page-objects/LessonAuthoringPage.ts
import { Page, Locator } from '@playwright/test'

export class LessonAuthoringPage {
  readonly page: Page
  readonly titleInput: Locator
  readonly languageSelect: Locator
  readonly saveButton: Locator
  readonly publishButton: Locator

  constructor(page: Page) {
    this.page = page
    this.titleInput = page.locator('input[name="title"]')
    this.languageSelect = page.locator('select[name="language"]')
    this.saveButton = page.locator('button:has-text("Save")')
    this.publishButton = page.locator('button:has-text("Publish")')
  }

  async createLesson(title: string, language: string) {
    await this.titleInput.fill(title)
    await this.languageSelect.selectOption(language)
    await this.saveButton.click()
  }

  async publishLesson() {
    await this.publishButton.click()
    await this.page.waitForURL(/.*\/lessons\/\d+/)
  }
}
```

**Dependencies:** Story 5

---

### Story 7: API Route Testing Setup
**Points:** 5 | **Priority:** P1

**Description:**
Configure Playwright for API testing and create utilities for testing Next.js route handlers.

**Acceptance Criteria:**
- [ ] `tests/api/lesson-authoring.spec.ts` with example API tests
- [ ] API test utilities: `createAuthenticatedRequest()`
- [ ] Helper: `expectApiSuccess(response, expectedStatus)`
- [ ] Helper: `expectApiError(response, expectedMessage)`
- [ ] Tests for lesson CRUD endpoints
- [ ] Tests for vocabulary autocomplete API
- [ ] Documentation for writing API tests

**Technical Notes:**
```typescript
// tests/utils/api-helpers.ts
import { APIRequestContext } from '@playwright/test'

export const createAuthenticatedRequest = async (
  context: APIRequestContext,
  userId: string
) => {
  // Get auth token for user
  const { session } = await createTestUserSession(userId)

  return {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }
}

// Example test
test('POST /api/lessons creates draft lesson', async ({ request }) => {
  const user = await createTestUser()
  const headers = await createAuthenticatedRequest(request, user.id)

  const response = await request.post('/api/lessons', {
    ...headers,
    data: { title: 'Test Lesson', language: 'spanish' }
  })

  expect(response.status()).toBe(201)
  const lesson = await response.json()
  expect(lesson.status).toBe('draft')
  expect(lesson.author_id).toBe(user.id)
})
```

**Dependencies:** Story 3

---

### Story 8: CI/CD Integration
**Points:** 8 | **Priority:** P1

**Description:**
Create GitHub Actions workflow for running E2E tests on every PR with test database provisioning and reporting.

**Acceptance Criteria:**
- [ ] `.github/workflows/e2e-tests.yml` created
- [ ] Workflow runs on PR creation and updates
- [ ] Test database provisioned in CI (or dev isolation strategy)
- [ ] Parallel test execution enabled (sharding)
- [ ] HTML test reports uploaded as artifacts
- [ ] Test results commented on PR
- [ ] Secrets configured: `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Workflow badge added to README

**Technical Notes:**
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 20
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Create .env.test
        run: |
          echo "NEXT_PUBLIC_SUPABASE_URL=${{ secrets.SUPABASE_URL }}" >> .env.test
          echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }}" >> .env.test
          echo "SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" >> .env.test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

**Dependencies:** All previous stories

---

## 🔗 Dependencies & Risks

### External Dependencies
- **SUPABASE_SERVICE_ROLE_KEY** - Required for admin operations
  - Risk: Security in CI/CD (must use GitHub Secrets)
  - Mitigation: Document secret management, never commit keys

- **Test Database Strategy** - Decision needed:
  - Option A: Separate Supabase project for testing (costs $)
  - Option B: Dev database isolation with prefixed tables
  - Option C: Dev database with careful cleanup (current approach)
  - Recommendation: Option C for MVP, Option A for production

### Internal Dependencies
- None - This is the foundation epic that all others depend on

### Risks

**High Risk:**
- Service role key leak → Document security best practices
- Test data pollution → Implement robust cleanup in global teardown
- Test database costs → Start with dev isolation, migrate if needed

**Medium Risk:**
- Parallel test conflicts → Use random IDs, transaction isolation
- CI/CD test flakiness → Implement retry logic, increase timeouts

**Low Risk:**
- Test maintenance burden → Use POMs and shared utilities to reduce duplication

---

## 📈 Testing Strategy for Other Epics

Once EPIC-00 is complete, all future epics will include tests:

### EPIC-01: Database Foundation
- Database schema validation tests
- RLS policy verification tests
- Component table CRUD tests

### EPIC-02: Vocabulary Integration
- Vocab autocomplete API tests
- Usage count tracking tests
- Auto-population flow tests

### EPIC-03: Lesson CRUD API
- All CRUD endpoint tests (API route testing)
- Author ownership verification
- Draft/publish workflow tests

### EPIC-04: Authoring UI Core
- MyLessons dashboard E2E tests
- Lesson editor navigation tests
- Auto-save functionality tests

### EPIC-05: Content Builders
- Dialog builder E2E tests
- Vocabulary manager with autocomplete tests
- Exercise builder tests (all 3 types)

### EPIC-06: Publish Workflow
- Validation logic tests
- Preview mode tests
- Publish action tests

### EPIC-07: Learner Integration
- Published lesson visibility tests
- Completion flow with vocab auto-population

---

## 📚 Documentation Deliverables

1. **Test Environment Setup Guide** - How to configure local and CI test environments
2. **Test Writing Guide** - Best practices, examples, and patterns
3. **Test Data Factory Documentation** - How to create fixtures and use factories
4. **Page Object Model Guide** - POM patterns and usage examples
5. **CI/CD Testing Documentation** - How tests run in GitHub Actions

---

## ✅ Definition of Done

- [ ] All 8 stories completed and tested
- [ ] Tests run locally without manual setup
- [ ] Tests run in CI/CD on every PR
- [ ] Zero "TODO" comments in test infrastructure code
- [ ] Documentation complete and reviewed
- [ ] All future epics can write tests using shared utilities
- [ ] Team trained on test writing patterns

---

## 📊 Story Summary

| Story | Description | Points | Priority | Dependencies |
|-------|-------------|--------|----------|--------------|
| 1 | Test User Factory & Supabase Service Client | 5 | P0 | None |
| 2 | Auth Setup Enhancement | 3 | P0 | Story 1 |
| 3 | Database State Management | 8 | P0 | Story 1 |
| 4 | Test Environment Configuration | 3 | P0 | None |
| 5 | Shared Test Fixtures & Utilities | 5 | P1 | Story 2, 3 |
| 6 | Page Object Models | 8 | P1 | Story 5 |
| 7 | API Route Testing Setup | 5 | P1 | Story 3 |
| 8 | CI/CD Integration | 8 | P1 | All previous |

**Total: 45 points across 8 stories**

**Critical Path:** Story 1 → Story 2 → Story 3 → Story 5 → Story 6 → Story 8

---

## 🎯 Epic Milestone

**Week 0 Complete When:**
- Stories 1-4 done (foundation complete)
- Tests can run locally without manual user creation
- Other epics can begin writing tests

**Week 1 Complete When:**
- Stories 5-6 done (shared utilities ready)
- POMs available for common flows
- API testing framework established

**Week 2 Complete When:**
- Story 7-8 done (CI/CD operational)
- All tests run automatically on PRs
- Test coverage tracking enabled
