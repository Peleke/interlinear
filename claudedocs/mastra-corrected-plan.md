# Mastra Implementation Plan - CORRECTED

**Date**: 2025-11-10
**Status**: Ready for Implementation
**Changes**: Corrected workflow binding, storage, NLP library

---

## ✅ **Answers to Open Questions**

1. **Mastra Supabase**: Auth only, build custom storage in Supabase table
2. **Workflow Binding**: Use `inputData`, NOT `.bind()`
3. **Exercise Tools**: One tool per type (4 total)
4. **Frontend State**: WebSockets for real-time updates
5. **Grammar**: Basic prompt-based implementation
6. **NLP Library**: NLP.js (multilingual) instead of WinkNLP

---

## 📦 **Updated Dependencies**

```bash
# Core
npm install @mastra/core

# NLP (multilingual)
npm install node-nlp

# Frontend (later)
npm install react-wordcloud

# WebSockets
npm install socket.io socket.io-client
```

---

## 🗄️ **Custom Storage Implementation**

### Database Schema

#### `supabase/migrations/xxx_mastra_workflows.sql` (NEW)
```sql
-- Workflow runs table
CREATE TABLE mastra_workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'suspended', 'success', 'failed', 'waiting')),
  current_step TEXT,

  -- Workflow data
  input_data JSONB NOT NULL,
  output_data JSONB,
  suspend_data JSONB,
  state JSONB DEFAULT '{}'::JSONB,

  -- Metadata
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Indexes
  INDEX idx_workflow_status (status),
  INDEX idx_workflow_user (user_id),
  INDEX idx_workflow_created (created_at)
);

-- Enable RLS
ALTER TABLE mastra_workflow_runs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users view own workflows"
  ON mastra_workflow_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages workflows"
  ON mastra_workflow_runs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_mastra_workflow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mastra_workflow_updated
  BEFORE UPDATE ON mastra_workflow_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_mastra_workflow_timestamp();
```

---

### Storage Adapter

#### `lib/mastra/storage/supabase-adapter.ts` (NEW)
```typescript
import { createClient } from '@/lib/supabase/server';

export interface WorkflowRun {
  id: string;
  workflow_name: string;
  status: 'running' | 'suspended' | 'success' | 'failed' | 'waiting';
  current_step: string | null;
  input_data: any;
  output_data?: any;
  suspend_data?: any;
  state: any;
  user_id: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export class SupabaseWorkflowStorage {
  async createRun(data: {
    workflow_name: string;
    input_data: any;
    user_id: string;
  }): Promise<WorkflowRun> {
    const supabase = await createClient();

    const { data: run, error } = await supabase
      .from('mastra_workflow_runs')
      .insert({
        workflow_name: data.workflow_name,
        input_data: data.input_data,
        user_id: data.user_id,
        status: 'running',
        state: {},
      })
      .select()
      .single();

    if (error) throw error;
    return run;
  }

  async getRun(runId: string): Promise<WorkflowRun | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('mastra_workflow_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (error) return null;
    return data;
  }

  async updateRun(runId: string, updates: Partial<WorkflowRun>): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('mastra_workflow_runs')
      .update(updates)
      .eq('id', runId);

    if (error) throw error;
  }

  async suspendRun(runId: string, data: {
    current_step: string;
    suspend_data: any;
    state: any;
  }): Promise<void> {
    await this.updateRun(runId, {
      status: 'suspended',
      current_step: data.current_step,
      suspend_data: data.suspend_data,
      state: data.state,
    });
  }

  async resumeRun(runId: string, resumeData: any): Promise<void> {
    await this.updateRun(runId, {
      status: 'running',
      suspend_data: null,
    });
  }

  async completeRun(runId: string, result: any): Promise<void> {
    await this.updateRun(runId, {
      status: 'success',
      output_data: result,
      completed_at: new Date().toISOString(),
    });
  }

  async failRun(runId: string, error: any): Promise<void> {
    await this.updateRun(runId, {
      status: 'failed',
      output_data: { error: error.message || String(error) },
      completed_at: new Date().toISOString(),
    });
  }
}
```

---

## 🧠 **NLP.js Integration**

### NLP Analyzer

