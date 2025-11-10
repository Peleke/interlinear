# Mastra Implementation Plan - FINAL
**Date**: 2025-11-10
**Status**: Ready to Build
**Changes**: Built-in storage, memory system, MCP integration, freemium model

---

## 🎯 **FINAL ANSWERS**

### Storage: Built-in Snapshots!
❌ **OLD**: Build custom storage in Supabase
✅ **NEW**: Use Mastra's built-in snapshot persistence

**Auto-persists workflow state:**
- Call `suspend()` → Auto-saves to storage
- Call `resume()` → Auto-restores from storage
- No custom adapter needed!

**Storage Options:**
1. **LibSQL** (default) - SQLite-compatible, local or remote
2. **Upstash** - Redis-compatible, serverless

**Our Plan:**
```bash
# Development: LibSQL local
DATABASE_URL=file:local.db

# Production: Upstash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

---

### Memory: Game-Changing Features!

✅ **Threads & Resources**
- Thread = specific lesson conversation
- Resource = user ID (persists across ALL lessons!)

```typescript
await agent.stream("Explain 'ser' vs 'estar'", {
  memory: {
    thread: `lesson_${lessonId}`,     // This lesson
    resource: `user_${userId}`,        // This user forever!
  }
});
```

✅ **Working Memory (User Profile)**
- Stores user's CEFR level, learned vocab, common mistakes
- Resource-scoped = persists across all lessons!

```typescript
memory: new Memory({
  workingMemoryTemplate: `
    # User Profile
    - CEFR Level: {{level}}
    - Target Language: {{language}}
    - Common Mistakes: {{mistakes}}
    - Learned Vocabulary: {{vocab}}
  `
})
```

✅ **Semantic Recall (RAG)**
- "Remember when we learned about 'ser' vs 'estar' in Lesson 3?"
- AI recalls semantically similar past lessons
- Requires pgvector extension in Supabase

```sql
-- Enable pgvector in Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- Mastra auto-creates:
-- - messages (conversation history)
-- - working_memory (user profiles)
-- - embeddings (semantic recall)
```

---

### MCP Integration: Killer Features!

**Immediate Value:**
1. **Wikipedia MCP** - Cultural context for lessons
2. **Search MCP** - Find authentic content (news, videos)

**Multi-Tenant SaaS Ready:**
```typescript
// Different tools per user tier!
const getUserTools = (user) => {
  const baseTools = [vocabularyTool];

  if (user.tier === 'premium') {
    return [...baseTools, exercisesTool, grammarTool, aiTutorTool, wikipediaTool];
  }

  return baseTools;  // Free tier
};
```

**User API Keys:**
```typescript
// Let users bring their own OpenAI keys
const userLLM = new ChatOpenAI({
  apiKey: user.openai_api_key || process.env.OPENAI_API_KEY
});
```

---

### Workflow Binding: Corrected!
❌ **WRONG**: `.bind()` method
✅ **CORRECT**: Use `inputData` parameter

```typescript
const step = createStep({
  inputSchema: z.object({ exerciseType: z.string() }),
  execute: async ({ inputData }) => {
    const { exerciseType } = inputData;  // ← Get params here!
  }
});
```

---

### NLP Library: NLP.js > WinkNLP

**Why NLP.js is Perfect:**
- ✅ Multilingual: ES, FR, DE built-in with stemmers
- ✅ Named Entity Recognition: People, places, things
- ✅ Sentiment Analysis: Bonus feature
- ✅ Fast: 3 sec training vs 108 sec (36x faster)
- ✅ Tokenization: Language-specific

**Hybrid Approach:**
```typescript
import { NlpManager } from 'node-nlp';

const manager = new NlpManager({ languages: ['es'] });
const analyzed = await manager.process('es', readingText);
// → entities, tokens, sentiment, classification
```

---

## 📦 **Dependencies**

```bash
# Core Mastra
npm install @mastra/core

# Memory & Storage
npm install @mastra/pg         # PostgreSQL for memory
npm install @upstash/redis     # Upstash for production workflows

# NLP
npm install node-nlp

# WebSockets
npm install socket.io socket.io-client

