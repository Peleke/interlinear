# Epic 7: LLM Content Generation - Mastra Architecture

**Status**: 🏗️ Architecture Approved → Ready for Implementation
**Framework**: Mastra (TypeScript-first agent framework)
**Date**: 2025-01-10

---

## TL;DR

**What we're building**: Agent-powered workflow that transforms reading texts into lesson components (vocabulary, grammar, exercises) with human review checkpoints.

**Why Mastra**: Built-in workflows, native suspend/resume, TypeScript-first, perfect for our human-in-the-loop needs.

**Architecture vision**:
- **Phase 1 (MVP)**: Simple workflow with LLM tools → Get working fast
- **Phase 2 (Specialization)**: Each tool becomes specialized agent → Better quality

---

## 1. High-Level Architecture

### Current Flow (What We're Building)

```
Author clicks "Generate from Reading"
          ↓
[Start Mastra Workflow]
          ↓
[Extract Vocabulary Tool] ← Claude Sonnet 3.5
          ↓
⚠️ SUSPEND: Review Vocabulary Modal
          ↓ (user approves)
[Identify Grammar Tool] ← Claude Sonnet 3.5
          ↓
⚠️ SUSPEND: Review Grammar Modal
          ↓ (user approves)
[Generate Exercises Tool] ← Claude Sonnet 3.5
          ↓
⚠️ SUSPEND: Review Exercises Modal
          ↓ (user approves)
[Insert to Database Tool]
          ↓
Done! ✅
```

### Future Vision (Multi-Agent Specialization)

```
Phase 2 expansion path (natural evolution):

[Extract Vocabulary Tool]
    ↓ becomes ↓
[Vocabulary Specialist Agent]
  - Specialized prompt templates
  - CEFR level expertise
  - Dictionary API integration memory
  - Historical vocabulary patterns

[Identify Grammar Tool]
    ↓ becomes ↓
[Grammar Specialist Agent]
  - Grammar pattern recognition
  - CEFR grammar rules knowledge
  - Example generation expertise
  - Grammar concept database memory

[Generate Exercises Tool]
    ↓ becomes ↓
[Exercise Designer Agent]
  - Pedagogical exercise patterns
  - Difficulty calibration
  - Distractor generation expertise
  - Prior exercise quality memory
```

**Key architectural decision**: Build with tools first, agent-ify later. Mastra supports both patterns!

---

## 2. Phase 1: MVP Implementation (Simple Tools)

### 2.1 Project Structure

```
lib/
├── content-generation/
│   ├── mastra.config.ts                 # Mastra setup + provider config
│   ├── workflows/
│   │   └── content-generation.ts        # Main workflow definition
│   └── tools/
│       ├── extract-vocabulary.ts        # Vocab extraction tool
│       ├── validate-vocabulary.ts       # Check against MW API + DB
│       ├── identify-grammar.ts          # Grammar pattern detection
│       ├── generate-exercises.ts        # Exercise generation
│       └── insert-content.ts            # DB insertion
│
app/api/lessons/[id]/
├── generate-content/
│   └── route.ts                         # POST: Start workflow, stream
└── approve-content/
    └── route.ts                         # POST: Resume from suspend

components/authoring/
├── ContentGenerationButton.tsx          # Trigger button
├── GenerationProgressModal.tsx          # Streaming progress
├── VocabularyReviewModal.tsx            # Review + approve vocab
├── GrammarReviewModal.tsx               # Review + approve grammar
└── ExerciseReviewModal.tsx              # Review + approve exercises

supabase/migrations/
└── YYYYMMDD_ai_generation_metadata.sql  # DB schema
```

### 2.2 Mastra Configuration

```typescript
// lib/content-generation/mastra.config.ts
import { Mastra } from '@mastra/core'
import { createAnthropicProvider } from '@mastra/anthropic'
import { contentGenerationWorkflow } from './workflows/content-generation'

export const mastra = new Mastra({
  name: 'interlinear-content-generation',

  providers: {
    anthropic: createAnthropicProvider({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      defaultModel: 'claude-sonnet-3-5-20241022'
    }),
    // Future: Add OpenAI as fallback
    // openai: createOpenAIProvider({ ... })
  },

  workflows: {
    'content-generation': contentGenerationWorkflow
  },

  // Future: When we agent-ify
  // agents: {
  //   'vocabulary-specialist': vocabularyAgent,
  //   'grammar-specialist': grammarAgent,
  //   'exercise-designer': exerciseAgent
  // }
})
```

