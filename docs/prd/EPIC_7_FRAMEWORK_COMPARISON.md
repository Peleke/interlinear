# Epic 7: Agent Framework Decision - Mastra vs LangGraph

**Status**: 🤔 Architecture Decision Needed
**Date**: 2025-01-10
**Context**: Choosing agent framework for LLM content generation

---

## TL;DR - Quick Comparison

| Criterion | Mastra | LangGraph | Winner |
|-----------|--------|-----------|--------|
| **TypeScript-first** | ✅ Native | ⚠️ Port from Python | **Mastra** |
| **Human-in-the-loop** | ✅ Built-in suspend/resume | ⚠️ Manual checkpoints | **Mastra** |
| **Streaming** | ✅ streamVNext() native | ⚠️ Custom SSE | **Mastra** |
| **Learning curve** | ✅ Simpler API | ⚠️ Complex state graphs | **Mastra** |
| **Existing usage** | ❌ New to project | ✅ Already used (AI Tutor) | **LangGraph** |
| **Maturity** | ⚠️ Newer (2024?) | ✅ Established | **LangGraph** |
| **Observability** | ✅ Built-in dashboard | ⚠️ Manual logging | **Mastra** |
| **Provider flexibility** | ✅ Multi-provider | ✅ Multi-provider | **Tie** |

**Recommendation**: **Mastra** - Better fit for this specific use case, despite mixing frameworks

---

## 1. The Core Problem

**What we're building**:
```
Reading Text
    ↓
[LLM Agent generates vocabulary]
    ↓
⚠️ HUMAN REVIEW (approve/edit/reject)
    ↓
[LLM Agent generates grammar]
    ↓
⚠️ HUMAN REVIEW
    ↓
[LLM Agent generates exercises]
    ↓
⚠️ HUMAN REVIEW
    ↓
Insert to Database
```

**Critical requirements**:
1. **Human checkpoints**: Must pause workflow, wait for approval, then resume
2. **Streaming**: Show real-time progress to user
3. **State persistence**: Resume from checkpoint even after browser refresh
4. **Tool composition**: Extract vocab, validate, identify grammar as discrete tools
5. **Error recovery**: Retry failed steps without restarting entire flow

---

## 2. Mastra Architecture Analysis

### 2.1 Core Concepts

```typescript
import { Mastra, Workflow, Agent, createTool } from '@mastra/core'
import { z } from 'zod'

// 1. Define tools (exactly what we need!)
const extractVocabularyTool = createTool({
  id: 'extract-vocabulary',
  description: 'Extract vocabulary from Spanish reading',
  inputSchema: z.object({
    readingText: z.string(),
    targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    maxItems: z.number().default(20)
  }),
  outputSchema: z.array(z.object({
    word: z.string(),
    english_translation: z.string(),
    part_of_speech: z.string(),
    difficulty_level: z.string(),
    example_sentence: z.string()
  })),
  execute: async ({ context }) => {
    const { readingText, targetLevel, maxItems } = context

    // Call Claude/GPT with structured output
    const llm = context.llm('anthropic', { model: 'claude-sonnet-3.5' })
    const result = await llm.generate({
      prompt: buildVocabularyPrompt(readingText, targetLevel, maxItems),
      schema: vocabularySchema
    })

    return result.items
  }
})

// 2. Define workflow with human checkpoints
const contentGenerationWorkflow = new Workflow({
  name: 'content-generation',
  triggerSchema: z.object({
    lessonId: z.string(),
    readingId: z.string(),
    readingText: z.string(),
    targetLevel: z.string()
  })
})
  .step('extractVocabulary', {
    tool: extractVocabularyTool
  })
  .step('reviewVocabulary', {
    // 🔥 THIS IS THE MAGIC - Built-in suspend for human review
    suspend: true,
    schema: z.object({
      approved: z.boolean(),
      edited_items: z.array(vocabularySchema).optional()
    })
  })
  .step('identifyGrammar', {
    tool: identifyGrammarTool,
    condition: (context) => context.steps.reviewVocabulary.approved
  })
  .step('reviewGrammar', {
    suspend: true,
    schema: z.object({
      approved: z.boolean(),
      edited_concepts: z.array(grammarSchema).optional()
    })
  })
  .step('generateExercises', {
    tool: generateExercisesTool,
    condition: (context) => context.steps.reviewGrammar.approved
  })
  .step('reviewExercises', {
    suspend: true,
    schema: z.object({
      approved: z.boolean(),
      edited_exercises: z.array(exerciseSchema).optional()
    })
  })
  .step('insertToDatabase', {
    tool: insertContentTool,
    condition: (context) => context.steps.reviewExercises.approved
  })
  .commit()
```

