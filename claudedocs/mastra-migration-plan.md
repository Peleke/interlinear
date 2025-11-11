# Mastra Migration Plan: LLM Content Generation Workflows

**Date**: 2025-11-10
**Status**: Planning Phase
**Goal**: Replace broken LangChain supervisor with Mastra workflows for interactive content generation

---

## 🎯 Goals

### Immediate
1. **Fix broken LangChain implementation** - Rewrite as Mastra workflows
2. **Enable language swapping** - Easy prompt/tool changes per language (ES, FR, DE, etc.)
3. **Phase 0: Simple generation buttons** - One-click generation in lesson create views

### Short-term
4. **Phase 1: Batch wizard** - Paste text → generate all content in parallel
5. **Phase 2: Interactive chat** - Step-by-step generation with user feedback/refinement

### Long-term
6. **Multi-language support** - Swap prompts/tools based on target language
7. **Exercise type specialization** - Different tools for fill-blank, multiple-choice, etc.
8. **Grammar generation** - More complex, deferred for now

---

## 🏗️ Architecture Overview

### Current (Broken) LangChain
```
API Request
  ↓
createReactAgent (supervisor)
  ↓
3 Tools (vocab, grammar, exercises)
  ↓
Sequential LLM calls
  ↓
❌ Fails with Zod validation errors
```

### New Mastra Architecture
```
API Request
  ↓
Mastra Workflow
  ├─ Step 1: Generate Vocab (suspend)
  │   ↓ Resume with user feedback
  ├─ Step 2: Generate Exercises (suspend)
  │   ↓ Resume with user feedback
  └─ Step 3: Generate Grammar (suspend)
      ↓ Resume with user feedback
  ↓
Returns workflow status + data
```

---

## 📁 File-by-File Implementation Plan

### 1. Dependencies & Config

#### `package.json` (MODIFY)
```json
{
  "dependencies": {
    "@mastra/core": "^0.1.x",
    // Keep existing...
  }
}
```

**Actions**:
- Install `@mastra/core`
- Remove LangChain agent dependencies? (TBD - might keep for other features)

---

#### `lib/mastra/config.ts` (NEW)
**Purpose**: Configure Mastra with Supabase storage

```typescript
import { Mastra } from '@mastra/core';
import { createClient } from '@/lib/supabase/server';

export async function getMastraInstance() {
  const supabase = await createClient();

  return new Mastra({
    storage: {
      // Use Supabase for workflow state persistence
      type: 'postgres',
      connectionString: process.env.SUPABASE_URL,
      // OR custom adapter using Supabase client
    },
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }
  });
}
```

**Key Decisions**:
- ❓ Does Mastra have native Postgres/Supabase adapter?
- ❓ Do we need custom storage adapter implementation?
- ✅ Use env vars for config

---

### 2. Workflow Steps (NEW FILES)

#### `lib/mastra/steps/vocabulary.ts` (NEW)
**Purpose**: Generate vocabulary items from reading text

```typescript
import { createStep } from '@mastra/core';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

const VocabularyInputSchema = z.object({
  readingText: z.string(),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  targetLanguage: z.enum(['es', 'fr', 'de']), // Language swapping!
  maxItems: z.number().default(15),
});

const VocabularyOutputSchema = z.object({
  vocabulary: z.array(z.object({
    word: z.string(),
    translation: z.string(),
    definition: z.string(),
    cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    example_sentence: z.string().optional(),
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
  suspendSchema: z.object({
    reason: z.string(),
    vocabulary: z.array(z.any()),
  }),

  execute: async ({ input, resumeData, suspend }) => {
    const { readingText, targetLevel, targetLanguage, maxItems } = input;

    // If resumed with approval, return stored result
    if (resumeData?.approved) {
      return resumeData.vocabulary;
    }

    // Get language-specific prompt
    const prompt = getVocabularyPrompt(targetLanguage, targetLevel, maxItems);

    // Generate with LLM
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7
    }).withStructuredOutput(VocabularyOutputSchema);

    const result = await llm.invoke([
      { role: "system", content: prompt },
      { role: "user", content: readingText }
    ]);

    // Suspend for user review (Phase 2)
    return await suspend({
      reason: "Review vocabulary items before continuing",
      vocabulary: result.vocabulary,
    });
  }
});

// Language-specific prompts
function getVocabularyPrompt(lang: string, level: string, maxItems: number) {
  const prompts = {
    es: `Eres un profesor de español. Extrae ${maxItems} palabras importantes...`,
    fr: `Tu es un professeur de français. Extrais ${maxItems} mots importants...`,
    de: `Du bist ein Deutschlehrer. Extrahiere ${maxItems} wichtige Wörter...`,
  };
  return prompts[lang as keyof typeof prompts] || prompts.es;
}
```

