# Testing Setup Guide

Quick start guide for running E2E tests with Playwright.

## Installation

### 1. Install Playwright
```bash
npm install -D @playwright/test
npx playwright install --with-deps
```

### 2. Add Test Scripts to package.json
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

### 3. Configure Environment Variables
Create `.env.test.local` for test environment:
```bash
# .env.test.local
NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_supabase_key
DATABASE_URL=your_test_database_url

# Optional: Use different base URL for tests
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

## Running Tests

### Local Development
```bash
# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/e2e/auth/signup.spec.ts

# Run tests with UI (recommended for debugging)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test by name
npm run test:e2e -- -g "should create account"

# Debug mode (step through tests)
npm run test:e2e:debug
```

### CI/CD
Tests will run automatically on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

View results in GitHub Actions tab.

## Test Structure

```
tests/
├── e2e/
│   ├── auth/               # Authentication tests
│   ├── reader/             # Reader flow tests
│   ├── vocabulary/         # Vocabulary tracking tests
│   ├── tutor/              # AI tutor tests
│   ├── flashcards/         # Flashcard system tests
│   └── library/            # Library management tests
├── fixtures/
│   ├── auth.ts            # Authenticated user fixture
│   └── test-data.ts       # Sample test data
└── page-objects/
    └── ReaderPage.ts      # Page object models
```

## Writing Tests

### Basic Test
```typescript
import { test, expect } from '@playwright/test'

test('my test', async ({ page }) => {
  await page.goto('/my-page')
  await expect(page.locator('h1')).toContainText('Welcome')
})
```

### Authenticated Test
```typescript
import { test, expect } from '@/tests/fixtures/auth'

test('my authenticated test', async ({ authenticatedPage }) => {
  // Already logged in!
  await authenticatedPage.goto('/profile')
  await expect(authenticatedPage.locator('text=Profile')).toBeVisible()
})
```

### Using Page Objects
```typescript
import { test } from '@/tests/fixtures/auth'
import { ReaderPage } from '@/tests/page-objects/ReaderPage'
import { SAMPLE_SPANISH_TEXTS } from '@/tests/fixtures/test-data'

test('read Spanish text', async ({ authenticatedPage }) => {
  const reader = new ReaderPage(authenticatedPage)
  await reader.goto()
  await reader.pasteText(SAMPLE_SPANISH_TEXTS.greeting)
  await reader.renderText()
  await reader.expectWordToBeRendered('Hola')
})
```

## Best Practices

### 1. Use BDD-Style Scenarios
```typescript
test('should create account with valid credentials', async ({ page }) => {
  // Given I am on the signup page
  await page.goto('/signup')

  // When I enter valid credentials
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'Password123!')
  await page.click('button[type="submit"]')

  // Then I should be redirected
  await expect(page).toHaveURL('/reader')
})
```

### 2. Use Page Objects for Reusability
- Encapsulate page interactions in Page Object classes
- Keep selectors in one place for easier maintenance
- Provide semantic methods (e.g., `clickWord()` vs `page.click()`)

### 3. Use Fixtures for Setup/Teardown
- Use fixtures for authentication, test data, etc.
- Automatic cleanup after tests
- Consistent test environment

### 4. Add Data Test IDs
In your components:
```tsx
<div data-testid="definition-sidebar">
  {/* sidebar content */}
</div>
```

In your tests:
```typescript
const sidebar = page.locator('[data-testid="definition-sidebar"]')
```

### 5. Handle Async Operations
```typescript
// Wait for element to be visible
await expect(page.locator('.definition')).toBeVisible()

// Wait for URL change
await page.waitForURL('/reader')

// Wait for network idle
await page.waitForLoadState('networkidle')

// Custom timeout
await expect(sidebar).toBeVisible({ timeout: 10000 })
```

## Debugging Tests

### Visual Mode (Recommended)
```bash
npm run test:e2e:ui
```
- Step through tests visually
- Inspect DOM at each step
- Time travel debugging

### Debug Mode
```bash
npm run test:e2e:debug
```
- Runs with Playwright Inspector
- Set breakpoints
- Step through test execution

### Screenshots & Videos
Failed tests automatically capture:
- Screenshots
- Videos
- Traces

View in HTML report:
```bash
npm run test:e2e:report
```

## Troubleshooting

### Tests Failing Locally
1. Ensure dev server is running: `npm run dev`
2. Check environment variables in `.env.test.local`
3. Clear browser state: `npx playwright clean`
4. Update browsers: `npx playwright install`

### Flaky Tests
- Add explicit waits: `await page.waitForSelector()`
- Use `toBeVisible()` instead of checking existence
- Increase timeout for slow operations
- Check for race conditions in test logic

### CI/CD Failures
- Check GitHub Actions logs
- Ensure secrets are configured
- Verify database is seeded correctly
- Check for environment-specific issues

## Next Steps

1. ✅ **Write More Tests**: Follow TESTING_STRATEGY.md for priority flows
2. ✅ **Add Data Test IDs**: Add `data-testid` attributes to key components
3. ✅ **Create More Page Objects**: Build page objects for Tutor, Flashcards, etc.
4. ✅ **Expand Fixtures**: Add fixtures for common test scenarios
5. ✅ **Setup CI/CD**: Configure GitHub Actions workflow

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
- [Testing Strategy (our docs)](./TESTING_STRATEGY.md)
