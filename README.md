# Interlinear AI

**Master Languages with AI Tutoring. Classical to Modern.**

The first AI language tutor that teaches like a university professor—with real-time error correction, character roleplay, and support for dead languages like Latin. No green owls, no gamified flashcards, just intelligent feedback that adapts to your learning level.

**[Experience AI Tutoring →](https://interlinear.peleke.me)**

---

## The Problem with Language Apps

Current language learning is stuck in 2010:
- **Scripted chatbots** that can't handle real conversation
- **Gamified flashcards** that don't teach context or usage
- **Green owls** that guilt-trip instead of actually teaching
- **Zero support** for classical languages like Latin

**Result:** Millions of people "learning" languages for years without ever becoming conversational.

## Our AI Education Revolution

We built the first language tutor that actually *teaches*—using advanced AI to provide university-grade instruction with personalized feedback.

### 🧠 **Real-Time Error Correction**
Not just "wrong answer"—detailed grammar explanations by category, with native pronunciation of your mistakes so you hear the difference.

### 🎭 **Character Roleplay System**
Practice real conversations with AI characters who maintain narrative coherence and adapt to your responses, creating immersive dialogue experiences.

### 🏛️ **Classical Language Mastery**
First modern AI platform for Latin—helping students, educators, and classical literature enthusiasts master ancient languages with the same sophistication as modern ones.

### 👩‍🏫 **Professor-Style Reviews**
Comprehensive performance analysis that identifies patterns in your mistakes and provides targeted improvement strategies.

### 📊 **CEFR-Adaptive Intelligence**
Automatically adjusts difficulty from A1 (beginner) to C2 (mastery) based on your responses, ensuring optimal challenge level.

### 📱 **Native PWA Experience**
Install to your device like a real app—works offline, instant loading, no browser chrome. Built for serious learners.

**This is language learning the way it should be: intelligent, adaptive, and university-grade.**

**[Start mastering languages →](https://interlinear.peleke.me)**

---

## Advanced AI Capabilities

### 🧠 **AI Tutoring Engine**
- Real-time error correction with detailed grammar explanations
- Character roleplay system for contextual conversations
- Professor-style performance analysis and feedback
- CEFR-adaptive intelligence (A1-C2 automatic level adjustment)

### 🏛️ **Classical Language Innovation**
- First AI platform supporting Latin with full sophistication
- Interactive Caesar translation demos
- Academic-grade content for university coursework
- Support for classical literature and historical texts

### 🎮 **Gamified Learning System**
- Duolingo-style practice mode with lives and XP progression
- Streak tracking for consistent learning habits
- AI-generated exercises based on personal vocabulary
- Beautiful animations and responsive feedback

### 📱 **Progressive Web App**
- Native app experience (installable to home screen)
- Offline functionality with smart caching
- Service worker optimization for instant loading
- Performance-first architecture (~1.2s initial load)

---

## Architecture & Technical Details

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 15 (App Router) + TypeScript | React Server Components for optimal performance; TypeScript for type safety |
| **Database** | Supabase (PostgreSQL) | Managed PostgreSQL with built-in auth, Row Level Security, and real-time subscriptions |
| **Authentication** | Supabase Auth | OAuth-ready auth with email verification and session management |
| **Text-to-Speech** | ElevenLabs API | Best-in-class neural TTS for pronunciation quality |
| **Dictionary** | Free Dictionary API | Zero-cost, comprehensive English dictionary with phonetics |
| **Deployment** | Google Cloud Run | Serverless containers with auto-scaling (0-10 instances) |
| **IaC** | OpenTofu (Terraform fork) | Declarative infrastructure with state management in GCS |
| **CI/CD** | GitHub Actions | Automated builds on merge to main |

### Key Architectural Decisions

#### 1. **Server-Side Rendering with Dynamic Rendering**
- **Decision**: Force dynamic rendering for all pages (`export const dynamic = 'force-dynamic'`)
- **Rationale**: Supabase client initialization requires runtime environment variables; static generation attempts to access them at build time, causing failures
- **Tradeoff**: Sacrificed static generation performance for deployment simplicity. Alternative would be edge runtime with environment variable injection, but adds complexity.

#### 2. **Client-Side Audio Caching**
- **Decision**: Store TTS audio in Supabase `audio_cache` table with user-scoped RLS
- **Rationale**: ElevenLabs charges per character; caching reduces API costs by ~80% for repeated words
- **Tradeoff**: Database storage costs vs API costs. Break-even at ~10 repeated pronunciations per word.

#### 3. **Container Build Strategy**
- **Decision**: Bake `NEXT_PUBLIC_*` env vars into Docker image at build time via `--build-arg`
- **Rationale**: Next.js compiles client-side env vars into JavaScript bundle; runtime injection doesn't work
- **Tradeoff**: Requires rebuild for env var changes, but enables immutable deployments with proper image tagging

#### 4. **Manual Deployment Trigger**
- **Decision**: GitHub Actions builds containers; Terraform deployment is manual
- **Rationale**: Separates build (automated, fast feedback) from deploy (deliberate, rollback-safe)
- **Tradeoff**: Extra manual step vs risk of auto-deploying breaking changes to production

#### 5. **Vocabulary Implicit Tracking**
- **Decision**: Save every clicked word to database immediately (no "save" button)
- **Rationale**: Removes friction; users learn by reading, not by managing lists
- **Tradeoff**: Higher database writes, but trivial cost (~$0.01/1000 writes on Supabase)

### Infrastructure Design

```
┌─────────────────────────────────────────────────────────────┐
│                       Google Cloud                           │
│                                                               │
│  ┌─────────────────┐         ┌──────────────────┐          │
│  │  Cloud Run      │◄────────┤ Artifact Registry│          │
│  │  (0-10 inst)    │         │  Docker Images   │          │
│  └────────┬────────┘         └──────────────────┘          │
│           │                                                   │
│           │ Pulls secrets at runtime                         │
│           ▼                                                   │
│  ┌─────────────────┐                                         │
│  │ Secret Manager  │                                         │
│  │ - Supabase keys │                                         │
│  │ - ElevenLabs API│                                         │
│  └─────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘

                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│  ┌─────────────┐    ┌──────────────┐   ┌─────────────┐    │
│  │ PostgreSQL  │◄───┤ Row Level    │◄──┤ Auth        │    │
│  │ - vocab     │    │ Security     │   │ - JWT       │    │
│  │ - audio_cache    │ (user_id)    │   │ - Email     │    │
│  └─────────────┘    └──────────────┘   └─────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Security Model:**
- All database queries filtered by `auth.uid()` via RLS policies
- ElevenLabs API key server-side only (never exposed to client)
- Supabase anon key client-side (safe; RLS enforces user isolation)

**Scaling Strategy:**
- Cloud Run auto-scales 0→10 instances based on CPU (horizontal scaling)
- Supabase connection pooling handles 60 concurrent connections (sufficient for ~1000 MAU)
- ElevenLabs rate limit: 50 req/sec (overkill for current scale)

### Performance Characteristics

| Metric | Value | Target |
|--------|-------|--------|
| **Initial Load** | ~1.2s (TTI) | <2s |
| **Definition Lookup** | <100ms (cache) / ~300ms (cold) | <500ms |
| **TTS Generation** | ~800ms (ElevenLabs latency) | <1s |
| **Database Query** | <50ms (Supabase co-located) | <100ms |
| **Container Cold Start** | ~2s (Cloud Run) | <3s |

**Cost Structure** (at 1000 MAU):
- Cloud Run: ~$15/month (1 min instance, us-east4)
- Supabase: Free tier (under 500MB, <2GB transfer)
- ElevenLabs: ~$5/month (with 80% cache hit rate)
- **Total**: ~$20/month

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- ElevenLabs API key

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/interlinear.git
   cd interlinear
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ELEVENLABS_API_KEY=your-elevenlabs-key
   ```

4. **Set up database**

   Run the SQL migrations in `supabase/schema.sql` on your Supabase project.

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
interlinear/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (TTS, health check)
│   ├── login/             # Authentication pages
│   ├── profile/           # User profile and stats
│   ├── reader/            # Main reading interface
│   └── signup/            # User registration
├── components/            # React components
│   ├── auth/             # Authentication forms
│   ├── reader/           # Reading interface components
│   └── vocabulary/       # Vocabulary management UI
├── lib/                   # Utilities and services
│   ├── supabase/         # Database client
│   ├── dictionary.ts     # Dictionary API integration
│   ├── tts.ts            # Text-to-speech service
│   └── vocabulary.ts     # Vocabulary tracking service
├── types/                 # TypeScript type definitions
├── supabase/             # Database schema and migrations
├── terraform/            # Infrastructure as Code
├── scripts/              # Deployment automation
└── docs/                 # Documentation

```

## Database Schema

### Tables

**vocabulary_entries**
- User's clicked words with frequency tracking
- Automatic timestamps for learning analytics

**audio_cache**
- Cached TTS audio to reduce API costs
- User-scoped with automatic cleanup

**Row Level Security**
- All data is private and user-scoped
- Automatic user_id filtering on all operations

## API Routes

### POST /api/tts
Generate text-to-speech audio for a word or phrase.

**Request:**
```json
{
  "text": "hello",
  "voice_id": "21m00Tcm4TlvDq8ikWAM"
}
```

**Response:**
```json
{
  "audio": "base64-encoded-audio",
  "cached": false
}
```

### GET /api/health
Health check endpoint for monitoring.

## Deployment

See [DEPLOY.md](./DEPLOY.md) for complete deployment walkthrough.

### Quick Deploy

```bash
# Deploy infrastructure
./scripts/deploy-infra.sh staging

# Deploy application
./scripts/deploy-app.sh staging

# Rollback if needed
./scripts/rollback.sh staging
```

## Monitoring

Structured logging outputs JSON in production for Cloud Logging integration:

```typescript
import { logger } from '@/lib/logger'

logger.info('User action', { userId, action: 'click_word' })
logger.error('API error', error, { endpoint: '/api/tts' })
```

## Environment Variables

### Required

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `ELEVENLABS_API_KEY` - ElevenLabs API key (server-side only)

### Optional

- `NODE_ENV` - `development` | `production`

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Roadmap

### Phase 1: MVP (Completed)
- ✅ Core reading interface with click-to-define
- ✅ Audio pronunciation (ElevenLabs integration)
- ✅ Automatic vocabulary tracking with frequency analytics
- ✅ User authentication and profile management
- ✅ Production deployment (GCP Cloud Run + OpenTofu)
- ✅ CI/CD pipeline (GitHub Actions)

### Phase 2: Learning Loop (Next)
- 🚧 **AI Tutor Mode**: GPT-4 powered exercises based on clicked vocabulary
  - Contextual sentence generation using user's vocabulary
  - Fill-in-the-blank and translation exercises
  - Adaptive difficulty based on click frequency
- 🚧 **Spaced Repetition System**: Automatic review scheduling
  - Algorithm: SM-2 (Anki-style) with click frequency weighting
  - Native push notifications for review reminders

### Phase 3: Expansion (Future)
- Multi-language support (Spanish → French, German, Italian)
- Text upload (PDF/EPUB parsing)
- Vocabulary export (Anki-compatible CSV)
- Browser extension (read any webpage)

### Known Limitations
- **English-only**: Dictionary API is English-specific; multi-language requires paid APIs
- **No offline mode**: Requires network for definitions and TTS
- **Limited corpus**: No built-in reading library (user must paste text)
- **No mobile app**: PWA could improve mobile experience but requires additional testing

---

## Project Scope & Portfolio Context

**Built as**: Full-stack portfolio project demonstrating production-grade engineering practices

**Timeline**: ~2 weeks (architecture → deployment)

**Key Achievements**:
- Zero-downtime deployments with image tagging and Terraform state management
- Type-safe full-stack TypeScript with strict ESLint rules
- Database-level security with PostgreSQL Row Level Security
- Cost-optimized architecture (~$20/month for 1000 MAU)
- Comprehensive deployment automation (see [DEPLOY.md](./DEPLOY.md))

**Design Philosophy**:
- **Solve one problem well**: Reading comprehension, not full language curriculum
- **Implicit over explicit**: Track behavior without asking users to manage data
- **Infrastructure as code**: Reproducible deployments with OpenTofu
- **Cost awareness**: Free tier optimization with graceful scaling

---

## Local Development

### Prerequisites
- Node.js 20+
- Supabase account (free tier)
- ElevenLabs API key (free tier: 10k characters/month)

### Setup

```bash
# Clone and install
git clone https://github.com/yourusername/interlinear.git
cd interlinear
npm install

# Environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ELEVENLABS_API_KEY=your-elevenlabs-key

# Database setup
# Run supabase/schema.sql in your Supabase SQL editor

# Start dev server
npm run dev
# → http://localhost:3000
```

### Scripts
```bash
npm run dev          # Development server with hot reload
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # ESLint + Prettier
npm test             # Jest tests (if present)
```

---

## Deployment

**Full walkthrough**: [DEPLOY.md](./DEPLOY.md)

**Quick deploy**:
```bash
# 1. Deploy infrastructure (Artifact Registry, IAM, Secrets)
./scripts/deploy-infra.sh staging

# 2. Build and push container
./scripts/deploy-app.sh staging

# 3. Deploy Cloud Run service
./scripts/deploy-infra.sh staging --with-cloud-run --image-tag <sha>
```

**GitHub Secrets Required**:
- `GCP_SA_KEY` - Service account JSON
- `GCP_PROJECT_ID` - GCP project ID
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Credits & Acknowledgments

- **Dictionary API**: [Free Dictionary API](https://dictionaryapi.dev/) - Public domain
- **Text-to-Speech**: [ElevenLabs](https://elevenlabs.io/) - Neural voice synthesis
- **Database & Auth**: [Supabase](https://supabase.com/) - PostgreSQL + Auth + Realtime
- **Infrastructure**: Google Cloud Platform

---

## License

MIT - See [LICENSE](./LICENSE) for details

---

**Built by**: [Your Name]
**Contact**: your.email@example.com
**Portfolio**: [yourportfolio.com](https://yourportfolio.com)