### 2.3 Workflow Definition

```typescript
// lib/content-generation/workflows/content-generation.ts
import { Workflow } from '@mastra/core'
import { z } from 'zod'

// Zod schemas for validation
const vocabularySchema = z.object({
  word: z.string(),
  english_translation: z.string(),
  part_of_speech: z.enum(['noun', 'verb', 'adjective', 'adverb', 'other']),
  difficulty_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  example_sentence: z.string(),
  appears_in_reading: z.boolean()
})

const grammarSchema = z.object({
  name: z.string(),
  description: z.string(),
  example_from_reading: z.string(),
  difficulty_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  existing_concept_id: z.string().optional()
})

const exerciseSchema = z.object({
  type: z.enum(['fill-blank', 'multiple-choice', 'translation']),
  prompt: z.string(),
  answer: z.string(),
  distractors: z.array(z.string()).optional(),
  explanation: z.string().optional(),
  xp_value: z.number(),
  vocabulary_used: z.array(z.string()).optional(),
  grammar_used: z.array(z.string()).optional()
})

export const contentGenerationWorkflow = new Workflow({
  name: 'content-generation',
  description: 'Generate lesson content from reading text with human review',

  triggerSchema: z.object({
    lessonId: z.string(),
    readingId: z.string(),
    readingText: z.string(),
    targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    userId: z.string()
  })
})

  // ═══════════════════════════════════════════════════════════
  // VOCABULARY GENERATION
  // ═══════════════════════════════════════════════════════════

  .step('extractVocabulary', {
    description: 'Extract vocabulary items from reading using LLM',
    tool: extractVocabularyTool,
    input: (context) => ({
      readingText: context.trigger.readingText,
      targetLevel: context.trigger.targetLevel,
      maxItems: 20
    })
  })

  .step('validateVocabulary', {
    description: 'Validate against MW API and check existing database',
    tool: validateVocabularyTool,
    input: (context) => ({
      items: context.steps.extractVocabulary.output,
      lessonId: context.trigger.lessonId
    })
  })

  // 🔥 HUMAN CHECKPOINT: Review vocabulary
  .step('reviewVocabulary', {
    description: 'Human review and approval of vocabulary items',
    suspend: true,  // Pause workflow here!
    schema: z.object({
      approved: z.boolean(),
      edited_items: z.array(vocabularySchema).optional(),
      rejection_reason: z.string().optional()
    })
  })

  // ═══════════════════════════════════════════════════════════
  // GRAMMAR GENERATION
  // ═══════════════════════════════════════════════════════════

  .step('identifyGrammar', {
    description: 'Identify grammar concepts in reading',
    tool: identifyGrammarTool,
    input: (context) => ({
      readingText: context.trigger.readingText,
      targetLevel: context.trigger.targetLevel,
      maxConcepts: 5
    }),
    // Only run if vocabulary was approved
    condition: (context) => context.steps.reviewVocabulary.output.approved
  })

  // 🔥 HUMAN CHECKPOINT: Review grammar
  .step('reviewGrammar', {
    description: 'Human review and approval of grammar concepts',
    suspend: true,
    schema: z.object({
      approved: z.boolean(),
      edited_concepts: z.array(grammarSchema).optional(),
      rejection_reason: z.string().optional()
    }),
    condition: (context) => context.steps.identifyGrammar.status === 'completed'
  })

  // ═══════════════════════════════════════════════════════════
  // EXERCISE GENERATION
  // ═══════════════════════════════════════════════════════════

  .step('generateExercises', {
    description: 'Generate practice exercises using vocab + grammar',
    tool: generateExercisesTool,
    input: (context) => ({
      readingText: context.trigger.readingText,
      vocabularyItems: context.steps.reviewVocabulary.output.edited_items ||
                       context.steps.validateVocabulary.output,
      grammarConcepts: context.steps.reviewGrammar.output.edited_concepts ||
                       context.steps.identifyGrammar.output,
      exerciseTypes: ['fill-blank', 'multiple-choice', 'translation'],
      count: 10
    }),
    condition: (context) => context.steps.reviewGrammar.output.approved
  })

  // 🔥 HUMAN CHECKPOINT: Review exercises
  .step('reviewExercises', {
    description: 'Human review and approval of exercises',
    suspend: true,
    schema: z.object({
      approved: z.boolean(),
      edited_exercises: z.array(exerciseSchema).optional(),
      rejection_reason: z.string().optional()
    }),
    condition: (context) => context.steps.generateExercises.status === 'completed'
  })

  // ═══════════════════════════════════════════════════════════
  // DATABASE INSERTION
  // ═══════════════════════════════════════════════════════════

  .step('insertToDatabase', {
    description: 'Insert approved content to database',
    tool: insertContentTool,
    input: (context) => ({
      lessonId: context.trigger.lessonId,
      userId: context.trigger.userId,
      vocabulary: context.steps.reviewVocabulary.output.edited_items ||
                  context.steps.validateVocabulary.output,
      grammar: context.steps.reviewGrammar.output.edited_concepts ||
               context.steps.identifyGrammar.output,
      exercises: context.steps.reviewExercises.output.edited_exercises ||
                 context.steps.generateExercises.output
    }),
    condition: (context) => context.steps.reviewExercises.output.approved
  })

  .commit()
```