# Frontend (later)
npm install react-wordcloud
```

---

## 🏗️ **Implementation Phases**

### Phase 0: Basic Generation (NOW)
**Goal:** Get workflows working, no memory yet

**Build:**
1. ✅ Vocabulary step (NLP.js + LLM)
2. ✅ Exercise steps (fill-blank, multiple-choice, matching, translation)
3. ✅ Grammar step (basic prompt)
4. ✅ API endpoints
5. ✅ Generate buttons in UI

**Storage:**
- LibSQL local: `DATABASE_URL=file:local.db`
- Workflow snapshots auto-saved

**Example:**
```typescript
// User clicks "Generate Vocabulary"
const result = await mastra.workflows.generateVocabulary.run({
  readingText: "...",
  targetLevel: "B1",
  targetLanguage: "es",
  maxItems: 20,
});

// Auto-saved to LibSQL!
```

---

### Phase 1: Memory & User Profiles (SOON)
**Goal:** Remember user context across lessons

**Add:**
1. 🔜 PostgreSQL memory storage (Supabase)
2. 🔜 Working memory (user CEFR level, learned vocab)
3. 🔜 Thread per lesson
4. 🔜 Resource = user ID
5. 🔜 Auto-adjust content difficulty based on profile

**Setup:**
```sql
-- Supabase: Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;
```

```typescript
// Mastra config with memory
const mastra = new Mastra({
  memory: new Memory({
    storage: new PostgresStore({
      connectionString: process.env.SUPABASE_URL,
    }),
    workingMemorySchema: z.object({
      cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
      targetLanguage: z.enum(['es', 'fr', 'de']),
      learnedVocab: z.array(z.string()),
      commonMistakes: z.array(z.string()),
    }),
  }),
});
```

**Benefits:**
- ✅ AI remembers user's level across all lessons
- ✅ Avoids repeating learned vocabulary
- ✅ Tracks common mistakes for personalized practice
- ✅ Each lesson = separate thread (resume later)

---

### Phase 2: Semantic Recall & Cultural Context (LATER)
**Goal:** Long-term learning continuity + cultural enrichment

**Add:**
1. 📅 Semantic recall ("Remember Lesson 3 when...")
2. 📅 Wikipedia MCP for cultural context
3. 📅 Search MCP for authentic content discovery
4. 📅 Dynamic toolsets per language

**Example:**
```typescript
// Agent with cultural context
const vocabAgent = createAgent({
  tools: [
    extractVocabulary,
    wikipediaTool,  // ← MCP server!
    searchTool,     // ← MCP server!
  ],
  prompt: `Generate vocab AND add cultural notes from Wikipedia`,
});

// Result:
// - Vocabulary: "fiesta"
// - Cultural Note: "Spanish festivals celebrate..."
```

---

### Phase 3: Freemium SaaS Features (v2)
**Goal:** Multi-tenant with tier-based toolsets

**Features:**
1. 📅 Free tier: Basic vocab generation
2. 📅 Premium tier: + exercises + grammar + AI tutor + cultural context
3. 📅 User API keys: Bring your own OpenAI key
4. 📅 Per-language toolsets (ES vs FR vs DE)

**Example:**
```typescript
// Dynamic tools based on user tier
const mastra = new Mastra({
  agents: {
    vocabAgent: createAgent({
      tools: getUserTools(user),  // ← Tier-based!
    }),
  },
});

function getUserTools(user: User) {
  const base = [vocabularyTool];

  if (user.tier === 'premium') {
    return [
      ...base,
      exercisesTool,
      grammarTool,
      aiTutorTool,
      wikipediaTool,    // Cultural context
      searchTool,       // Authentic content
    ];
  }

  return base;  // Free users
}
```

---

## 🔄 **Corrected Workflow Steps**

### Vocabulary Step (NLP.js + LLM Hybrid)

**`lib/mastra/steps/vocabulary.ts`**
```typescript
import { createStep } from '@mastra/core';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { extractVocabularyCandidates } from '@/lib/nlp/nlpjs-analyzer';