### 2.2 Streaming Implementation

```typescript
// app/api/lessons/[id]/generate/route.ts
import { mastra } from '@/lib/mastra'

export async function POST(req: Request, { params }) {
  const { readingId, readingText, targetLevel } = await req.json()

  // Start workflow with streaming
  const run = await mastra.workflows.run('content-generation', {
    lessonId: params.id,
    readingId,
    readingText,
    targetLevel
  })

  // 🔥 Built-in streaming API
  const stream = run.streamVNext()

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  })
}
```

### 2.3 Human Review & Resume

```typescript
// app/api/lessons/[id]/approve/route.ts
import { mastra } from '@/lib/mastra'

export async function POST(req: Request) {
  const { runId, stepId, approved, editedItems } = await req.json()

  // 🔥 Resume from suspended step
  const run = await mastra.workflows.resume(runId, {
    stepId,
    input: {
      approved,
      edited_items: editedItems
    }
  })

  // Continue streaming
  const stream = run.resumeStreamVNext()
  return new Response(stream, { /* headers */ })
}
```

### 2.4 Frontend Integration

```typescript
// components/authoring/ContentGenerationFlow.tsx
'use client'

import { useWorkflowStream } from '@mastra/react'

export function ContentGenerationFlow({ lessonId, readingId }) {
  const {
    state,      // Current workflow state
    suspend,    // Suspended step data
    resume,     // Function to resume
    isStreaming
  } = useWorkflowStream('content-generation', {
    lessonId,
    readingId,
    // ... trigger data
  })

  if (suspend?.stepId === 'reviewVocabulary') {
    return (
      <VocabularyReviewModal
        items={suspend.data.vocabulary}
        onApprove={(approved, edited) => {
          resume({
            stepId: 'reviewVocabulary',
            input: { approved, edited_items: edited }
          })
        }}
      />
    )
  }

  return <ProgressIndicator step={state.currentStep} />
}
```

---

## 3. LangGraph Architecture Analysis

### 3.1 Core Concepts

```typescript
import { StateGraph, Annotation, END } from '@langchain/langgraph'
import { tool } from '@langchain/core/tools'

// 1. Define state schema
const ContentGenerationState = Annotation.Root({
  lessonId: Annotation<string>(),
  readingText: Annotation<string>(),
  vocabularyItems: Annotation<VocabularyItem[]>({ default: () => [] }),
  vocabularyApproved: Annotation<boolean>({ default: () => false }),
  // ... more state fields
})

// 2. Define tools (similar to Mastra)
export const extractVocabularyTool = tool(
  async ({ readingText, targetLevel }) => {
    // Same implementation as Mastra
  },
  {
    name: 'extract_vocabulary',
    description: 'Extract vocabulary from reading',
    schema: ExtractVocabularySchema
  }
)

// 3. Build graph manually
const graph = new StateGraph(ContentGenerationState)

graph.addNode('extractVocabulary', async (state) => {
  const result = await extractVocabularyTool.invoke({
    readingText: state.readingText,
    targetLevel: state.targetLevel
  })
  return { vocabularyItems: result.items }
})

graph.addNode('reviewVocabulary', async (state) => {
  // ⚠️ This is just a placeholder - actual review happens externally
  return state
})

graph.addConditionalEdges(
  'reviewVocabulary',
  (state) => state.vocabularyApproved ? 'identifyGrammar' : END,
  { identifyGrammar: 'identifyGrammar', __end__: END }
)

// ... more nodes and edges

// 4. Compile with checkpointer
const app = graph.compile({
  checkpointer: new PostgresSaver(pool),  // Need external DB for persistence
  interruptBefore: ['reviewVocabulary', 'reviewGrammar', 'reviewExercises']
})
```

### 3.2 Streaming Implementation

```typescript
// app/api/lessons/[id]/generate/route.ts
import { app } from '@/lib/content-generation/graph'

export async function POST(req: Request, { params }) {
  const body = await req.json()

  const config = {
    configurable: {
      thread_id: `lesson-${params.id}-${Date.now()}`
    }
  }

  // ⚠️ Manual streaming setup
  const stream = await app.stream({
    lessonId: params.id,
    // ... other state
  }, config)

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        // ⚠️ Manual SSE formatting
        const data = `data: ${JSON.stringify(chunk)}\n\n`
        controller.enqueue(encoder.encode(data))
      }
      controller.close()
    }
  })

  return new Response(readable, { /* headers */ })
}
```

