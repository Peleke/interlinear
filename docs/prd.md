# Product Requirements Document: Interlinear

**Version:** 1.0
**Date:** 2025-10-24
**Status:** Ready for Development
**Related:** [Project Brief](./brief.md)

---

## Table of Contents

1. [Overview](#overview)
2. [Design System](#design-system)
3. [User Stories](#user-stories)
4. [Feature Specifications](#feature-specifications)
5. [Technical Architecture](#technical-architecture)
6. [API Contracts](#api-contracts)
7. [Database Schema](#database-schema)
8. [Component Specifications](#component-specifications)
9. [Development Timeline](#development-timeline)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Requirements](#deployment-requirements)

---

## Overview

This PRD translates the [Project Brief](./brief.md) into actionable development specifications for building **Interlinear** in 2 days + 1 day deployment.

### Success Criteria Recap

- ✅ User can sign up, paste text, click words, see definitions in < 2 minutes
- ✅ Clicking a word plays AI-powered Spanish pronunciation
- ✅ Text selection enables sentence playback
- ✅ Vocabulary list persists across sessions
- ✅ Beautiful, polished UI (smooth animations, typography)
- ✅ Demo runs live with zero crashes
- ✅ Deployed to Cloud Run with CI/CD

---

## Design System

**Complete Design System:** See [design-system.md](./design-system.md)

**v0 Component Prompts:** See [v0-prompts.md](./v0-prompts.md)

### Design Philosophy Summary

**"Reverence for the written word meets modern minimalism"**

Inspired by:
- iOS Books app (clean, focused reading)
- Illuminated manuscripts (warmth, craftsmanship)
- Apple HIG (clarity, restraint, delight)

### Quick Reference

**Color Palette:**
```css
--parchment: #F9F6F0;      /* Warm background */
--ink: #1A1614;            /* Text (never pure black) */
--gold: #D4A574;           /* Accent, highlights */
--sepia: #8B7355;          /* Secondary UI */
--crimson: #A4443E;        /* Errors only */
```

**Typography:**
```css
--font-reading: 'Merriweather', Georgia, serif;  /* 20px, 1.75 line-height */
--font-ui: -apple-system, system-ui, sans-serif;  /* 16px, 1.5 line-height */
```

**Animation:**
```css
--duration-fast: 200ms;
--duration-normal: 300ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);  /* Apple's ease */
```

**Spacing:** 4px base grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96)

### Key Design Decisions

1. **Warm, not cold** - Parchment backgrounds, gold accents (not blue/gray)
2. **Generous spacing** - 80px reading margins, 1.75 line-height
3. **Minimal animation** - Only hover, modal entry, audio playing indicator
4. **Serif for content** - Sans for UI chrome
5. **Subtle interactions** - Low-opacity highlights, 1px underlines
6. **Apple-level polish** - Clean shadows, smooth easing, attention to detail

### Component-Specific Notes

**DefinitionSidebar:** Desktop = slide from right (400px), Mobile = bottom sheet (80vh)

**ClickableWord:** Hover = subtle gold background (8% opacity) + gold underline

**AudioButton:** Idle = parchment bg, Playing = gold bg with pulse animation

**VocabularyList:** White cards on parchment, subtle shadow, hover lift

---

## User Stories

### Epic 1: Authentication & Onboarding

#### US-101: User Registration
**As a** language learner
**I want to** create an account with email/password
**So that** my vocabulary progress is saved across sessions

**Acceptance Criteria:**
- [ ] User can navigate to sign-up page
- [ ] Form validates email format and password strength (min 8 chars)
- [ ] Successful registration creates Supabase user and redirects to reader
- [ ] Error messages display for duplicate email or weak password
- [ ] Form uses accessible labels and ARIA attributes

**Priority:** P0 (Day 1 AM)

---

#### US-102: User Login
**As a** returning user
**I want to** log in with my credentials
**So that** I can access my saved vocabulary

**Acceptance Criteria:**
- [ ] User can navigate to login page
- [ ] Form validates email/password presence
- [ ] Successful login redirects to reader interface
- [ ] Invalid credentials show clear error message
- [ ] "Forgot password" link present (can be placeholder for MVP)

**Priority:** P0 (Day 1 AM)

---

#### US-103: Session Persistence
**As a** user
**I want to** stay logged in when I return
**So that** I don't have to log in every time

**Acceptance Criteria:**
- [ ] Supabase session persists in browser storage
- [ ] Returning users with valid session skip login
- [ ] Expired sessions redirect to login gracefully
- [ ] Logout button clears session and redirects

**Priority:** P0 (Day 1 AM)

---

### Epic 2: Text Input & Rendering

#### US-201: Paste Text for Analysis
**As a** user
**I want to** paste Spanish text into a textarea
**So that** I can transform it into an interactive reading experience

**Acceptance Criteria:**
- [ ] Reader page shows large textarea with placeholder ("Paste your Spanish text here...")
- [ ] Character count displays below textarea
- [ ] "Render Text" button becomes enabled when text is present
- [ ] Soft limit of 2,000 words with warning message if exceeded
- [ ] Text persists in session storage if user navigates away

**Priority:** P0 (Day 1 PM)

---

#### US-202: Render Interactive Text
**As a** user
**I want to** click "Render Text" and see my passage with clickable words
**So that** I can start looking up definitions

**Acceptance Criteria:**
- [ ] Clicking "Render Text" transitions from input mode to render mode
- [ ] Text is tokenized by spaces into individual words
- [ ] Each word wrapped in `<span>` with unique ID (`word-{index}`)
- [ ] Words preserve original spacing and punctuation
- [ ] "Edit Text" button allows returning to input mode
- [ ] Transition animates smoothly (fade or slide)

**Priority:** P0 (Day 1 PM)

---

### Epic 3: Dictionary Integration

#### US-301: Click Word to See Definition
**As a** user
**I want to** click any word and see its definition
**So that** I can learn vocabulary while reading

**Acceptance Criteria:**
- [ ] Clicking a word highlights it (visual state change)
- [ ] Sidebar/panel opens with loading spinner
- [ ] API call fetches definition from Merriam-Webster
- [ ] Definition displays: word, part of speech, translation(s)
- [ ] Multiple definitions shown if available
- [ ] Error state displays if word not found ("Definition unavailable")
- [ ] Panel can be closed (click outside or close button)

**Priority:** P0 (Day 1 PM)

---

#### US-302: Definition Caching
**As a** user
**I want** definitions to load instantly on second click
**So that** I don't wait for the same API call repeatedly

**Acceptance Criteria:**
- [ ] Definitions cached in memory (React state/context)
- [ ] Second click of same word loads from cache (< 50ms)
- [ ] Cache persists during session but clears on page reload
- [ ] Cache size limited to 500 words (LRU eviction)

**Priority:** P1 (Day 2 if time)

---

### Epic 4: Text-to-Speech Integration

#### US-401: Hear Word Pronunciation
**As a** user
**I want to** click a speaker icon and hear the word pronounced
**So that** I can learn correct pronunciation

**Acceptance Criteria:**
- [ ] Speaker icon appears next to word in definition panel
- [ ] Clicking speaker triggers ElevenLabs API call
- [ ] Audio streams and plays immediately (< 1 second delay)
- [ ] Visual feedback shows audio is playing (animated icon)
- [ ] Audio stops if user clicks another word
- [ ] Graceful error if API quota exceeded (hide icon + notification)

**Priority:** P0 (Day 2 AM)

---

#### US-402: Play Selected Text
**As a** user
**I want to** select a sentence and hear it read aloud
**So that** I can practice listening comprehension

**Acceptance Criteria:**
- [ ] Text selection shows "Play Selection" button/icon
- [ ] Button appears as floating tooltip near selection
- [ ] Clicking button sends selected text to ElevenLabs
- [ ] Entire selection plays as continuous audio
- [ ] Selection limited to 200 characters (show warning if exceeded)
- [ ] Button disappears when selection cleared

**Priority:** P0 (Day 2 AM)

---

#### US-403: Audio Caching
**As a** user
**I want** repeated words/phrases to play instantly
**So that** I stay within API quota limits

**Acceptance Criteria:**
- [ ] Audio files cached in localStorage (base64 or blob URL)
- [ ] Cache key is hash of text + voice settings
- [ ] Cached audio plays with zero delay
- [ ] Cache limited to 10MB (evict oldest on overflow)
- [ ] Cache survives page reload

**Priority:** P1 (Day 2 PM if time)

---

### Epic 5: Vocabulary Tracking

#### US-501: Auto-Save Clicked Words
**As a** user
**I want** clicked words automatically saved to my vocabulary list
**So that** I can review them later without manual work

**Acceptance Criteria:**
- [ ] First click on a word saves it to Supabase `vocabulary_entries`
- [ ] Subsequent clicks increment `click_count`
- [ ] Saved data includes: word, definition, timestamp, language
- [ ] Visual indicator shows word is "saved" (checkmark or color change)
- [ ] Save happens asynchronously (doesn't block UI)

**Priority:** P0 (Day 1 PM)

---

#### US-502: View Vocabulary List
**As a** user
**I want to** view all my saved vocabulary words
**So that** I can review what I've learned

**Acceptance Criteria:**
- [ ] "Vocabulary" button/tab opens vocabulary view
- [ ] List shows all saved words with definitions
- [ ] Words sorted by most recent first
- [ ] Each entry shows: word, translation, click count, date saved
- [ ] List scrolls if > 10 words
- [ ] Empty state shows helpful message ("Start clicking words...")

**Priority:** P0 (Day 2 PM)

---

#### US-503: Track Sentence Contexts
**As a** user
**I want** the app to remember which sentences contained my vocabulary
**So that** I can see words in context later

**Acceptance Criteria:**
- [ ] When word is saved, full sentence stored in `sentence_contexts`
- [ ] Sentence detection uses basic period/question mark splitting
- [ ] Vocabulary list shows "View in Context" link per word
- [ ] Clicking link displays sentence with word highlighted
- [ ] Multiple contexts shown if word appears in multiple sentences

**Priority:** P2 (Post-MVP, nice to have)

---

### Epic 6: UI/UX Polish

#### US-601: Beautiful Typography
**As a** user
**I want** the reading interface to feel like a premium manuscript
**So that** the experience is enjoyable and focused

**Acceptance Criteria:**
- [ ] Body text uses serif font (e.g., Merriweather, Georgia)
- [ ] Font size is comfortably large (18-20px)
- [ ] Line height is generous (1.6-1.8)
- [ ] Proper contrast ratio (WCAG AA compliant)
- [ ] Responsive text sizing (scales on mobile)

**Priority:** P0 (Day 2 PM)

---

#### US-602: Smooth Animations
**As a** user
**I want** UI transitions to feel smooth and polished
**So that** the app feels professional

**Acceptance Criteria:**
- [ ] Definition panel slides in smoothly (300ms ease-out)
- [ ] Word highlights fade in (150ms)
- [ ] Mode transitions fade (200ms)
- [ ] All animations 60fps (no jank)
- [ ] Reduced motion respected (prefers-reduced-motion media query)

**Priority:** P1 (Day 2 PM)

---

#### US-603: Mobile Responsive
**As a** user
**I want** the app to work well on my phone
**So that** I can read on the go

**Acceptance Criteria:**
- [ ] Layout adapts to mobile viewport (< 768px)
- [ ] Definition panel becomes bottom sheet on mobile
- [ ] Text size remains readable on small screens
- [ ] Touch targets are ≥ 44px (iOS guidelines)
- [ ] No horizontal scroll

**Priority:** P1 (Day 2 PM)

---

## Feature Specifications

### Feature 1: Authentication Flow

**Components:**
- `LoginPage` - Email/password form
- `SignupPage` - Registration form
- `AuthProvider` - Supabase auth context wrapper

**Flow:**
1. User lands on `/` → redirect to `/login` if not authenticated
2. User clicks "Sign up" → navigate to `/signup`
3. User submits form → `supabase.auth.signUp(email, password)`
4. On success → redirect to `/reader`
5. On error → display error message inline

**Edge Cases:**
- Email already exists → "Account already exists. Please log in."
- Network error → "Unable to connect. Please try again."
- Weak password → "Password must be at least 8 characters."

---

### Feature 2: Text Tokenization Engine

**Algorithm:**
```typescript
function tokenizeText(text: string): Token[] {
  // Split by whitespace but preserve punctuation
  const words = text.split(/(\s+)/);

  return words.map((word, index) => ({
    id: `word-${index}`,
    text: word,
    isWhitespace: /^\s+$/.test(word),
    sentence: detectSentence(words, index), // sentence boundary detection
  }));
}
```

**Sentence Detection:**
- Sentence ends at: `. ` `? ` `! `
- Handle edge cases: abbreviations (Dr., Sr.), decimals (3.14)
- Simple heuristic: period followed by space + capital letter

**Output:**
```typescript
interface Token {
  id: string;          // "word-42"
  text: string;        // "hola"
  isWhitespace: boolean;
  sentenceId: number;  // sentence grouping
}
```

---

### Feature 3: Dictionary API Integration

**Proxy Endpoint:** `/api/dictionary/lookup`

**Request:**
```typescript
POST /api/dictionary/lookup
{
  "word": "libro",
  "language": "es"
}
```

**Response (Success):**
```typescript
{
  "word": "libro",
  "definitions": [
    {
      "partOfSpeech": "noun",
      "translation": "book",
      "examples": ["un libro interesante"]
    }
  ],
  "cached": false
}
```

**Response (Not Found):**
```typescript
{
  "error": "WORD_NOT_FOUND",
  "message": "No definition available for this word.",
  "suggestions": ["libros", "libre"]  // optional
}
```

**Implementation:**
```typescript
// app/api/dictionary/lookup/route.ts
export async function POST(req: Request) {
  const { word } = await req.json();

  const response = await fetch(
    `https://www.dictionaryapi.com/api/v3/references/spanish/json/${word}?key=${process.env.MERRIAM_WEBSTER_API_KEY}`
  );

  const data = await response.json();

  // Transform Merriam-Webster format to our format
  return NextResponse.json(transformDefinition(data));
}
```

---

### Feature 4: Text-to-Speech Integration

**Proxy Endpoint:** `/api/tts/speak`

**Request:**
```typescript
POST /api/tts/speak
{
  "text": "Hola, ¿cómo estás?",
  "voiceId": "pNInz6obpgDQGcFmaJgB"  // optional, defaults to Spanish voice
}
```

**Response:**
- Content-Type: `audio/mpeg`
- Streams audio directly to client

**Implementation:**
```typescript
// app/api/tts/speak/route.ts
export async function POST(req: Request) {
  const { text, voiceId = 'pNInz6obpgDQGcFmaJgB' } = await req.json();

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    }
  );

  // Stream response directly
  return new Response(response.body, {
    headers: { 'Content-Type': 'audio/mpeg' }
  });
}
```

**Client-Side Usage:**
```typescript
async function playAudio(text: string) {
  const response = await fetch('/api/tts/speak', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  await audio.play();
}
```

---

### Feature 5: Vocabulary Persistence

**Auto-Save Logic:**
```typescript
async function handleWordClick(word: Token) {
  // 1. Fetch definition (if not cached)
  const definition = await fetchDefinition(word.text);

  // 2. Show in UI
  setSelectedWord({ word, definition });

  // 3. Save to database (async, non-blocking)
  saveVocabulary({
    word: word.text,
    definition,
    sentenceId: word.sentenceId,
    language: 'es'
  });
}
```

**Deduplication:**
- Check if word exists: `SELECT * FROM vocabulary_entries WHERE user_id = $1 AND word = $2`
- If exists: `UPDATE click_count = click_count + 1`
- If new: `INSERT INTO vocabulary_entries`

**Row-Level Security (RLS):**
```sql
-- Users can only read their own vocabulary
CREATE POLICY "Users can view own vocabulary"
ON vocabulary_entries FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own vocabulary
CREATE POLICY "Users can insert own vocabulary"
ON vocabulary_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## Technical Architecture

### High-Level Component Tree

```
App
├── AuthProvider (Supabase session)
│
├── LoginPage
│   └── LoginForm
│
├── SignupPage
│   └── SignupForm
│
└── ReaderPage (protected route)
    ├── ReaderHeader
    │   ├── Logo
    │   ├── VocabularyButton
    │   └── LogoutButton
    │
    ├── TextInputPanel (mode === 'input')
    │   ├── Textarea
    │   └── RenderButton
    │
    ├── InteractiveTextPanel (mode === 'render')
    │   ├── ClickableWord[] (generated from tokens)
    │   ├── DefinitionSidebar
    │   │   ├── WordHeader
    │   │   ├── DefinitionList
    │   │   └── AudioPlayer (speaker icon)
    │   └── TextSelectionToolbar
    │       └── PlaySelectionButton
    │
    └── VocabularyListPanel (mode === 'vocabulary')
        └── VocabularyItem[]
            ├── Word
            ├── Definition
            ├── ClickCount
            └── DateSaved
```

---

### Data Flow Diagram

```
┌─────────────────┐
│  User Action    │
│  (Click Word)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  ReaderPage State Update    │
│  setSelectedWord(word)      │
└────────┬────────────────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌──────────────────┐   ┌─────────────────┐
│ Fetch Definition │   │ Save Vocabulary │
│ (API call)       │   │ (Supabase)      │
└────────┬─────────┘   └─────────────────┘
         │
         ▼
┌──────────────────┐
│ Update UI State  │
│ (show sidebar)   │
└──────────────────┘
```

---

### State Management Strategy

**Global State (React Context):**
```typescript
interface AppContext {
  user: User | null;
  vocabulary: VocabularyEntry[];
  addToVocabulary: (entry: VocabularyEntry) => void;
  refreshVocabulary: () => Promise<void>;
}
```

**Local State (Component):**
- `ReaderPage`: mode ('input' | 'render' | 'vocabulary'), tokens, selectedWord
- `DefinitionSidebar`: loading, error, definition
- `AudioPlayer`: playing, loading, error

**Why not Redux/Zustand?**
- MVP scope doesn't need complex state management
- React Context + hooks sufficient for this scale
- Faster to implement and debug

---

## API Contracts

### Internal API Routes

#### POST `/api/dictionary/lookup`

**Request:**
```json
{
  "word": "hablar",
  "language": "es"
}
```

**Response (200):**
```json
{
  "word": "hablar",
  "definitions": [
    {
      "partOfSpeech": "verb",
      "translation": "to speak, to talk",
      "examples": ["hablar español", "hablar con alguien"]
    }
  ],
  "cached": false
}
```

**Response (404):**
```json
{
  "error": "WORD_NOT_FOUND",
  "message": "No definition found for 'xyz'.",
  "suggestions": []
}
```

**Response (500):**
```json
{
  "error": "API_ERROR",
  "message": "Dictionary service unavailable."
}
```

---

#### POST `/api/tts/speak`

**Request:**
```json
{
  "text": "Buenos días",
  "voiceId": "pNInz6obpgDQGcFmaJgB"
}
```

**Response (200):**
- Content-Type: `audio/mpeg`
- Body: Audio stream (binary)

**Response (429):**
```json
{
  "error": "QUOTA_EXCEEDED",
  "message": "Text-to-speech quota exceeded. Try again tomorrow."
}
```

**Response (500):**
```json
{
  "error": "TTS_ERROR",
  "message": "Text-to-speech service unavailable."
}
```

---

### External API Integrations

#### Merriam-Webster Spanish Dictionary

**Endpoint:**
```
GET https://www.dictionaryapi.com/api/v3/references/spanish/json/{word}?key={api_key}
```

**Rate Limit:** 1,000 requests/day (free tier)

**Example Response:**
```json
[
  {
    "meta": {
      "id": "casa",
      "stems": ["casa", "casas"]
    },
    "hwi": { "hw": "casa" },
    "fl": "noun",
    "def": [
      {
        "sseq": [
          [
            ["sense", { "dt": [["text", "house, home"]] }]
          ]
        ]
      }
    ]
  }
]
```

**Error Handling:**
- Empty array `[]` → word not found
- 403 → invalid API key
- 429 → rate limit exceeded

---

#### ElevenLabs Text-to-Speech

**Endpoint:**
```
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream
```

**Headers:**
```
xi-api-key: {api_key}
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Hola mundo",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75
  }
}
```

**Rate Limit:** 10,000 characters/month (free tier)

**Response:** MP3 audio stream

**Error Handling:**
- 401 → invalid API key
- 429 → quota exceeded
- 500 → service error

---

## Database Schema

### Supabase PostgreSQL Tables

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

### Supabase Client Setup

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

## Component Specifications

### Component: `ClickableWord`

**Props:**
```typescript
interface ClickableWordProps {
  token: Token;
  isSelected: boolean;
  isSaved: boolean;
  onClick: (token: Token) => void;
}
```

**Behavior:**
- Renders word as clickable `<span>`
- Applies hover effect (underline)
- Shows visual indicator if saved (subtle background color)
- Active state when selected (highlighted)

**Styling:**
```css
.word {
  cursor: pointer;
  transition: background-color 150ms ease;
}

.word:hover {
  text-decoration: underline;
}

.word.saved {
  background-color: rgba(59, 130, 246, 0.1);
}

.word.selected {
  background-color: rgba(59, 130, 246, 0.2);
}
```

---

### Component: `DefinitionSidebar`

**Props:**
```typescript
interface DefinitionSidebarProps {
  word: string;
  definition: Definition | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onPlayAudio: (text: string) => void;
}
```

**Layout:**
```
┌─────────────────────────┐
│ Word: libro         [X] │  ← Header with close button
├─────────────────────────┤
│ 🔊 Listen              │  ← Audio button
├─────────────────────────┤
│ noun                    │  ← Part of speech
│ • book                  │  ← Definitions
│ • publication           │
├─────────────────────────┤
│ Examples:               │  ← Examples (if available)
│ "un libro interesante"  │
└─────────────────────────┘
```

**Animation:**
- Slides in from right (desktop) or bottom (mobile)
- 300ms ease-out transition
- Overlay darkens background (30% opacity)

---

### Component: `VocabularyList`

**Props:**
```typescript
interface VocabularyListProps {
  entries: VocabularyEntry[];
  loading: boolean;
  onRefresh: () => void;
}
```

**Layout:**
```
┌─────────────────────────────────┐
│ My Vocabulary (42 words)        │
│ [Sort: Recent ▼] [Filter...]    │
├─────────────────────────────────┤
│ libro                           │
│ book • noun • 3 clicks          │
│ Saved 2 hours ago               │
├─────────────────────────────────┤
│ hablar                          │
│ to speak • verb • 1 click       │
│ Saved 5 hours ago               │
├─────────────────────────────────┤
│ ...                             │
└─────────────────────────────────┘
```

**Empty State:**
```
┌─────────────────────────────────┐
│                                 │
│    📚 No vocabulary yet         │
│    Start clicking words to      │
│    build your list!             │
│                                 │
└─────────────────────────────────┘
```

---

### Component: `AudioPlayer`

**Props:**
```typescript
interface AudioPlayerProps {
  text: string;
  autoPlay?: boolean;
  onError?: (error: Error) => void;
}
```

**States:**
- Idle: Speaker icon (gray)
- Loading: Spinner animation
- Playing: Animated sound waves
- Error: Icon hidden or error indicator

**Implementation:**
```typescript
function AudioPlayer({ text, autoPlay = false }: AudioPlayerProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle');

  const play = async () => {
    setStatus('loading');

    try {
      const response = await fetch('/api/tts/speak', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('TTS failed');

      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));

      setStatus('playing');
      await audio.play();

      audio.onended = () => setStatus('idle');
    } catch (error) {
      setStatus('idle');
      // Show error notification
    }
  };

  return (
    <button onClick={play} disabled={status === 'loading'}>
      {status === 'idle' && <SpeakerIcon />}
      {status === 'loading' && <Spinner />}
      {status === 'playing' && <SoundWaveIcon />}
    </button>
  );
}
```

---

## Development Timeline

### Day 1: Core Foundation (8-10 hours)

#### Morning (4 hours)
**Goal:** Authentication + Project Setup

- [ ] **Hour 1: Project Initialization**
  - Create Next.js 15 project with TypeScript
  - Install dependencies: Tailwind, Supabase client, UI libraries
  - Set up ESLint + Prettier
  - Configure environment variables (.env.local template)
  - Initialize Git repository

- [ ] **Hour 2-3: Supabase Setup**
  - Create Supabase project
  - Run database migrations (create tables)
  - Configure RLS policies
  - Test auth flow locally
  - Create `AuthProvider` component

- [ ] **Hour 3-4: Auth Pages**
  - Build `LoginPage` component
  - Build `SignupPage` component
  - Protected route wrapper
  - Test registration → login → logout flow

**Checkpoint:** User can sign up, log in, and see authenticated "Reader" page

---

#### Afternoon (4-6 hours)
**Goal:** Text Input + Dictionary Integration

- [ ] **Hour 5: Reader Layout**
  - Create `ReaderPage` skeleton
  - Build mode switcher (input/render/vocabulary)
  - Create `TextInputPanel` with textarea
  - Character count + render button

- [ ] **Hour 6-7: Tokenization Engine**
  - Implement `tokenizeText()` function
  - Sentence boundary detection
  - Create `ClickableWord` component
  - Test rendering with sample Spanish text

- [ ] **Hour 8-9: Dictionary API**
  - Create `/api/dictionary/lookup` route
  - Integrate Merriam-Webster API
  - Transform API response to internal format
  - Error handling (404, 429, 500)

- [ ] **Hour 9-10: Definition Sidebar**
  - Build `DefinitionSidebar` component
  - Connect click handler → API call → display
  - Loading states + error states
  - Close button functionality

**Checkpoint:** User can paste text, click words, see definitions

---

### Day 2: TTS + Vocabulary + Polish (8-10 hours)

#### Morning (4 hours)
**Goal:** Text-to-Speech Integration

- [ ] **Hour 1-2: TTS API Route**
  - Create `/api/tts/speak` endpoint
  - Integrate ElevenLabs streaming API
  - Test audio playback in browser
  - Error handling (quota, network)

- [ ] **Hour 3: Word Pronunciation**
  - Add `AudioPlayer` component to sidebar
  - Speaker icon → plays word audio
  - Visual feedback (loading, playing states)
  - Cache audio in localStorage

- [ ] **Hour 4: Selection Playback**
  - Detect text selection with `window.getSelection()`
  - Show floating "Play" button on selection
  - Send selection to TTS API
  - Handle long selections (character limit)

**Checkpoint:** User can hear word + sentence pronunciation

---

#### Afternoon (4-6 hours)
**Goal:** Vocabulary Persistence + UI Polish

- [ ] **Hour 5-6: Vocabulary Auto-Save**
  - Create vocabulary save function (Supabase insert/update)
  - Hook up to word click handler
  - Deduplicate logic (increment click_count)
  - Visual indicator for saved words

- [ ] **Hour 7: Vocabulary List View**
  - Build `VocabularyList` component
  - Fetch user's vocabulary on load
  - Display list with sort (recent first)
  - Empty state design

- [ ] **Hour 8-9: UI Polish**
  - Typography improvements (fonts, spacing)
  - Smooth animations (sidebar, mode transitions)
  - Mobile responsive adjustments
  - Accessibility audit (ARIA labels, keyboard nav)

- [ ] **Hour 10: Final Testing**
  - End-to-end user flow test
  - Cross-browser testing (Chrome, Firefox, Safari)
  - Mobile device testing
  - Fix critical bugs

**Checkpoint:** Fully functional MVP ready for demo

---

### Day 3: Deployment + DevOps (6-8 hours)

#### Morning (4 hours)
**Goal:** Containerization + IaC

- [ ] **Hour 1: Dockerfile**
  - Create optimized Next.js Dockerfile
  - Multi-stage build (build → runtime)
  - Test local Docker build
  - Push to Google Container Registry

- [ ] **Hour 2-3: OpenTofu Configuration**
  - Write Terraform configs for Cloud Run service
  - Configure environment variables (secrets)
  - Set up custom domain (optional)
  - Test local `tofu apply`

- [ ] **Hour 4: Manual Deployment Test**
  - Deploy to Cloud Run manually
  - Verify environment variables
  - Test production URLs
  - Check logs for errors

**Checkpoint:** App running on Cloud Run

---

#### Afternoon (2-4 hours)
**Goal:** CI/CD Pipeline

- [ ] **Hour 5-6: GitHub Actions Workflow**
  - Create `.github/workflows/deploy.yml`
  - Set up GitHub secrets (API keys, GCP credentials)
  - Configure workflow triggers (push to main)
  - Add build → test → deploy steps

- [ ] **Hour 7: Pipeline Testing**
  - Push test commit to trigger workflow
  - Monitor Actions logs
  - Debug any failures
  - Verify deployment success

- [ ] **Hour 8: Demo Preparation**
  - Prepare demo script/talking points
  - Create demo account with sample data
  - Test demo flow end-to-end
  - Screen recording (backup if live demo fails)

**Checkpoint:** Fully deployed with CI/CD, ready to present

---

## Testing Strategy

### Manual Testing Checklist

**Authentication:**
- [ ] Sign up with new email → creates account
- [ ] Sign up with existing email → shows error
- [ ] Login with valid credentials → redirects to reader
- [ ] Login with invalid credentials → shows error
- [ ] Logout → clears session and redirects to login
- [ ] Return with valid session → skips login

**Text Input & Rendering:**
- [ ] Paste short text (< 100 words) → renders correctly
- [ ] Paste long text (> 2000 words) → shows warning
- [ ] Click "Render" → transitions to render mode
- [ ] Click "Edit" → returns to input mode
- [ ] Punctuation preserved (periods, commas, quotes)

**Dictionary Lookups:**
- [ ] Click common word → definition appears
- [ ] Click rare word → "not found" message
- [ ] Click same word twice → second click faster (cache)
- [ ] Click word during loading → doesn't break UI
- [ ] API error → graceful error message

**Text-to-Speech:**
- [ ] Click speaker icon → word plays
- [ ] Audio plays smoothly (< 1s delay)
- [ ] Click another word → previous audio stops
- [ ] Select text → play button appears
- [ ] Play selection → sentence audio plays
- [ ] API quota exceeded → hides audio button gracefully

**Vocabulary:**
- [ ] First click saves word to database
- [ ] Second click increments click count
- [ ] Saved indicator appears on word
- [ ] Vocabulary list shows all saved words
- [ ] List persists after page reload
- [ ] Empty vocabulary shows empty state

**UI/UX:**
- [ ] All transitions smooth (60fps)
- [ ] Mobile layout adapts correctly
- [ ] Touch targets ≥ 44px on mobile
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader announces changes (basic ARIA)

**Performance:**
- [ ] Page loads in < 2 seconds on 3G
- [ ] No layout shift during load
- [ ] Dictionary lookups < 500ms
- [ ] Audio playback starts < 1 second
- [ ] No memory leaks (DevTools profiling)

---

### Automated Testing (If Time Permits)

**Unit Tests (Vitest):**
```typescript
// lib/tokenize.test.ts
describe('tokenizeText', () => {
  it('splits text by whitespace', () => {
    const tokens = tokenizeText('Hola mundo');
    expect(tokens).toHaveLength(3); // ['Hola', ' ', 'mundo']
  });

  it('preserves punctuation', () => {
    const tokens = tokenizeText('¿Cómo estás?');
    expect(tokens[0].text).toBe('¿Cómo');
    expect(tokens[2].text).toBe('estás?');
  });
});
```

**API Route Tests:**
```typescript
// app/api/dictionary/lookup/route.test.ts
describe('POST /api/dictionary/lookup', () => {
  it('returns definition for valid word', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/dictionary/lookup', {
        method: 'POST',
        body: JSON.stringify({ word: 'casa' }),
      })
    );

    const data = await response.json();
    expect(data.word).toBe('casa');
    expect(data.definitions).toBeDefined();
  });
});
```

**E2E Tests (Playwright - Optional):**
```typescript
// tests/reader.spec.ts
test('user can look up a word', async ({ page }) => {
  await page.goto('/reader');

  // Paste text
  await page.fill('textarea', 'Hola mundo');
  await page.click('button:has-text("Render")');

  // Click word
  await page.click('text="Hola"');

  // Verify sidebar appears
  await expect(page.locator('[data-testid="definition-sidebar"]')).toBeVisible();
});
```

---

## Deployment Requirements

### Environment Variables

**Local Development (`.env.local`):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Merriam-Webster
MERRIAM_WEBSTER_API_KEY=your-api-key-here

# ElevenLabs
ELEVENLABS_API_KEY=your-api-key-here

# Optional: Anthropic (Phase 2)
# ANTHROPIC_API_KEY=sk-ant-...
```

**Production (Cloud Run Secrets):**
- Set via Google Secret Manager
- Reference in OpenTofu config
- Never commit to Git

---

### Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

---

### OpenTofu Configuration

```hcl
# infrastructure/main.tf

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud Run Service
resource "google_cloud_run_service" "interlinear" {
  name     = "interlinear"
  location = var.region

  template {
    spec {
      containers {
        image = var.container_image

        env {
          name  = "NEXT_PUBLIC_SUPABASE_URL"
          value = var.supabase_url
        }

        env {
          name  = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
          value = var.supabase_anon_key
        }

        env {
          name = "MERRIAM_WEBSTER_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.merriam_webster_key.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "ELEVENLABS_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.elevenlabs_key.secret_id
              key  = "latest"
            }
          }
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "1"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Allow unauthenticated access
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.interlinear.name
  location = google_cloud_run_service.interlinear.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Secrets
resource "google_secret_manager_secret" "merriam_webster_key" {
  secret_id = "merriam-webster-api-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "elevenlabs_key" {
  secret_id = "elevenlabs-api-key"

  replication {
    auto {}
  }
}

# Outputs
output "service_url" {
  value = google_cloud_run_service.interlinear.status[0].url
}
```

**Variables (`variables.tf`):**
```hcl
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "container_image" {
  description = "Container image URL"
  type        = string
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anon key"
  type        = string
}
```

---

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Deploy to Cloud Run

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1
  SERVICE_NAME: interlinear

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      # - run: npm test (if tests exist)

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest

    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker

      - name: Build Docker image
        run: |
          docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA .
          docker tag gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

      - name: Push Docker image
        run: |
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE_NAME \
            --image gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA \
            --platform managed \
            --region $REGION \
            --allow-unauthenticated \
            --set-env-vars NEXT_PUBLIC_SUPABASE_URL=${{ secrets.SUPABASE_URL }} \
            --set-env-vars NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }} \
            --set-secrets MERRIAM_WEBSTER_API_KEY=merriam-webster-api-key:latest \
            --set-secrets ELEVENLABS_API_KEY=elevenlabs-api-key:latest

      - name: Get Service URL
        run: |
          SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')
          echo "Service deployed to: $SERVICE_URL"
          echo "SERVICE_URL=$SERVICE_URL" >> $GITHUB_ENV

      - name: Smoke Test
        run: |
          curl -f $SERVICE_URL || exit 1
```

---

## Appendix: API Key Setup

### Merriam-Webster Spanish Dictionary

1. Go to: https://dictionaryapi.com/register/index
2. Sign up for free developer account
3. Select "Spanish-English Dictionary"
4. Copy API key
5. Add to `.env.local`: `MERRIAM_WEBSTER_API_KEY=xxx`

### ElevenLabs

1. Go to: https://elevenlabs.io/sign-up
2. Sign up (free tier: 10,000 chars/month)
3. Navigate to Profile → API Keys
4. Generate new key
5. Add to `.env.local`: `ELEVENLABS_API_KEY=xxx`

### Supabase

1. Go to: https://supabase.com/dashboard
2. Create new project
3. Copy Project URL and anon key from Settings → API
4. Add to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...`

### OpenAI (for AI Tutor - Epic 6)

1. Go to: https://platform.openai.com/signup
2. Create account and add payment method
3. Navigate to API Keys section
4. Generate new secret key
5. Add to `.env.local`: `OPENAI_API_KEY=sk-...`
6. **Cost Management**: Set usage limits in OpenAI dashboard ($50/month recommended for demo)

---

## Success Metrics

**Development Velocity:**
- [ ] MVP completed in 48 hours (Day 1-2)
- [ ] 4-Day Sprint: Library, AI Tutor, Flashcards (Day 1-4)
- [ ] Deployment pipeline functional by Day 3
- [ ] Zero critical bugs at demo time

**Technical Quality:**
- [ ] TypeScript strict mode with zero errors
- [ ] ESLint passes with zero warnings
- [ ] WCAG AA compliance (basic checks)
- [ ] Page load < 2 seconds
- [ ] API responses < 500ms (95th percentile)

**User Experience:**
- [ ] Demo user completes full flow in < 2 minutes
- [ ] Audio playback feels instant (< 1s)
- [ ] UI feels polished (no visual glitches)
- [ ] Mobile experience is usable

**Demo Readiness:**
- [ ] Live demo runs smoothly
- [ ] Backup screen recording prepared
- [ ] Demo account seeded with sample data
- [ ] Talking points prepared

---

**END OF PRD**

This document serves as the complete specification for building Interlinear MVP. All acceptance criteria, technical details, and timelines are designed for a 3-day build-and-deploy cycle using AI-assisted development with Claude Code.

For questions or clarifications, refer back to the [Project Brief](./brief.md) or update this PRD as development reveals new requirements.
