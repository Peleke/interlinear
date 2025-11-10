# Epic 7: Agent-Based Content Generation Architecture

**Status**: 🏗️ Architecture Design
**Date**: 2025-01-10
**Architect**: System Design Analysis
**Supersedes**: Original Epic 7 raw LLM design

---

## Executive Summary

**Critical Decision**: Use **LangGraph agent framework** with **tool-based architecture** instead of raw LLM API calls.

**Why This Matters**:
- ✅ **Stateful workflows**: Multi-step generation with context preservation
- ✅ **Tool composition**: Reusable, testable components
- ✅ **Human-in-the-loop**: Natural checkpoints for review
- ✅ **Streaming support**: Real-time progress updates
- ✅ **Error recovery**: Built-in retry and fallback patterns
- ✅ **Future extensibility**: Easy to add new generation types

**Risk Mitigation**: Getting the architecture wrong means rewriting everything. This design locks in:
1. LangGraph state machine patterns (already used for AI Tutor)
2. Tool-based composition (matches existing `lib/tutor-tools.ts` patterns)
3. Anthropic Claude + OpenAI fallback (cost optimization)
4. Interactive checkpoints (human approval before DB insertion)

---

## 1. Architecture Analysis

### Current State (AI Tutor Implementation)
**File**: `lib/tutor-tools.ts` (existing)

```typescript
// Existing pattern: LangChain tools with structured outputs
import { tool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'

export const analyzeErrorsTool = tool(
  async ({ sessionId }) => {
    const supabase = await createClient()
    // ... Supabase queries ...

    const model = new ChatOpenAI({ model: "gpt-4o" })
      .withStructuredOutput(ErrorAnalysisOutputSchema)

    const result = await retryWithBackoff(() =>
      invokeWithTimeout(model.invoke([...]), 30000)
    )
    return result
  },
  {
    name: "analyze_errors",
    description: "Analyze conversation for errors",
    schema: AnalyzeErrorsSchema
  }
)
```

**Key Patterns Already Established**:
- ✅ Zod schemas for input validation
- ✅ `.withStructuredOutput()` for guaranteed JSON
- ✅ `retryWithBackoff` + `invokeWithTimeout` for resilience
- ✅ Direct Supabase integration within tools
- ✅ Typed returns

### Dependencies Available
```json
{
  "@langchain/core": "^0.3.0",        // ✅ Tools, prompts, schemas
  "@langchain/langgraph": "^0.2.0",   // ✅ Stateful agent graphs
  "@langchain/openai": "^0.3.0",      // ✅ GPT-4 integration
  "langchain": "^0.3.0",              // ✅ Main package
  "zod": "^3.22.0"                    // ✅ Schema validation
}
```

**Missing (to add)**:
```json
{
  "@langchain/anthropic": "^0.3.0"   // ❌ Need for Claude Sonnet 3.5
}
```

---

## 2. Recommended Framework Stack

### Core Architecture: LangGraph Agent

**Why LangGraph over raw LLM calls**:

| Feature | Raw LLM Calls | LangGraph Agent |
|---------|--------------|-----------------|
| State management | Manual `let state = {}` | Built-in state reducer |
| Tool orchestration | Manual if/else | Agent decides tool usage |
| Human checkpoints | Custom async logic | Native `interrupt_before` |
| Streaming | Complex SSE setup | Built-in `.stream()` |
| Error recovery | Custom retry logic | Graph-level error handling |
| Testing | Mock entire LLM | Mock individual tools |
| Debugging | Black box | Visual graph inspection |

**LangGraph State Machine Pattern**:
```
┌──────────────────────────────────────────────────────┐
│              Content Generation Graph                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  START                                               │
│    ↓                                                 │
│  [Analyze Reading]  ← Tool: analyzeReadingTool      │
│    ↓                                                 │
│  [Extract Vocab]    ← Tool: extractVocabularyTool   │
│    ↓                                                 │
│  ⚠️ CHECKPOINT: Review vocabulary (human approval)   │
│    ↓                                                 │
│  [Validate Vocab]   ← Tool: validateVocabularyTool  │
│    ↓                                                 │
│  [Identify Grammar] ← Tool: identifyGrammarTool     │
│    ↓                                                 │
│  ⚠️ CHECKPOINT: Review grammar (human approval)      │
│    ↓                                                 │
│  [Generate Exercises] ← Tool: generateExercisesTool │
│    ↓                                                 │
│  ⚠️ CHECKPOINT: Review exercises (human approval)    │
│    ↓                                                 │
│  [Insert to DB]    ← Tool: insertContentTool        │
│    ↓                                                 │
│  END                                                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 3. Agent Workflow Design

### 3.1 State Schema

```typescript
import { Annotation } from '@langchain/langgraph'
import { z } from 'zod'

