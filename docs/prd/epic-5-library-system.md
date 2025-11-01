# Epic 5: Library System & Text-Vocab Linking

**Status**: 🚧 Ready for Dev
**Priority**: P0 - Critical
**Sprint**: 4-Day MVP Launch (Day 1)
**Estimated Effort**: 8 hours

---

## Overview

Build a Library system that allows users to save custom texts, track vocabulary per text, and maintain the relationship between clicked words and their source materials. This is the foundation for all adaptive learning features.

---

## User Stories

### 5.1: Database Migrations for Library System
**As a** developer
**I want** database tables for library and text-vocab linking
**So that** we can store user texts and track vocabulary sources

**Acceptance Criteria**:
- [ ] `library_texts` table created with proper schema
- [ ] `vocabulary` table updated with `source_text_id` and `original_sentence` columns
- [ ] Indexes created for performance
- [ ] RLS policies configured for user isolation
- [ ] Migration tested on local Supabase instance
- [ ] Migration runs successfully without errors

---

### 5.2: LibraryService Implementation
**As a** developer
**I want** a service layer for library CRUD operations
**So that** we can abstract database access and maintain clean architecture

**Acceptance Criteria**:
- [ ] `LibraryService` class created in `lib/services/library.ts`
- [ ] `createText()` method inserts new library entry
- [ ] `getTexts()` method retrieves all user's texts (sorted by created_at DESC)
- [ ] `getText()` method retrieves single text with details
- [ ] `deleteText()` method removes text
- [ ] `getVocabularyForText()` method retrieves vocab entries filtered by source_text_id
- [ ] All methods use Supabase RLS for security
- [ ] Unit tests written for all methods

---

### 5.3: Update VocabularyService for Text Linking
**As a** developer
**I want** VocabularyService to support source text tracking
**So that** vocabulary entries remember their origin text and sentence

**Acceptance Criteria**:
- [ ] `VocabularyService.saveWord()` accepts optional `sourceTextId` parameter
- [ ] `VocabularyService.saveWord()` accepts optional `originalSentence` parameter
- [ ] When `sourceTextId` provided, save foreign key to `library_texts`
- [ ] Sentence extraction helper created in `lib/utils/text.ts`
- [ ] Sentence extraction handles Spanish punctuation (¿?, ¡!)
- [ ] Tests verify sentence boundaries detected correctly

---

### 5.4: Library API Routes
**As a** developer
**I want** REST API endpoints for library operations
**So that** frontend can interact with library data

**Acceptance Criteria**:
- [ ] `POST /api/library` creates new text (returns text object)
- [ ] `GET /api/library` lists all user's texts
- [ ] `GET /api/library/[id]` retrieves text details
- [ ] `DELETE /api/library/[id]` removes text
- [ ] `GET /api/library/[id]/vocabulary` retrieves vocab for text
- [ ] All routes enforce authentication
- [ ] Error responses follow standard format
- [ ] API integration tests written

---

### 5.5: Library UI Pages
**As a** language learner
**I want to** view and manage my saved texts in a library interface
**So that** I can organize my reading materials

**Acceptance Criteria**:
- [ ] `/library` page displays all user's texts
- [ ] Each text card shows: title, excerpt (first 100 chars), word count, created date
- [ ] Empty state shown when no texts exist
- [ ] "Add New Text" button navigates to creation form
- [ ] Clicking text card navigates to detail page
- [ ] Responsive design (mobile + desktop)
- [ ] Loading states while fetching

---

### 5.6: Text Creation & Detail Pages
**As a** language learner
**I want to** create new texts and view text details with associated vocabulary
**So that** I can build my personal reading library

**Acceptance Criteria**:
- [ ] `/library/new` page with form (title, content, language selector)
- [ ] Form validates required fields (title, content)
- [ ] Character limit enforced (50,000 chars for content, 200 for title)
- [ ] Success message on save, redirects to library
- [ ] `/library/[id]` page shows full text content
- [ ] Text detail page shows associated vocabulary list
- [ ] Vocabulary list shows: word, definition, click count, original sentence
- [ ] "Delete Text" button with confirmation modal
- [ ] "Open in Reader" button loads text in interactive reader

---

### 5.7: Reader Integration with Library
**As a** language learner
**I want** clicked words in reader to link to their source text
**So that** I can track which text taught me each word

**Acceptance Criteria**:
- [ ] Reader component accepts optional `sourceTextId` prop
- [ ] When word clicked, `sourceTextId` passed to VocabularyService
- [ ] Original sentence extracted and saved with vocabulary entry
- [ ] "Save to Library" button in Reader (for session texts)
- [ ] Saving session text to library preserves existing vocab links
- [ ] Vocabulary list in reader filtered by current text (if from library)

