# Database Schema

## Supabase PostgreSQL Tables

```sql
-- Users table (managed by Supabase Auth)
-- No custom fields needed for MVP

-- Vocabulary entries
CREATE TABLE vocabulary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  lemma TEXT,  -- normalized form (future: add lemmatization)
  definition JSONB NOT NULL,  -- full API response
  language VARCHAR(10) DEFAULT 'es' NOT NULL,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  click_count INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  UNIQUE(user_id, word, language)
);

-- Indexes
CREATE INDEX idx_vocabulary_user_id ON vocabulary_entries(user_id);
CREATE INDEX idx_vocabulary_created_at ON vocabulary_entries(created_at DESC);

-- Reading sessions (tracks each reading activity)
CREATE TABLE reading_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text_snippet TEXT,  -- first 200 chars of passage
  word_count INTEGER,
  vocabulary_added INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_reading_sessions_user_id ON reading_sessions(user_id);

-- Sentence contexts (future phase)
CREATE TABLE sentence_contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vocabulary_id UUID REFERENCES vocabulary_entries(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES reading_sessions(id) ON DELETE CASCADE,
  sentence_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_sentence_contexts_vocabulary_id ON sentence_contexts(vocabulary_id);

-- Row Level Security (RLS)
ALTER TABLE vocabulary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_contexts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own vocabulary"
  ON vocabulary_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vocabulary"
  ON vocabulary_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocabulary"
  ON vocabulary_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions"
  ON reading_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON reading_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sentence contexts"
  ON sentence_contexts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vocabulary_entries
      WHERE id = sentence_contexts.vocabulary_id
      AND user_id = auth.uid()
    )
  );
```

---

## Supabase Client Setup

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Type definitions
export interface VocabularyEntry {
  id: string;
  user_id: string;
  word: string;
  lemma?: string;
  definition: any;  // JSONB from API
  language: string;
  first_seen: string;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReadingSession {
  id: string;
  user_id: string;
  text_snippet: string;
  word_count: number;
  vocabulary_added: number;
  created_at: string;
}
```

---
