# Epic 6: AI Tutor Mode - Backend & LangChain Integration

**Status**: 🚧 In Progress
**Priority**: P0 - Critical
**Sprint**: 4-Day MVP Launch (Day 2)
**Estimated Effort**: 8 hours

---

## Overview

Integrate LangChain 1.x and OpenAI to power adaptive AI tutoring using individual `tool()` functions and `createAgent` patterns. Build backend services for dialog-based conversation, error analysis, and professor-style text overviews. This is the "magic sauce" that makes the app revolutionary.

**Architecture Note**: We use LangChain 1.x patterns with individual `tool()` functions (NOT deprecated 0.3.x LCEL chains or class-based services).

---

## User Stories

### 6.1: Database Migrations for Tutor Sessions
**As a** developer
**I want** database schema for tutor sessions and dialog turns
**So that** we can persist conversation state and analysis

**Acceptance Criteria**:
- [ ] Create `tutor_sessions` table with user/text relationships
- [ ] Create `dialog_turns` table for conversation history
- [ ] Add indexes on `user_id`, `text_id`, `session_id`
- [ ] Enable RLS policies for user data isolation
- [ ] Add token usage tracking columns
- [ ] Migration runs successfully on local Supabase

**Database Schema**:
```sql
-- Tutor sessions
CREATE TABLE public.tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text_id UUID NOT NULL REFERENCES public.library_texts(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_tokens INT DEFAULT 0,
  CONSTRAINT valid_level CHECK (level IN ('A1','A2','B1','B2','C1','C2'))
);

-- Dialog turns
CREATE TABLE public.dialog_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.tutor_sessions(id) ON DELETE CASCADE,
  turn_number INT NOT NULL,
  ai_message TEXT NOT NULL,
  user_response TEXT,
  tokens_used INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT positive_turn CHECK (turn_number > 0),
  CONSTRAINT valid_tokens CHECK (tokens_used >= 0)
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON public.tutor_sessions(user_id);
CREATE INDEX idx_sessions_text_id ON public.tutor_sessions(text_id);
CREATE INDEX idx_turns_session_id ON public.dialog_turns(session_id);
CREATE INDEX idx_sessions_completed ON public.tutor_sessions(completed_at) WHERE completed_at IS NOT NULL;

-- RLS Policies
ALTER TABLE public.tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialog_turns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.tutor_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.tutor_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.tutor_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own turns"
  ON public.dialog_turns FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.tutor_sessions WHERE id = session_id));

CREATE POLICY "Users can insert own turns"
  ON public.dialog_turns FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.tutor_sessions WHERE id = session_id));
```

**Migration File**: `supabase/migrations/YYYYMMDDHHMMSS_create_tutor_tables.sql`

---

### 6.2: LangChain Tool Functions (Core AI Logic)
**As a** developer
**I want** individual LangChain `tool()` functions for tutor operations
**So that** we follow LangChain 1.x patterns and avoid deprecated LCEL chains

**Acceptance Criteria**:
- [ ] Create `startDialogTool` with Zod schema validation
- [ ] Create `continueDialogTool` with conversation history
- [ ] Create `analyzeErrorsTool` with `.withStructuredOutput()` for JSON
- [ ] Create `generateOverviewTool` with `.withStructuredOutput()` for JSON
- [ ] All tools use `ChatOpenAI({ model: "gpt-4o" })` (NOT `modelName`)
- [ ] All tools properly typed with TypeScript interfaces
- [ ] Error handling and retry logic implemented

**Implementation**: `lib/tutor-tools.ts`