const VocabularyInputSchema = z.object({
  readingText: z.string(),
  readingMetadata: z.object({
    readingIds: z.array(z.string()),
    readingTitles: z.array(z.string()),
  }),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  targetLanguage: z.enum(['es', 'fr', 'de']),
  maxItems: z.number(),
});

const VocabularyOutputSchema = z.object({
  vocabulary: z.array(z.object({
    word: z.string(),
    translation: z.string(),
    definition: z.string(),
    cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    example_sentence: z.string().optional(),
    source_readings: z.array(z.string()),
  })),
});

export const generateVocabularyStep = createStep({
  id: 'generate-vocabulary',
  inputSchema: VocabularyInputSchema,
  outputSchema: VocabularyOutputSchema,

  execute: async ({ inputData, suspend }) => {
    // ✅ CORRECTED: Use inputData!
    const { readingText, readingMetadata, targetLevel, targetLanguage, maxItems } = inputData;

    // Step 1: NLP.js extracts candidates (fast, free)
    console.log('[Vocab] NLP.js analyzing...');
    const candidates = await extractVocabularyCandidates(
      readingText,
      targetLanguage,
      maxItems * 2  // 2x for LLM to choose from
    );

    // Step 2: LLM refines and adds translations (smart, costs tokens)
    console.log(`[Vocab] LLM refining ${candidates.length} candidates...`);

    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7
    }).withStructuredOutput(VocabularyOutputSchema);

    const candidateList = candidates
      .map(c => `${c.word} (stem: ${c.stem}, freq: ${c.frequency})`)
      .join('\n');

    const result = await llm.invoke([
      {
        role: "system",
        content: `You are a language teacher. Select the ${maxItems} most valuable words for ${targetLevel} learners from the candidates.`
      },
      {
        role: "user",
        content: `
Reading: ${readingText}

Candidates (from NLP analysis):
${candidateList}

Select ${maxItems} words and provide translations + definitions.
        `
      }
    ]);

    // Tag with source readings
    const vocabWithSources = result.vocabulary.map(item => ({
      ...item,
      source_readings: readingMetadata.readingIds,
    }));

    // Suspend for user review
    return await suspend({
      reason: `Review ${vocabWithSources.length} vocabulary items`,
      vocabulary: vocabWithSources,
    });
  }
});
```

**Benefits:**
- ✅ NLP.js does heavy lifting (fast, free)
- ✅ LLM adds intelligence (translations, CEFR levels)
- ✅ Token-efficient hybrid approach
- ✅ Works for ES, FR, DE out of the box

---

### Exercise Steps (One Per Type)

**`lib/mastra/steps/exercises-fill-blank.ts`**
```typescript
import { createStep } from '@mastra/core';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

const FillBlankInputSchema = z.object({
  readingText: z.string(),
  vocabulary: z.array(z.any()),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  targetLanguage: z.enum(['es', 'fr', 'de']),
  count: z.number(),
});

const FillBlankOutputSchema = z.object({
  exercises: z.array(z.object({
    type: z.literal('fill-blank'),
    question: z.string(),
    correctAnswer: z.string(),
    explanation: z.string(),
    difficulty: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  })),
});

export const generateFillBlankStep = createStep({
  id: 'generate-fill-blank',
  inputSchema: FillBlankInputSchema,
  outputSchema: FillBlankOutputSchema,

  execute: async ({ inputData, suspend }) => {
    const { readingText, vocabulary, targetLevel, targetLanguage, count } = inputData;

    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7
    }).withStructuredOutput(FillBlankOutputSchema);

    const vocabContext = vocabulary
      .map((v: any) => `${v.word}: ${v.translation}`)
      .join(', ');

    const result = await llm.invoke([
      {
        role: "system",
        content: `Generate ${count} fill-in-the-blank exercises for ${targetLevel} learners.`
      },
      {
        role: "user",
        content: `Reading: ${readingText}\nVocabulary: ${vocabContext}`
      }
    ]);

    return await suspend({
      reason: `Review ${count} fill-blank exercises`,
      exercises: result.exercises,
    });
  }
});
```

**Similar files for:**
- `exercises-multiple-choice.ts`
- `exercises-matching.ts`
- `exercises-translation.ts`

---

### Grammar Step (Basic)

**`lib/mastra/steps/grammar.ts`**
```typescript
import { createStep } from '@mastra/core';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

