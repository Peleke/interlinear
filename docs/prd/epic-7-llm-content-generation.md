# Epic 7: LLM-Powered Content Generation

**Status**: 📋 Planned
**Priority**: P1 - High Value
**Estimated Effort**: 18-21 story points (~28 hours)
**Dependencies**: Epic 05 (Content Builders), Epic 06 (Course Management - optional)

---

## Overview

Transform reading texts into complete lesson components (vocabulary, grammar, exercises) using LLM analysis. This automates the most time-consuming part of lesson authoring while maintaining quality through human review.

**Key Architectural Decisions**:
- ✅ Anthropic Claude (Sonnet 3.5) as primary LLM - superior structured outputs
- ✅ Incremental generation (vocab → grammar → exercises) - better UX and cost control
- ✅ Server-side API with streaming - security and progress updates
- ✅ Multi-layer validation (structure + content + difficulty) - prevent hallucinations
- ✅ Mandatory human review - authors approve before insertion
- ✅ AI-generated metadata flags - transparency and tracking

**Success Vision**: Author clicks "Generate from Reading" → 30 seconds later → reviews 20 vocabulary items, 5 grammar points, 10 exercises → approves with one click → complete lesson ready.

---

## User Stories

### 7.1: Database Schema for AI Generation Metadata (2 pts)

**As a** developer
**I want** database columns to track AI-generated content
**So that** we can distinguish AI content, track generation costs, and enable analytics

**Acceptance Criteria**:
- [ ] Add `ai_generated` boolean column to relevant tables (vocabulary_items, grammar_concepts, exercises)
- [ ] Add `ai_generation_metadata` JSONB column for tracking (model, prompt_version, tokens, confidence)
- [ ] Add `ai_generation_cost_tracking` table for usage analytics
- [ ] Migration tested on local Supabase instance
- [ ] Migration runs successfully without errors

**Technical Notes**:
```sql
-- Add AI metadata to content tables
ALTER TABLE public.vocabulary_items
  ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN ai_metadata JSONB;

ALTER TABLE public.grammar_concepts
  ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN ai_metadata JSONB;

ALTER TABLE public.exercises
  ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN ai_metadata JSONB;

-- Cost tracking table
CREATE TABLE public.ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  lesson_id TEXT REFERENCES public.lessons(id),
  reading_id UUID REFERENCES public.library_readings(id),
  generation_type TEXT NOT NULL, -- 'vocabulary', 'grammar', 'exercises', 'dialogs'
  model TEXT NOT NULL, -- 'claude-sonnet-3.5', etc.
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  estimated_cost_usd DECIMAL(10, 6),
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_logs_user ON ai_generation_logs(user_id);
CREATE INDEX idx_ai_logs_created ON ai_generation_logs(created_at DESC);

-- RLS
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI logs"
  ON public.ai_generation_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

---

### 7.2: LLM Service Layer with Anthropic Integration (3 pts)

**As a** developer
**I want** a service layer for LLM interactions
**So that** we abstract provider logic and support structured outputs

**Acceptance Criteria**:
- [ ] `LLMService` class created in `lib/services/llm.ts`
- [ ] Anthropic SDK integration (`@anthropic-ai/sdk`)
- [ ] Zod schemas defined for each generation type
- [ ] `generateVocabulary()` method extracts vocab from reading
- [ ] `generateGrammar()` method identifies grammar patterns
- [ ] `generateExercises()` method creates exercises
- [ ] All methods use structured outputs (JSON mode)
- [ ] Token usage tracking for cost management
- [ ] Error handling for rate limits, timeouts, malformed responses
- [ ] Unit tests with mocked LLM responses

**Technical Notes**:
```typescript
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// Zod schemas for validation
const VocabularyItemSchema = z.object({
  word: z.string(),
  english_translation: z.string(),
  part_of_speech: z.enum(['noun', 'verb', 'adjective', 'adverb', 'other']),
  difficulty_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  example_sentence: z.string().optional(),
  appears_in_reading: z.boolean()
})

