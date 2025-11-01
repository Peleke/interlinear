// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CardType = 'basic' | 'basic_reversed' | 'basic_with_text' | 'cloze'

export interface BaseFlashcard {
  id: string
  deck_id: string
  card_type: CardType
  extra?: string
  notes?: string
  source?: string
  source_id?: string
  created_at: string
  updated_at: string
}

export interface BasicFlashcard extends BaseFlashcard {
  card_type: 'basic' | 'basic_reversed' | 'basic_with_text'
  front: string
  back: string
}

export interface ClozeFlashcard extends BaseFlashcard {
  card_type: 'cloze'
  cloze_text: string
}

export type Flashcard = BasicFlashcard | ClozeFlashcard

// Practice card (what user sees during review)
export interface PracticeCard {
  card_id: string
  card_index: number // Which variation (for reversed/cloze)
  deck_id: string
  deck_name: string
  card_type: CardType
  prompt: string // What to show user
  answer: string // Correct answer
  full_content: string // Full content after reveal
  extra?: string
  notes?: string
}

// Deck interface
export interface FlashcardDeck {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  card_count?: number
  due_count?: number
}

// Review quality ratings
export type ReviewQuality = 0 | 1 | 2 | 3 // Again, Hard, Good, Easy

// ============================================================================
// CLOZE PARSING UTILITIES
// ============================================================================

interface ClozeMatch {
  index: number // c1, c2, etc.
  word: string // The hidden word
  hint?: string // Optional hint
  fullMatch: string // Full {{c1::word::hint}} string
  start: number // Position in text
  end: number // Position in text
}

/**
 * Parse cloze text to extract all deletions
 * Example: "El {{c1::perro}} corre en el {{c2::parque::place}}."
 * Returns: [
 *   { index: 1, word: "perro", start: 3, end: 19, ... },
 *   { index: 2, word: "parque", hint: "place", start: 32, end: 56, ... }
 * ]
 */
export function parseClozeText(text: string): ClozeMatch[] {
  const matches: ClozeMatch[] = []
  // Regex to match {{c1::word}} or {{c1::word::hint}}
  const regex = /\{\{c(\d+)::([^:}]+)(?:::([^}]+))?\}\}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      index: parseInt(match[1]),
      word: match[2].trim(),
      hint: match[3]?.trim(),
      fullMatch: match[0],
      start: match.index,
      end: match.index + match[0].length
    })
  }

  return matches.sort((a, b) => a.index - b.index)
}

/**
 * Render cloze text with specific deletions hidden
 * @param text - Original cloze text
 * @param hideIndices - Which cloze indices to hide (e.g., [1] to hide {{c1::}})
 * @param showHints - Whether to show hints in brackets
 * @returns Rendered text with deletions replaced by [...] or [hint]
 */
export function renderClozeText(
  text: string,
  hideIndices: number[],
  showHints: boolean = true
): string {
  const matches = parseClozeText(text)
  let result = text

  // Replace from end to start to maintain positions
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]

    if (hideIndices.includes(match.index)) {
      // Hide this deletion
      const replacement = showHints && match.hint
        ? `[${match.hint}]`
        : '[...]'
      result = result.substring(0, match.start) + replacement + result.substring(match.end)
    } else {
      // Show the word (remove cloze syntax)
      result = result.substring(0, match.start) + match.word + result.substring(match.end)
    }
  }

  return result
}

/**
 * Generate practice cards from a cloze flashcard
 * Each {{cN::}} deletion generates a separate practice card
 */
export function generateClozeCards(flashcard: ClozeFlashcard, deckName: string): PracticeCard[] {
  const matches = parseClozeText(flashcard.cloze_text)
  const cards: PracticeCard[] = []

  matches.forEach(match => {
    // Render prompt (hide only this deletion)
    const prompt = renderClozeText(flashcard.cloze_text, [match.index], true)

    // Render full content (show all words, no cloze syntax)
    const fullContent = renderClozeText(flashcard.cloze_text, [], false)

    cards.push({
      card_id: flashcard.id,
      card_index: match.index - 1, // 0-indexed for database
      deck_id: flashcard.deck_id,
      deck_name: deckName,
      card_type: 'cloze',
      prompt,
      answer: match.word,
      full_content: fullContent,
      extra: flashcard.extra,
      notes: flashcard.notes
    })
  })

  return cards
}

/**
 * Generate practice cards from a basic flashcard
 */
export function generateBasicCards(
  flashcard: BasicFlashcard,
  deckName: string
): PracticeCard[] {
  const cards: PracticeCard[] = []

  // Forward card (always)
  cards.push({
    card_id: flashcard.id,
    card_index: 0,
    deck_id: flashcard.deck_id,
    deck_name: deckName,
    card_type: flashcard.card_type,
    prompt: flashcard.front,
    answer: flashcard.back,
    full_content: flashcard.back,
    extra: flashcard.extra,
    notes: flashcard.notes
  })

  // Reverse card (only for basic_reversed)
  if (flashcard.card_type === 'basic_reversed') {
    cards.push({
      card_id: flashcard.id,
      card_index: 1,
      deck_id: flashcard.deck_id,
      deck_name: deckName,
      card_type: flashcard.card_type,
      prompt: flashcard.back,
      answer: flashcard.front,
      full_content: flashcard.front,
      extra: flashcard.extra,
      notes: flashcard.notes
    })
  }

  return cards
}

// ============================================================================
// MOCK SRS SCHEDULER
// ============================================================================

interface ScheduleResult {
  interval_days: number
  next_review_date: Date
}

/**
 * Mock SRS Scheduler with fixed intervals
 * Easy to swap with SM-2 algorithm later
 */
export class MockScheduler {
  static calculate(quality: ReviewQuality, currentInterval: number = 0): ScheduleResult {
    let interval_days: number

    switch (quality) {
      case 0: // Again
        interval_days = 1
        break
      case 1: // Hard
        interval_days = 3
        break
      case 2: // Good
        interval_days = 7
        break
      case 3: // Easy
        interval_days = 30
        break
      default:
        interval_days = 1
    }

    const next_review_date = new Date()
    next_review_date.setDate(next_review_date.getDate() + interval_days)

    return { interval_days, next_review_date }
  }
}

// This file contains only pure utility functions and types
// Database operations are handled directly in API routes