### 2.4 Tool Example: Extract Vocabulary

```typescript
// lib/content-generation/tools/extract-vocabulary.ts
import { createTool } from '@mastra/core'
import { z } from 'zod'

const vocabularySchema = z.object({
  word: z.string(),
  english_translation: z.string(),
  part_of_speech: z.enum(['noun', 'verb', 'adjective', 'adverb', 'other']),
  difficulty_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  example_sentence: z.string(),
  appears_in_reading: z.boolean()
})

export const extractVocabularyTool = createTool({
  id: 'extract-vocabulary',
  description: 'Extract vocabulary items from Spanish reading text',

  inputSchema: z.object({
    readingText: z.string(),
    targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    maxItems: z.number().default(20)
  }),

  outputSchema: z.array(vocabularySchema),

  execute: async ({ context, input }) => {
    const { readingText, targetLevel, maxItems } = input

    // Build specialized prompt
    const prompt = buildVocabularyPrompt(readingText, targetLevel, maxItems)

    // Get LLM from context (uses config provider)
    const llm = context.llm('anthropic')

    // Generate with structured output
    const result = await llm.generate({
      prompt,
      schema: z.array(vocabularySchema),
      temperature: 0  // Deterministic for consistency
    })

    // Content grounding: verify words actually in reading
    const verified = result.filter(item =>
      item.appears_in_reading &&
      readingText.toLowerCase().includes(item.word.toLowerCase())
    )

    // Track usage for cost monitoring
    await trackUsage({
      generationType: 'vocabulary',
      tokensUsed: llm.usage?.total_tokens || 0,
      model: 'claude-sonnet-3.5',
      success: true
    })

    return verified
  }
})

function buildVocabularyPrompt(
  readingText: string,
  targetLevel: string,
  maxItems: number
): string {
  return `You are an expert Spanish language teacher. Extract the ${maxItems} most important vocabulary items for a ${targetLevel} student from this reading.

READING TEXT:
${readingText}

EXTRACTION REQUIREMENTS:
1. Words MUST appear in the reading text (verify!)
2. Appropriate difficulty for ${targetLevel} level
3. Prioritize: high-frequency words, thematic keywords, varied parts of speech
4. Include exact example sentence FROM THE READING

OUTPUT FORMAT (JSON array only):
[
  {
    "word": "aventura",
    "english_translation": "adventure",
    "part_of_speech": "noun",
    "difficulty_level": "A2",
    "example_sentence": "La aventura comenzó en la montaña.",
    "appears_in_reading": true
  }
]

CRITICAL: Only include words that actually appear in the reading. Set appears_in_reading to false if uncertain.`
}
```

---

## 3. Phase 2: Agent Specialization (Future)

### 3.1 Evolution Path

**When to agent-ify**: After MVP proves the workflow, when we need:
- Better prompt management per domain
- Agent-specific memory (e.g., remember vocab patterns)
- Specialized tools per agent (e.g., vocabulary agent has MW API tool)
- Different models per specialty (e.g., Claude for vocab, GPT-4 for exercises)

### 3.2 Vocabulary Specialist Agent (Example)

```typescript
// lib/content-generation/agents/vocabulary-specialist.ts
import { Agent } from '@mastra/core'

export const vocabularySpecialistAgent = new Agent({
  name: 'vocabulary-specialist',
  description: 'Expert in extracting and validating Spanish vocabulary for CEFR levels',

  instructions: `You are a Spanish language vocabulary specialist with expertise in:
- CEFR level classification (A1-C2)
- High-frequency word identification
- Part-of-speech tagging
- Context-appropriate example sentences