const GrammarConceptSchema = z.object({
  name: z.string(),
  description: z.string(),
  example_from_reading: z.string(),
  difficulty_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
})

const ExerciseSchema = z.object({
  type: z.enum(['fill-blank', 'multiple-choice', 'translation']),
  prompt: z.string(),
  answer: z.string(),
  distractors: z.array(z.string()).optional(), // For multiple choice
  explanation: z.string().optional(),
  xp_value: z.number()
})

export class LLMService {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }

  /**
   * Generate vocabulary from reading
   */
  async generateVocabulary(
    readingText: string,
    targetDifficultyLevel: string,
    maxItems: number = 20
  ): Promise<VocabularyGenerationResult> {
    const prompt = `You are an expert Spanish language teacher. Analyze this reading text and extract the ${maxItems} most important vocabulary items for a ${targetDifficultyLevel} student.

Reading Text:
${readingText}

Extract vocabulary that:
1. Appears in the reading (verify this!)
2. Is appropriate for ${targetDifficultyLevel} level
3. Represents key concepts or frequently used words
4. Covers different parts of speech

Return JSON array of vocabulary items. Each item must include:
- word (Spanish word as it appears in text)
- english_translation
- part_of_speech
- difficulty_level (CEFR: A1-C2)
- example_sentence (from the reading)
- appears_in_reading (boolean - MUST be true)

Example format:
[
  {
    "word": "casa",
    "english_translation": "house",
    "part_of_speech": "noun",
    "difficulty_level": "A1",
    "example_sentence": "Mi casa es grande.",
    "appears_in_reading": true
  }
]`

    const response = await this.client.messages.create({
      model: 'claude-sonnet-3-5-20240620',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })

    // Parse and validate response
    const content = response.content[0].text
    const parsed = JSON.parse(content)
    const validated = z.array(VocabularyItemSchema).parse(parsed)

    // Filter out hallucinated words (not in reading)
    const verified = validated.filter(item =>
      item.appears_in_reading && readingText.toLowerCase().includes(item.word.toLowerCase())
    )

    return {
      items: verified,
      metadata: {
        model: 'claude-sonnet-3.5',
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        estimated_cost_usd: this.calculateCost(response.usage)
      }
    }
  }

  /**
   * Generate grammar concepts from reading
   */
  async generateGrammar(
    readingText: string,
    targetDifficultyLevel: string,
    maxConcepts: number = 5
  ): Promise<GrammarGenerationResult> {
    // Similar structure to generateVocabulary
    // Prompt focuses on identifying grammar patterns
  }

  /**
   * Generate exercises from reading + vocab + grammar
   */
  async generateExercises(
    readingText: string,
    vocabularyItems: string[],
    grammarConcepts: string[],
    exerciseTypes: ExerciseType[],
    count: number = 10
  ): Promise<ExerciseGenerationResult> {
    // Prompt combines reading context with lesson components
    // Generates targeted practice exercises
  }

  /**
   * Calculate cost based on token usage
   * Claude Sonnet 3.5: $3/1M input tokens, $15/1M output tokens
   */
  private calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
    const inputCost = (usage.input_tokens / 1_000_000) * 3
    const outputCost = (usage.output_tokens / 1_000_000) * 15
    return inputCost + outputCost
  }
}
```

---

### 7.3: Vocabulary Extraction API Endpoint (3 pts)

**As an** author
**I want** an API endpoint to generate vocabulary from a reading
**So that** I can quickly populate lesson vocabulary lists

**Acceptance Criteria**:
- [ ] `POST /api/lessons/:id/generate/vocabulary` endpoint created
- [ ] Accepts `reading_id` and optional `max_items`, `difficulty_level` parameters
- [ ] Calls `LLMService.generateVocabulary()` with reading text
- [ ] Returns validated vocabulary items with metadata
- [ ] Saves generation log to `ai_generation_logs` table
- [ ] Implements rate limiting (1 request per minute per user)
- [ ] Implements timeout (30 seconds max)
- [ ] Returns streaming response for progress updates
- [ ] Error handling for LLM failures, invalid readings
- [ ] Integration tests with mocked LLM

**Technical Notes**:
```typescript
// POST /api/lessons/:id/generate/vocabulary
{
  "reading_id": "uuid-here",
  "max_items": 20,
  "target_difficulty": "B1"
}