const GrammarInputSchema = z.object({
  readingText: z.string(),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  targetLanguage: z.enum(['es', 'fr', 'de']),
  maxConcepts: z.number(),
});

const GrammarOutputSchema = z.object({
  grammar_concepts: z.array(z.object({
    concept_name: z.string(),
    cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    example_from_text: z.string(),
    explanation: z.string(),
  })),
});

export const generateGrammarStep = createStep({
  id: 'generate-grammar',
  inputSchema: GrammarInputSchema,
  outputSchema: GrammarOutputSchema,

  execute: async ({ inputData, suspend }) => {
    const { readingText, targetLevel, targetLanguage, maxConcepts } = inputData;

    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.6
    }).withStructuredOutput(GrammarOutputSchema);

    const result = await llm.invoke([
      {
        role: "system",
        content: `Identify ${maxConcepts} key grammar concepts for ${targetLevel} learners.`
      },
      {
        role: "user",
        content: readingText
      }
    ]);

    return await suspend({
      reason: `Review ${result.grammar_concepts.length} grammar concepts`,
      grammar_concepts: result.grammar_concepts,
    });
  }
});
```

---

## 🧠 **NLP.js Integration**

**`lib/nlp/nlpjs-analyzer.ts`** (NEW)
```typescript
import { NlpManager } from 'node-nlp';

const managers = new Map<string, NlpManager>();

function getManager(language: 'es' | 'fr' | 'de'): NlpManager {
  if (!managers.has(language)) {
    managers.set(language, new NlpManager({ languages: [language] }));
  }
  return managers.get(language)!;
}

export interface VocabCandidate {
  word: string;
  stem: string;
  frequency: number;
  entities?: string[];
}