#### `lib/nlp/nlpjs-analyzer.ts` (NEW)
```typescript
import { NlpManager, Language } from 'node-nlp';

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

export async function analyzeText(text: string, language: 'es' | 'fr' | 'de') {
  const manager = getManager(language);

  // Process text
  const result = await manager.process(language, text);

  return {
    entities: result.entities || [],
    sentiment: result.sentiment,
    tokens: result.tokens || [],
    classifications: result.classifications || [],
  };
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

export function generateWordCloudData(
  text: string,
  language: 'es' | 'fr' | 'de',
  topN: number = 50
) {
  const manager = getManager(language);
  const tokenizer = manager.container.get(`tokenizer-${language}`);
  const stemmer = manager.container.get(`stemmer-${language}`);

  const tokens = tokenizer.tokenize(text);

  // Frequency count
  const freqMap = new Map<string, number>();

  for (const token of tokens) {
    if (token.length < 3 || /^\d+$/.test(token)) continue;

    const lower = token.toLowerCase();
    freqMap.set(lower, (freqMap.get(lower) || 0) + 1);
  }

  // Convert to word cloud format
  return Array.from(freqMap.entries())
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
}
```

**Benefits:**
- ✅ ES/FR/DE support out of the box
- ✅ Tokenization with language-specific rules
- ✅ Stemming for base forms
- ✅ Named entity extraction
- ✅ Sentiment analysis (bonus)

---

## 🔄 **Corrected Workflow Steps**

### Vocabulary Step (CORRECTED)

#### `lib/mastra/steps/vocabulary.ts`
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

const VocabularyResumeSchema = z.object({
  userFeedback: z.string().optional(),
  approved: z.boolean().optional(),
});

export const generateVocabularyStep = createStep({
  id: 'generate-vocabulary',
  inputSchema: VocabularyInputSchema,
  outputSchema: VocabularyOutputSchema,
  resumeSchema: VocabularyResumeSchema,

  execute: async ({ inputData, resumeData, suspend }) => {
    // ✅ CORRECTED: Use inputData, not input
    const { readingText, readingMetadata, targetLevel, targetLanguage, maxItems } = inputData;

    if (resumeData?.approved) {
      return resumeData.vocabulary;
    }

    // Step 1: NLP.js analysis
    console.log('[Vocab] Analyzing with NLP.js...');
    const candidates = await extractVocabularyCandidates(
      readingText,
      targetLanguage,
      maxItems * 2
    );

    // Step 2: LLM refinement
    console.log(`[Vocab] LLM refining ${candidates.length} candidates...`);

    const prompt = getVocabularyPrompt(targetLanguage, targetLevel, maxItems);

    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7
    }).withStructuredOutput(VocabularyOutputSchema);

    const candidateList = candidates
      .map(c => `${c.word} (stem: ${c.stem}, freq: ${c.frequency})`)
      .join('\n');

    const result = await llm.invoke([
      { role: "system", content: prompt },
      {
        role: "user",
        content: `
Reading: ${readingText}

Candidates (from NLP analysis):
${candidateList}

Select ${maxItems} most valuable for ${targetLevel} learners.
        `
      }
    ]);

    // Tag with source readings
    const vocabWithSources = result.vocabulary.map(item => ({
      ...item,
      source_readings: readingMetadata.readingIds,
    }));

    // Suspend for review
    return await suspend({
      reason: `Review ${vocabWithSources.length} vocabulary items`,
      vocabulary: vocabWithSources,
    });
  }
});

