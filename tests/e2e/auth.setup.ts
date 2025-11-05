import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../../.auth/user.json')

setup('authenticate', async ({ page }) => {
  // Use test credentials from environment or defaults
  const email = process.env.TEST_USER_EMAIL || 'test@example.com'
  const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

  // Navigate to login page
  await page.goto('/login')

  // Fill in login form
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)

  // Click login button
  await page.click('button:has-text("Log In")')

  // Wait for successful login - check for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })

  // Verify we're authenticated by checking for a common authenticated element
  // This could be a user menu, dashboard, or any element that only shows when logged in
  await expect(page).not.toHaveURL(/\/login/)

  // Save signed-in state to 'authFile'
  await page.context().storageState({ path: authFile })
})
