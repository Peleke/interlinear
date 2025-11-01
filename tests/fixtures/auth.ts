import { test as base, Page } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: Page
  testUser: { email: string; password: string }
}

/**
 * Extended test fixture that provides authenticated user sessions
 *
 * Usage:
 *   import { test } from '@/tests/fixtures/auth'
 *   test('my test', async ({ authenticatedPage }) => { ... })
 */
export const test = base.extend<AuthFixtures>({
  testUser: async ({}, use) => {
    // Generate unique test user credentials
    const timestamp = Date.now()
    const user = {
      email: `test-${timestamp}@example.com`,
      password: 'TestPassword123!'
    }

    await use(user)

    // TODO: Cleanup - delete user from Supabase if needed
    // This can be implemented later when we have admin API access
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    // Navigate to signup page
    await page.goto('/signup')

    // Fill in signup form
    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button[type="submit"]')

    // Wait for redirect to reader (successful signup auto-logs in)
    await page.waitForURL('/reader', { timeout: 10000 })

    // Provide the authenticated page to the test
    await use(page)

    // Cleanup: logout after test
    try {
      // Check if we're still on an authenticated page
      const currentUrl = page.url()
      if (!currentUrl.includes('/login') && !currentUrl.includes('/signup')) {
        await page.goto('/profile')
        await page.click('button:has-text("Logout")').catch(() => {
          // Ignore if logout button not found
        })
      }
    } catch (error) {
      // Silently fail cleanup - test already finished
    }
  }
})

export { expect } from '@playwright/test'
