import { test, expect } from '@playwright/test'

test.describe('User Signup', () => {
  test('should create account with valid credentials', async ({ page }) => {
    await page.goto('/signup')

    // Fill in valid credentials
    const email = `test-${Date.now()}@example.com`
    const password = 'SecurePass123!'

    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')

    // Should show success message (signup redirects to login with pending verification)
    await expect(page.getByText('Success! Account created.')).toBeVisible({ timeout: 10000 })
  })

  test('should show error for weak password', async ({ page }) => {
    await page.goto('/signup')

    const email = `test-${Date.now()}@example.com`
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', '123') // Too short

    await page.click('button[type="submit"]')

    // Should show validation error
    await expect(page.locator('text=/password.*8/i')).toBeVisible()
  })
})