### 3.3 Human Review & Resume

```typescript
// app/api/lessons/[id]/approve/route.ts
import { app } from '@/lib/content-generation/graph'

export async function POST(req: Request) {
  const { threadId, approvalType, approved } = await req.json()

  const config = { configurable: { thread_id: threadId } }

  // ⚠️ Update state manually
  await app.updateState(config, {
    [`${approvalType}Approved`]: approved
  })

  // ⚠️ Resume stream manually
  const stream = await app.stream(null, config)

  // ⚠️ More manual SSE setup
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

  return new Response(readable, { /* headers */ })
}
```

---

## 4. Side-by-Side Comparison

### Feature: Human Checkpoint

**Mastra** ✅
```typescript
.step('reviewVocabulary', {
  suspend: true,  // ONE LINE!
  schema: z.object({ approved: z.boolean() })
})
```

**LangGraph** ⚠️
```typescript
// 1. Add interrupt in compile config
const app = graph.compile({
  interruptBefore: ['reviewVocabulary']  // Manual list
})

// 2. Add conditional edge
graph.addConditionalEdges(
  'reviewVocabulary',
  (state) => state.vocabularyApproved ? 'next' : END
)

// 3. Manual state update in API
await app.updateState(config, { vocabularyApproved: true })

// 4. Manual resume
await app.stream(null, config)
```

### Feature: Streaming

**Mastra** ✅
```typescript
const stream = run.streamVNext()
return new Response(stream)  // Works out of the box
```

**LangGraph** ⚠️
```typescript
const stream = await app.stream(input, config)

const readable = new ReadableStream({
  async start(controller) {
    for await (const chunk of stream) {
      const data = `data: ${JSON.stringify(chunk)}\n\n`
      controller.enqueue(encoder.encode(data))
    }
    controller.close()
  }
})
```

### Feature: State Persistence

**Mastra** ✅
```typescript
// Automatic - stores in internal DB or configured backend
const run = await mastra.workflows.resume(runId)
```

**LangGraph** ⚠️
```typescript
// Manual setup - need to provision PostgreSQL or Redis
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'

const pool = new Pool({ /* postgres config */ })
const checkpointer = new PostgresSaver(pool)

const app = graph.compile({ checkpointer })
```

### Feature: Tool Definition

**Mastra** ✅
```typescript
const myTool = createTool({
  id: 'my-tool',
  description: 'Does something',
  inputSchema: z.object({ /* ... */ }),
  outputSchema: z.object({ /* ... */ }),
  execute: async ({ context }) => {
    // Access LLM, memory, etc. from context
    const llm = context.llm('anthropic')
    return await llm.generate({ /* ... */ })
  }
})
```

**LangGraph** ≈ Similar
```typescript
import { tool } from '@langchain/core/tools'

const myTool = tool(
  async (input) => {
    // Need to manually instantiate LLM
    const llm = new ChatAnthropic({ /* ... */ })
    return await llm.invoke({ /* ... */ })
  },
  {
    name: 'my_tool',
    description: 'Does something',
    schema: z.object({ /* ... */ })
  }
)
```

---

## 5. Trade-off Analysis

### Pros: Mastra

✅ **TypeScript-native**: No Python baggage, feels natural in Next.js
✅ **Simpler API**: Less boilerplate, faster development
✅ **Built-in suspend/resume**: Exactly what we need for human review
✅ **Native streaming**: Works out of the box, no SSE plumbing
✅ **Automatic state persistence**: No need to provision PostgreSQL
✅ **Built-in observability**: Dashboard for monitoring runs
✅ **Better DX**: Hot reload, local dev server, interactive studio

### Cons: Mastra

❌ **New to project**: Team already knows LangChain from AI Tutor
❌ **Less mature**: Newer project, smaller community
❌ **Mixed frameworks**: Would have LangChain (tutor) + Mastra (content gen)
❌ **Unknown gotchas**: Less battle-tested than LangChain
❌ **Migration cost**: If we later consolidate, need to rewrite

### Pros: LangGraph

✅ **Already used**: Team familiar from AI Tutor implementation
✅ **Mature ecosystem**: Large community, extensive docs
✅ **Single framework**: Consistency across AI features
✅ **Proven at scale**: Used in production by many companies
✅ **Strong TypeScript support**: First-class TypeScript bindings

### Cons: LangGraph

❌ **Python-first design**: TypeScript feels like a port
❌ **Complex API**: State graphs, nodes, edges, checkpointers
❌ **Manual checkpoints**: More code for human-in-the-loop
❌ **Manual streaming**: Need to wire up SSE ourselves
❌ **External dependencies**: PostgreSQL for state persistence
❌ **Steeper learning curve**: More concepts to understand

