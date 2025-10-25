# Story 2.3: Tokenization Engine

## Story
**As a** developer
**I want to** split Spanish text into clickable tokens
**So that** each word can be individually selected and defined

## Priority
**P0 - Day 1 PM, Hours 6-7**

## Acceptance Criteria
- [ ] Text split by whitespace into tokens
- [ ] Punctuation preserved with words
- [ ] Each token has unique ID
- [ ] Sentence boundaries detected
- [ ] Original formatting maintained (spacing, line breaks)
- [ ] Handles edge cases (numbers, ellipses, quotes)
- [ ] TypeScript types for Token interface

## Technical Details

### Token Interface (`types/index.ts`)
```typescript
export interface Token {
  id: string // Format: word-{index}
  text: string // The actual word (including punctuation)
  cleanText: string // Word without punctuation for API lookups
  index: number // Position in original text
  sentenceId: number // Which sentence this belongs to
  isWord: boolean // true for words, false for pure whitespace/punctuation
}

export interface Sentence {
  id: number
  tokens: Token[]
  text: string
}
```

### Tokenization Utility (`lib/tokenize.ts`)
```typescript
export function tokenizeText(text: string): Token[] {
  const tokens: Token[] = []
  let currentIndex = 0

  // Split by whitespace while preserving the whitespace
  const rawTokens = text.split(/(\s+)/)

  rawTokens.forEach((rawToken, idx) => {
    if (rawToken.length === 0) return

    // Determine if this is a word or just whitespace
    const isWord = /\S/.test(rawToken)

    // Remove punctuation for clean text (used for API calls)
    const cleanText = rawToken.replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase()

    tokens.push({
      id: `word-${currentIndex}`,
      text: rawToken,
      cleanText: isWord ? cleanText : '',
      index: currentIndex,
      sentenceId: 0, // Will be set by sentence detection
      isWord,
    })

    currentIndex++
  })

  // Detect sentence boundaries
  return detectSentences(tokens)
}

function detectSentences(tokens: Token[]): Token[] {
  let sentenceId = 0
  let buffer = ''

  return tokens.map((token) => {
    buffer += token.text

    // Sentence ends with . ! ? followed by whitespace or end of text
    const endsWithPunctuation = /[.!?]\s*$/.test(buffer)

    if (endsWithPunctuation) {
      const updatedToken = { ...token, sentenceId }
      sentenceId++
      buffer = ''
      return updatedToken
    }

    return { ...token, sentenceId }
  })
}

export function getSentence(tokens: Token[], sentenceId: number): string {
  return tokens
    .filter((t) => t.sentenceId === sentenceId)
    .map((t) => t.text)
    .join('')
}

export function getWordTokens(tokens: Token[]): Token[] {
  return tokens.filter((t) => t.isWord)
}
```

### Example Usage
```typescript
const text = "Hola mundo. ¿Cómo estás? ¡Muy bien!"
const tokens = tokenizeText(text)

// Result:
// [
//   { id: 'word-0', text: 'Hola', cleanText: 'hola', index: 0, sentenceId: 0, isWord: true },
//   { id: 'word-1', text: ' ', cleanText: '', index: 1, sentenceId: 0, isWord: false },
//   { id: 'word-2', text: 'mundo.', cleanText: 'mundo', index: 2, sentenceId: 0, isWord: true },
//   { id: 'word-3', text: ' ', cleanText: '', index: 3, sentenceId: 1, isWord: false },
//   { id: 'word-4', text: '¿Cómo', cleanText: 'cómo', index: 4, sentenceId: 1, isWord: true },
//   ...
// ]
```

### Edge Cases Handled
- **Accented characters:** ¿ ¡ á é í ó ú ñ
- **Quotation marks:** "palabra" 'palabra'
- **Numbers:** año 2024, 1.5 metros
- **Ellipses:** palabra...
- **Multiple punctuation:** ¿¡Hola!?

### Tasks
1. Create `types/index.ts` with Token interface
2. Create `lib/tokenize.ts` with tokenization logic
3. Implement whitespace splitting
4. Add punctuation handling (preserve but clean)
5. Implement sentence boundary detection
6. Add helper functions (getSentence, getWordTokens)
7. Write tests for edge cases
8. Test with sample Spanish text

## Architecture References
- `/docs/architecture/data-models.md` - Token interface
- `/docs/prd/feature-specifications.md` - Tokenization requirements
- `/docs/architecture/coding-standards.md` - TypeScript patterns

## Definition of Done
- [ ] Text tokenized correctly
- [ ] Punctuation preserved
- [ ] Sentence boundaries detected
- [ ] Handles Spanish characters (á, ñ, ¿, ¡)
- [ ] TypeScript fully typed
- [ ] Edge cases tested
- [ ] No data loss from original text
