# Testing Strategy - Interlinear

## Overview
BDD-style E2E testing strategy using Playwright for comprehensive user flow validation.

**Testing Philosophy**: Test user journeys, not implementation details. Focus on what users experience.

---

## User Flow Map

### 🔐 Flow 1: Authentication Journey
**Path**: Signup → Login → Session Persistence → Logout

**Scenarios**:
```gherkin
Feature: User Authentication
  As a language learner
  I want to create an account and log in
  So that my progress is saved

  Scenario: New user signup
    Given I am on the home page
    When I navigate to the signup page
    And I enter valid credentials
      | email               | password    |
      | test@example.com    | Password123 |
    And I submit the form
    Then I should be redirected to the reader page
    And I should see my email in the profile menu

  Scenario: Existing user login
    Given I have an existing account
    When I navigate to the login page
    And I enter my credentials
    And I submit the form
    Then I should be redirected to the reader page
    And I should see a welcome message

  Scenario: Invalid login credentials
    Given I am on the login page
    When I enter invalid credentials
    And I submit the form
    Then I should see an error message
    And I should remain on the login page

  Scenario: Session persistence
    Given I am logged in
    When I close the browser
    And I reopen the application
    Then I should still be logged in
    And I should not see the login page

  Scenario: User logout
    Given I am logged in
    When I click the logout button
    Then I should be redirected to the home page
    And my session should be cleared
```

**Critical Paths**:
- ✅ P0: Signup → Auto-login → Reader
- ✅ P0: Login → Reader
- ✅ P0: Session persistence across tabs
- ✅ P1: Password reset flow
- ✅ P1: Email verification

---

### 📖 Flow 2: Reader Experience
**Path**: Paste Text → Render → Click Words → See Definitions → Hear Audio

**Scenarios**:
```gherkin
Feature: Interactive Text Reading
  As a user
  I want to read Spanish text with instant definitions
  So that I can learn vocabulary in context

  Scenario: Paste and render text
    Given I am logged in and on the reader page
    When I paste Spanish text into the textarea
      """
      Hola, me llamo María. ¿Cómo estás hoy?
      """
    And I click the "Render Text" button
    Then I should see the text rendered with clickable words
    And each word should be wrapped in a clickable span

  Scenario: Click word to see definition
    Given I have rendered text on the page
    When I click the word "hola"
    Then I should see the definition sidebar open
    And the sidebar should display:
      | field           | value                    |
      | Word            | hola                     |
      | Part of Speech  | interjection             |
      | Translation     | hello                    |
    And the word should be highlighted in the text

  Scenario: Definition not found
    Given I have rendered text on the page
    When I click a nonsense word "xyzabc"
    Then I should see an error message "Definition unavailable"
    And the sidebar should remain open

  Scenario: Hear word pronunciation
    Given I have a word definition open
    When I click the audio/speaker icon
    Then I should hear the word pronounced
    And the icon should show a playing animation

  Scenario: Switch between words quickly
    Given I have rendered text with multiple words
    When I click "hola"
    Then I should see "hola" definition
    When I click "estás"
    Then I should see "estás" definition
    And "hola" should no longer be highlighted

  Scenario: Edit rendered text
    Given I have rendered text on the page
    When I click the "Edit Text" button
    Then I should return to input mode
    And my previous text should still be in the textarea
```

**Critical Paths**:
- ✅ P0: Paste → Render → Interactive text
- ✅ P0: Click word → Definition shows
- ✅ P0: Audio playback works
- ✅ P1: Error handling (no definition, API failure)
- ✅ P1: Edit mode toggle

---

### 📚 Flow 3: Vocabulary Tracking
**Path**: Click Words → Auto-save → View List → Review