// Response (streaming JSON):
{
  "status": "processing",
  "progress": "Analyzing reading text..."
}

{
  "status": "complete",
  "items": [
    {
      "word": "aventura",
      "english_translation": "adventure",
      "part_of_speech": "noun",
      "difficulty_level": "A2",
      "example_sentence": "La aventura comenzó en la montaña.",
      "appears_in_reading": true,
      "ai_generated": true,
      "ai_metadata": {
        "model": "claude-sonnet-3.5",
        "confidence": 0.95
      }
    }
  ],
  "metadata": {
    "total_items": 18,
    "tokens_used": 2450,
    "estimated_cost_usd": 0.012
  }
}
```

---

### 7.4: Grammar Concept Extraction API Endpoint (3 pts)

**As an** author
**I want** an API endpoint to identify grammar patterns in a reading
**So that** I can link relevant grammar concepts to lessons

**Acceptance Criteria**:
- [ ] `POST /api/lessons/:id/generate/grammar` endpoint created
- [ ] Accepts `reading_id` and optional `max_concepts`, `difficulty_level` parameters
- [ ] Calls `LLMService.generateGrammar()` with reading text
- [ ] Returns grammar concepts with examples from reading
- [ ] Links to existing `grammar_concepts` table OR suggests new concepts
- [ ] Saves generation log to `ai_generation_logs` table
- [ ] Implements same rate limiting as vocabulary endpoint
- [ ] Streaming response with progress updates
- [ ] Error handling for LLM failures
- [ ] Integration tests with mocked LLM

**Technical Notes**:
```typescript
// Response format:
{
  "status": "complete",
  "concepts": [
    {
      "name": "Present Tense -ar Verbs",
      "description": "Regular -ar verb conjugation in present tense",
      "example_from_reading": "Ella camina por el parque todos los días.",
      "difficulty_level": "A1",
      "existing_concept_id": "grammar-123", // If already in DB
      "is_new": false,
      "ai_generated": true
    }
  ]
}
```

---

### 7.5: Exercise Generation API Endpoint (4 pts)

**As an** author
**I want** an API endpoint to generate practice exercises
**So that** I can create targeted exercises based on lesson content

**Acceptance Criteria**:
- [ ] `POST /api/lessons/:id/generate/exercises` endpoint created
- [ ] Accepts `reading_id`, `vocabulary_ids[]`, `grammar_concept_ids[]`, `exercise_types[]`, `count`
- [ ] Calls `LLMService.generateExercises()` with full context
- [ ] Generates fill-in-blank, multiple-choice, and translation exercises
- [ ] Exercises use vocabulary and grammar from lesson
- [ ] Each exercise includes answer and optional explanation
- [ ] Assigns appropriate XP values based on difficulty
- [ ] Saves generation log to `ai_generation_logs` table
- [ ] Rate limiting and timeout same as other endpoints
- [ ] Streaming response with progress updates
- [ ] Integration tests with mocked LLM

**Technical Notes**:
```typescript
// Request:
{
  "reading_id": "uuid",
  "vocabulary_ids": ["vocab-1", "vocab-2"],
  "grammar_concept_ids": ["grammar-1"],
  "exercise_types": ["fill-blank", "multiple-choice", "translation"],
  "count": 10
}