// LangGraph state definition
const ContentGenerationState = Annotation.Root({
  // Input
  lessonId: Annotation<string>(),
  readingId: Annotation<string>(),
  readingText: Annotation<string>(),
  targetLevel: Annotation<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>(),
  generationTypes: Annotation<('vocabulary' | 'grammar' | 'exercises')[]>(),

  // Agent state
  currentStep: Annotation<string>(),
  errors: Annotation<string[]>({ default: () => [] }),

  // Generated content (accumulates)
  vocabularyItems: Annotation<VocabularyItem[]>({ default: () => [] }),
  grammarConcepts: Annotation<GrammarConcept[]>({ default: () => [] }),
  exercises: Annotation<Exercise[]>({ default: () => [] }),

  // Metadata
  tokensUsed: Annotation<number>({ default: () => 0 }),
  estimatedCost: Annotation<number>({ default: () => 0 }),

  // Human review
  vocabularyApproved: Annotation<boolean>({ default: () => false }),
  grammarApproved: Annotation<boolean>({ default: () => false }),
  exercisesApproved: Annotation<boolean>({ default: () => false }),
})

type ContentGenerationStateType = typeof ContentGenerationState.State
```

### 3.2 Graph Definition

```typescript
import { StateGraph, END } from '@langchain/langgraph'

// Create graph
const graph = new StateGraph(ContentGenerationState)

// Add nodes (each node is a tool or decision point)
graph.addNode('analyzeReading', analyzeReadingNode)
graph.addNode('extractVocabulary', extractVocabularyNode)
graph.addNode('reviewVocabulary', reviewVocabularyNode)  // Human checkpoint
graph.addNode('validateVocabulary', validateVocabularyNode)
graph.addNode('identifyGrammar', identifyGrammarNode)
graph.addNode('reviewGrammar', reviewGrammarNode)        // Human checkpoint
graph.addNode('generateExercises', generateExercisesNode)
graph.addNode('reviewExercises', reviewExercisesNode)    // Human checkpoint
graph.addNode('insertToDatabase', insertToDatabaseNode)

// Define edges (workflow)
graph.setEntryPoint('analyzeReading')
graph.addEdge('analyzeReading', 'extractVocabulary')
graph.addEdge('extractVocabulary', 'reviewVocabulary')

// Conditional: Wait for human approval
graph.addConditionalEdges(
  'reviewVocabulary',
  (state) => state.vocabularyApproved ? 'validateVocabulary' : END,
  { validateVocabulary: 'validateVocabulary', __end__: END }
)

graph.addEdge('validateVocabulary', 'identifyGrammar')
graph.addEdge('identifyGrammar', 'reviewGrammar')

graph.addConditionalEdges(
  'reviewGrammar',
  (state) => state.grammarApproved ? 'generateExercises' : END,
  { generateExercises: 'generateExercises', __end__: END }
)

graph.addEdge('generateExercises', 'reviewExercises')

graph.addConditionalEdges(
  'reviewExercises',
  (state) => state.exercisesApproved ? 'insertToDatabase' : END,
  { insertToDatabase: 'insertToDatabase', __end__: END }
)

graph.addEdge('insertToDatabase', END)

// Compile with checkpoints for human-in-the-loop
const app = graph.compile({
  checkpointer: new MemorySaver(),  // Or PostgreSQL checkpointer
  interruptBefore: ['reviewVocabulary', 'reviewGrammar', 'reviewExercises']
})
```

---

## 4. Tool Architecture

### 4.1 Tool Definitions

**File structure**:
```
lib/
├── content-generation/
│   ├── tools/
│   │   ├── analyze-reading.ts         // Reading analysis
│   │   ├── extract-vocabulary.ts      // Vocab extraction
│   │   ├── validate-vocabulary.ts     // Check against MW API, DB
│   │   ├── identify-grammar.ts        // Grammar pattern detection
│   │   ├── generate-exercises.ts      // Exercise generation
│   │   └── insert-content.ts          // Database insertion
│   ├── graph.ts                       // LangGraph definition
│   ├── state.ts                       // State schema
│   └── nodes.ts                       // Node implementations
└── services/
    └── llm-provider.ts                // Provider abstraction