**Scenarios**:
```gherkin
Feature: Vocabulary Management
  As a user
  I want my clicked words automatically saved
  So that I can review them later

  Scenario: Auto-save clicked words
    Given I am on the reader page with rendered text
    When I click the word "hola"
    Then the word should be saved to my vocabulary list
    And I should see a visual indicator (checkmark or color)

  Scenario: Increment click count
    Given I have previously clicked "hola"
    When I click "hola" again
    Then the click count should increment
    And the word should not be duplicated in my list

  Scenario: View vocabulary list
    Given I have saved multiple words
    When I navigate to the vocabulary page
    Then I should see all my saved words
    And they should be sorted by most recent first
    And each entry should show:
      | field       |
      | Word        |
      | Translation |
      | Click count |
      | Date saved  |

  Scenario: Empty vocabulary state
    Given I have no saved words
    When I navigate to the vocabulary page
    Then I should see a helpful message
    And the message should say "Start clicking words in the reader..."

  Scenario: Vocabulary persistence
    Given I have saved words
    When I log out and log back in
    Then my vocabulary list should still be there
    And all my click counts should be preserved
```

**Critical Paths**:
- ✅ P0: Click → Auto-save
- ✅ P0: View vocabulary list
- ✅ P0: Persistence across sessions
- ✅ P1: Click count tracking
- ✅ P2: Export vocabulary

---

### 🏫 Flow 4: Tutor Mode (AI Conversation)
**Path**: Select Text → Choose Level → Chat → Error Correction → Save Vocabulary

**Scenarios**:
```gherkin
Feature: AI Tutor Conversations
  As a user
  I want to practice Spanish through AI conversations
  So that I can improve my speaking skills

  Scenario: Start tutor session
    Given I am on the library page
    When I select a text for tutoring
    And I choose CEFR level "B1"
    And I click "Start Conversation"
    Then I should see the tutor chat interface
    And I should see an initial message from the AI professor

  Scenario: Send message to tutor
    Given I am in an active tutor session
    When I type "Hola, ¿cómo estás?"
    And I click send
    Then my message should appear in the chat
    And I should see a loading indicator
    And the AI should respond within 5 seconds
    And the AI response should be appropriate to my level

  Scenario: Play audio for AI response
    Given I have received an AI response
    When I click the audio button on the message
    Then I should hear the message pronounced
    And the audio should play without errors

  Scenario: Error correction and review
    Given I have completed 3+ conversation turns
    When the tutor detects errors in my Spanish
    Then I should see an error correction panel
    And each error should show:
      | field       |
      | Error text  |
      | Correction  |
      | Explanation |

  Scenario: Save vocabulary from tutor
    Given I am in a tutor conversation
    When I click the save icon on a word
    Then the word should be added to my flashcards
    And I should see a confirmation toast
```

**Critical Paths**:
- ✅ P0: Start session → AI responds
- ✅ P0: Message send/receive flow
- ✅ P0: Audio playback works
- ✅ P0: Error correction display
- ✅ P1: Save to flashcards integration

---

### 🎴 Flow 5: Flashcard System (SRS)
**Path**: Create Deck → Add Cards → Practice → Review

**Scenarios**:
```gherkin
Feature: Flashcard Practice
  As a user
  I want to practice vocabulary with spaced repetition
  So that I can memorize words effectively

  Scenario: Create new deck
    Given I am on the flashcards page
    When I click "Create New Deck"
    And I enter deck name "Common Verbs"
    And I enter description "Essential Spanish verbs"
    And I click save
    Then I should see my new deck in the list

  Scenario: Add flashcard to deck
    Given I have a deck "Common Verbs"
    When I click "Add Card"
    And I select card type "Basic"
    And I enter:
      | Front | hablar        |
      | Back  | to speak      |
    And I click save
    Then the card should be added to the deck

  Scenario: Practice flashcards
    Given I have a deck with 5 cards
    When I click "Practice"
    Then I should see the first card front
    When I click "Show Answer"
    Then I should see the card back
    And I should see difficulty buttons:
      | Again | Hard | Good | Easy |

  Scenario: Rate card difficulty
    Given I am practicing flashcards
    And I am viewing a card's answer
    When I click "Good"
    Then the next card should be shown
    And the previous card's review data should be saved

  Scenario: Complete practice session
    Given I am practicing 5 cards
    When I complete all 5 cards
    Then I should see a completion screen
    And I should see my session stats:
      | Cards reviewed |
      | Average time   |
      | Accuracy       |

  Scenario: Cloze deletion cards
    Given I am creating a new card
    When I select card type "Cloze"
    And I enter "Me {{c1::gusta}} el español"
    And I save the card
    Then when practicing, I should see "Me _____ el español"
    And revealing should show "Me gusta el español"
```