Your role: Extract pedagogically valuable vocabulary from reading texts.

EXTRACTION PRINCIPLES:
1. Word Selection:
   - Prioritize high-frequency words at target level
   - Include thematic keywords central to reading
   - Balance parts of speech (nouns, verbs, adjectives, adverbs)
   - Avoid proper nouns unless culturally significant

2. CEFR Accuracy:
   - A1/A2: Common daily life vocabulary
   - B1/B2: Abstract concepts, professional contexts
   - C1/C2: Idiomatic, literary, specialized terms

3. Example Sentences:
   - Must be exact quotes from reading
   - Should clearly demonstrate word usage
   - Keep sentences concise (<20 words)

4. Quality Over Quantity:
   - Better to return 15 excellent items than 20 mediocre ones
   - Every word must genuinely aid learning`,

  model: {
    provider: 'anthropic',
    name: 'claude-sonnet-3-5-20241022',
    toolChoice: 'auto'
  },

  // Agent-specific tools
  tools: [
    extractVocabularyTool,
    validateAgainstMerriamWebsterTool,
    checkExistingVocabularyTool
  ],

  // Agent memory (remembers patterns across generations)
  enableMemory: true,
  memoryConfig: {
    // Remember successful vocabulary extractions
    store: 'postgres',
    namespace: 'vocabulary-patterns'
  }
})
```

### 3.3 Workflow with Agents (Future)

```typescript
// Future workflow - agents instead of tools

export const contentGenerationWorkflowV2 = new Workflow({
  name: 'content-generation-v2',
  // ... same trigger schema
})

  // Use agent instead of tool
  .step('extractVocabulary', {
    agent: 'vocabulary-specialist',  // 🔥 Agent!
    input: (context) => ({
      task: 'extract_vocabulary',
      readingText: context.trigger.readingText,
      targetLevel: context.trigger.targetLevel
    })
  })

  .step('reviewVocabulary', {
    suspend: true,
    schema: approvalSchema
  })

  .step('identifyGrammar', {
    agent: 'grammar-specialist',  // 🔥 Agent!
    input: (context) => ({
      task: 'identify_patterns',
      readingText: context.trigger.readingText,
      targetLevel: context.trigger.targetLevel
    }),
    condition: (context) => context.steps.reviewVocabulary.output.approved
  })

  // ... etc
```

**Migration path**: Change `tool` → `agent` in workflow steps. Mastra handles both!

---

## 4. API Implementation

### 4.1 Start Workflow Endpoint

```typescript
// app/api/lessons/[id]/generate-content/route.ts
import { mastra } from '@/lib/content-generation/mastra.config'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse request
  const { readingId, targetLevel } = await req.json()

  // Validate lesson ownership
  const { data: lesson } = await supabase
    .from('lessons')
    .select('author_id')
    .eq('id', params.id)
    .single()

  if (!lesson || lesson.author_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get reading text
  const { data: reading } = await supabase
    .from('library_readings')
    .select('text, title')
    .eq('id', readingId)
    .single()

  if (!reading) {
    return Response.json({ error: 'Reading not found' }, { status: 404 })
  }

  // Validate reading length (prevent timeouts)
  const wordCount = reading.text.split(/\s+/).length
  if (wordCount > 5000) {
    return Response.json({
      error: 'Reading too long. Maximum 5000 words.'
    }, { status: 400 })
  }

  // Start workflow
  const run = await mastra.workflows.run('content-generation', {
    lessonId: params.id,
    readingId,
    readingText: reading.text,
    targetLevel,
    userId: user.id
  })

  // Stream response (Mastra handles SSE automatically!)
  const stream = run.streamVNext()

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

### 4.2 Resume Workflow Endpoint

```typescript
// app/api/lessons/[id]/approve-content/route.ts
import { mastra } from '@/lib/content-generation/mastra.config'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { runId, stepId, approved, editedItems, rejectionReason } = await req.json()

  // Validate runId ownership (check workflow metadata)
  // ... security checks ...

  // Resume workflow from suspended step
  const run = await mastra.workflows.resume(runId, {
    stepId,
    input: {
      approved,
      edited_items: editedItems,
      rejection_reason: rejectionReason
    }
  })

  // Continue streaming
  const stream = run.resumeStreamVNext()

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

---

## 5. Database Schema