**Key Features**:
- ✅ Suspend/resume for user feedback
- ✅ Language-specific prompts
- ✅ Uses `.withStructuredOutput()` (no manual Zod validation)
- ✅ Stores state in Mastra workflow

---

#### `lib/mastra/steps/exercises.ts` (NEW)
**Purpose**: Generate exercises from vocabulary

```typescript
import { createStep } from '@mastra/core';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

const ExercisesInputSchema = z.object({
  readingText: z.string(),
  vocabulary: z.array(z.any()), // From previous step
  exerciseType: z.enum(['fill-blank', 'multiple-choice', 'matching', 'translation']),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  targetLanguage: z.enum(['es', 'fr', 'de']),
  count: z.number().default(5),
});

const ExercisesOutputSchema = z.object({
  exercises: z.array(z.object({
    type: z.enum(['fill-blank', 'multiple-choice', 'matching', 'translation']),
    question: z.string(),
    correctAnswer: z.string(),
    options: z.array(z.string()).optional(),
    explanation: z.string(),
    difficulty: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  })),
});

const ExercisesResumeSchema = z.object({
  userFeedback: z.string().optional(),
  approved: z.boolean().optional(),
});

export const generateExercisesStep = createStep({
  id: 'generate-exercises',
  inputSchema: ExercisesInputSchema,
  outputSchema: ExercisesOutputSchema,
  resumeSchema: ExercisesResumeSchema,
  suspendSchema: z.object({
    reason: z.string(),
    exercises: z.array(z.any()),
  }),

  execute: async ({ input, resumeData, suspend }) => {
    const { readingText, vocabulary, exerciseType, targetLevel, targetLanguage, count } = input;

    if (resumeData?.approved) {
      return resumeData.exercises;
    }

    // Get exercise-type and language-specific prompt
    const prompt = getExercisePrompt(targetLanguage, exerciseType, targetLevel, count);

    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7
    }).withStructuredOutput(ExercisesOutputSchema);

    const vocabContext = vocabulary.map((v: any) =>
      `${v.word}: ${v.translation}`
    ).join(', ');

    const result = await llm.invoke([
      { role: "system", content: prompt },
      { role: "user", content: `Reading: ${readingText}\n\nVocabulary: ${vocabContext}` }
    ]);

    return await suspend({
      reason: `Review ${exerciseType} exercises before continuing`,
      exercises: result.exercises,
    });
  }
});

// Exercise-type and language-specific prompts
function getExercisePrompt(lang: string, type: string, level: string, count: number) {
  const templates = {
    es: {
      'fill-blank': `Genera ${count} ejercicios de completar espacios para nivel ${level}...`,
      'multiple-choice': `Genera ${count} preguntas de opción múltiple para nivel ${level}...`,
      // ... more types
    },
    fr: {
      'fill-blank': `Génère ${count} exercices à trous pour niveau ${level}...`,
      // ... more types
    },
  };

  return templates[lang as keyof typeof templates]?.[type] || templates.es[type];
}
```

**Key Features**:
- ✅ Exercise type specialization
- ✅ Receives vocabulary from previous step
- ✅ Language-specific prompts per exercise type
- ✅ Suspend for review

---

#### `lib/mastra/steps/grammar.ts` (NEW - DEFERRED)
**Purpose**: Generate grammar concepts (Coming Soon)