**Critical Paths**:
- ✅ P0: Create deck → Add cards → Practice
- ✅ P0: SRS algorithm works correctly
- ✅ P0: Card types (basic, cloze) render properly
- ✅ P1: Progress tracking
- ✅ P1: Import/export decks

---

### 📚 Flow 6: Library Management
**Path**: Create Text → Save → Browse → Select for Reading/Tutoring

**Scenarios**:
```gherkin
Feature: Text Library
  As a user
  I want to save and organize Spanish texts
  So that I can return to them later

  Scenario: Save new text
    Given I am on the library page
    When I click "Add Text"
    And I enter:
      | Title   | Mi primer texto    |
      | Content | Hola, soy estudiante. |
      | Language| Spanish            |
    And I click save
    Then the text should appear in my library

  Scenario: Browse library
    Given I have 10 saved texts
    When I am on the library page
    Then I should see all my texts
    And they should be sorted by most recent

  Scenario: Open text in reader
    Given I have a text "Mi primer texto" in my library
    When I click on the text
    And I select "Read"
    Then I should be taken to the reader page
    And the text should be loaded and rendered

  Scenario: Start tutor session from library
    Given I have a text "Mi primer texto" in my library
    When I click on the text
    And I select "Practice with Tutor"
    Then I should be taken to the tutor page
    And the text should be loaded as context

  Scenario: Delete text
    Given I have a text in my library
    When I click the delete button
    And I confirm deletion
    Then the text should be removed from my library
```

**Critical Paths**:
- ✅ P0: Create → Save → Retrieve
- ✅ P0: Open in reader
- ✅ P0: Start tutor session
- ✅ P1: Edit existing text
- ✅ P2: Share texts

---

## Testing Architecture

### Tech Stack
```yaml
Framework: Playwright
Language: TypeScript
Assertion Library: Expect (Playwright built-in)
Reporting: HTML Reporter + CI/CD integration
```

### Directory Structure
```
tests/
├── e2e/
│   ├── auth/
│   │   ├── signup.spec.ts
│   │   ├── login.spec.ts
│   │   └── session.spec.ts
│   ├── reader/
│   │   ├── text-rendering.spec.ts
│   │   ├── word-definitions.spec.ts
│   │   └── audio-playback.spec.ts
│   ├── vocabulary/
│   │   ├── auto-save.spec.ts
│   │   └── vocabulary-list.spec.ts
│   ├── tutor/
│   │   ├── conversation.spec.ts
│   │   ├── error-correction.spec.ts
│   │   └── vocabulary-save.spec.ts
│   ├── flashcards/
│   │   ├── deck-management.spec.ts
│   │   ├── card-creation.spec.ts
│   │   └── practice-session.spec.ts
│   └── library/
│       ├── text-management.spec.ts
│       └── navigation.spec.ts
├── fixtures/
│   ├── auth.ts         # Authenticated user fixture
│   ├── test-data.ts    # Sample texts, words, etc.
│   └── db-setup.ts     # Database seeding utilities
├── page-objects/
│   ├── LoginPage.ts
│   ├── ReaderPage.ts
│   ├── VocabularyPage.ts
│   ├── TutorPage.ts
│   ├── FlashcardsPage.ts
│   └── LibraryPage.ts
└── playwright.config.ts
```

### Page Object Pattern
```typescript
// page-objects/ReaderPage.ts
export class ReaderPage {
  constructor(private page: Page) {}

  // Locators
  get textInput() { return this.page.locator('textarea[placeholder*="Spanish text"]') }
  get renderButton() { return this.page.getByRole('button', { name: 'Render Text' }) }
  get editButton() { return this.page.getByRole('button', { name: 'Edit Text' }) }
  get definitionSidebar() { return this.page.locator('[data-testid="definition-sidebar"]') }

  // Actions
  async pasteText(text: string) {
    await this.textInput.fill(text)
  }

  async renderText() {
    await this.renderButton.click()
  }

  async clickWord(word: string) {
    await this.page.locator(`span:has-text("${word}")`).first().click()
  }

  async waitForDefinition() {
    await this.definitionSidebar.waitFor({ state: 'visible' })
  }

  // Assertions
  async expectWordToBeRendered(word: string) {
    await expect(this.page.locator(`span:has-text("${word}")`)).toBeVisible()
  }

  async expectDefinitionToShow(translation: string) {
    await expect(this.definitionSidebar).toContainText(translation)
  }
}
```