// Response:
{
  "status": "complete",
  "exercises": [
    {
      "type": "fill-blank",
      "prompt": "Mi hermana ____ (caminar) al parque todos los días.",
      "answer": "camina",
      "explanation": "Present tense -ar verb conjugation (3rd person singular)",
      "xp_value": 5,
      "vocabulary_used": ["caminar"],
      "grammar_used": ["Present Tense -ar Verbs"],
      "ai_generated": true
    },
    {
      "type": "multiple-choice",
      "prompt": "What does 'aventura' mean?",
      "answer": "adventure",
      "distractors": ["story", "journey", "challenge"],
      "xp_value": 3,
      "ai_generated": true
    }
  ]
}
```

---

### 7.6: Content Review UI Component (3 pts)

**As an** author
**I want** a review interface for AI-generated content
**So that** I can approve, edit, or reject items before adding to lesson

**Acceptance Criteria**:
- [ ] `GeneratedContentReviewModal` component created
- [ ] Shows generated items in categorized lists (vocabulary, grammar, exercises)
- [ ] Each item has checkbox for bulk selection
- [ ] Inline editing for corrections (click to edit)
- [ ] "AI-generated" badge visible on each item
- [ ] Displays metadata (confidence score, tokens used, cost)
- [ ] "Approve Selected" and "Reject All" buttons
- [ ] Approved items automatically added to lesson
- [ ] Modal closes on completion, shows success message
- [ ] Loading states during generation
- [ ] Error states with retry option
- [ ] Responsive design (mobile + desktop)

**UI Mockup**:
```
Generated Content Review Modal:
+----------------------------------------------------------+
| 🤖 AI-Generated Content Review                            |
| Analyzed: "Don Quixote Chapter 1" (2,450 tokens, $0.012) |
| -------------------------------------------------------- |
| 📚 Vocabulary (18 items)                                  |
| ☑ aventura (noun, A2) - "adventure"                      |
|   Example: "La aventura comenzó en la montaña"           |
|   [Edit] [Remove]                                        |
| ☑ caballero (noun, A2) - "knight"                        |
|   Example: "El caballero montó su caballo"               |
|   [Edit] [Remove]                                        |
| ...                                                      |
| -------------------------------------------------------- |
| 📖 Grammar Concepts (5 items)                             |
| ☑ Present Tense -ar Verbs (A1)                           |
|   Example: "Ella camina por el parque"                   |
|   Links to: [Existing Concept: grammar-123]              |
| ...                                                      |
| -------------------------------------------------------- |
| ✏️ Exercises (10 items)                                   |
| ☑ Fill-blank: Mi hermana ____ (caminar) al parque       |
|   Answer: camina • XP: 5 • Grammar: Present -ar          |
| ...                                                      |
| -------------------------------------------------------- |
| [Select All] [Deselect All]                              |
| [Approve Selected (33)] [Reject All] [Cancel]            |
+----------------------------------------------------------+
```

---

### 7.7: Lesson Authoring Integration (2 pts)

**As an** author
**I want** "Generate from Reading" button in lesson authoring UI
**So that** I can trigger AI generation directly from lesson editor

**Acceptance Criteria**:
- [ ] "🤖 Generate from Reading" button added to lesson editor
- [ ] Button only visible when lesson has linked reading
- [ ] Clicking button shows generation options modal
- [ ] Options modal allows selecting: vocabulary, grammar, exercises (checkboxes)
- [ ] Options modal shows reading title and word count
- [ ] Clicking "Generate" triggers API calls (incremental if multiple selected)
- [ ] Progress indicator shows generation status (vocabulary → grammar → exercises)
- [ ] On completion, opens review modal with generated content
- [ ] Button disabled during generation (prevent duplicate requests)
- [ ] Error handling with user-friendly messages
- [ ] Works with existing lesson builder tabs

**UI Mockup**:
```
Lesson Editor (with linked reading):
+------------------------------------------+
| Lesson: "Don Quixote Adventure"          |
| Tabs: [Details] [Vocabulary] [Grammar]   |
| ---------------------------------------- |
| Reading: "Don Quixote Chapter 1" (2.5k) |
| [🤖 Generate from Reading]               |
+------------------------------------------+