```typescript
import { tool } from "langchain"
import { ChatOpenAI } from "@langchain/openai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { LibraryService } from "@/lib/library"
import { VocabularyService } from "@/lib/vocabulary"

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DialogStartResult {
  sessionId: string
  aiMessage: string
  turnNumber: number
}

export interface DialogTurnResult {
  aiMessage: string
  turnNumber: number
}

export interface ErrorAnalysis {
  turn: number
  errorText: string
  correction: string
  explanation: string
}

export interface ProfessorOverview {
  summary: string
  grammarConcepts: string[]
  vocabThemes: string[]
  syntaxPatterns: string[]
}

// ============================================================================
// ZOD SCHEMAS (for tool validation and structured output)
// ============================================================================

const StartDialogSchema = z.object({
  textId: z.string().uuid(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
})

const ContinueDialogSchema = z.object({
  sessionId: z.string().uuid(),
  userResponse: z.string().min(1).max(1000)
})

const AnalyzeErrorsSchema = z.object({
  sessionId: z.string().uuid()
})

const GenerateOverviewSchema = z.object({
  textId: z.string().uuid()
})

// Structured output schemas
const ErrorAnalysisOutputSchema = z.object({
  errors: z.array(z.object({
    turn: z.number().int().positive(),
    errorText: z.string().min(1),
    correction: z.string().min(1),
    explanation: z.string().min(10)
  }))
})

const ProfessorOverviewOutputSchema = z.object({
  summary: z.string().min(20),
  grammarConcepts: z.array(z.string()).min(1),
  vocabThemes: z.array(z.string()).min(1),
  syntaxPatterns: z.array(z.string()).min(1)
})

// ============================================================================
// TOOL 1: START DIALOG
// ============================================================================

export const startDialogTool = tool(
  async ({ textId, level }, config) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get text and vocabulary
    const text = await LibraryService.getText(textId)
    const vocab = await LibraryService.getVocabularyForText(textId)

    const vocabList = vocab.map(v => `${v.word}: ${v.definition || 'sin definición'}`).join('\n')

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('tutor_sessions')
      .insert({
        user_id: user.id,
        text_id: textId,
        level: level
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Generate first AI message
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.7
    })

    const systemPrompt = `Eres un tutor de español nivel ${level}.
Inicia una conversación natural basada en este texto:

${text.content}

El estudiante ha aprendido estas palabras:
${vocabList}

Haz preguntas que:
- Usen el vocabulario del texto
- Sean apropiadas para nivel ${level}
- Fomenten respuestas completas
- Sean naturales y alentadoras

Responde SOLO en español. No uses inglés.

Primera pregunta:`

    const response = await model.invoke([
      { role: "system", content: systemPrompt }
    ])

    const aiMessage = response.content as string

    // Save first turn
    const { error: turnError } = await supabase
      .from('dialog_turns')
      .insert({
        session_id: session.id,
        turn_number: 1,
        ai_message: aiMessage
      })

    if (turnError) throw turnError

    return {
      sessionId: session.id,
      aiMessage,
      turnNumber: 1
    }
  },
  {
    name: "start_dialog",
    description: "Start an AI tutor dialog session based on a library text and CEFR level",
    schema: StartDialogSchema
  }
)

// ============================================================================
// TOOL 2: CONTINUE DIALOG
// ============================================================================

export const continueDialogTool = tool(
  async ({ sessionId, userResponse }, config) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('tutor_sessions')
      .select('*, library_texts(*)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) throw new Error('Session not found')

    // Get conversation history
    const { data: turns, error: turnsError } = await supabase
      .from('dialog_turns')
      .select('*')
      .eq('session_id', sessionId)
      .order('turn_number', { ascending: true })

    if (turnsError) throw turnsError

    // Build conversation history
    const history = turns.map(turn => {
      return `Tutor: ${turn.ai_message}${turn.user_response ? `\nEstudiante: ${turn.user_response}` : ''}`
    }).join('\n\n')

    const nextTurnNumber = turns.length + 1

    // Generate AI response
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.7
    })

    const systemPrompt = `Eres un tutor de español nivel ${session.level}.
Conversación hasta ahora:
${history}

El estudiante respondió: "${userResponse}"