```

### 4.2 Example Tool: Extract Vocabulary

```typescript
// lib/content-generation/tools/extract-vocabulary.ts
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { ChatAnthropic } from '@langchain/anthropic'

const ExtractVocabularySchema = z.object({
  readingText: z.string(),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  maxItems: z.number().default(20)
})

const VocabularyItemSchema = z.object({
  word: z.string(),
  english_translation: z.string(),
  part_of_speech: z.enum(['noun', 'verb', 'adjective', 'adverb', 'other']),
  difficulty_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  example_sentence: z.string(),
  appears_in_reading: z.boolean()
})

export const extractVocabularyTool = tool(
  async ({ readingText, targetLevel, maxItems }) => {
    const model = new ChatAnthropic({
      model: 'claude-sonnet-3-5-20241022',
      temperature: 0
    }).withStructuredOutput(z.array(VocabularyItemSchema))

    const prompt = `You are an expert Spanish language teacher. Extract the ${maxItems} most important vocabulary items for a ${targetLevel} student from this reading.

READING:
${readingText}

REQUIREMENTS:
1. Words MUST appear in the reading (verify!)
2. Appropriate for ${targetLevel} difficulty
3. Prioritize high-frequency and thematic keywords
4. Include exact example sentence from reading
5. Return ONLY valid JSON array

Each item format:
{
  "word": "casa",
  "english_translation": "house",
  "part_of_speech": "noun",
  "difficulty_level": "A1",
  "example_sentence": "Mi casa es grande.",
  "appears_in_reading": true
}`

    const result = await retryWithBackoff(async () => {
      return await invokeWithTimeout(
        model.invoke([{ role: 'user', content: prompt }]),
        30000
      )
    })

    // Content grounding: Verify words actually appear
    const verified = result.filter(item =>
      item.appears_in_reading &&
      readingText.toLowerCase().includes(item.word.toLowerCase())
    )

    return {
      items: verified,
      tokensUsed: result.usage?.total_tokens || 0
    }
  },
  {
    name: 'extract_vocabulary',
    description: 'Extract vocabulary items from Spanish reading text',
    schema: ExtractVocabularySchema
  }
)
```

### 4.3 Tool: Validate Vocabulary

```typescript
// lib/content-generation/tools/validate-vocabulary.ts
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const ValidateVocabularySchema = z.object({
  items: z.array(z.object({
    word: z.string(),
    english_translation: z.string()
  }))
})

export const validateVocabularyTool = tool(
  async ({ items }) => {
    const supabase = await createClient()
    const validated = []

    for (const item of items) {
      // Check if exists in vocabulary_items table
      const { data: existing } = await supabase
        .from('vocabulary_items')
        .select('id, usage_count')
        .eq('word', item.word)
        .single()

      // Check Merriam-Webster API for validation
      const mwData = await fetchMerriamWebsterData(item.word)

      validated.push({
        ...item,
        existing_id: existing?.id || null,
        usage_count: existing?.usage_count || 0,
        mw_verified: !!mwData,
        is_new: !existing
      })
    }

    return { validated }
  },
  {
    name: 'validate_vocabulary',
    description: 'Validate vocabulary against database and Merriam-Webster API',
    schema: ValidateVocabularySchema
  }
)
```

### 4.4 Tool: Identify Grammar

```typescript
// lib/content-generation/tools/identify-grammar.ts
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { ChatAnthropic } from '@langchain/anthropic'
import { createClient } from '@/lib/supabase/server'

const IdentifyGrammarSchema = z.object({
  readingText: z.string(),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  maxConcepts: z.number().default(5)
})

const GrammarConceptSchema = z.object({
  name: z.string(),
  description: z.string(),
  example_from_reading: z.string(),
  difficulty_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
})

