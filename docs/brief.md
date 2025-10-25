# Project Brief: Interlinear

**Version:** 1.0
**Date:** 2025-10-24
**Status:** Ready for Development
**Build Timeline:** 2 days build + 1 day deployment

---

## Executive Summary

**Interlinear** is an AI-augmented language learning web application that transforms static foreign-language texts into interactive, word-level study materials. Users paste Spanish text (with Latin support planned), click words to receive instant dictionary definitions, **hear native pronunciation via AI voice synthesis**, and automatically build vocabulary lists and sentence corpora for review.

**Primary Demo Purpose:** Showcase AI-accelerated development competence for an AI accelerator program - demonstrating that modern full-stack applications with authentication, external API integration, and beautiful UX can be built in 2-3 days using AI-assisted development workflows.

**Target Market:** Language learners (beginners to intermediate) who want to learn from authentic texts rather than textbooks, with initial focus on Spanish learners.

**Key Value Proposition:** Zero-friction transition from static text to interactive learning experience. No setup, no downloads, no configuration - just paste and start learning with intelligent vocabulary tracking in authentic sentence contexts.

---

## Problem Statement

### Current State & Pain Points

Language learners face a critical gap between textbook exercises and authentic texts. When students attempt to read real Spanish content (news articles, literature, social media), they encounter:

1. **Friction Barrier:** Looking up every unknown word in a dictionary app breaks reading flow and concentration
2. **Lost Context:** Traditional dictionaries don't track which sentences contained which words, losing valuable contextual learning opportunities
3. **Manual Vocabulary Management:** Students must manually copy words into vocabulary lists, a tedious process that discourages consistent practice
4. **Pronunciation Gap:** Reading without hearing pronunciation creates a disconnect between written and spoken language
5. **No Grammar Scaffolding:** Encountering complex grammar in the wild without guided analysis is overwhelming for beginners

### Impact

- Students avoid authentic texts until "advanced enough," missing months/years of contextual learning
- Vocabulary acquisition is slower due to decontextualized memorization
- Grammar patterns remain abstract without real-world application examples
- Motivation drops when reading feels like a chore rather than an engaging activity

### Why Existing Solutions Fall Short

- **Duolingo/Babbel:** Great for structured lessons, but don't support learning from authentic texts
- **Google Translate:** Translates entire passages, removing the active learning component; no word-level interaction
- **Physical Dictionaries:** Too slow and cumbersome for digital-age learners; no audio pronunciation
- **LingQ:** Closest competitor, but has complex UI and requires paid subscription for full features; pronunciation is basic/robotic
- **SpanishDict/WordReference:** Good dictionaries but require switching contexts; no integrated reading experience

### Urgency

With AI-powered language tools proliferating, there's a window to capture the "authentic text reading" niche before larger players expand into this space. Additionally, the demonstration value for the AI accelerator is time-sensitive.

---

## Proposed Solution

### Core Concept

A single-page web application that transforms any pasted Spanish text into an interactive reading environment where:
- Every word becomes clickable
- Definitions appear instantly via Merriam-Webster Spanish Dictionary API
- **AI-powered text-to-speech** plays native Spanish pronunciation via ElevenLabs (click word → hear it spoken)
- Selected text or sentences can be read aloud for listening practice
- Clicked words automatically populate a persistent vocabulary list
- Sentences containing studied vocabulary are tracked for review
- Beautiful, manuscript-inspired UI makes the experience feel premium and focused

### Key Differentiators

1. **Zero Friction:** No import/export workflow, no file uploads - paste and go
2. **AI-Powered Audio:** Native-quality pronunciation for every word and sentence via ElevenLabs (the "wow" moment)
3. **Automatic Corpus Building:** Vocabulary and sentence tracking happens invisibly as you read
4. **Language-Agnostic Architecture:** Spanish MVP, but designed to swap in Latin, Icelandic, or any language with available dictionary API
5. **AI Development Showcase:** The app itself demonstrates what can be built in 48 hours using AI-assisted development

### Why This Will Succeed

