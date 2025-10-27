# Story 2.3: Tokenization Engine

## Story
**As a** developer
**I want to** split Spanish text into clickable tokens
**So that** each word can be individually selected and defined

## Priority
**P0 - Day 1 PM, Hours 6-7**

## Acceptance Criteria
- [x] Text split by whitespace into tokens
- [x] Punctuation preserved with words
- [x] Each token has unique ID
- [x] Sentence boundaries detected
- [x] Original formatting maintained (spacing, line breaks)
- [x] Handles edge cases (numbers, ellipses, quotes)
- [x] TypeScript types for Token interface

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
- [x] Text tokenized correctly
- [x] Punctuation preserved
- [x] Sentence boundaries detected
- [x] Handles Spanish characters (á, ñ, ¿, ¡)
- [x] TypeScript fully typed
- [x] Edge cases tested
- [x] No data loss from original text

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (20250929)

### Tasks Completed
- [x] Created types/index.ts with Token and Sentence interfaces
- [x] Created lib/tokenize.ts with full tokenization engine
- [x] Implemented tokenizeText() - whitespace splitting with preservation
- [x] Implemented detectSentences() - sentence boundary detection
- [x] Implemented getSentence() - retrieve sentence text by ID
- [x] Implemented getWordTokens() - filter to only word tokens
- [x] Implemented getSentences() - group tokens into Sentence objects
- [x] Unicode-aware punctuation handling (\p{L}, \p{N})
- [x] Tested with Spanish text and edge cases
- [x] TypeScript strict mode validation passed

### Implementation Details

**Tokenization Algorithm:**
```typescript
// Split by whitespace, preserve whitespace tokens
text.split(/(\s+)/)

// Identify word vs whitespace
isWord = /\S/.test(rawToken)

// Clean text for API lookups (preserves Unicode letters/numbers)
cleanText = rawToken.replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase()
```

**Sentence Detection:**
- Detects sentence endings: `.`, `!`, `?`
- Handles spacing after punctuation
- Accumulates buffer until punctuation found
- Increments sentenceId after each sentence

**Token Structure:**
```typescript
{
  id: 'word-0',           // Unique identifier
  text: '¿Cómo',          // Original text with punctuation
  cleanText: 'cómo',      // Cleaned for dictionary lookups
  index: 0,               // Position in token array
  sentenceId: 1,          // Which sentence this belongs to
  isWord: true            // true = word, false = whitespace
}
```

**Spanish Character Handling:**
- Accented vowels: á, é, í, ó, ú
- Ñ (eñe): ñ
- Inverted punctuation: ¿, ¡
- All preserved in `text`, removed in `cleanText`

**Edge Cases Tested:**
1. **año 2024** → Words: "año", "2024"
2. **palabra...** → Words: "palabra..." (clean: "palabra")
3. **¿¡Hola!?** → Words: "¿¡Hola!?" (clean: "hola")
4. **"palabra" otra** → Words: ""palabra"", "otra"
5. **1.5 metros** → Words: "1.5" (clean: "15"), "metros"

**Test Results:**
```
Input: "Hola mundo. ¿Cómo estás? ¡Muy bien!"
Tokens: 11 (6 words, 5 whitespace)
Sentences: 3
- Sentence 0: "Hola mundo."
- Sentence 1: " ¿Cómo estás?"
- Sentence 2: " ¡Muy bien!"
```

### Files Created
- `types/index.ts` - Token and Sentence TypeScript interfaces
- `lib/tokenize.ts` - Core tokenization engine with helpers
- `lib/tokenize.test.ts` - Test file for validation

### Helper Functions

**getWordTokens(tokens)**
- Filters to only word tokens (isWord: true)
- Removes whitespace tokens

**getSentence(tokens, sentenceId)**
- Retrieves text for a specific sentence
- Joins tokens by sentenceId

**getSentences(tokens)**
- Groups tokens into Sentence objects
- Returns array of { id, tokens, text }

### Unicode Regex Pattern
```typescript
/[^\p{L}\p{N}]+/gu
```
- `\p{L}` = Unicode letter property (includes á, ñ, etc.)
- `\p{N}` = Unicode number property
- `u` flag = Unicode mode
- `g` flag = Global replacement

### Completion Notes
- TypeScript strict mode: ✓ passed
- Spanish characters: ✓ preserved
- Punctuation: ✓ preserved in text, removed in cleanText
- Sentence detection: ✓ working
- No data loss: ✓ verified
- Ready for Story 2.4: Clickable Word Component

### Change Log
- 2025-10-25: Tokenization engine implemented and tested

### Status
**Ready for Review**