Generation Options Modal:
+------------------------------------------+
| Generate Content from Reading            |
| ---------------------------------------- |
| Select content types to generate:        |
| ☑ Vocabulary (up to 20 items)           |
| ☑ Grammar Concepts (up to 5 concepts)   |
| ☑ Exercises (up to 10 exercises)        |
|                                          |
| Estimated tokens: ~3,000                 |
| Estimated cost: ~$0.015                  |
|                                          |
| [Cancel] [Generate]                      |
+------------------------------------------+

Progress Modal:
+------------------------------------------+
| Generating Content...                     |
| ---------------------------------------- |
| ✅ Vocabulary (18 items found)           |
| 🔄 Grammar (analyzing patterns...)       |
| ⏳ Exercises (pending)                   |
|                                          |
| [Cancel Generation]                      |
+------------------------------------------+
```

---

### 7.8: Cost Tracking Dashboard (Optional - 1 pt)

**As an** admin/author
**I want** to view AI generation usage and costs
**So that** I can monitor budget and optimize prompts

**Acceptance Criteria**:
- [ ] `/authoring/ai-usage` page shows generation logs
- [ ] Displays total tokens used, total cost (daily, weekly, monthly)
- [ ] Shows breakdown by generation type (vocabulary, grammar, exercises)
- [ ] Lists recent generations with success/failure status
- [ ] Filterable by date range, generation type
- [ ] Export to CSV functionality
- [ ] Only accessible to authenticated users (view own usage)

**Technical Notes**:
This story is **optional** and can be deferred if time-constrained. Basic logging already exists via `ai_generation_logs` table.

---

## Technical Specification

### LLM Integration Architecture

**Provider**: Anthropic Claude (Sonnet 3.5)
- **Model**: `claude-sonnet-3-5-20240620`
- **Cost**: $3/1M input tokens, $15/1M output tokens
- **Max Tokens**: 200K context window
- **Strengths**: Superior structured outputs, instruction-following, multilingual

**Alternative/Fallback**: OpenAI GPT-4 Turbo
- **Model**: `gpt-4-turbo-preview`
- **Cost**: $10/1M input tokens, $30/1M output tokens
- **Use Case**: Fallback if Anthropic rate-limited or unavailable

**API Key Management**:
```typescript
// Environment variables
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx (fallback)