- **Minimal Scope:** Focused on one thing (interactive reading) done extremely well
- **Modern Stack:** Next.js 15, React 19, Supabase - proven, fast-to-develop technologies
- **Real API Integration:** Merriam-Webster provides professional-grade dictionary data
- **Beautiful Design:** Typography and UX as competitive moat against clunky alternatives

### High-Level Vision

The product becomes a "machine philologist's assistant" - a tool that combines the precision of traditional language study with the intelligence of modern AI to make authentic text reading accessible to learners at any level.

---

## Target Users

### Primary User Segment: Intermediate Spanish Learners

**Profile:**
- Age: 18-45
- Current level: A2-B1 (CEFR scale)
- Learning context: Self-directed learners, college students in Spanish programs, heritage speakers improving literacy
- Technical comfort: Comfortable with web apps, uses language learning apps regularly

**Current Behaviors:**
- Uses Duolingo or similar apps for structured practice
- Wants to read Spanish news/social media but gets frustrated
- Manually looks up words in SpanishDict.com or Google Translate
- Has vocabulary notebook (physical or digital) they inconsistently maintain

**Specific Needs:**
- Bridge the gap between controlled textbook content and "real" Spanish
- Build vocabulary from contexts that interest them (not generic textbook topics)
- Hear correct pronunciation of new words (listening comprehension gap)
- Track progress tangibly (see their vocabulary list grow)
- Understand grammar patterns as they appear in authentic usage

**Goals:**
- Read Spanish news articles without constant dictionary interruption
- Build 500-word vocabulary from authentic contexts in 3 months
- Develop listening skills alongside reading comprehension
- Feel confident encountering Spanish in the wild

### Secondary User Segment: Philology Students & Language Enthusiasts

**Profile:**
- Age: 20-65
- Interest: Classical languages (Latin, Ancient Greek), historical linguistics
- Context: Academic study, personal enrichment, professional translation work

**Current Behaviors:**
- Uses print dictionaries and grammar references
- Takes manual notes on morphology and syntax
- Seeks tools that support close textual analysis

**Specific Needs:**
- Word-level analysis tools for ancient/under-resourced languages
- Ability to track grammatical patterns across texts
- Export capabilities for research notes

**Goals:**
- Close reading of classical texts with efficient lookup workflow
- Build personal lexicons for specialized domains

---

## Goals & Success Metrics

### Business Objectives

- **Demo Success:** Successfully present working application to AI accelerator cohort by Day 3
- **Technical Demonstration:** Showcase full development lifecycle (build → test → deploy) within 72 hours
- **Portfolio Value:** Create a polished, production-ready application that demonstrates technical capabilities

### User Success Metrics

- **Engagement:** Average session length > 10 minutes (indicates sustained reading)
- **Vocabulary Growth:** Average user saves 15+ words per reading session
- **Return Usage:** 60%+ of users return for second reading session within 7 days
- **Reading Completion:** Users finish passages they start (low mid-passage abandonment rate)

### Key Performance Indicators (KPIs)

- **Development Velocity:** Complete MVP within 48 hours with AI-assisted workflow
- **Code Quality:** Pass TypeScript strict mode, zero ESLint errors
- **API Performance:** Dictionary lookups < 500ms response time
- **UI/UX Quality:** Zero critical accessibility violations (WCAG AA)
- **Deployment Success:** Zero-downtime deployment to Cloud Run via IaC pipeline

---

## MVP Scope

### Core Features (Must Have)

- **Supabase Authentication:** Email/password sign-up and login with session persistence
  - *Rationale:* User-specific vocabulary lists require accounts; Supabase makes this 2-hour implementation

- **Text Input Interface:** Clean textarea for pasting Spanish text with "Render" button to transition to reading mode
  - *Rationale:* Simplicity over file upload reduces scope and friction

- **Word Tokenization & Click Handlers:** Parse text into clickable `<span>` elements with unique IDs
  - *Rationale:* Space-based splitting (no advanced NLP) is sufficient for MVP; handles 90% of cases