---

## Technical Specification

### Database Schema

**Migration File**: `supabase/migrations/20241101_library_system.sql`

```sql
-- Create library_texts table
CREATE TABLE public.library_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT title_length CHECK (char_length(title) BETWEEN 1 AND 200),
  CONSTRAINT content_length CHECK (char_length(content) BETWEEN 1 AND 50000)
);

-- Update vocabulary table
ALTER TABLE public.vocabulary
ADD COLUMN source_text_id UUID REFERENCES public.library_texts(id) ON DELETE SET NULL,
ADD COLUMN original_sentence TEXT;

-- Create indexes for performance
CREATE INDEX idx_library_texts_user_id ON public.library_texts(user_id);
CREATE INDEX idx_library_texts_created_at ON public.library_texts(created_at DESC);
CREATE INDEX idx_vocabulary_source_text_id ON public.vocabulary(source_text_id);

-- Enable Row Level Security
ALTER TABLE public.library_texts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for library_texts
CREATE POLICY "Users can view own texts"
  ON public.library_texts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own texts"
  ON public.library_texts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own texts"
  ON public.library_texts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own texts"
  ON public.library_texts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE public.library_texts IS 'User-saved texts for language learning';
COMMENT ON COLUMN public.vocabulary.source_text_id IS 'Links vocabulary word to source text';
COMMENT ON COLUMN public.vocabulary.original_sentence IS 'Sentence where word was encountered';
```

---

### Services

**`lib/services/library.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'

export interface LibraryText {
  id: string
  user_id: string
  title: string
  content: string
  language: string
  created_at: string
}

export interface LibraryTextInsert {
  title: string
  content: string
  language?: string
}

export class LibraryService {
  /**
   * Create a new library text
   */
  static async createText(
    data: LibraryTextInsert
  ): Promise<LibraryText> {
    const supabase = createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: text, error } = await supabase
      .from('library_texts')
      .insert({
        user_id: user.user.id,
        title: data.title,
        content: data.content,
        language: data.language || 'es'
      })
      .select()
      .single()

    if (error) throw error
    return text
  }

  /**
   * Get all texts for current user
   */
  static async getTexts(): Promise<LibraryText[]> {
    const supabase = createClient()

    const { data: texts, error } = await supabase
      .from('library_texts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return texts
  }

  /**
   * Get single text by ID
   */
  static async getText(id: string): Promise<LibraryText> {
    const supabase = createClient()

    const { data: text, error } = await supabase
      .from('library_texts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return text
  }

  /**
   * Delete text by ID
   */
  static async deleteText(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('library_texts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get all vocabulary entries for a specific text
   */
  static async getVocabularyForText(textId: string): Promise<VocabularyEntry[]> {
    const supabase = createClient()

    const { data: entries, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('source_text_id', textId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return entries
  }
}
```

**Update `lib/services/vocabulary.ts`**

```typescript
export class VocabularyService {
  static async saveWord(
    word: string,
    definition?: DictionaryResponse,
    sourceTextId?: string,      // NEW
    originalSentence?: string    // NEW
  ): Promise<VocabularyEntry> {
    const supabase = createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Check if word already exists
    const { data: existing } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('word', word)
      .single()

    if (existing) {
      // Update click count and potentially source info
      const { data: updated, error } = await supabase
        .from('vocabulary')
        .update({
          click_count: existing.click_count + 1,
          // Update source if provided and not set
          ...(sourceTextId && !existing.source_text_id && {
            source_text_id: sourceTextId,
            original_sentence: originalSentence
          })
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return updated
    }

    // Insert new word
    const { data: newEntry, error } = await supabase
      .from('vocabulary')
      .insert({
        user_id: user.user.id,
        word,
        definition,
        source_text_id: sourceTextId,
        original_sentence: originalSentence,
        click_count: 1
      })
      .select()
      .single()

    if (error) throw error
    return newEntry
  }
}
```

**New: `lib/utils/text.ts`**