// Load in server-side code only
const llmService = new LLMService({
  provider: 'anthropic',
  fallback: 'openai'
})
```

---

### Prompt Engineering Strategies

**Vocabulary Extraction Prompt Template**:
```typescript
const VOCABULARY_PROMPT = `You are an expert Spanish language teacher creating vocabulary lists for ${targetLevel} students.

READING TEXT:
${readingText}

TASK: Extract the ${maxItems} most important vocabulary items from this reading.

REQUIREMENTS:
1. Words MUST appear in the reading text (verify before including)
2. Appropriate difficulty for ${targetLevel} (CEFR scale)
3. Prioritize: high-frequency words, thematic keywords, varied parts of speech
4. Include example sentence FROM THE READING (exact quote)

OUTPUT FORMAT (JSON array):
[
  {
    "word": "exact word from text",
    "english_translation": "translation",
    "part_of_speech": "noun|verb|adjective|adverb|other",
    "difficulty_level": "A1|A2|B1|B2|C1|C2",
    "example_sentence": "exact sentence from reading containing word",
    "appears_in_reading": true
  }
]

CRITICAL: Only include words that actually appear in the reading text. If uncertain, set appears_in_reading to false.`
```

**Grammar Concept Prompt Template**:
```typescript
const GRAMMAR_PROMPT = `You are an expert Spanish grammar teacher analyzing a reading text.

READING TEXT:
${readingText}

TASK: Identify the ${maxConcepts} most prominent grammar concepts in this reading.

FOCUS ON:
- Verb tenses and conjugations
- Sentence structures
- Pronoun usage
- Agreement patterns
- Idiomatic constructions

For each concept:
1. Name (e.g., "Present Tense -ar Verbs")
2. Brief description
3. Specific example FROM THE READING
4. Difficulty level (CEFR: A1-C2)

OUTPUT FORMAT (JSON array):
[
  {
    "name": "Grammar Concept Name",
    "description": "Brief explanation",
    "example_from_reading": "exact sentence demonstrating concept",
    "difficulty_level": "A1|A2|B1|B2|C1|C2"
  }
]`
```

**Exercise Generation Prompt Template**:
```typescript
const EXERCISE_PROMPT = `You are creating practice exercises for Spanish language learners.

CONTEXT:
Reading: ${readingTitle}
Vocabulary: ${vocabularyWords.join(', ')}
Grammar: ${grammarConcepts.join(', ')}

TASK: Generate ${count} exercises covering the vocabulary and grammar from this lesson.

EXERCISE TYPES NEEDED:
${exerciseTypes.map(type => `- ${type}`).join('\n')}

REQUIREMENTS:
1. Use vocabulary and grammar from the lesson
2. Vary difficulty appropriately
3. Provide correct answer
4. For multiple choice: include 3 plausible distractors
5. For fill-blank: use sentence from reading or create realistic context
6. For translation: English → Spanish or Spanish → English

OUTPUT FORMAT (JSON array):
[
  {
    "type": "fill-blank|multiple-choice|translation",
    "prompt": "exercise question",
    "answer": "correct answer",
    "distractors": ["wrong1", "wrong2", "wrong3"], // only for multiple-choice
    "explanation": "why this is correct (optional)",
    "xp_value": 3-10 based on difficulty,
    "vocabulary_used": ["word1", "word2"],
    "grammar_used": ["concept1"]
  }
]`
```

---

### Validation Layers

**Layer 1: Schema Validation (Zod)**
```typescript
// Ensures JSON structure matches expected format
const validated = VocabularyItemSchema.parse(llmResponse)
```

**Layer 2: Content Grounding**
```typescript
// Verify vocabulary actually appears in reading
const verified = validated.filter(item =>
  readingText.toLowerCase().includes(item.word.toLowerCase())
)
```

**Layer 3: Difficulty Validation**
```typescript
// Ensure difficulty matches CEFR expectations
const difficultyCheck = (item: VocabularyItem, targetLevel: string) => {
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const itemIndex = levelOrder.indexOf(item.difficulty_level)
  const targetIndex = levelOrder.indexOf(targetLevel)

  // Allow ±1 level variance
  return Math.abs(itemIndex - targetIndex) <= 1
}
```

**Layer 4: Human Review**
```typescript
// All content must be reviewed before insertion
// Review UI allows editing, approval, rejection
```

---

### Rate Limiting & Cost Management

**Rate Limits**:
```typescript
// Per-user rate limits
const RATE_LIMITS = {
  vocabulary: { requests: 10, window: '1 hour' },
  grammar: { requests: 10, window: '1 hour' },
  exercises: { requests: 5, window: '1 hour' }
}

// Implement with Upstash Redis or in-memory cache
async function checkRateLimit(userId: string, generationType: string) {
  const key = `ratelimit:${userId}:${generationType}`
  const count = await redis.incr(key)

  if (count === 1) {
    await redis.expire(key, 3600) // 1 hour
  }

  const limit = RATE_LIMITS[generationType].requests
  if (count > limit) {
    throw new Error('Rate limit exceeded. Try again in 1 hour.')
  }
}
```

**Cost Tracking**:
```typescript
// Log every generation for analytics
await supabase.from('ai_generation_logs').insert({
  user_id: userId,
  lesson_id: lessonId,
  reading_id: readingId,
  generation_type: 'vocabulary',
  model: 'claude-sonnet-3.5',
  prompt_tokens: usage.input_tokens,
  completion_tokens: usage.output_tokens,
  total_tokens: usage.input_tokens + usage.output_tokens,
  estimated_cost_usd: calculateCost(usage),
  success: true
})