---

## 6. Decision Framework

### Option A: Use Mastra (Recommended)

**Rationale**:
- Human-in-the-loop is CORE to this feature
- Mastra's suspend/resume is exactly what we need
- Simpler code = faster development = ship sooner
- TypeScript-first means better DX and maintainability
- Content generation is separate domain from tutoring (okay to use different framework)

**Implementation**:
```
lib/content-generation/
├── mastra.config.ts       # Mastra setup
├── tools/
│   ├── extract-vocabulary.ts
│   ├── identify-grammar.ts
│   └── generate-exercises.ts
└── workflows/
    └── content-generation.ts

lib/tutor-tools.ts         # Keep existing LangChain code
```

**Risks**:
- Two frameworks in codebase (mitigation: clear separation by domain)
- Mastra less mature (mitigation: simple feature scope, easy to migrate if needed)

### Option B: Use LangGraph (Conservative)

**Rationale**:
- Consistency across AI features
- Team already familiar from AI Tutor
- Proven at scale, mature ecosystem
- Lower risk for production

**Implementation**:
```
lib/content-generation/
├── graph.ts              # LangGraph definition
├── state.ts              # State schema
├── nodes.ts              # Node implementations
└── tools/
    ├── extract-vocabulary.ts
    ├── identify-grammar.ts
    └── generate-exercises.ts
```

**Risks**:
- More code to write and maintain
- Manual checkpoint/resume logic
- Manual streaming setup
- PostgreSQL dependency for checkpoints

---

## 7. Recommended Approach

### Decision: **Use Mastra**

**Why**:
1. **Human-in-the-loop is critical** - Mastra's suspend/resume is built for this
2. **TypeScript-first = better DX** - Faster development in our Next.js app
3. **Simpler code = less bugs** - Less boilerplate to maintain
4. **Separate domain = okay to mix** - Content gen ≠ tutoring
5. **Easy migration path** - If needed, can port to LangGraph later

**Implementation Plan**:
1. Install Mastra: `npm install @mastra/core`
2. Create Mastra config with Anthropic provider
3. Build tools for vocab/grammar/exercises
4. Create workflow with suspend points
5. Wire up API endpoints with streaming
6. Build review modals with resume logic

**Code estimate**: ~40% less code than LangGraph approach

---

## 8. Proof of Concept Code

### Mastra Implementation (Full Example)

```typescript
// lib/content-generation/mastra.config.ts
import { Mastra } from '@mastra/core'
import { createAnthropicProvider } from '@mastra/anthropic'

export const mastra = new Mastra({
  providers: {
    anthropic: createAnthropicProvider({
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultModel: 'claude-sonnet-3-5-20241022'
    })
  },
  workflows: {
    'content-generation': contentGenerationWorkflow
  }
})
```

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

    const prompt = `You are an expert Spanish language teacher. Extract the ${maxItems} most important vocabulary items for a ${targetLevel} student from this reading.

READING:
${readingText}

REQUIREMENTS:
1. Words MUST appear in the reading
2. Appropriate for ${targetLevel} difficulty
3. Include exact example sentence from reading
4. Return valid JSON array only`

    const llm = context.llm('anthropic')
    const result = await llm.generate({
      prompt,
      schema: z.array(vocabularySchema)
    })

    // Content grounding: verify words in reading
    const verified = result.filter(item =>
      item.appears_in_reading &&
      readingText.toLowerCase().includes(item.word.toLowerCase())
    )

    return verified
  }
})
```

```typescript
// lib/content-generation/workflows/content-generation.ts
import { Workflow } from '@mastra/core'
import { z } from 'zod'
import { extractVocabularyTool } from '../tools/extract-vocabulary'
import { identifyGrammarTool } from '../tools/identify-grammar'
import { generateExercisesTool } from '../tools/generate-exercises'
import { insertContentTool } from '../tools/insert-content'