Continúa la conversación:
- Reconoce su respuesta
- Haz una pregunta de seguimiento
- Usa vocabulario del texto
- Mantén nivel ${session.level}
- Sé alentador

Responde SOLO en español.

Tu respuesta:`

    const response = await model.invoke([
      { role: "system", content: systemPrompt }
    ])

    const aiMessage = response.content as string

    // Update previous turn with user response
    const lastTurn = turns[turns.length - 1]
    await supabase
      .from('dialog_turns')
      .update({ user_response: userResponse })
      .eq('id', lastTurn.id)

    // Save new AI turn
    const { error: newTurnError } = await supabase
      .from('dialog_turns')
      .insert({
        session_id: sessionId,
        turn_number: nextTurnNumber,
        ai_message: aiMessage
      })

    if (newTurnError) throw newTurnError

    return {
      aiMessage,
      turnNumber: nextTurnNumber
    }
  },
  {
    name: "continue_dialog",
    description: "Continue an AI tutor conversation with user's response",
    schema: ContinueDialogSchema
  }
)

// ============================================================================
// TOOL 3: ANALYZE ERRORS (with .withStructuredOutput())
// ============================================================================

export const analyzeErrorsTool = tool(
  async ({ sessionId }, config) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('tutor_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) throw new Error('Session not found')

    // Get all turns with user responses
    const { data: turns, error: turnsError } = await supabase
      .from('dialog_turns')
      .select('*')
      .eq('session_id', sessionId)
      .not('user_response', 'is', null)
      .order('turn_number', { ascending: true })

    if (turnsError) throw turnsError

    // Build transcript
    const transcript = turns.map((turn, idx) => {
      return `Turno ${turn.turn_number}:\nEstudiante: ${turn.user_response}`
    }).join('\n\n')

    // Use .withStructuredOutput() for guaranteed JSON response
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0
    }).withStructuredOutput(ErrorAnalysisOutputSchema)

    const systemPrompt = `Analiza esta conversación de un estudiante de español nivel ${session.level}:

${transcript}

Identifica todos los errores gramaticales, de vocabulario y sintaxis.
Para cada error, proporciona:
1. El número de turno donde ocurrió
2. La frase incorrecta exacta del estudiante
3. La corrección apropiada
4. Una explicación clara y didáctica del error

Si no hay errores, devuelve un array vacío.`

    const result = await model.invoke([
      { role: "system", content: systemPrompt }
    ])

    // Mark session as completed
    await supabase
      .from('tutor_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    return result.errors
  },
  {
    name: "analyze_errors",
    description: "Analyze conversation for grammar, vocabulary, and syntax errors",
    schema: AnalyzeErrorsSchema
  }
)

// ============================================================================
// TOOL 4: GENERATE OVERVIEW (with .withStructuredOutput())
// ============================================================================

export const generateOverviewTool = tool(
  async ({ textId }, config) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get text
    const text = await LibraryService.getText(textId)

    // Use .withStructuredOutput() for guaranteed JSON response
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0
    }).withStructuredOutput(ProfessorOverviewOutputSchema)

    const systemPrompt = `Analiza este texto en español como un profesor experimentado:

${text.content}

Proporciona un análisis estructurado:

1. RESUMEN (2-3 oraciones): El tema principal y puntos clave
2. CONCEPTOS GRAMATICALES: Lista de estructuras gramaticales importantes (subjuntivo, tiempos verbales, etc.)
3. TEMAS DE VOCABULARIO: Lista de campos semánticos presentes (ej: "familia", "negocios", "naturaleza")
4. PATRONES DE SINTAXIS: Lista de construcciones sintácticas notables (ej: "oraciones condicionales", "voz pasiva")

Sé específico y didáctico.`

    const result = await model.invoke([
      { role: "system", content: systemPrompt }
    ])

    return result
  },
  {
    name: "generate_overview",
    description: "Generate a professor-style overview of a text's learning points",
    schema: GenerateOverviewSchema
  }
)
```