// Budget alerts (optional future enhancement)
const monthlyUsage = await getMonthlyTokenUsage(userId)
if (monthlyUsage.cost_usd > MONTHLY_BUDGET) {
  // Send warning email
}
```

---

### Error Handling

**LLM Provider Errors**:
```typescript
try {
  const result = await llmService.generateVocabulary(...)
} catch (error) {
  if (error instanceof AnthropicRateLimitError) {
    // Fallback to OpenAI or queue for retry
    return await fallbackToOpenAI(...)
  } else if (error instanceof AnthropicTimeoutError) {
    // Retry with exponential backoff
    return await retryWithBackoff(...)
  } else if (error instanceof AnthropicInvalidRequestError) {
    // Log and return user-friendly error
    logger.error('Invalid LLM request', error)
    throw new Error('Content generation failed. Please try a different reading.')
  }
}
```

**Validation Failures**:
```typescript
// Partial success: return validated items, log failures
const { valid, invalid } = validateGeneratedItems(items)

if (invalid.length > 0) {
  logger.warn(`${invalid.length} items failed validation`, invalid)
}

return {
  items: valid,
  warnings: invalid.map(item => ({
    item,
    reason: 'Failed validation (not in reading text)'
  }))
}
```

**Timeout Handling**:
```typescript
// Set 30-second timeout on all LLM calls
const result = await Promise.race([
  llmService.generate(...),
  timeout(30000)
])
```

---

## Components

**File Structure**:
```
lib/services/
├── llm.ts                       # LLMService class
└── ai-validation.ts             # Validation helpers

app/api/lessons/[id]/generate/
├── vocabulary/route.ts          # Vocabulary generation endpoint
├── grammar/route.ts             # Grammar generation endpoint
└── exercises/route.ts           # Exercise generation endpoint

components/authoring/
├── GeneratedContentReviewModal.tsx   # Review UI
├── GenerationOptionsModal.tsx        # Generation trigger
├── GenerationProgressIndicator.tsx   # Progress UI
└── AIGeneratedBadge.tsx             # "AI-generated" badge

