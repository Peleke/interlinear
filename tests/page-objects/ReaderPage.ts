import { Page, Locator, expect } from '@playwright/test'

/**
 * Page Object Model for Reader page
 * Encapsulates all interactions with the interactive text reader
 */
export class ReaderPage {
  readonly page: Page

  // Locators
  readonly textInput: Locator
  readonly renderButton: Locator
  readonly editButton: Locator
  readonly definitionSidebar: Locator
  readonly audioButton: Locator
  readonly characterCount: Locator
  readonly renderedText: Locator

  constructor(page: Page) {
    this.page = page

    // Input mode elements
    this.textInput = page.locator('textarea[placeholder*="Spanish text"]')
    this.renderButton = page.getByRole('button', { name: /render text/i })
    this.characterCount = page.locator('[data-testid="char-count"]')

    // Render mode elements
    this.editButton = page.getByRole('button', { name: /edit text/i })
    this.renderedText = page.locator('[data-testid="rendered-text"]')

    // Definition sidebar
    this.definitionSidebar = page.locator('[data-testid="definition-sidebar"]')
    this.audioButton = this.definitionSidebar.locator('button[title*="audio"]')
  }

  // Navigation
  async goto() {
    await this.page.goto('/reader')
  }

  // Actions - Input Mode
  async pasteText(text: string) {
    await this.textInput.fill(text)
  }

  async clearText() {
    await this.textInput.clear()
  }

  async renderText() {
    await this.renderButton.click()
  }

  // Actions - Render Mode
  async clickWord(word: string) {
    // Click the first occurrence of the word
    await this.page.locator(`span[data-word]:has-text("${word}")`).first().click()
  }

  async clickWordAtIndex(word: string, index: number) {
    await this.page.locator(`span[data-word]:has-text("${word}")`).nth(index).click()
  }

  async editText() {
    await this.editButton.click()
  }

  async playAudio() {
    await this.audioButton.click()
  }

  async closeSidebar() {
    await this.definitionSidebar.locator('button[aria-label="Close"]').click()
  }

  // Waiters
  async waitForDefinition() {
    await this.definitionSidebar.waitFor({ state: 'visible', timeout: 5000 })
  }

  async waitForRenderComplete() {
    await this.renderedText.waitFor({ state: 'visible' })
  }

  // Assertions
  async expectToBeInInputMode() {
    await expect(this.textInput).toBeVisible()
    await expect(this.renderButton).toBeVisible()
  }

  async expectToBeInRenderMode() {
    await expect(this.renderedText).toBeVisible()
    await expect(this.editButton).toBeVisible()
  }

  async expectWordToBeRendered(word: string) {
    await expect(this.page.locator(`span[data-word]:has-text("${word}")`).first()).toBeVisible()
  }

  async expectWordToBeHighlighted(word: string) {
    const wordElement = this.page.locator(`span[data-word]:has-text("${word}")`).first()
    await expect(wordElement).toHaveClass(/highlighted|active|selected/)
  }

  async expectDefinitionToShow(translation: string) {
    await expect(this.definitionSidebar).toContainText(translation)
  }

  async expectDefinitionSidebarToBeOpen() {
    await expect(this.definitionSidebar).toBeVisible()
  }

  async expectDefinitionSidebarToBeClosed() {
    await expect(this.definitionSidebar).not.toBeVisible()
  }

  async expectWordCount(count: number) {
    const words = await this.page.locator('span[data-word]').count()
    expect(words).toBe(count)
  }

  async expectCharacterCount(text: string) {
    await expect(this.characterCount).toContainText(String(text.length))
  }

  async expectErrorMessage(message: string) {
    await expect(this.definitionSidebar).toContainText(message)
  }

  // Helpers
  async getRenderedWords(): Promise<string[]> {
    const wordElements = await this.page.locator('span[data-word]').all()
    return Promise.all(wordElements.map(el => el.textContent() || ''))
  }

  async isAudioPlaying(): Promise<boolean> {
    const playingClass = await this.audioButton.getAttribute('class')
    return playingClass?.includes('playing') || playingClass?.includes('animate-pulse') || false
  }
}