export const contentGenerationWorkflow = new Workflow({
  name: 'content-generation',
  triggerSchema: z.object({
    lessonId: z.string(),
    readingId: z.string(),
    readingText: z.string(),
    targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  })
})
  // Step 1: Extract vocabulary
  .step('extractVocabulary', {
    tool: extractVocabularyTool,
    input: (context) => ({
      readingText: context.trigger.readingText,
      targetLevel: context.trigger.targetLevel,
      maxItems: 20
    })
  })

  // Step 2: Human review checkpoint
  .step('reviewVocabulary', {
    suspend: true,  // 🔥 Pause here for human approval
    schema: z.object({
      approved: z.boolean(),
      edited_items: z.array(vocabularySchema).optional()
    })
  })

  // Step 3: Identify grammar (only if vocab approved)
  .step('identifyGrammar', {
    tool: identifyGrammarTool,
    input: (context) => ({
      readingText: context.trigger.readingText,
      targetLevel: context.trigger.targetLevel,
      maxConcepts: 5
    }),
    condition: (context) => context.steps.reviewVocabulary.output.approved
  })

  // Step 4: Human review checkpoint
  .step('reviewGrammar', {
    suspend: true,
    schema: z.object({
      approved: z.boolean(),
      edited_concepts: z.array(grammarSchema).optional()
    }),
    condition: (context) => context.steps.identifyGrammar.status === 'completed'
  })

  // Step 5: Generate exercises (only if grammar approved)
  .step('generateExercises', {
    tool: generateExercisesTool,
    input: (context) => ({
      readingText: context.trigger.readingText,
      vocabularyItems: context.steps.reviewVocabulary.output.edited_items ||
                       context.steps.extractVocabulary.output,
      grammarConcepts: context.steps.reviewGrammar.output.edited_concepts ||
                       context.steps.identifyGrammar.output,
      exerciseTypes: ['fill-blank', 'multiple-choice', 'translation'],
      count: 10
    }),
    condition: (context) => context.steps.reviewGrammar.output.approved
  })

  // Step 6: Human review checkpoint
  .step('reviewExercises', {
    suspend: true,
    schema: z.object({
      approved: z.boolean(),
      edited_exercises: z.array(exerciseSchema).optional()
    }),
    condition: (context) => context.steps.generateExercises.status === 'completed'
  })

  // Step 7: Insert to database (only if exercises approved)
  .step('insertToDatabase', {
    tool: insertContentTool,
    input: (context) => ({
      lessonId: context.trigger.lessonId,
      vocabulary: context.steps.reviewVocabulary.output.edited_items ||
                  context.steps.extractVocabulary.output,
      grammar: context.steps.reviewGrammar.output.edited_concepts ||
               context.steps.identifyGrammar.output,
      exercises: context.steps.reviewExercises.output.edited_exercises ||
                 context.steps.generateExercises.output
    }),
    condition: (context) => context.steps.reviewExercises.output.approved
  })

  .commit()
```

```typescript
// app/api/lessons/[id]/generate-content/route.ts
import { mastra } from '@/lib/content-generation/mastra.config'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { readingId, targetLevel } = await req.json()

  // Get reading text
  const { data: reading } = await supabase
    .from('library_readings')
    .select('text')
    .eq('id', readingId)
    .single()

  if (!reading) {
    return Response.json({ error: 'Reading not found' }, { status: 404 })
  }

  // Start workflow
  const run = await mastra.workflows.run('content-generation', {
    lessonId: params.id,
    readingId,
    readingText: reading.text,
    targetLevel
  })

  // Stream response
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

```typescript
// app/api/lessons/[id]/approve-content/route.ts
import { mastra } from '@/lib/content-generation/mastra.config'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { runId, stepId, approved, editedItems } = await req.json()

  // Resume workflow from suspended step
  const run = await mastra.workflows.resume(runId, {
    stepId,
    input: {
      approved,
      edited_items: editedItems  // User's edits
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

## 9. Migration Considerations

**If we choose Mastra**:
- AI Tutor stays on LangChain (no changes needed)
- Content generation uses Mastra (new feature)
- Clear domain separation: tutoring vs content authoring
- Can consolidate later if desired (low priority)

**If we choose LangGraph**:
- Unified framework across AI features
- Can share tools/patterns between tutor and content gen
- Larger upfront implementation cost
- More code to maintain long-term

---

## 10. Final Recommendation

### ✅ Use Mastra

**Reasons**:
1. **40% less code** for same functionality
2. **Built-in human-in-the-loop** (our core requirement)
3. **TypeScript-first** = better DX in Next.js
4. **Native streaming** = less plumbing
5. **Separate domain** = mixing frameworks is acceptable

**Next Steps**:
1. Get approval for Mastra approach
2. Install dependencies: `npm install @mastra/core @mastra/anthropic`
3. Create POC: Simple vocab extraction workflow
4. Validate suspend/resume flow works as expected
5. Proceed with full implementation

**Estimated effort**: 15-18 story points (vs 20-23 with LangGraph)

---

**Document Status**: 🟢 Ready for Decision
**Recommended**: Mastra
**Fallback**: LangGraph (if team prefers consistency)