- **Merriam-Webster Dictionary Integration:** Fetch word definitions, part of speech, and translations via official Spanish Dictionary API
  - *Rationale:* Professional API ensures data quality and reduces integration risk vs. web scraping

- **Sidebar Definition Panel:** Right-side panel (or modal on mobile) displays clicked word's dictionary entry with smooth animations
  - *Rationale:* This is the "wow factor" - beautiful typography and smooth interactions showcase polish

- **Automatic Vocabulary Tracking:** Every clicked word saves to user's vocabulary list (word + definition + timestamp)
  - *Rationale:* Core value proposition - passive learning artifact generation

- **Sentence Context Tracking:** Store the sentence containing each vocabulary word for future review
  - *Rationale:* Enables contextual flashcard generation in future phases

- **Vocabulary List View:** In-page or modal view showing all saved words with definitions
  - *Rationale:* Users need to see their progress; this validates the learning loop

- **ElevenLabs Text-to-Speech Integration:** Audio playback for individual words and text selections via ElevenLabs API
  - Click word → hear pronunciation button appears
  - Select text → "Play Selection" button appears
  - Supports streaming for instant playback
  - *Rationale:* The "lol wtf" demo moment - hearing AI-powered native Spanish pronunciation elevates this from a dictionary to a full learning tool. Shows multi-API integration sophistication.

### Out of Scope for MVP

- Export functionality (CSV, Anki, PDF)
- Flashcard/quiz generation
- Multi-language UI (English UI only for MVP)
- Advanced tokenization (handling contractions, hyphenated words)
- User profile management
- Social features (sharing, collaborative reading)
- Mobile native apps (web-responsive only)
- Offline mode
- Etymology or usage examples beyond basic dictionary entry
- Phonetic transcription (IPA)

### MVP Success Criteria

The MVP is successful if:
1. A user can sign up, paste a Spanish paragraph, click 10 words, and see definitions within 2 minutes
2. Clicking a word plays native Spanish pronunciation via ElevenLabs (the "wow" moment)
3. Users can select and play entire sentences for listening practice
4. The vocabulary list persists across sessions
5. The UI feels polished (smooth animations, beautiful typography, no visual bugs)
6. The demo can be shown live with zero crashes or API failures
7. The application is deployed to Cloud Run with working CI/CD pipeline

---

## Post-MVP Vision

### Phase 2 Features: AI Grammar Coach (Stretch Goal)

If time permits during Day 2, add an AI agent layer that analyzes the pasted text and generates:
- **Content Summary:** High-level summary of what the passage is about
- **Grammar Breakdown:** Identification of key grammatical structures (verb tenses, subjunctive usage, pronouns)
- **Lesson Framing:** Position the passage as a learning exercise (e.g., "This text is great for practicing preterite vs. imperfect")
- **Generated Exercises:** Simple fill-in-the-blank or translation exercises based on the passage
- **Interactive Q&A:** Chat interface to ask grammar questions about specific sentences

**Implementation Note:** This layer is a proof-of-concept; doesn't need RAG/MCP sophistication for demo purposes. Simple LLM API call with the text as context is sufficient.

### Long-Term Vision (6-12 months)