**File Location**: `lib/tutor-tools.ts`

---

### 6.3: API Routes for Tutor Operations
**As a** frontend developer
**I want** REST API endpoints that invoke tutor tools
**So that** I can build the tutor UI without backend knowledge

**Acceptance Criteria**:
- [ ] `POST /api/tutor/start` - Start dialog session
- [ ] `POST /api/tutor/turn` - Continue conversation
- [ ] `POST /api/tutor/analyze` - Analyze errors
- [ ] `POST /api/tutor/overview` - Generate overview
- [ ] All routes validate request bodies with Zod
- [ ] All routes return proper error responses (400, 401, 500)
- [ ] All routes handle LangChain tool invocation

**Implementation**: `app/api/tutor/start/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { startDialogTool } from '@/lib/tutor-tools'
import { z } from 'zod'

const StartRequestSchema = z.object({
  textId: z.string().uuid(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const parsed = StartRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Invoke tool
    const result = await startDialogTool.invoke(parsed.data)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Start dialog error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to start dialog' },
      { status: 500 }
    )
  }
}
```

**Implementation**: `app/api/tutor/turn/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { continueDialogTool } from '@/lib/tutor-tools'
import { z } from 'zod'

const TurnRequestSchema = z.object({
  sessionId: z.string().uuid(),
  userResponse: z.string().min(1).max(1000)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = TurnRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const result = await continueDialogTool.invoke(parsed.data)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Continue dialog error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'Session not found') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to continue dialog' },
      { status: 500 }
    )
  }
}
```

**Implementation**: `app/api/tutor/analyze/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { analyzeErrorsTool } from '@/lib/tutor-tools'
import { z } from 'zod'

const AnalyzeRequestSchema = z.object({
  sessionId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = AnalyzeRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const errors = await analyzeErrorsTool.invoke(parsed.data)

    return NextResponse.json({ errors })
  } catch (error) {
    console.error('Analyze errors error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'Session not found') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to analyze errors' },
      { status: 500 }
    )
  }
}
```

**Implementation**: `app/api/tutor/overview/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateOverviewTool } from '@/lib/tutor-tools'
import { z } from 'zod'

const OverviewRequestSchema = z.object({
  textId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = OverviewRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const overview = await generateOverviewTool.invoke(parsed.data)

    return NextResponse.json({ overview })
  } catch (error) {
    console.error('Generate overview error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to generate overview' },
      { status: 500 }
    )
  }
}
```

**File Locations**:
- `app/api/tutor/start/route.ts`
- `app/api/tutor/turn/route.ts`
- `app/api/tutor/analyze/route.ts`
- `app/api/tutor/overview/route.ts`

---

### 6.4: Cost Management & Rate Limiting
**As a** product owner
**I want** cost controls on OpenAI API usage
**So that** we don't exceed demo budget during development

**Acceptance Criteria**:
- [ ] Rate limit: 10 requests/minute per user for `/api/tutor/*`
- [ ] Hard limit: 3000 tokens per session (auto-end after 10 turns)
- [ ] Token usage tracked in `tutor_sessions.total_tokens`
- [ ] Professor overviews cached (in-memory Map with 24h TTL)
- [ ] OpenAI dashboard spending limit set to $50/month
- [ ] Exponential backoff on OpenAI rate limit errors

**Implementation**: `lib/rate-limit.ts`

```typescript
import { LRUCache } from 'lru-cache'

type RateLimitOptions = {
  interval: number // milliseconds
  uniqueTokenPerInterval: number
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000
  })

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0]
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount)
        }
        tokenCount[0] += 1

        const currentUsage = tokenCount[0]
        const isRateLimited = currentUsage >= limit

        return isRateLimited ? reject() : resolve()
      })
  }
}

// Usage in API routes:
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
})

// In route handler:
const identifier = user.id // or IP address
try {
  await limiter.check(10, identifier) // 10 requests per minute
} catch {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  )
}
```