```typescript
import { Token } from '@/lib/tokenize'

/**
 * Extract the sentence containing a specific word from tokenized text
 * Handles Spanish punctuation: ¿? ¡!
 */
export function extractSentence(tokens: Token[], wordIndex: number): string {
  // Spanish sentence terminators
  const sentenceEnd = /[.!?]/
  const spanishQuestionOpen = '¿'
  const spanishExclamationOpen = '¡'

  // Find sentence start (look backward)
  let startIdx = 0
  for (let i = wordIndex - 1; i >= 0; i--) {
    const token = tokens[i]
    if (sentenceEnd.test(token.text)) {
      startIdx = i + 1
      break
    }
    // Spanish opening punctuation also marks sentence start
    if (token.text === spanishQuestionOpen || token.text === spanishExclamationOpen) {
      startIdx = i
      break
    }
  }

  // Find sentence end (look forward)
  let endIdx = tokens.length - 1
  for (let i = wordIndex; i < tokens.length; i++) {
    const token = tokens[i]
    if (sentenceEnd.test(token.text)) {
      endIdx = i
      break
    }
  }

  // Extract and join tokens
  return tokens
    .slice(startIdx, endIdx + 1)
    .map(t => t.text)
    .join('')
    .trim()
}

/**
 * Calculate word count from text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Extract first N characters as excerpt
 */
export function createExcerpt(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}
```

---

### API Routes

**`app/api/library/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { LibraryService } from '@/lib/services/library'

export async function GET() {
  try {
    const texts = await LibraryService.getTexts()
    return NextResponse.json({ texts })
  } catch (error) {
    console.error('Failed to fetch library texts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch texts' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, content, language } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const text = await LibraryService.createText({ title, content, language })
    return NextResponse.json({ text }, { status: 201 })
  } catch (error) {
    console.error('Failed to create library text:', error)
    return NextResponse.json(
      { error: 'Failed to create text' },
      { status: 500 }
    )
  }
}
```

**`app/api/library/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { LibraryService } from '@/lib/services/library'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const text = await LibraryService.getText(params.id)
    return NextResponse.json({ text })
  } catch (error) {
    console.error('Failed to fetch text:', error)
    return NextResponse.json(
      { error: 'Text not found' },
      { status: 404 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await LibraryService.deleteText(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete text:', error)
    return NextResponse.json(
      { error: 'Failed to delete text' },
      { status: 500 }
    )
  }
}
```

**`app/api/library/[id]/vocabulary/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { LibraryService } from '@/lib/services/library'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vocabulary = await LibraryService.getVocabularyForText(params.id)
    return NextResponse.json({ vocabulary })
  } catch (error) {
    console.error('Failed to fetch vocabulary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary' },
      { status: 500 }
    )
  }
}
```

---

### Components

**File Structure**:
```
components/library/
├── LibraryCard.tsx          # Text preview card for list view
├── TextForm.tsx             # Create/edit text form
├── VocabListByText.tsx      # Vocabulary list filtered by text
└── EmptyState.tsx           # Empty library message
```

**Pages**:
```
app/library/
├── page.tsx                 # Library list page
├── new/page.tsx            # Create new text
└── [id]/page.tsx           # Text detail + vocabulary
```

---

## Dependencies

- **Requires**: Existing `vocabulary` table, tokenization logic (`lib/tokenize.ts`)
- **Blocks**: Epic 6 (Tutor Mode requires library texts)

---

## Testing Checklist

- [ ] Create text from library form
- [ ] Verify text saved with correct user_id (RLS)
- [ ] View all texts in library (sorted by most recent)
- [ ] View single text details
- [ ] Click words in reader → verify `source_text_id` saved
- [ ] Verify original sentence captured correctly (including Spanish punctuation)
- [ ] View vocabulary filtered by text
- [ ] Delete vocabulary entry
- [ ] Delete text (verify ON DELETE SET NULL preserves vocab)
- [ ] Test RLS (users can't see other users' texts)
- [ ] Test character limits (50k content, 200 title)
- [ ] Test empty states (no texts, no vocab for text)

---

## Wireframes

See: `docs/wireframes/library-system.md`

---

## Technical Risks & Mitigations

### Risk: Sentence Extraction Accuracy
**Issue**: Spanish punctuation (¿?, ¡!) complicates sentence boundary detection
- **Impact**: Wrong sentences saved with vocabulary entries
- **Mitigation**: Enhanced regex pattern for Spanish punctuation in `extractSentence()`
- **Testing**: Unit tests with various Spanish sentence structures

### Risk: Library Storage Without Limits
**Issue**: Users could save massive texts → database bloat
- **Impact**: Storage costs, slow queries
- **Mitigation**: 50,000 character limit (database constraint + form validation)

### Risk: Cascade Delete Behavior
**Issue**: Deleting text could accidentally delete user's vocabulary
- **Impact**: Data loss, user frustration
- **Mitigation**: `ON DELETE SET NULL` preserves vocab when text deleted

---

## Success Metrics

**Day 1 Complete When**:
- User can save custom text to library
- Vocabulary automatically links to source text
- Can view vocab per text with original sentences
- All CRUD operations work for library texts
- RLS properly enforces user isolation