- **Multi-Language Support:** Add Latin (via Whitaker's Words), French, German, Italian
- **Advanced Morphology:** For inflected languages, show grammatical analysis (case, tense, mood)
- **Smart Flashcards:** Spaced repetition system (SRS) based on vocabulary list
- **Reading Library:** Curated collection of texts sorted by difficulty level
- **Community Features:** Users can share annotated texts and vocabulary lists
- **Teacher Dashboard:** Track student progress, assign readings

### Expansion Opportunities

- **B2B Education Market:** License to language schools and universities
- **API for Developers:** Offer the interlinear rendering as an embeddable widget
- **Content Partnerships:** Partner with Spanish news outlets to embed interactive reading experience
- **Mobile Apps:** Native iOS/Android for on-the-go reading

---

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Web (desktop + mobile responsive)
- **Browser Support:** Modern evergreen browsers (Chrome, Firefox, Safari, Edge) - last 2 versions
- **Performance Requirements:**
  - Page load < 2 seconds on 3G connection
  - Dictionary lookup < 500ms (cached < 100ms)
  - Audio playback starts < 1 second after click (streaming)
  - Smooth 60fps animations on definition panel

### Technology Preferences

**Frontend:**
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Styling:** TailwindCSS for rapid development and consistency
- **State Management:** React Context API (sufficient for MVP scope)
- **HTTP Client:** Native fetch with Next.js server actions where appropriate

**Backend:**
- **Authentication:** Supabase Auth (email/password, magic link optional)
- **Database:** Supabase PostgreSQL (stores users, vocabulary lists, sentence tracking)
- **API Layer:** Next.js API routes for dictionary + TTS proxy (to protect API keys)
- **Dictionary API:** Merriam-Webster Spanish-English Dictionary (https://dictionaryapi.com/products/api-spanish-dictionary)
- **Text-to-Speech API:** ElevenLabs TTS (https://elevenlabs.io/docs/api-reference/text-to-speech)
  - Supports streaming for instant audio playback
  - Spanish voices: Use multilingual model for native pronunciation

**AI Layer (Phase 2 - Stretch):**
- **LLM:** Anthropic Claude API (for grammar analysis and exercise generation)
- **Prompt Engineering:** Simple few-shot prompts (no vector DB or RAG for MVP)

**Hosting/Infrastructure:**
- **Deployment:** Google Cloud Run (containerized Next.js app)
- **IaC:** OpenTofu (Terraform) for infrastructure as code
- **CI/CD:** GitHub Actions workflow (test → build → deploy)
- **Domain:** TBD (can use Cloud Run default URL for demo)

### Architecture Considerations

**Repository Structure:**
```
interlinear/
├── app/              # Next.js 15 App Router
│   ├── (auth)/       # Auth pages
│   ├── reader/       # Main reader interface
│   └── api/          # API routes
├── components/       # React components
├── lib/              # Utilities, API clients
├── supabase/         # DB migrations, types
├── infrastructure/   # OpenTofu configs
└── .github/workflows/ # CI/CD
```

**Service Architecture:**
- Monolithic Next.js app (no microservices needed for MVP)
- Supabase as BaaS (backend-as-a-service)
- External API calls proxied through Next.js API routes

**Integration Requirements:**
- Merriam-Webster API requires API key (free tier: 1,000 requests/day)
- ElevenLabs API requires API key (free tier: 10,000 characters/month, ~200 words)
- Supabase requires project URL + anon key (configured via env vars)
- Claude API (Phase 2) requires Anthropic API key

**Security/Compliance:**
- API keys stored in environment variables (never committed to git)
- Supabase Row Level Security (RLS) policies to ensure users only access their own data
- HTTPS enforced (Cloud Run provides TLS automatically)
- No PII stored beyond email (GDPR-lite compliance)

---

## Constraints & Assumptions

### Constraints

**Budget:**
- $0 infrastructure cost (Supabase free tier, Cloud Run free tier, Merriam-Webster free tier, ElevenLabs free tier)
- ElevenLabs free tier limits demo to ~200 word pronunciations/month (sufficient for demo)
- Potential costs if scaling beyond free tiers: ~$30/month

**Timeline:**
- **Day 1-2:** Core application development (48 hours)
- **Day 3:** IaC setup + deployment pipeline + final polish
- **Hard Deadline:** Must be demo-ready by end of Day 3

**Resources:**
- Solo developer + AI assistant (Claude Code)
- No design team (use Tailwind defaults + typography best practices)
- No QA team (manual testing only)

**Technical:**
- Must work within Merriam-Webster free tier (1,000 API calls/day)
- Must work within ElevenLabs free tier (10,000 characters/month) - cache audio when possible
- No budget for paid LLM API calls (use sparingly for Phase 2)
- Database limited to Supabase free tier (500MB, 2GB bandwidth)

### Key Assumptions

- Spanish is sufficient for demo; Latin can be swapped later
- Users will paste clean text (no need for OCR or PDF parsing)
- Space-based tokenization handles 90% of Spanish texts acceptably
- Merriam-Webster API provides adequate definition quality
- Simple authentication (email/password) is sufficient (no OAuth)
- Dictionary lookups are fast enough without caching strategy (can add Redis later if needed)
- Users are comfortable with English UI (no i18n needed for MVP)
- AI accelerator demo reviewers prioritize "speed of development" over "feature completeness"

---

## Risks & Open Questions

### Key Risks

- **API Rate Limiting:** If multiple demo viewers trigger lookups simultaneously, could hit Merriam-Webster's 1,000/day limit
  - *Mitigation:* Implement client-side caching; use localStorage to cache definitions per user

- **Dictionary API Coverage:** Merriam-Webster may not have entries for all Spanish words (slang, regional variants, very new terms)
  - *Mitigation:* Graceful error handling; show "definition not found" with option to Google it

- **Time Pressure:** 48 hours is aggressive for full-stack app
  - *Mitigation:* Ruthlessly prioritize; cut Phase 2 AI features if behind schedule

- **Cloud Run Cold Starts:** If demo audience encounters cold starts, app may feel slow
  - *Mitigation:* Keep at least 1 instance warm via health check pings

### Open Questions

- Do we need to handle verb conjugations (e.g., user clicks "hablaba" → dictionary shows "hablar")?
  - *Decision Pending:* Start without lemmatization; add if time allows

- Should vocabulary list show frequency (how many times word appears in passage)?
  - *Decision:* Nice to have, but not MVP-critical

- What happens if user pastes 10,000-word document?
  - *Decision:* Add soft limit (e.g., 2,000 words max) with friendly error message

- Mobile UX: Should definition panel be modal or bottom sheet?
  - *Decision:* Test both in dev; choose based on feel

### Areas Needing Further Research

- **Latin Dictionary Options:** Identify best API/dataset for Phase 2 Latin support
- **Lemmatization Services:** Research if we need to add verb/noun lemmatization for better dictionary hits
- **Accessibility Best Practices:** Review WCAG guidelines for click-to-reveal interactive text
- **Performance Optimization:** If many words clicked, does DOM size impact performance?

---

## Appendices

### A. Technical Architecture Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│      Next.js 15 (App Router)        │
│  ┌───────────┐      ┌─────────────┐ │
│  │  Reader   │◄────►│  Auth Page  │ │
│  │  Interface│      └─────────────┘ │
│  └─────┬─────┘                      │
│        │                            │
│  ┌─────▼──────────────────────┐    │
│  │   API Routes (Proxy)       │    │
│  └──────┬─────────────────────┘    │
└─────────┼──────────────────────────┘
          │
    ┌─────┴─────────┐
    │               │
    ▼               ▼
┌────────────┐ ┌──────────────────┐
│ Supabase   │ │ Merriam-Webster  │
│ (Auth+DB)  │ │ Dictionary API   │
└────────────┘ └──────────────────┘
                ┌──────────────────┐
                │  ElevenLabs TTS  │
                │  (Audio Stream)  │
                └──────────────────┘
```

### B. Data Model

```typescript
// Supabase Tables

users (managed by Supabase Auth)
├── id: uuid (PK)
├── email: string
└── created_at: timestamp

vocabulary_entries
├── id: uuid (PK)
├── user_id: uuid (FK → users.id)
├── word: string
├── lemma: string (nullable)
├── definition: jsonb (full API response)
├── language: string (default: 'es')
├── first_seen: timestamp
└── click_count: int

reading_sessions
├── id: uuid (PK)
├── user_id: uuid (FK → users.id)
├── text_snippet: text (first 200 chars)
├── word_count: int
├── created_at: timestamp
└── vocabulary_added: int

sentence_contexts
├── id: uuid (PK)
├── vocabulary_id: uuid (FK → vocabulary_entries.id)
├── session_id: uuid (FK → reading_sessions.id)
├── sentence_text: text
└── created_at: timestamp
```

### C. API Integration Details

**Merriam-Webster Spanish Dictionary API:**
- Endpoint: `https://www.dictionaryapi.com/api/v3/references/spanish/json/{word}?key={api_key}`
- Rate Limit: 1,000 requests/day (free tier)
- Response Format: JSON array of dictionary entries
- Required Fields: headword, part of speech, definitions, translations

**Example Request:**
```bash
GET https://www.dictionaryapi.com/api/v3/references/spanish/json/libro?key=YOUR_KEY
```

**Example Response:**
```json
[
  {
    "meta": { "id": "libro", "stems": ["libro", "libros"] },
    "hwi": { "hw": "libro" },
    "fl": "noun",
    "def": [
      {
        "sseq": [
          [
            [
              "sense",
              { "dt": [["text", "book"]] }
            ]
          ]
        ]
      }
    ]
  }
]
```

**ElevenLabs Text-to-Speech API:**
- Endpoint (Convert): `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- Endpoint (Stream): `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream`
- Rate Limit: 10,000 characters/month (free tier)
- Response Format: Audio stream (MP3)
- Recommended Voice: Use multilingual Spanish model (e.g., `pNInz6obpgDQGcFmaJgB` - Adam multilingual)

**Example Request (Streaming):**
```bash
POST https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB/stream
Headers:
  xi-api-key: YOUR_API_KEY
  Content-Type: application/json
Body:
{
  "text": "Hola, ¿cómo estás?",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75
  }
}
```

**Implementation Notes:**
- Use streaming endpoint for instant playback (no wait for full audio generation)
- Cache audio files client-side (localStorage) to avoid re-generating same words
- Fallback gracefully if quota exceeded (hide audio button, show notification)

### D. Deployment Pipeline

**GitHub Actions Workflow (`.github/workflows/deploy.yml`):**
1. Trigger on push to `main` branch
2. Run tests (TypeScript, ESLint, unit tests)
3. Build Next.js app (`npm run build`)
4. Build Docker image
5. Push to Google Container Registry
6. Deploy to Cloud Run via OpenTofu
7. Run smoke tests against deployed URL
8. Post deployment notification to Slack (optional)

**OpenTofu Configuration:**
- Provision Cloud Run service
- Configure environment variables (Supabase URL, API keys)
- Set up custom domain (if applicable)
- Configure IAM permissions
- Enable Cloud Logging

---

## Next Steps

### Immediate Actions

1. **Obtain API Keys**
   - Sign up for Merriam-Webster Spanish Dictionary API
   - Sign up for ElevenLabs and get API key (free tier)
   - Create Supabase project and note credentials
   - (Optional) Get Anthropic API key for Phase 2

2. **Initialize Repository**
   - Create Next.js 15 project with TypeScript
   - Install dependencies (Tailwind, Supabase client)
   - Set up ESLint + Prettier
   - Initialize git + push to GitHub

3. **Set Up Supabase Project**
   - Create database tables (users, vocabulary_entries, etc.)
   - Configure Row Level Security policies
   - Test authentication flow locally

4. **Begin Development (Day 1)**
   - Build authentication pages
   - Create reader interface skeleton
   - Implement text tokenization
   - Integrate dictionary API

5. **Continue Development (Day 2)**
   - Build vocabulary list component
   - Add sentence tracking
   - Polish UI/animations
   - (Stretch) Add AI grammar coach

6. **Deployment (Day 3)**
   - Write OpenTofu configs
   - Set up GitHub Actions workflow
   - Deploy to Cloud Run
   - Test production environment
   - Prepare demo presentation

---

## PM Handoff

This Project Brief provides the full context for **Interlinear**. The project is now ready to move into PRD (Product Requirements Document) generation, which will break down each feature into detailed specifications, acceptance criteria, and technical implementation notes.

**For the next phase, we should:**
- Create detailed user stories for each core feature
- Define component hierarchy and data flow
- Specify API contracts (request/response schemas)
- Write acceptance criteria for each feature
- Plan testing strategy
- Create development task breakdown (Day 1 vs. Day 2 tasks)

The brief is optimized for a 48-hour build timeline with a third day for deployment automation. The scope is intentionally tight to ensure demo-readiness while showcasing full-stack capabilities and AI-accelerated development velocity.