**Implementation**: `lib/overview-cache.ts`

```typescript
interface CacheEntry {
  overview: ProfessorOverview
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const TTL = 24 * 60 * 60 * 1000 // 24 hours

export function getCachedOverview(textId: string): ProfessorOverview | null {
  const entry = cache.get(textId)
  if (!entry) return null

  const isExpired = Date.now() - entry.timestamp > TTL
  if (isExpired) {
    cache.delete(textId)
    return null
  }

  return entry.overview
}

export function setCachedOverview(textId: string, overview: ProfessorOverview): void {
  cache.set(textId, {
    overview,
    timestamp: Date.now()
  })
}
```

**File Locations**:
- `lib/rate-limit.ts`
- `lib/overview-cache.ts`

---

### 6.5: Error Recovery & Validation
**As a** developer
**I want** robust error handling and recovery
**So that** the system gracefully handles LLM failures

**Acceptance Criteria**:
- [ ] All LLM calls have 30-second timeout
- [ ] Retry logic with exponential backoff (max 3 attempts)
- [ ] Spanish-only enforcement: reject responses with >50% English
- [ ] Off-topic detection: inject enforcement prompt if AI strays
- [ ] Empty error array returned if error analysis fails (don't block)
- [ ] Structured output validation with Zod (already in tools)
- [ ] Detailed error logging for debugging

**Implementation**: Add to `lib/tutor-tools.ts`

```typescript
// Utility: Detect English vs Spanish
function detectLanguage(text: string): 'en' | 'es' | 'mixed' {
  const englishWords = text.match(/\b(the|is|are|was|were|have|has|been|to|of|and|a|in|that|it|for|not|with|as|you|this|be|on|at|by|from)\b/gi) || []
  const spanishWords = text.match(/\b(el|la|los|las|de|que|es|en|y|a|un|una|por|con|para|del|como|al|lo|su|se|las|más|pero|su|me|ya|ser|ha|ha|sido|está|están|fue|será|son)\b/gi) || []

  const englishRatio = englishWords.length / (text.split(/\s+/).length || 1)

  if (englishRatio > 0.5) return 'en'
  if (englishRatio > 0.2) return 'mixed'
  return 'es'
}

// Utility: Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries - 1) throw error

      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

// Add timeout wrapper to all model.invoke() calls:
async function invokeWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 30000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('LLM timeout')), timeoutMs)
    )
  ])
}

// Example usage in continueDialogTool:
const response = await retryWithBackoff(async () => {
  return await invokeWithTimeout(
    model.invoke([{ role: "system", content: systemPrompt }]),
    30000
  )
})

const aiMessage = response.content as string

// Validate Spanish-only
const detectedLang = detectLanguage(aiMessage)
if (detectedLang === 'en') {
  throw new Error('AI responded in English, enforcing Spanish-only')
}
```

**File Location**: `lib/tutor-tools.ts` (utilities section)

---

### 6.6: Integration Testing
**As a** QA engineer
**I want** comprehensive tests for all tutor operations
**So that** we verify correctness before shipping

**Acceptance Criteria**:
- [ ] Test: Start dialog with A1 level returns Spanish response
- [ ] Test: Continue conversation maintains history
- [ ] Test: Error analysis identifies intentional mistakes
- [ ] Test: Professor overview returns structured JSON
- [ ] Test: Rate limiting rejects >10 requests/minute
- [ ] Test: Token limit ends session after 3000 tokens
- [ ] Test: Cache returns same overview on repeat requests
- [ ] Test: English detection rejects non-Spanish responses

**Implementation**: `__tests__/tutor.test.ts`

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals'
import { startDialogTool, continueDialogTool, analyzeErrorsTool, generateOverviewTool } from '@/lib/tutor-tools'

describe('Tutor Tools', () => {
  let testTextId: string
  let testSessionId: string

  beforeAll(async () => {
    // Create test text in database
    // Create test user session
  })

  describe('startDialogTool', () => {
    it('should start dialog in Spanish', async () => {
      const result = await startDialogTool.invoke({
        textId: testTextId,
        level: 'A1'
      })

      expect(result.sessionId).toBeTruthy()
      expect(result.aiMessage).toBeTruthy()
      expect(result.turnNumber).toBe(1)

      // Verify Spanish (no English words like "Hello", "How are you")
      expect(result.aiMessage).not.toMatch(/\b(Hello|Hi|How are you)\b/i)
    })
  })

  describe('continueDialogTool', () => {
    it('should continue conversation with history', async () => {
      const result = await continueDialogTool.invoke({
        sessionId: testSessionId,
        userResponse: 'Me gusta leer libros de historia.'
      })

      expect(result.aiMessage).toBeTruthy()
      expect(result.turnNumber).toBeGreaterThan(1)
    })
  })

  describe('analyzeErrorsTool', () => {
    it('should identify grammar errors', async () => {
      // Insert test turns with intentional errors
      const errors = await analyzeErrorsTool.invoke({
        sessionId: testSessionId
      })

      expect(Array.isArray(errors)).toBe(true)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toHaveProperty('turn')
      expect(errors[0]).toHaveProperty('errorText')
      expect(errors[0]).toHaveProperty('correction')
      expect(errors[0]).toHaveProperty('explanation')
    })
  })

  describe('generateOverviewTool', () => {
    it('should generate structured overview', async () => {
      const overview = await generateOverviewTool.invoke({
        textId: testTextId
      })

      expect(overview.summary).toBeTruthy()
      expect(overview.grammarConcepts).toBeInstanceOf(Array)
      expect(overview.vocabThemes).toBeInstanceOf(Array)
      expect(overview.syntaxPatterns).toBeInstanceOf(Array)
      expect(overview.grammarConcepts.length).toBeGreaterThan(0)
    })
  })
})
```

**File Location**: `__tests__/tutor.test.ts`

---

## Technical Specification

### Dependencies

```json
{
  "dependencies": {
    "langchain": "^1.0.0",
    "@langchain/openai": "^1.0.0",
    "@langchain/core": "^1.0.0",
    "zod": "^3.22.0",
    "lru-cache": "^10.0.0"
  }
}
```

**Important**: We use LangChain 1.x (NOT 0.3.x). The key differences:
- ✅ Use `tool()` function for individual tools
- ✅ Use `createAgent` for multi-tool coordination (not needed in this epic)
- ✅ Use `model` parameter in ChatOpenAI (NOT deprecated `modelName`)
- ✅ Use `.withStructuredOutput(ZodSchema)` for JSON responses
- ❌ NO LCEL chains (`.pipe()`, `ChatPromptTemplate.fromTemplate()`)
- ❌ NO `RunnableSequence` or `RunnablePassthrough`

### Environment Variables

```bash
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Cost Management

**Expected Costs** (GPT-4o):
- 10-turn conversation: ~2000 tokens = $0.10/session (input: $0.005/1K, output: $0.015/1K)
- 100 users/day: $10/day = $300/month
- **Mitigation**: Set $50/month spending limit in OpenAI dashboard for demo phase

### File Structure

```
lib/
  tutor-tools.ts           # LangChain tool() functions
  rate-limit.ts            # Rate limiting utility
  overview-cache.ts        # Overview caching

app/api/tutor/
  start/route.ts           # POST /api/tutor/start
  turn/route.ts            # POST /api/tutor/turn
  analyze/route.ts         # POST /api/tutor/analyze
  overview/route.ts        # POST /api/tutor/overview

supabase/migrations/
  YYYYMMDDHHMMSS_create_tutor_tables.sql

__tests__/
  tutor.test.ts            # Integration tests
```

---

## Error Handling

### Rate Limiting
- Implement per-user rate limit: 10 requests/minute for `/api/tutor/*`
- Return 429 status with retry-after header
- Exponential backoff for OpenAI API calls (LangChain built-in)
- Cache overview results per text (in-memory Map with 24h TTL)

### Error Recovery
- **Invalid JSON**: Use `.withStructuredOutput()` - Zod validates automatically
- **Timeout**: 30-second timeout on all LLM calls with retry logic
- **Off-topic conversation**: Inject Spanish-only enforcement prompt
- **Error analysis failure**: Return empty array (don't block user)
- **English language detection**: Reject responses with >50% English words
- **Max retries**: 3 attempts with exponential backoff (1s, 2s, 4s)

### Cost Management
- Track token usage per session in `tutor_sessions.total_tokens`
- Warn if session exceeds 10 turns (suggest ending)
- Cache professor overviews indefinitely (24h TTL, in-memory)
- Hard limit: 3000 tokens per session (automatically end)
- OpenAI dashboard spending limit: $50/month

---

## Testing Checklist

### Functional Tests
- [ ] Start dialog session with A1 level
- [ ] Verify AI responds in Spanish only (no English)
- [ ] Continue conversation for 3+ turns
- [ ] Verify conversation history maintained correctly
- [ ] Submit conversation with intentional grammar errors
- [ ] Verify error analysis returns valid structured JSON
- [ ] Verify errors correctly identified with explanations
- [ ] Generate professor overview for 500-word text
- [ ] Generate professor overview for 2000-word text

### Performance Tests
- [ ] Test rate limit: 11th request within 1 minute rejected
- [ ] Test token limit: Session auto-ends after 3000 tokens
- [ ] Test cache: Second overview request returns instantly
- [ ] Test timeout: LLM call exceeds 30s triggers retry

### Error Handling Tests
- [ ] Test invalid JSON recovery (should not occur with .withStructuredOutput())
- [ ] Test English detection: AI responds in English → rejected
- [ ] Test session not found: 404 error returned
- [ ] Test unauthorized: 401 error returned
- [ ] Test invalid level: 400 error returned

### Integration Tests
- [ ] End-to-end: Start → 3 turns → analyze → verify errors
- [ ] End-to-end: Overview → start dialog using vocab → complete
- [ ] Verify RLS: User A cannot access User B's sessions
- [ ] Verify foreign keys: Deleting text deletes associated sessions

---

## Dependencies

- **Requires**: Epic 5 (Library System) completed
- **Blocks**: Epic 7 (Tutor UI)

---

## Success Metrics

**Day 2 Complete When**:
- ✅ LangChain 1.x successfully integrated with `tool()` functions
- ✅ Can start and continue Spanish conversation with context
- ✅ Error analysis returns actionable feedback with structured JSON
- ✅ Professor overview generates useful summaries
- ✅ All APIs tested and returning valid data
- ✅ Rate limiting and cost controls operational
- ✅ Integration tests passing

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| OpenAI API costs exceed budget | Hard $50/month limit + token tracking + caching |
| AI responds in English | Language detection + enforcement prompts |
| Slow LLM responses (>10s) | 30s timeout + exponential backoff + user feedback |
| Invalid JSON responses | `.withStructuredOutput()` guarantees valid JSON |
| Session state lost | Database persistence + proper foreign keys |
| User overwhelmed by errors | Only show top 5 errors, group by type |
| Off-topic conversations | System prompts enforce text-based dialog |

---

## Notes

- Uses LangChain 1.x `tool()` pattern (NOT deprecated LCEL chains)
- `.withStructuredOutput(ZodSchema)` ensures type-safe JSON responses
- Each tool is a standalone function (NOT class methods)
- API routes directly invoke tools (no service layer needed)
- Cost-conscious: caching, rate limiting, token tracking
- Spanish-only enforcement at multiple layers
- Comprehensive error handling and retry logic