export const identifyGrammarTool = tool(
  async ({ readingText, targetLevel, maxConcepts }) => {
    const model = new ChatAnthropic({
      model: 'claude-sonnet-3-5-20241022',
      temperature: 0
    }).withStructuredOutput(z.array(GrammarConceptSchema))

    const prompt = `Identify the ${maxConcepts} most prominent grammar concepts in this Spanish reading for ${targetLevel} students.

READING:
${readingText}

Focus on:
- Verb tenses and conjugations
- Sentence structures
- Pronoun usage
- Agreement patterns

Return exact examples from the reading.`

    const concepts = await retryWithBackoff(async () => {
      return await invokeWithTimeout(
        model.invoke([{ role: 'user', content: prompt }]),
        30000
      )
    })

    // Check if concepts exist in grammar_concepts table
    const supabase = await createClient()
    const enriched = await Promise.all(
      concepts.map(async (concept) => {
        const { data: existing } = await supabase
          .from('grammar_concepts')
          .select('id, name')
          .ilike('name', `%${concept.name}%`)
          .limit(1)
          .single()

        return {
          ...concept,
          existing_concept_id: existing?.id || null,
          is_new: !existing
        }
      })
    )

    return { concepts: enriched }
  },
  {
    name: 'identify_grammar',
    description: 'Identify grammar concepts from reading text',
    schema: IdentifyGrammarSchema
  }
)
```

---

## 5. Interactive Review Integration

### 5.1 API Endpoint Design

**Endpoint**: `POST /api/lessons/[id]/generate-content`

**Flow**:
```typescript
// app/api/lessons/[id]/generate-content/route.ts
import { app } from '@/lib/content-generation/graph'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json()
  const { readingId, generationTypes, targetLevel } = body

  // Initialize graph with state
  const config = {
    configurable: {
      thread_id: `lesson-${params.id}-${Date.now()}`
    }
  }

  // Stream graph execution
  const stream = await app.stream({
    lessonId: params.id,
    readingId,
    targetLevel,
    generationTypes
  }, config)

  // Return SSE stream
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const data = `data: ${JSON.stringify(chunk)}\n\n`
        controller.enqueue(encoder.encode(data))
      }
      controller.close()
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

### 5.2 Resume After Human Review

**Endpoint**: `POST /api/lessons/[id]/approve-content`

```typescript
// app/api/lessons/[id]/approve-content/route.ts
import { app } from '@/lib/content-generation/graph'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { threadId, approvalType, approved } = await req.json()

  const config = {
    configurable: { thread_id: threadId }
  }

  // Update state with approval
  await app.updateState(config, {
    [`${approvalType}Approved`]: approved
  })

  // Resume graph execution
  const stream = await app.stream(null, config)

  // Continue streaming...
}
```

### 5.3 Frontend Integration

```typescript
// components/authoring/ContentGenerationFlow.tsx
'use client'

import { useState } from 'react'

export function ContentGenerationFlow({ lessonId, readingId }) {
  const [state, setState] = useState<'idle' | 'generating' | 'reviewing'>('idle')
  const [threadId, setThreadId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [vocabularyItems, setVocabularyItems] = useState([])

  async function startGeneration() {
    setState('generating')

    const response = await fetch(`/api/lessons/${lessonId}/generate-content`, {
      method: 'POST',
      body: JSON.stringify({
        readingId,
        generationTypes: ['vocabulary', 'grammar', 'exercises'],
        targetLevel: 'B1'
      })
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))

          // Update UI based on graph state
          if (data.currentStep === 'reviewVocabulary') {
            setState('reviewing')
            setVocabularyItems(data.vocabularyItems)
            setThreadId(data.configurable.thread_id)
          }
        }
      }
    }
  }

  async function approveVocabulary(approved: boolean) {
    const response = await fetch(`/api/lessons/${lessonId}/approve-content`, {
      method: 'POST',
      body: JSON.stringify({
        threadId,
        approvalType: 'vocabulary',
        approved
      })
    })

    // Resume streaming...
    setState('generating')
  }

  return (
    <div>
      {state === 'idle' && (
        <button onClick={startGeneration}>
          🤖 Generate Content from Reading
        </button>
      )}

      {state === 'generating' && (
        <div>
          <p>⏳ {currentStep}...</p>
        </div>
      )}

      {state === 'reviewing' && (
        <VocabularyReviewModal
          items={vocabularyItems}
          onApprove={() => approveVocabulary(true)}
          onReject={() => approveVocabulary(false)}
        />
      )}
    </div>
  )
}
```

---

## 6. LLM Provider Strategy

### 6.1 Provider Selection