export async function extractVocabularyCandidates(
  text: string,
  language: 'es' | 'fr' | 'de',
  maxCandidates: number = 30
): Promise<VocabCandidate[]> {
  const manager = getManager(language);

  // Tokenize
  const tokenizer = manager.container.get(`tokenizer-${language}`);
  const stemmer = manager.container.get(`stemmer-${language}`);

  const tokens = tokenizer.tokenize(text);

  // Count frequency and stem
  const freqMap = new Map<string, { count: number; stem: string }>();

  for (const token of tokens) {
    // Skip short words and numbers
    if (token.length < 3 || /^\d+$/.test(token)) continue;

    const stem = stemmer.stem([token])[0];
    const lower = token.toLowerCase();

    if (!freqMap.has(lower)) {
      freqMap.set(lower, { count: 0, stem });
    }

    freqMap.get(lower)!.count++;
  }

  // Extract entities
  const analyzed = await manager.process(language, text);
  const entities = analyzed.entities || [];

  // Convert to array and sort by frequency
  const candidates: VocabCandidate[] = Array.from(freqMap.entries())
    .map(([word, { count, stem }]) => ({
      word,
      stem,
      frequency: count,
      entities: entities
        .filter((e: any) => e.sourceText.toLowerCase() === word)
        .map((e: any) => e.entity),
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, maxCandidates);

  return candidates;
}

export async function extractNamedEntities(
  text: string,
  language: 'es' | 'fr' | 'de'
) {
  const manager = getManager(language);
  const result = await manager.process(language, text);

  return (result.entities || []).map((e: any) => ({
    text: e.sourceText,
    type: e.entity,
    start: e.start,
    end: e.end,
  }));
}
```

---

## 🔌 **WebSocket Integration**

### Server Setup

**`app/api/socket/route.ts`** (NEW)
```typescript
import { Server } from 'socket.io';
import { NextResponse } from 'next/server';

let io: Server | null = null;

export function GET(request: Request) {
  if (!io) {
    const httpServer = (request as any).socket.server;
    io = new Server(httpServer, {
      path: '/api/socket',
      cors: { origin: '*' },
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
    });
  }

  return NextResponse.json({ message: 'Socket server running' });
}

export function emitWorkflowUpdate(runId: string, data: any) {
  if (io) {
    io.emit(`workflow:${runId}`, data);
  }
}
```

### Client Hook

**`hooks/useWorkflowSocket.ts`** (NEW)
```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWorkflowSocket(runId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (!runId) return;

    const newSocket = io({ path: '/api/socket' });

    newSocket.on(`workflow:${runId}`, (data) => {
      setStatus(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [runId]);

  return { status, socket };
}
```

---

## 📋 **Implementation Checklist**

### Phase 0: Basic Generation (NOW)

**Setup:**
- [ ] Install dependencies (`@mastra/core`, `node-nlp`, `socket.io`)
- [ ] Configure LibSQL local: `DATABASE_URL=file:local.db`
- [ ] Test NLP.js with sample ES/FR/DE text

**Build Steps:**
- [ ] `lib/nlp/nlpjs-analyzer.ts` (NLP.js helpers)
- [ ] `lib/mastra/steps/vocabulary.ts` (NLP.js + LLM hybrid)
- [ ] `lib/mastra/steps/exercises-fill-blank.ts`
- [ ] `lib/mastra/steps/exercises-multiple-choice.ts`
- [ ] `lib/mastra/steps/exercises-matching.ts`
- [ ] `lib/mastra/steps/exercises-translation.ts`
- [ ] `lib/mastra/steps/grammar.ts`

**Build Workflows:**
- [ ] Single-step workflows (vocab, exercises, grammar)
- [ ] Test with `mastra.workflows.generateVocabulary.run()`

**API + Frontend:**
- [ ] `/api/v1/mastra/workflows/trigger`
- [ ] `/api/v1/mastra/workflows/[runId]/status`
- [ ] `/api/v1/mastra/workflows/[runId]/resume`
- [ ] Reading selection dropdown
- [ ] Generate Vocabulary button
- [ ] Generate Exercises buttons (4 types)
- [ ] Wire up API calls

---

### Phase 1: Memory (SOON)

**Supabase Setup:**
- [ ] Enable pgvector: `CREATE EXTENSION IF NOT EXISTS vector;`
- [ ] Install `@mastra/pg`
- [ ] Configure PostgresStore with Supabase URL

**Memory Implementation:**
- [ ] Define working memory schema (user profile)
- [ ] Add memory to Mastra config
- [ ] Thread per lesson
- [ ] Resource = user ID
- [ ] Test memory persistence

**Auto-Adjust Content:**
- [ ] Read user's CEFR level from working memory
- [ ] Pass to vocabulary/exercise generation
- [ ] Track learned vocab, avoid repeating

---

### Phase 2: Semantic Recall + MCP (LATER)

**Semantic Recall:**
- [ ] Configure `topK` for semantic search
- [ ] Test "Remember Lesson 3..." queries
- [ ] Add conversation history tracking

**MCP Integration:**
- [ ] Install Wikipedia MCP: `npx -y wikipedia-mcp`
- [ ] Install Search MCP: `npx -y search-mcp`
- [ ] Add cultural context to vocab generation
- [ ] Search for authentic content

---

### Phase 3: Freemium SaaS (v2)

**Multi-Tenant:**
- [ ] Dynamic toolsets per user tier
- [ ] Free tier: Basic vocab only
- [ ] Premium tier: + exercises + grammar + AI tutor + cultural context

**User API Keys:**
- [ ] Store user OpenAI API keys (encrypted)
- [ ] Use user key if present, fallback to app key
- [ ] Track token usage per user

**Per-Language Toolsets:**
- [ ] ES tools: Dictionary, conjugator, grammar
- [ ] FR tools: Dictionary, conjugator, grammar
- [ ] DE tools: Dictionary, declension, grammar

---

## 🚀 **LET'S BUILD THIS!**

**Start NOW with:**
```bash
# Install deps
npm install @mastra/core node-nlp socket.io socket.io-client

# Set up local storage
export DATABASE_URL=file:local.db

# Test NLP.js
node -e "
  const { NlpManager } = require('node-nlp');
  const mgr = new NlpManager({ languages: ['es'] });
  mgr.process('es', 'Hola mundo').then(console.log);
"

# Build first step: vocabulary.ts
# Test with API call
# Add Generate button to UI
```

**READY TO BANG IT OUT? 🔥🔥🔥**