```typescript
// Placeholder for Phase 3+
export const generateGrammarStep = createStep({
  id: 'generate-grammar',
  execute: async () => {
    throw new Error('Grammar generation coming soon');
  }
});
```

---

### 3. Workflow Definitions

#### `lib/mastra/workflows/content-generation.ts` (NEW)
**Purpose**: Main workflow orchestrating all steps

```typescript
import { createWorkflow } from '@mastra/core';
import { generateVocabularyStep } from '../steps/vocabulary';
import { generateExercisesStep } from '../steps/exercises';

/**
 * Phase 1: Batch Generation Workflow
 * Runs all steps in parallel, no suspend/resume
 */
export const batchContentWorkflow = createWorkflow({
  name: 'batch-content-generation',
  triggerSchema: z.object({
    readingText: z.string(),
    targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    targetLanguage: z.enum(['es', 'fr', 'de']),
  }),
})
  .parallel([
    generateVocabularyStep.bind({ maxItems: 15 }),
    generateExercisesStep.bind({ exerciseType: 'fill-blank', count: 5 }),
    generateExercisesStep.bind({ exerciseType: 'multiple-choice', count: 5 }),
  ])
  .commit();

/**
 * Phase 2: Interactive Workflow
 * Steps run sequentially with suspend/resume
 */
export const interactiveContentWorkflow = createWorkflow({
  name: 'interactive-content-generation',
  triggerSchema: z.object({
    readingText: z.string(),
    targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    targetLanguage: z.enum(['es', 'fr', 'de']),
  }),
})
  .then(generateVocabularyStep)
  .then(generateExercisesStep.bind({ exerciseType: 'fill-blank' }))
  .then(generateExercisesStep.bind({ exerciseType: 'multiple-choice' }))
  .commit();

/**
 * Phase 0: Single-step workflows (for individual Generate buttons)
 */
export const vocabularyOnlyWorkflow = createWorkflow({
  name: 'vocabulary-only',
  triggerSchema: z.object({
    readingText: z.string(),
    targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    targetLanguage: z.enum(['es', 'fr', 'de']),
  }),
})
  .then(generateVocabularyStep)
  .commit();

export const exercisesOnlyWorkflow = createWorkflow({
  name: 'exercises-only',
  triggerSchema: z.object({
    readingText: z.string(),
    vocabulary: z.array(z.any()),
    exerciseType: z.enum(['fill-blank', 'multiple-choice', 'matching', 'translation']),
    targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    targetLanguage: z.enum(['es', 'fr', 'de']),
  }),
})
  .then(generateExercisesStep)
  .commit();
```

**Key Decisions**:
- ❓ How does `.bind()` work in Mastra? (check docs)
- ✅ 3 workflows: batch (parallel), interactive (sequential), single-step
- ✅ Language passed through entire workflow

---

### 4. API Endpoints

#### `app/api/v1/mastra/workflows/trigger/route.ts` (NEW)
**Purpose**: Start a workflow

```typescript
import { NextResponse } from 'next/server';
import { getMastraInstance } from '@/lib/mastra/config';
import {
  batchContentWorkflow,
  interactiveContentWorkflow,
  vocabularyOnlyWorkflow,
  exercisesOnlyWorkflow
} from '@/lib/mastra/workflows/content-generation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workflowType, ...params } = body;

    const mastra = await getMastraInstance();

    // Select workflow
    const workflows = {
      batch: batchContentWorkflow,
      interactive: interactiveContentWorkflow,
      'vocabulary-only': vocabularyOnlyWorkflow,
      'exercises-only': exercisesOnlyWorkflow,
    };

    const workflow = workflows[workflowType as keyof typeof workflows];
    if (!workflow) {
      return NextResponse.json({ error: 'Invalid workflow type' }, { status: 400 });
    }

    // Trigger workflow
    const run = await workflow.execute(params);

    return NextResponse.json({
      success: true,
      runId: run.id,
      status: run.status,
      data: run.status === 'suspended' ? run.suspendData : run.result,
    });

  } catch (error) {
    console.error('Workflow trigger error:', error);
    return NextResponse.json({ error: 'Failed to start workflow' }, { status: 500 });
  }
}
```

