# Data Models

Based on the PRD, these are the core entities:

## Model: User

**Purpose:** Represents authenticated users. Managed by Supabase Auth (no custom table needed).

**Key Attributes:**
- `id`: `uuid` - Supabase auth user ID (primary key)
- `email`: `string` - User's email address
- `created_at`: `timestamp` - Account creation time

### TypeScript Interface

```typescript
// packages/shared/src/types/user.ts
// Note: Supabase Auth provides this via auth.users
export interface User {
  id: string;
  email: string;
  created_at: string;
}
```

### Relationships
- **One-to-Many** with VocabularyEntry (one user has many vocabulary entries)
- **One-to-Many** with ReadingSession (one user has many reading sessions)

---

## Model: VocabularyEntry

**Purpose:** Stores words the user has clicked on, along with their definitions and metadata. This is the primary business entity.

**Key Attributes:**
- `id`: `uuid` - Primary key (auto-generated)
- `user_id`: `uuid` - Foreign key to auth.users (RLS enforces ownership)
- `word`: `string` - The Spanish word (e.g., "libro")
- `definition`: `jsonb` - Full definition from Merriam-Webster API
- `language`: `string` - Language code (always "es" for MVP)
- `first_seen`: `timestamp` - When user first clicked this word
- `click_count`: `number` - How many times user looked it up
- `created_at`: `timestamp` - Record creation time
- `updated_at`: `timestamp` - Last update time

### TypeScript Interface

```typescript
// packages/shared/src/types/vocabulary.ts
export interface VocabularyEntry {
  id: string;
  user_id: string;
  word: string;
  definition: DefinitionResponse; // Stored as JSONB
  language: 'es';
  first_seen: string; // ISO timestamp
  click_count: number;
  created_at: string;
  updated_at: string;
}

// Insert type (for creating new entries)
export interface VocabularyEntryInsert {
  user_id: string;
  word: string;
  definition: DefinitionResponse;
  language: 'es';
  click_count?: number; // Defaults to 1
}

// Update type (for incrementing click_count)
export interface VocabularyEntryUpdate {
  click_count?: number;
  updated_at?: string;
}
```

### Relationships
- **Many-to-One** with User (many entries belong to one user)
- **One-to-Many** with SentenceContext (one word appears in many sentences) [Phase 2]

---

## Model: DefinitionResponse

**Purpose:** Represents the dictionary API response structure. Not a database table - stored as JSONB within VocabularyEntry.

**Key Attributes:**
- `word`: `string` - The word being defined
- `partOfSpeech`: `string` - Grammatical category (noun, verb, etc.)
- `translations`: `string[]` - English translations
- `examples`: `string[]` (optional) - Example sentences in Spanish

### TypeScript Interface

```typescript
// packages/shared/src/types/dictionary.ts
export interface DefinitionResponse {
  word: string;
  partOfSpeech: string; // "noun", "verb", "adjective", etc.
  translations: string[]; // ["book", "publication"]
  examples?: string[]; // ["un libro interesante"]
}

// API error response
export interface DefinitionError {
  error: 'WORD_NOT_FOUND' | 'API_ERROR';
  message: string;
  suggestions?: string[]; // Similar words
}
```

### Relationships
- **Embedded in** VocabularyEntry (JSONB field)

---

## Model: Token

**Purpose:** Frontend-only model representing a tokenized word in the rendered text. Not persisted to database.

**Key Attributes:**
- `id`: `string` - Unique identifier (e.g., "word-42")
- `text`: `string` - The actual text ("hola")
- `isWhitespace`: `boolean` - Whether this is whitespace
- `sentenceId`: `number` - Which sentence this belongs to
- `index`: `number` - Position in original text

### TypeScript Interface

```typescript
// packages/shared/src/types/token.ts
export interface Token {
  id: string; // "word-0", "word-1", etc.
  text: string;
  isWhitespace: boolean;
  sentenceId: number; // For grouping into sentences
  index: number; // Original position
}
```

### Relationships
- **Frontend-only** - Generated client-side from pasted text

---

## Model: ReadingSession (Optional - Phase 2)

**Purpose:** Tracks each time a user reads a passage. Useful for analytics but not critical for MVP.

**Key Attributes:**
- `id`: `uuid` - Primary key
- `user_id`: `uuid` - Foreign key to auth.users
- `text_snippet`: `string` - First 200 chars of passage
- `word_count`: `number` - Total words in passage
- `vocabulary_added`: `number` - New words saved this session
- `created_at`: `timestamp` - Session start time

### TypeScript Interface

```typescript
// packages/shared/src/types/session.ts
export interface ReadingSession {
  id: string;
  user_id: string;
  text_snippet: string; // First 200 chars
  word_count: number;
  vocabulary_added: number;
  created_at: string;
}
```

### Relationships
- **Many-to-One** with User

---

## Design Decisions

1. **JSONB for definitions** - Stores full API response; allows querying within JSON later
2. **No lemmatization (yet)** - "libro" and "libros" are separate entries; simplifies MVP
3. **Frontend-only Token model** - No persistence needed; regenerated on each render
4. **Shared types package** - Both frontend and backend import from `packages/shared/src/types`
5. **Supabase type generation** - Run `npx supabase gen types typescript --local` to sync DB → TypeScript

## Type Safety Flow

```
PostgreSQL Schema → Supabase CLI → database.types.ts → packages/shared → Frontend/Backend
```

---
