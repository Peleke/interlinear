import { test, expect } from '@/tests/fixtures/auth'
import { ReaderPage } from '@/tests/page-objects/ReaderPage'
import { SAMPLE_SPANISH_TEXTS } from '@/tests/fixtures/test-data'

test.describe('Interactive Text Reading', () => {
  test('should paste and render text with clickable words', async ({ authenticatedPage }) => {
    const reader = new ReaderPage(authenticatedPage)
    await reader.goto()

    // Given I am on the reader page
    await reader.expectToBeInInputMode()

    // When I paste Spanish text
    await reader.pasteText(SAMPLE_SPANISH_TEXTS.greeting)

    // And I click the "Render Text" button
    await reader.renderText()

    // Then I should see the text rendered with clickable words
    await reader.waitForRenderComplete()
    await reader.expectToBeInRenderMode()

    // And each word should be clickable
    await reader.expectWordToBeRendered('Hola')
    await reader.expectWordToBeRendered('llamo')
    await reader.expectWordToBeRendered('María')

    // Verify words are wrapped in spans
    const words = await reader.getRenderedWords()
    expect(words.length).toBeGreaterThan(0)
  })

  test('should preserve spacing and punctuation when rendering', async ({ authenticatedPage }) => {
    const reader = new ReaderPage(authenticatedPage)
    await reader.goto()

    const textWithPunctuation = 'Hola, ¿cómo estás? ¡Muy bien!'
    await reader.pasteText(textWithPunctuation)
    await reader.renderText()

    await reader.waitForRenderComplete()

    // Check that punctuation is preserved
    await expect(authenticatedPage.locator('text=/Hola,/')).toBeVisible()
    await expect(authenticatedPage.locator('text=/¿cómo/')).toBeVisible()
    await expect(authenticatedPage.locator('text=/¡Muy/')).toBeVisible()
  })

  test('should toggle between input and render modes', async ({ authenticatedPage }) => {
    const reader = new ReaderPage(authenticatedPage)
    await reader.goto()

    // Start in input mode
    await reader.expectToBeInInputMode()

    // Render text
    await reader.pasteText(SAMPLE_SPANISH_TEXTS.simple)
    await reader.renderText()
    await reader.waitForRenderComplete()
    await reader.expectToBeInRenderMode()

    // Return to edit mode
    await reader.editText()
    await reader.expectToBeInInputMode()

    // Text should still be there
    const inputValue = await reader.textInput.inputValue()
    expect(inputValue).toBe(SAMPLE_SPANISH_TEXTS.simple)
  })

  test('should show character count in input mode', async ({ authenticatedPage }) => {
    const reader = new ReaderPage(authenticatedPage)
    await reader.goto()

    const text = 'Hola mundo'
    await reader.pasteText(text)

    // Character count should update
    await reader.expectCharacterCount(text)
  })

  test('should warn for text over soft limit', async ({ authenticatedPage }) => {
    const reader = new ReaderPage(authenticatedPage)
    await reader.goto()

    // Generate text over 2000 words
    const longText = 'palabra '.repeat(2100)
    await reader.pasteText(longText)

    // Should show warning (implementation-dependent)
    await expect(authenticatedPage.locator('text=/exceeded|too long|limit/i')).toBeVisible()
  })

  test('should persist text in session storage', async ({ authenticatedPage }) => {
    const reader = new ReaderPage(authenticatedPage)
    await reader.goto()

    const text = SAMPLE_SPANISH_TEXTS.greeting
    await reader.pasteText(text)

    // Navigate away
    await authenticatedPage.goto('/vocabulary')

    // Navigate back
    await authenticatedPage.goto('/reader')

    // Text should still be there
    const inputValue = await reader.textInput.inputValue()
    expect(inputValue).toBe(text)
  })
})