---

#### `app/api/v1/mastra/workflows/[runId]/status/route.ts` (NEW)
**Purpose**: Check workflow status

```typescript
import { NextResponse } from 'next/server';
import { getMastraInstance } from '@/lib/mastra/config';

export async function GET(
  request: Request,
  { params }: { params: { runId: string } }
) {
  try {
    const mastra = await getMastraInstance();
    const run = await mastra.getWorkflowRun(params.runId);

    return NextResponse.json({
      runId: run.id,
      status: run.status,
      currentStep: run.currentStep,
      data: run.status === 'suspended' ? run.suspendData : run.result,
    });

  } catch (error) {
    console.error('Workflow status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
```

---

#### `app/api/v1/mastra/workflows/[runId]/resume/route.ts` (NEW)
**Purpose**: Resume suspended workflow with user feedback

```typescript
import { NextResponse } from 'next/server';
import { getMastraInstance } from '@/lib/mastra/config';

export async function POST(
  request: Request,
  { params }: { params: { runId: string } }
) {
  try {
    const body = await request.json();
    const { resumeData } = body;

    const mastra = await getMastraInstance();
    const run = await mastra.getWorkflowRun(params.runId);

    // Resume workflow
    const resumed = await run.resume({
      resumeData,
    });

    return NextResponse.json({
      runId: resumed.id,
      status: resumed.status,
      data: resumed.status === 'suspended' ? resumed.suspendData : resumed.result,
    });

  } catch (error) {
    console.error('Workflow resume error:', error);
    return NextResponse.json({ error: 'Failed to resume workflow' }, { status: 500 });
  }
}
```

---

### 5. Database Schema

#### Supabase Migration: `mastra_workflow_runs` (NEW TABLE - if needed)

**Question**: Does Mastra auto-create tables or do we need migration?

```sql
-- If manual migration needed:
CREATE TABLE mastra_workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'suspended', 'success', 'failed', 'waiting')),
  current_step TEXT,
  input_data JSONB NOT NULL,
  output_data JSONB,
  suspend_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),

  INDEX idx_workflow_status (status),
  INDEX idx_workflow_user (user_id)
);

-- RLS policies
ALTER TABLE mastra_workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workflow runs"
  ON mastra_workflow_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert workflow runs"
  ON mastra_workflow_runs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update workflow runs"
  ON mastra_workflow_runs FOR UPDATE
  USING (true);
```

---

### 6. Frontend Components

#### `app/lessons/[lessonId]/create/vocabulary/page.tsx` (MODIFY - Phase 0)
**Add Generate Button**

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function VocabularyTab() {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      // Get reading text from lesson context
      const readingText = getLessonReadingText();

      // Trigger vocabulary-only workflow
      const res = await fetch('/api/v1/mastra/workflows/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowType: 'vocabulary-only',
          readingText,
          targetLevel: 'A1', // From lesson metadata
          targetLanguage: 'es',
        }),
      });

      const { runId, data } = await res.json();

      // For Phase 0: Auto-approve (no suspend/resume)
      // Populate vocabulary form with generated items
      populateVocabularyForm(data.vocabulary);

    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <Button onClick={handleGenerate} disabled={generating}>
        {generating ? 'Generating...' : 'Generate Vocabulary ✨'}
      </Button>
      {/* Existing vocabulary form */}
    </div>
  );
}
```

---

#### `app/lessons/[lessonId]/create/wizard/page.tsx` (NEW - Phase 1)
**Batch Generation Wizard**

```tsx
'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function ContentGenerationWizard() {
  const [readingText, setReadingText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      // Trigger batch workflow
      const res = await fetch('/api/v1/mastra/workflows/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowType: 'batch',
          readingText,
          targetLevel: 'A1',
          targetLanguage: 'es',
        }),
      });

      const { runId } = await res.json();

      // Poll for completion (parallel steps)
      const finalResults = await pollWorkflowStatus(runId);
      setResults(finalResults);

    } catch (error) {
      console.error('Batch generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6">
      <h1>Content Generation Wizard</h1>

      <Textarea
        placeholder="Paste your reading text here..."
        value={readingText}
        onChange={(e) => setReadingText(e.target.value)}
        rows={10}
      />

      <Button onClick={handleGenerate} disabled={generating}>
        {generating ? 'Generating All Content...' : 'Generate All ⚡'}
      </Button>

      {results && (
        <div>
          <h2>Results</h2>
          {/* Show vocab, exercises, etc. */}
        </div>
      )}
    </div>
  );
}