app/authoring/ai-usage/
└── page.tsx                     # Usage dashboard (optional)
```

---

## Dependencies

- **Requires**: Epic 05 (Content Builders - lesson structure exists)
- **Integrates With**: Epic 06 (Course Management - optional course context)
- **External**: Anthropic SDK, Zod validation library

**Package Installations**:
```bash
npm install @anthropic-ai/sdk zod
```

---

## Testing Checklist

- [ ] Mock LLM responses for unit tests
- [ ] Test vocabulary extraction with various reading lengths
- [ ] Test grammar extraction with different CEFR levels
- [ ] Test exercise generation with mixed exercise types
- [ ] Verify Zod schema validation catches malformed responses
- [ ] Test content grounding (hallucination detection)
- [ ] Test rate limiting (simulate rapid requests)
- [ ] Test timeout handling (mock slow LLM responses)
- [ ] Test fallback to OpenAI on Anthropic failure
- [ ] Verify AI metadata saved correctly
- [ ] Test cost tracking logs
- [ ] Test review UI approve/reject flow
- [ ] Test inline editing in review modal
- [ ] Verify approved items added to lesson
- [ ] Test error states in UI (LLM failure, timeout, validation)

---

## Technical Risks & Mitigations

### Risk: LLM Hallucinations (High Impact)
**Issue**: LLM generates vocabulary not present in reading or incorrect grammar
- **Impact**: Authors approve incorrect content, learners confused
- **Mitigation**:
  - Multi-layer validation (schema + grounding + difficulty)
  - Mandatory human review (no auto-insert)
  - "AI-generated" badges for transparency
  - Example sentences must be exact quotes from reading
- **Testing**: Deliberately use readings with uncommon words, verify extraction accuracy

### Risk: Cost Overruns (Medium Impact)
**Issue**: Excessive LLM usage → budget exceeded
- **Impact**: High API bills, potential service disruption
- **Mitigation**:
  - Per-user rate limiting (10 generations/hour)
  - Cost tracking dashboard
  - Budget alerts (future enhancement)
  - Token usage optimization (concise prompts)
- **Monitoring**: Daily cost reports, alert if >$50/day

### Risk: Rate Limiting from Provider (Medium Impact)
**Issue**: Anthropic rate limits hit during high usage
- **Impact**: Generation failures, poor user experience
- **Mitigation**:
  - Fallback to OpenAI GPT-4
  - Exponential backoff retry logic
  - Queue system for deferred processing (future)
  - User-friendly error messages
- **Testing**: Simulate rate limit errors, verify fallback works

### Risk: Timeout on Large Readings (Low Impact)
**Issue**: Very long readings (>10k words) → LLM timeout
- **Impact**: Generation fails, user frustration
- **Mitigation**:
  - 30-second timeout with retry option
  - Reading length validation (warn if >5k words)
  - Chunking strategy for very long texts (future)
  - Progress indicator shows "still processing"
- **Limit**: Recommend readings <5,000 words for optimal results

### Risk: Prompt Injection Attacks (Low Impact)
**Issue**: Malicious user crafts reading to manipulate LLM output
- **Impact**: Unexpected or inappropriate content generated
- **Mitigation**:
  - Treat all readings as untrusted input
  - Validate output structure rigorously
  - Human review required (catches inappropriate content)
  - Content moderation flags (future enhancement)
- **Monitoring**: Log suspicious patterns in generation logs

---

## Success Metrics

**Epic Complete When**:
- Author can generate vocabulary from reading (18+ items in <30 seconds)
- Author can generate grammar concepts (5+ concepts in <30 seconds)
- Author can generate exercises (10+ exercises in <45 seconds)
- Review UI allows approve/edit/reject workflow
- All AI-generated content clearly marked
- Cost tracking logs every generation
- Rate limiting prevents abuse
- >90% of generated content passes validation
- Authors approve >70% of generated items (quality threshold)

**Stretch Goals (Post-MVP)**:
- Dialog generation from reading themes
- Adaptive difficulty (learns user preferences)
- Multi-language support (French, German, Italian)
- Bulk generation (entire course from reading list)

---

## Future Enhancements (Out of Scope for MVP)

- **Dialog Generation**: Conversational dialogs using reading themes/vocab
- **Adaptive Prompts**: Learn from user edits to improve future generations
- **Batch Generation**: Generate content for multiple lessons at once
- **Custom Prompt Templates**: Authors customize generation instructions
- **Quality Scoring**: Confidence scores for each generated item
- **Multi-Model Comparison**: Run same prompt through Claude + GPT-4, show both results
- **Fine-tuned Models**: Train custom model on approved author content

---

## Cost Estimation

**Per Generation Estimates** (Claude Sonnet 3.5):

| Generation Type | Avg Tokens | Cost/Request | Requests/Hour (Rate Limit) | Max Cost/Hour/User |
|-----------------|------------|--------------|----------------------------|--------------------|
| Vocabulary      | 3,000      | $0.012       | 10                         | $0.12              |
| Grammar         | 2,500      | $0.010       | 10                         | $0.10              |
| Exercises       | 4,000      | $0.018       | 5                          | $0.09              |
| **Total**       | -          | -            | -                          | **$0.31/hour**     |

**Monthly Budget** (100 active authors, 20 generations/week each):
- 100 users × 20 generations/week × 4 weeks = 8,000 generations/month
- Avg $0.015/generation = **$120/month**
- With 50% buffer for peak usage: **$180/month budget**

**ROI Justification**: Saves 2+ hours of manual content creation per lesson → $30-60/hour value for authors.