```typescript
// lib/services/llm-provider.ts
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatOpenAI } from '@langchain/openai'

export function getModel(task: 'vocabulary' | 'grammar' | 'exercises') {
  const providers = {
    vocabulary: {
      primary: () => new ChatAnthropic({
        model: 'claude-sonnet-3-5-20241022',
        temperature: 0
      }),
      fallback: () => new ChatOpenAI({
        model: 'gpt-4o',
        temperature: 0
      }),
      reason: 'Claude superior for structured extraction'
    },
    grammar: {
      primary: () => new ChatAnthropic({
        model: 'claude-sonnet-3-5-20241022',
        temperature: 0
      }),
      fallback: () => new ChatOpenAI({
        model: 'gpt-4o',
        temperature: 0
      }),
      reason: 'Claude better multilingual understanding'
    },
    exercises: {
      primary: () => new ChatOpenAI({
        model: 'gpt-4o',
        temperature: 0.3
      }),
      fallback: () => new ChatAnthropic({
        model: 'claude-sonnet-3-5-20241022',
        temperature: 0.3
      }),
      reason: 'GPT-4 more creative for exercise generation'
    }
  }

  return providers[task]
}

export async function invokeWithFallback(task: string, invoke: () => Promise<any>) {
  const { primary, fallback } = getModel(task)

  try {
    return await invoke(primary())
  } catch (error) {
    if (isRateLimitError(error) || isProviderError(error)) {
      console.warn(`Primary provider failed, falling back...`)
      return await invoke(fallback())
    }
    throw error
  }
}
```

### 6.2 Cost Tracking

```typescript
// lib/content-generation/tools/track-usage.ts
import { createClient } from '@/lib/supabase/server'

export async function trackUsage({
  userId,
  lessonId,
  readingId,
  generationType,
  model,
  promptTokens,
  completionTokens,
  success,
  error
}: UsageMetrics) {
  const supabase = await createClient()

  const totalTokens = promptTokens + completionTokens
  const cost = calculateCost(model, promptTokens, completionTokens)

  await supabase.from('ai_generation_logs').insert({
    user_id: userId,
    lesson_id: lessonId,
    reading_id: readingId,
    generation_type: generationType,
    model,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    estimated_cost_usd: cost,
    success,
    error_message: error?.message
  })

  return { totalTokens, cost }
}

function calculateCost(model: string, input: number, output: number): number {
  const pricing = {
    'claude-sonnet-3-5-20241022': {
      input: 3 / 1_000_000,    // $3 per 1M tokens
      output: 15 / 1_000_000   // $15 per 1M tokens
    },
    'gpt-4o': {
      input: 2.50 / 1_000_000,
      output: 10 / 1_000_000
    }
  }

  const rates = pricing[model]
  return (input * rates.input) + (output * rates.output)
}
```

---

## 7. Error Recovery Patterns

### 7.1 Retry with Exponential Backoff

```typescript
// lib/utils/retry.ts (already exists in tutor-tools.ts)
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error

      const delay = baseDelay * Math.pow(2, i)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}
```

### 7.2 Timeout Handling

```typescript
// lib/utils/timeout.ts (already exists)
export async function invokeWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
  })

  return Promise.race([promise, timeout])
}
```

### 7.3 Graph-Level Error Handling

```typescript
// lib/content-generation/graph.ts
const graph = new StateGraph(ContentGenerationState)

// Add error node
graph.addNode('handleError', async (state) => {
  console.error('Generation failed:', state.errors)

  // Log to database
  await trackUsage({
    ...state,
    success: false,
    error: state.errors[state.errors.length - 1]
  })

  return { currentStep: 'error' }
})

// Conditional error routing
graph.addConditionalEdges(
  'extractVocabulary',
  (state) => {
    if (state.errors.length > 0) return 'handleError'
    return 'reviewVocabulary'
  }
)
```

---

## 8. Migration from Original Epic 7 Design

### What Changes

| Original Design | New Agent Design | Reason |
|----------------|------------------|--------|
| `LLMService` class | LangGraph tools | Better composition, testability |
| Manual state management | LangGraph state | Built-in persistence, checkpoints |
| Custom streaming | LangGraph `.stream()` | Native support, simpler |
| Manual retry logic | Tool-level retries | Isolated failure handling |
| Custom review flow | Graph interrupts | Native human-in-the-loop |
| Single generation endpoint | Resumable endpoints | Support for pausing/resuming |

### What Stays the Same

✅ Database schema (ai_generation_logs, ai_metadata columns)
✅ Zod validation schemas
✅ Cost tracking requirements
✅ Rate limiting strategy
✅ Review UI components (just different API contract)
✅ Content grounding validation