async function pollWorkflowStatus(runId: string) {
  while (true) {
    const res = await fetch(`/api/v1/mastra/workflows/${runId}/status`);
    const { status, data } = await res.json();

    if (status === 'success') return data;
    if (status === 'failed') throw new Error('Workflow failed');

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

---

#### `app/lessons/[lessonId]/create/chat/page.tsx` (NEW - Phase 2)
**Interactive Chat Interface**

```tsx
'use client';

import { useState } from 'react';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';

export default function InteractiveChatGeneration() {
  const [messages, setMessages] = useState<any[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [currentSuspendData, setCurrentSuspendData] = useState<any>(null);

  const handleStart = async (readingText: string) => {
    // Trigger interactive workflow
    const res = await fetch('/api/v1/mastra/workflows/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowType: 'interactive',
        readingText,
        targetLevel: 'A1',
        targetLanguage: 'es',
      }),
    });

    const { runId, status, data } = await res.json();
    setRunId(runId);

    if (status === 'suspended') {
      // Show suspended data to user
      setMessages([
        { role: 'user', content: readingText },
        { role: 'assistant', content: `Here's the vocabulary I generated. Review?`, data: data.vocabulary }
      ]);
      setCurrentSuspendData(data);
    }
  };

  const handleUserFeedback = async (feedback: string, approved: boolean) => {
    if (!runId) return;

    // Resume workflow
    const res = await fetch(`/api/v1/mastra/workflows/${runId}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeData: { userFeedback: feedback, approved }
      }),
    });

    const { status, data } = await res.json();

    if (status === 'suspended') {
      // Next step suspended, show to user
      setMessages(prev => [...prev,
        { role: 'user', content: feedback },
        { role: 'assistant', content: `Now let's do exercises. Review?`, data: data.exercises }
      ]);
      setCurrentSuspendData(data);
    } else if (status === 'success') {
      // All done!
      setMessages(prev => [...prev,
        { role: 'assistant', content: `All done! Here's your complete lesson content.`, data }
      ]);
    }
  };

  return (
    <div className="chat-container">
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} />
      ))}

      <ChatInput
        onSubmit={handleUserFeedback}
        disabled={!currentSuspendData}
      />
    </div>
  );
}
```

---

### 7. Language Swapping Strategy

**Problem**: Different languages need different prompts

**Solution**: Prompt factory functions

```typescript
// lib/mastra/prompts/index.ts (NEW)

export const PROMPTS = {
  vocabulary: {
    es: (level: string, maxItems: number) => `
      Eres un profesor de español experto.
      Extrae ${maxItems} palabras importantes de nivel ${level}.
      ...
    `,
    fr: (level: string, maxItems: number) => `
      Tu es un professeur de français expert.
      Extrais ${maxItems} mots importants de niveau ${level}.
      ...
    `,
    de: (level: string, maxItems: number) => `
      Du bist ein erfahrener Deutschlehrer.
      Extrahiere ${maxItems} wichtige Wörter der Stufe ${level}.
      ...
    `,
  },

  exercises: {
    'fill-blank': {
      es: (level: string, count: number) => `...`,
      fr: (level: string, count: number) => `...`,
      de: (level: string, count: number) => `...`,
    },
    'multiple-choice': {
      es: (level: string, count: number) => `...`,
      fr: (level: string, count: number) => `...`,
      de: (level: string, count: number) => `...`,
    },
  },
};