function getVocabularyPrompt(lang: string, level: string, max: number) {
  const prompts = {
    es: `Eres un profesor de español. Selecciona ${max} palabras para nivel ${level}...`,
    fr: `Tu es un professeur de français. Sélectionne ${max} mots pour niveau ${level}...`,
    de: `Du bist ein Deutschlehrer. Wähle ${max} Wörter für Niveau ${level} aus...`,
  };
  return prompts[lang as keyof typeof prompts] || prompts.es;
}
```

---

### Exercise Steps (One Per Type)

#### `lib/mastra/steps/exercises-fill-blank.ts`
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

    const prompt = getFillBlankPrompt(targetLanguage, targetLevel, count);

    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7
    }).withStructuredOutput(FillBlankOutputSchema);

    const vocabContext = vocabulary
      .map((v: any) => `${v.word}: ${v.translation}`)
      .join(', ');

    const result = await llm.invoke([
      { role: "system", content: prompt },
      { role: "user", content: `Reading: ${readingText}\nVocab: ${vocabContext}` }
    ]);

    return await suspend({
      reason: `Review ${count} fill-in-the-blank exercises`,
      exercises: result.exercises,
    });
  }
});

function getFillBlankPrompt(lang: string, level: string, count: number) {
  const prompts = {
    es: `Genera ${count} ejercicios de completar espacios para nivel ${level}...`,
    fr: `Génère ${count} exercices à trous pour niveau ${level}...`,
    de: `Erstelle ${count} Lückentextübungen für Niveau ${level}...`,
  };
  return prompts[lang as keyof typeof prompts] || prompts.es;
}
```

#### Similar files for:
- `exercises-multiple-choice.ts`
- `exercises-matching.ts`
- `exercises-translation.ts`

---

### Grammar Step (Basic)

#### `lib/mastra/steps/grammar.ts`
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

    const prompt = getGrammarPrompt(targetLanguage, targetLevel, maxConcepts);

    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.6
    }).withStructuredOutput(GrammarOutputSchema);

    const result = await llm.invoke([
      { role: "system", content: prompt },
      { role: "user", content: readingText }
    ]);

    return await suspend({
      reason: `Review ${result.grammar_concepts.length} grammar concepts`,
      grammar_concepts: result.grammar_concepts,
    });
  }
});

function getGrammarPrompt(lang: string, level: string, max: number) {
  const prompts = {
    es: `Identifica ${max} conceptos gramaticales clave para nivel ${level}...`,
    fr: `Identifie ${max} concepts grammaticaux clés pour niveau ${level}...`,
    de: `Identifiziere ${max} wichtige Grammatikkonzepte für Niveau ${level}...`,
  };
  return prompts[lang as keyof typeof prompts] || prompts.es;
}
```

---

## 🔌 **WebSocket Integration**

### Server Setup

#### `app/api/socket/route.ts` (NEW)
```typescript
import { Server } from 'socket.io';
import { NextResponse } from 'next/server';

let io: Server | null = null;

export function GET(request: Request) {
  if (!io) {
    // Initialize Socket.IO server
    const httpServer = (request as any).socket.server;
    io = new Server(httpServer, {
      path: '/api/socket',
      cors: { origin: '*' },
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
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

---

### Client Hook

#### `hooks/useWorkflowSocket.ts` (NEW)
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

## 📋 **Updated Implementation Checklist**

### Step 1: Setup
- [ ] Run database migration for `mastra_workflow_runs`
- [ ] Install dependencies (`@mastra/core`, `node-nlp`, `socket.io`)
- [ ] Create Supabase storage adapter
- [ ] Test NLP.js with sample ES/FR/DE text

### Step 2: Build Steps
- [ ] `vocabulary.ts` with NLP.js + LLM hybrid
- [ ] `exercises-fill-blank.ts`
- [ ] `exercises-multiple-choice.ts`
- [ ] `exercises-matching.ts`
- [ ] `exercises-translation.ts`
- [ ] `grammar.ts` (basic)

### Step 3: Build Workflows
- [ ] Batch workflow (parallel exercise generation)
- [ ] Interactive workflow (sequential with suspend)
- [ ] Single-step workflows (Phase 0)

### Step 4: API + WebSockets
- [ ] `/api/v1/mastra/workflows/trigger`
- [ ] `/api/v1/mastra/workflows/[runId]/status`
- [ ] `/api/v1/mastra/workflows/[runId]/resume`
- [ ] `/api/socket` WebSocket server
- [ ] `useWorkflowSocket` hook

### Step 5: Frontend (Phase 0)
- [ ] Reading selection dropdown
- [ ] Generate Vocabulary button
- [ ] Generate Exercises buttons (one per type)
- [ ] Wire up API calls

---

## 🚀 **Ready to Start?**

All questions answered, plan corrected. **Should I begin implementation now?**

**Start with:** Install dependencies → Database migration → NLP.js test → Build first step

**LET'S FUCKING GO!** 🔥