### New Files

```
lib/content-generation/
├── tools/
│   ├── analyze-reading.ts       # NEW
│   ├── extract-vocabulary.ts    # NEW (replaces LLMService.generateVocabulary)
│   ├── validate-vocabulary.ts   # NEW
│   ├── identify-grammar.ts      # NEW (replaces LLMService.generateGrammar)
│   ├── generate-exercises.ts    # NEW (replaces LLMService.generateExercises)
│   └── insert-content.ts        # NEW
├── graph.ts                     # NEW (orchestration)
├── state.ts                     # NEW (state schema)
└── nodes.ts                     # NEW (node implementations)

app/api/lessons/[id]/
├── generate-content/
│   └── route.ts                 # MODIFIED (streaming)
└── approve-content/
    └── route.ts                 # NEW (resume after review)
```

---

## 9. Implementation Phases

### Phase 1: Foundation (5 pts, ~8 hours)
- [ ] Install `@langchain/anthropic`
- [ ] Create state schema + types
- [ ] Implement 3 core tools (vocabulary, grammar, exercises)
- [ ] Create basic graph (no checkpoints yet)
- [ ] Unit tests for each tool

### Phase 2: Graph Orchestration (3 pts, ~5 hours)
- [ ] Add human-in-the-loop checkpoints
- [ ] Implement state persistence
- [ ] Add conditional routing
- [ ] Error handling nodes

### Phase 3: API Integration (4 pts, ~6 hours)
- [ ] Streaming endpoint
- [ ] Resume endpoint
- [ ] Rate limiting middleware
- [ ] Cost tracking integration

### Phase 4: UI Components (5 pts, ~8 hours)
- [ ] GenerationProgressIndicator
- [ ] VocabularyReviewModal (with approve/reject)
- [ ] GrammarReviewModal
- [ ] ExerciseReviewModal

### Phase 5: Testing & Refinement (3 pts, ~5 hours)
- [ ] Integration tests with mocked LLM
- [ ] E2E test full generation flow
- [ ] Cost tracking validation
- [ ] Performance optimization

**Total**: 20 story points (~32 hours)

---

## 10. Success Criteria

**Architecture validation**:
- ✅ Graph compiles without errors
- ✅ Tools can be tested independently
- ✅ State persists across interrupts
- ✅ Streaming works in real-time
- ✅ Human review pauses/resumes correctly

**Functional requirements** (from epic):
- ✅ Generate 20 vocab items in <30 seconds
- ✅ Generate 5 grammar concepts in <30 seconds
- ✅ Generate 10 exercises in <45 seconds
- ✅ >90% validation pass rate
- ✅ >70% author approval rate

**Technical requirements**:
- ✅ Cost tracking every generation
- ✅ Rate limiting (10 req/hr/user)
- ✅ Fallback to OpenAI on Anthropic failure
- ✅ All AI content marked with metadata

---

## 11. Risk Assessment

### High Risk ✅ MITIGATED

**Risk**: LangGraph learning curve slows development
**Mitigation**: Team already uses LangGraph for AI Tutor, patterns established

**Risk**: Agent makes wrong tool decisions
**Mitigation**: Deterministic graph (no tool-calling agent), fixed workflow

### Medium Risk ⚠️ MONITOR

**Risk**: Checkpoint persistence adds complexity
**Mitigation**: Start with MemorySaver, migrate to PostgreSQL if needed

**Risk**: Streaming + checkpoints interaction unclear
**Mitigation**: Prototype early, validate UX flow

### Low Risk ✅ ACCEPTABLE

**Risk**: Cost overruns from Claude
**Mitigation**: Rate limiting + fallback to GPT-4 + budget alerts

---

## 12. Next Steps

**Approval Required**:
1. ✅ Confirm LangGraph agent approach vs raw LLM
2. ✅ Confirm Anthropic Claude as primary provider
3. ✅ Confirm interactive checkpoints (vs background generation)
4. ✅ Confirm streaming SSE approach

**Once Approved**:
1. Create GitHub issues for 5 implementation phases
2. Update Epic 7 doc with agent architecture reference
3. Start Phase 1: Foundation (tools + state)

---

**Document Status**: 🟡 Draft - Awaiting Approval
**Last Updated**: 2025-01-10
**Supersedes**: docs/prd/epic-7-llm-content-generation.md (raw LLM design)