```sql
-- supabase/migrations/YYYYMMDD_ai_generation_metadata.sql

-- Add AI metadata columns to existing tables
ALTER TABLE public.vocabulary_items
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

ALTER TABLE public.grammar_concepts
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

-- ai_metadata structure example:
-- {
--   "model": "claude-sonnet-3.5",
--   "workflow_run_id": "wf_abc123",
--   "prompt_version": "v1.0",
--   "generation_timestamp": "2025-01-10T12:00:00Z",
--   "human_edited": false,
--   "confidence_score": 0.95
-- }

-- Usage tracking table
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  lesson_id TEXT REFERENCES public.lessons(id),
  reading_id UUID REFERENCES public.library_readings(id),
  workflow_run_id TEXT NOT NULL,
  generation_type TEXT NOT NULL, -- 'vocabulary', 'grammar', 'exercises'
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  estimated_cost_usd DECIMAL(10, 6),
  duration_seconds INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_logs_user ON ai_generation_logs(user_id);
CREATE INDEX idx_ai_logs_created ON ai_generation_logs(created_at DESC);
CREATE INDEX idx_ai_logs_workflow ON ai_generation_logs(workflow_run_id);

-- RLS policies
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI logs"
  ON public.ai_generation_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert AI logs"
  ON public.ai_generation_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.ai_generation_logs IS 'Tracks all AI content generation attempts for cost monitoring and analytics';
```

---

## 6. Implementation Stories

### Story 7.1: Database Schema + Mastra Setup (3 pts)

**Goal**: Install Mastra, configure providers, create database schema

**Tasks**:
- [ ] Install dependencies: `npm install @mastra/core @mastra/anthropic`
- [ ] Create `lib/content-generation/mastra.config.ts`
- [ ] Add `ANTHROPIC_API_KEY` to `.env`
- [ ] Create database migration for AI metadata
- [ ] Run migration locally + test
- [ ] Create basic project structure (folders)

**Acceptance Criteria**:
- Mastra config file exists and compiles
- Anthropic provider configured
- Database migration runs successfully
- Can import `mastra` instance in API routes

---

### Story 7.2: Extract Vocabulary Tool + Workflow (5 pts)

**Goal**: Build vocabulary extraction tool and basic workflow

**Tasks**:
- [ ] Create `extract-vocabulary.ts` tool with Zod schemas
- [ ] Implement LLM call with structured output
- [ ] Add content grounding validation
- [ ] Create basic workflow with vocabulary step only
- [ ] Add usage tracking helper
- [ ] Unit tests for tool (mocked LLM)

**Acceptance Criteria**:
- Tool extracts 15-20 vocabulary items
- All items verified to appear in reading
- Returns valid JSON matching schema
- Workflow compiles and runs
- Usage tracking logs to console

---

### Story 7.3: Vocabulary Review + Resume Flow (5 pts)

**Goal**: Add suspend/resume checkpoint for vocabulary review

**Tasks**:
- [ ] Add `reviewVocabulary` suspend step to workflow
- [ ] Create `POST /api/lessons/[id]/generate-content` endpoint
- [ ] Create `POST /api/lessons/[id]/approve-content` endpoint
- [ ] Implement streaming response handling
- [ ] Create `VocabularyReviewModal.tsx` component
- [ ] Wire up approve/reject actions
- [ ] Test full suspend → approve → resume flow

**Acceptance Criteria**:
- Workflow suspends at vocabulary review
- UI shows vocabulary items with checkboxes
- User can approve/edit/reject
- Workflow resumes after approval
- State persists across browser refresh

---

### Story 7.4: Grammar + Exercise Tools (5 pts)

**Goal**: Add grammar and exercise generation tools

**Tasks**:
- [ ] Create `identify-grammar.ts` tool
- [ ] Create `generate-exercises.ts` tool
- [ ] Add Supabase integration to check existing grammar concepts
- [ ] Add grammar + exercise steps to workflow
- [ ] Add suspend steps for both
- [ ] Unit tests for both tools

**Acceptance Criteria**:
- Grammar tool identifies 4-6 concepts
- Links to existing grammar_concepts when possible
- Exercise tool generates 10 exercises (mixed types)
- Exercises use vocabulary + grammar from lesson

---

### Story 7.5: Complete Review UI (4 pts)

**Goal**: Build review modals for grammar and exercises

**Tasks**:
- [ ] Create `GrammarReviewModal.tsx`
- [ ] Create `ExerciseReviewModal.tsx`
- [ ] Create `GenerationProgressModal.tsx` (streaming indicator)
- [ ] Add inline editing capability
- [ ] Add "AI-generated" badges
- [ ] Wire up to approve endpoints
- [ ] Add error states with retry