### Fixture Pattern for Auth
```typescript
// fixtures/auth.ts
import { test as base } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: Page
  testUser: { email: string; password: string }
}

export const test = base.extend<AuthFixtures>({
  testUser: async ({}, use) => {
    const user = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    }
    await use(user)
    // Cleanup: delete user from DB if needed
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    // Sign up
    await page.goto('/signup')
    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button[type="submit"]')

    // Wait for redirect
    await page.waitForURL('/reader')

    await use(page)

    // Cleanup: logout
    await page.goto('/profile')
    await page.click('button:has-text("Logout")')
  }
})
```

---

## Test Implementation Examples

### Example 1: Auth Flow
```typescript
// tests/e2e/auth/signup.spec.ts
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
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', 'SecurePass123!')

    // And I submit the form
    await page.click('button[type="submit"]')

    // Then I should be redirected to the reader page
    await expect(page).toHaveURL('/reader')

    // And I should see my email in the profile menu
    await page.click('[data-testid="profile-menu"]')
    await expect(page.locator('text=' + email)).toBeVisible()
  })

  test('should show error for weak password', async ({ page }) => {
    await page.goto('/signup')

    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', '123') // Too short
    await page.click('button[type="submit"]')

    await expect(page.locator('text=/password.*8 characters/i')).toBeVisible()
  })
})
```

### Example 2: Reader Flow
```typescript
// tests/e2e/reader/text-rendering.spec.ts
import { test } from '@/tests/fixtures/auth'
import { expect } from '@playwright/test'
import { ReaderPage } from '@/tests/page-objects/ReaderPage'

test.describe('Interactive Text Reading', () => {
  test('should paste and render text with clickable words', async ({ authenticatedPage }) => {
    const reader = new ReaderPage(authenticatedPage)
    const spanishText = 'Hola, me llamo María.'

    // Given I am logged in and on the reader page
    await authenticatedPage.goto('/reader')

    // When I paste Spanish text
    await reader.pasteText(spanishText)

    // And I click the "Render Text" button
    await reader.renderText()

    // Then I should see the text rendered with clickable words
    await reader.expectWordToBeRendered('Hola')
    await reader.expectWordToBeRendered('llamo')
    await reader.expectWordToBeRendered('María')

    // And each word should be wrapped in a clickable span
    const words = await authenticatedPage.locator('span[data-word]').count()
    expect(words).toBeGreaterThan(0)
  })

  test('should show definition when clicking a word', async ({ authenticatedPage }) => {
    const reader = new ReaderPage(authenticatedPage)

    await authenticatedPage.goto('/reader')
    await reader.pasteText('Hola mundo')
    await reader.renderText()

    // When I click the word "hola"
    await reader.clickWord('Hola')

    // Then I should see the definition sidebar open
    await reader.waitForDefinition()

    // And the sidebar should display the translation
    await reader.expectDefinitionToShow('hello')
  })
})
```

### Example 3: Tutor Flow
```typescript
// tests/e2e/tutor/conversation.spec.ts
import { test } from '@/tests/fixtures/auth'
import { expect } from '@playwright/test'
import { TutorPage } from '@/tests/page-objects/TutorPage'

test.describe('AI Tutor Conversations', () => {
  test('should start session and receive AI response', async ({ authenticatedPage }) => {
    const tutor = new TutorPage(authenticatedPage)

    // Given I have selected a text and level
    await authenticatedPage.goto('/library')
    await authenticatedPage.click('text=Sample Text')
    await authenticatedPage.click('text=Practice with Tutor')
    await authenticatedPage.click('button:has-text("B1")')
    await authenticatedPage.click('button:has-text("Start Conversation")')

    // Then I should see an initial message from the AI
    await expect(tutor.getMessageByRole('ai').first()).toBeVisible({ timeout: 10000 })

    // When I send a message
    await tutor.typeMessage('Hola, ¿cómo estás?')
    await tutor.sendMessage()

    // Then I should see my message in the chat
    await expect(tutor.getMessageByRole('user').last()).toContainText('Hola')

    // And the AI should respond
    await expect(tutor.getMessageByRole('ai').nth(1)).toBeVisible({ timeout: 10000 })
  })

  test('should play audio for AI message', async ({ authenticatedPage }) => {
    const tutor = new TutorPage(authenticatedPage)

    // Given I have an AI response
    await tutor.startSession('B1')
    await tutor.waitForAIResponse()

    // When I click the audio button
    const audioButton = tutor.getAudioButtonForMessage(0)
    await audioButton.click()

    // Then audio should play (check for playing state)
    await expect(audioButton).toHaveClass(/playing|animate-pulse/)
  })
})
```

