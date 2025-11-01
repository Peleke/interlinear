import { test, expect } from '@playwright/test'

test.describe('User Signup', () => {
  test('should create account with valid credentials', async ({ page }) => {
    // Given I am on the home page
    await page.goto('/')

    // When I navigate to the signup page
    await page.click('a:has-text("Sign Up")')
    await expect(page).toHaveURL('/signup')

    // And I enter valid credentials
    const email = `test-${Date.now()}@example.com`
    const password = 'SecurePass123!'

    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)

    // And I submit the form
    await page.click('button[type="submit"]')

    // Then I should be redirected to the reader page
    await expect(page).toHaveURL('/reader', { timeout: 10000 })

    // And I should be authenticated
    await page.goto('/profile')
    await expect(page.locator(`text=${email}`)).toBeVisible()
  })

  test('should show error for weak password', async ({ page }) => {
    await page.goto('/signup')

    const email = `test-${Date.now()}@example.com`
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', '123') // Too short

    await page.click('button[type="submit"]')

    // Should show validation error (exact message may vary)
    await expect(page.locator('text=/password.*8/i')).toBeVisible()
  })

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/signup')

    await page.fill('input[type="email"]', 'notanemail')
    await page.fill('input[type="password"]', 'ValidPass123!')

    await page.click('button[type="submit"]')

    // Should show email validation error
    await expect(page.locator('text=/invalid.*email|email.*invalid/i')).toBeVisible()
  })

  test('should show error for duplicate email', async ({ page }) => {
    const email = `duplicate-${Date.now()}@example.com`
    const password = 'ValidPass123!'

    // First signup
    await page.goto('/signup')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/reader', { timeout: 10000 })

    // Logout
    await page.goto('/profile')
    await page.click('button:has-text("Logout")')

    // Try to signup again with same email
    await page.goto('/signup')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')

    // Should show duplicate email error
    await expect(page.locator('text=/already.*exists|email.*taken/i')).toBeVisible()
  })

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/signup')

    // Check for proper accessibility
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    await expect(emailInput).toHaveAttribute('aria-label')
    await expect(passwordInput).toHaveAttribute('aria-label')
  })
})