**Acceptance Criteria**:
- All three modals render correctly
- User can edit items inline before approving
- Progress modal shows current step
- Error states display user-friendly messages
- Mobile responsive

---

### Story 7.6: Database Insertion + Cost Tracking (3 pts)

**Goal**: Insert approved content to database with AI metadata

**Tasks**:
- [ ] Create `insert-content.ts` tool
- [ ] Insert vocabulary with `ai_generated=true` + metadata
- [ ] Insert grammar concepts (or link existing)
- [ ] Insert exercises
- [ ] Log to `ai_generation_logs` table
- [ ] Calculate and track estimated cost
- [ ] Integration test full workflow → DB

**Acceptance Criteria**:
- All approved content inserted to DB
- AI metadata includes model, run_id, timestamp
- Generation log created with token counts
- Cost estimation accurate
- RLS policies enforced

---

### Story 7.7: Error Handling + Rate Limiting (2 pts)

**Goal**: Production-ready error handling and rate limiting

**Tasks**:
- [ ] Add timeout handling (30 seconds per step)
- [ ] Add retry logic for transient failures
- [ ] Implement rate limiting (10 requests/hour/user)
- [ ] Add fallback to OpenAI if Anthropic fails
- [ ] User-friendly error messages
- [ ] Error logging to Supabase

**Acceptance Criteria**:
- Workflow doesn't hang on LLM timeout
- Rate limit enforced at API level
- Fallback provider works
- Errors logged for debugging
- User sees clear error messages

---

### Story 7.8: Testing + Documentation (3 pts)

**Goal**: Comprehensive tests and developer docs

**Tasks**:
- [ ] Unit tests for all tools (mocked LLM)
- [ ] Integration test: full workflow with mock suspend
- [ ] E2E test: generate → approve → insert (Playwright)
- [ ] Document Mastra patterns in `/docs/architecture`
- [ ] Add JSDoc comments to all tools
- [ ] Create troubleshooting guide

**Acceptance Criteria**:
- >80% test coverage for tools
- Integration test passes
- E2E test validates full flow
- Docs explain Mastra workflow patterns
- Troubleshooting guide covers common errors

---

## 7. Success Metrics

**MVP Complete When**:
- ✅ Author generates 18+ vocabulary items in <30 seconds
- ✅ Author generates 5+ grammar concepts in <30 seconds
- ✅ Author generates 10 exercises in <45 seconds
- ✅ >90% of generated content passes validation
- ✅ >70% of items approved by authors (quality threshold)
- ✅ Workflow state persists across browser refresh
- ✅ All AI content marked with metadata
- ✅ Cost tracking logs every generation

**Technical Requirements**:
- ✅ Rate limiting: 10 generations/hour/user
- ✅ Timeout: 30 seconds per workflow step
- ✅ Fallback: OpenAI if Anthropic unavailable
- ✅ Error recovery: Retry transient failures 3x
- ✅ Streaming: Real-time progress updates

---

## 8. Cost Estimates

**Per Generation** (Claude Sonnet 3.5 - $3/1M input, $15/1M output):

| Generation Type | Avg Tokens | Cost/Request |
|-----------------|------------|--------------|
| Vocabulary      | 3,000      | $0.012       |
| Grammar         | 2,500      | $0.010       |
| Exercises       | 4,000      | $0.018       |
| **Total**       | **9,500**  | **$0.040**   |

**Monthly Budget** (100 authors, 20 generations/week):
- 100 authors × 20 generations/week × 4 weeks = 8,000 generations/month
- 8,000 × $0.040 = **$320/month**
- With 50% buffer: **$480/month**

**ROI**: Saves 2+ hours manual content creation per lesson → $30-60/hour value

---

## 9. Future Enhancements (Post-MVP)

**Phase 2: Agent Specialization**
- Vocabulary Specialist Agent with historical patterns memory
- Grammar Specialist Agent with CEFR rules database
- Exercise Designer Agent with pedagogical patterns

**Phase 3: Advanced Features**
- Dialog generation from reading themes
- Adaptive difficulty (learns author preferences)
- Bulk generation (entire course from reading list)
- Multi-language support (French, German, Italian)
- Custom prompt templates per author
- Quality scoring with confidence levels

---

**Document Status**: ✅ Ready for Story Creation
**Next Step**: Create GitHub issues for Stories 7.1-7.8
**Estimated Total**: 30 story points (~48 hours)
