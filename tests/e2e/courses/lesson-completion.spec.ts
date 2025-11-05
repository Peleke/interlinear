import { test, expect } from '@playwright/test'

test.describe('Lesson Completion', () => {
  test('should complete a lesson and redirect to course page', async ({ page }) => {
    // Navigate to courses
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    // Click on the first course
    const firstCourse = page.locator('a[href^="/courses/"]').first()
    await expect(firstCourse).toBeVisible({ timeout: 10000 })
    await firstCourse.click()

    // Wait for course page to load
    await page.waitForURL('**/courses/**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Find the first lesson that is NOT completed
    const incompleteLesson = page.locator('a[href*="/lessons/"]:not(:has(svg.text-green-600))').first()
    await expect(incompleteLesson).toBeVisible({ timeout: 10000 })

    // Get the lesson URL before clicking
    const lessonUrl = await incompleteLesson.getAttribute('href')

    // Click on the lesson
    await incompleteLesson.click()

    // Wait for lesson page to load
    await page.waitForURL('**/lessons/**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Verify we're on a lesson page
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })

    // Check if "Mark as Complete" button exists (it should be visible if lesson has content)
    const markCompleteButton = page.locator('button:has-text("Mark as Complete")')

    // If button is visible, click it
    if (await markCompleteButton.isVisible({ timeout: 5000 })) {
      await markCompleteButton.click()

      // Wait for the completion to process
      await page.waitForTimeout(2000) // Give server time to process

      // Should see "Completed" indicator instead of button
      await expect(page.locator('text=Completed')).toBeVisible({ timeout: 10000 })

      // Verify the button is now hidden
      await expect(markCompleteButton).not.toBeVisible()

      // Navigate back to course page
      const backButton = page.locator('a:has-text("Back to Course")')
      await backButton.click()

      // Wait for course page to load
      await page.waitForLoadState('networkidle')

      // Verify the lesson now shows as completed (has a green checkmark)
      const completedLesson = page.locator(`a[href="${lessonUrl}"]`).locator('svg.text-green-600, .text-green-600')
      await expect(completedLesson).toBeVisible({ timeout: 10000 })
    } else {
      // If no button visible, lesson might not have content blocks
      console.log('Mark as Complete button not visible - lesson may not have content blocks')
      test.skip()
    }
  })

  test('should not show mark complete button for already completed lessons', async ({ page }) => {
    // Navigate to courses
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    // Click on the first course
    const firstCourse = page.locator('a[href^="/courses/"]').first()
    await firstCourse.click()

    // Wait for course page
    await page.waitForURL('**/courses/**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Find a completed lesson (has green checkmark)
    const completedLesson = page.locator('a[href*="/lessons/"]:has(svg.text-green-600, .text-green-600)').first()

    if (await completedLesson.isVisible({ timeout: 5000 })) {
      await completedLesson.click()

      // Wait for lesson page
      await page.waitForURL('**/lessons/**', { timeout: 10000 })
      await page.waitForLoadState('networkidle')

      // Should show "Completed" indicator in header
      await expect(page.locator('text=Completed')).toBeVisible({ timeout: 10000 })

      // Should NOT show "Mark as Complete" button
      const markCompleteButton = page.locator('button:has-text("Mark as Complete")')
      await expect(markCompleteButton).not.toBeVisible()
    } else {
      console.log('No completed lessons found - skipping test')
      test.skip()
    }
  })
})