### Example 4: Flashcards Flow
```typescript
// tests/e2e/flashcards/practice-session.spec.ts
import { test } from '@/tests/fixtures/auth'
import { expect } from '@playwright/test'
import { FlashcardsPage } from '@/tests/page-objects/FlashcardsPage'

test.describe('Flashcard Practice', () => {
  test('should complete practice session and show stats', async ({ authenticatedPage }) => {
    const flashcards = new FlashcardsPage(authenticatedPage)

    // Setup: Create deck with 3 cards
    await flashcards.createDeck('Test Deck')
    await flashcards.addCard({ front: 'hola', back: 'hello' })
    await flashcards.addCard({ front: 'adiós', back: 'goodbye' })
    await flashcards.addCard({ front: 'gracias', back: 'thank you' })

    // Start practice
    await flashcards.startPractice()

    // Practice all cards
    for (let i = 0; i < 3; i++) {
      await flashcards.showAnswer()
      await flashcards.rateCard('Good')
    }

    // Then I should see completion screen
    await expect(authenticatedPage.locator('text=/Session Complete|Practice Complete/i')).toBeVisible()

    // And I should see session stats
    await expect(authenticatedPage.locator('text=/Cards reviewed.*3/i')).toBeVisible()
  })
})
```

---

## Priority Matrix

### P0: Critical Paths (Must Have Before Launch)
- ✅ Auth: Signup, Login, Logout
- ✅ Reader: Paste → Render → Click → Definition
- ✅ Vocabulary: Auto-save words
- ✅ Tutor: Start session → Send/receive messages
- ✅ Flashcards: Create deck → Add cards → Practice

### P1: Important Flows (Should Have)
- ✅ Session persistence across tabs
- ✅ Audio playback (reader + tutor)
- ✅ Error correction in tutor
- ✅ Vocabulary list view
- ✅ Library: Create/read/delete texts

### P2: Nice to Have
- ✅ Password reset flow
- ✅ Email verification
- ✅ Cloze card types
- ✅ Export vocabulary
- ✅ Share library texts

---

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 20
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### Local Development
```bash
# Run all tests
npm run test:e2e

# Run specific suite
npm run test:e2e -- tests/e2e/auth/

# Run in UI mode (debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific test
npm run test:e2e -- -g "should create account"
```

---

## Success Metrics

### Coverage Goals
- ✅ **User Flows**: 100% of P0 critical paths covered
- ✅ **Features**: 80%+ of P1 features covered
- ✅ **Edge Cases**: 60%+ of P2 edge cases covered

### Quality Targets
- ✅ **Test Stability**: < 5% flakiness rate
- ✅ **Execution Time**: < 10 minutes for full suite
- ✅ **Maintenance**: Tests updated within 1 sprint of feature changes

### Performance Benchmarks
- ✅ **API Response**: < 2s for dictionary lookups
- ✅ **Audio Generation**: < 3s for TTS
- ✅ **AI Tutor**: < 5s for conversation responses
- ✅ **Page Load**: < 2s for authenticated pages

---

## Next Steps

1. ✅ **Setup Playwright**: Install and configure
2. ✅ **Create Page Objects**: Build reusable page models
3. ✅ **Write Auth Tests**: Start with signup/login (highest priority)
4. ✅ **Implement Reader Tests**: Core feature testing
5. ✅ **Add Tutor Tests**: AI conversation validation
6. ✅ **Setup CI/CD**: Automated test runs
7. ✅ **Monitor & Iterate**: Track flakiness, optimize

---

**Last Updated**: 2025-01-11
**Owner**: Engineering Team
**Status**: Ready for Implementation