export function getPrompt(
  category: 'vocabulary' | 'exercises',
  language: string,
  type?: string
) {
  if (category === 'vocabulary') {
    return PROMPTS.vocabulary[language as keyof typeof PROMPTS.vocabulary];
  }

  if (category === 'exercises' && type) {
    return PROMPTS.exercises[type as keyof typeof PROMPTS.exercises][language];
  }

  throw new Error('Invalid prompt category');
}
```

---

## 🧪 Testing Plan

### Unit Tests
- [ ] Test each Mastra step in isolation
- [ ] Test prompt factory functions
- [ ] Test language swapping

### Integration Tests
- [ ] Test workflow execution (batch, interactive)
- [ ] Test suspend/resume with mock user feedback
- [ ] Test Supabase storage persistence

### E2E Tests
- [ ] Phase 0: Click Generate button → verify form populated
- [ ] Phase 1: Wizard flow → verify all content generated
- [ ] Phase 2: Chat flow → simulate user feedback loop

---

## 📋 Migration Steps

### Step 1: Install & Configure
1. `npm install @mastra/core`
2. Create `lib/mastra/config.ts`
3. Test Mastra initialization
4. Set up Supabase storage adapter

### Step 2: Build Workflow Steps
1. Create `lib/mastra/steps/vocabulary.ts`
2. Create `lib/mastra/steps/exercises.ts`
3. Create `lib/mastra/prompts/index.ts`
4. Test steps individually

### Step 3: Build Workflows
1. Create `lib/mastra/workflows/content-generation.ts`
2. Test batch workflow (parallel)
3. Test interactive workflow (sequential with suspend)
4. Test single-step workflows

### Step 4: Build API Endpoints
1. Create `/api/v1/mastra/workflows/trigger/route.ts`
2. Create `/api/v1/mastra/workflows/[runId]/status/route.ts`
3. Create `/api/v1/mastra/workflows/[runId]/resume/route.ts`
4. Test API with Postman/curl

### Step 5: Build Frontend (Phase 0)
1. Add Generate buttons to Vocabulary tab
2. Add Generate buttons to Exercises tab
3. Wire up API calls
4. Test in lesson create view

### Step 6: Build Frontend (Phase 1)
1. Create Wizard component
2. Wire up batch workflow
3. Test batch generation

### Step 7: Build Frontend (Phase 2)
1. Create Chat UI components
2. Wire up interactive workflow
3. Implement suspend/resume UI
4. Test interactive flow

### Step 8: Cleanup
1. Remove broken LangChain supervisor code
2. Update documentation
3. Add language swapping tests

---

## ❓ Open Questions

1. **Mastra Supabase Integration**:
   - Does Mastra have built-in Postgres adapter?
   - Do we need custom storage implementation?
   - How are workflow snapshots stored?

2. **Workflow API**:
   - Confirm `.bind()` syntax for step parameters
   - How to access previous step output in next step?
   - Error handling patterns?

3. **Frontend State Management**:
   - Use React Query for polling workflow status?
   - WebSocket for real-time updates?
   - Local state vs global state for workflow data?

4. **Exercise Type Tools**:
   - One tool per exercise type OR one tool with type parameter?
   - Should matching/translation exercises use different prompts entirely?

5. **Grammar Generation**:
   - Defer entirely or implement basic version?
   - More complex than vocab/exercises - needs research

---

## 📊 Success Criteria

### Phase 0 (Immediate)
- ✅ User clicks "Generate Vocabulary" → form populates with 15 items
- ✅ User clicks "Generate Exercises" → form populates with 5 exercises
- ✅ Generation completes in <30 seconds
- ✅ No Zod validation errors

### Phase 1 (Short-term)
- ✅ User pastes text in wizard → all content generates in parallel
- ✅ Shows progress for each step
- ✅ Results exportable to lesson

### Phase 2 (Long-term)
- ✅ User pastes text → starts chat conversation
- ✅ AI presents vocabulary → user can approve/edit/refine
- ✅ AI presents exercises → user can approve/edit/refine
- ✅ Workflow resumes correctly after user feedback
- ✅ Final content saved to lesson

---

**Status**: Ready for review and implementation

**Next**: Review with team, answer open questions, begin Step 1
