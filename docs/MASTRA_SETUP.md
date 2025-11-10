# Mastra AI Content Generation Setup

Complete guide for setting up and using Mastra for AI-powered lesson content generation.

## What is Mastra?

Mastra is a workflow orchestration framework that provides:
- ✅ Built-in suspend/resume at checkpoints
- ✅ Streaming support with Server-Sent Events (SSE)
- ✅ Automatic state persistence
- ✅ Tool integration with structured outputs
- ✅ Simple API for complex workflows

We use it to generate vocabulary, grammar concepts, and exercises from reading texts.

## Prerequisites

1. **Node.js 18+** (you have this)
2. **Supabase database** (set up)
3. **OpenAI API key** (required)

## Installation

Already installed! But for reference:

```bash
npm install @mastra/core openai @anthropic-ai/sdk
```

## Environment Setup

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 2. Add to `.env.local`

Create or update `.env.local`:

```env
# OpenAI API Key (required)
OPENAI_API_KEY=sk-your-actual-api-key-here

# Supabase (already set up)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Verify Setup

```bash
# Check environment variables are loaded
npm run dev

# Should not see errors about OPENAI_API_KEY
```

## Project Structure

```
lib/mastra/
├── index.ts                    # Public API (use this from your routes)
├── types/
│   └── index.ts               # Shared TypeScript types
├── providers/
│   └── openai.ts              # OpenAI configuration + cost calculation
├── tools/
│   ├── vocabulary.ts          # Vocabulary extraction tool
│   ├── grammar.ts             # Grammar identification tool
│   └── exercises.ts           # Exercise generation tool
└── workflows/
    └── contentGeneration.ts   # Main workflow orchestration
```

## Usage

### Basic API

Import from `lib/mastra`:

```typescript
import {
  generateVocabulary,
  generateGrammar,
  generateExercises,
  generateCompleteLesson,
} from '@/lib/mastra';
```

### Example 1: Generate Vocabulary Only

```typescript
const result = await generateVocabulary({
  lessonId: '123e4567-e89b-12d3-a456-426614174000',
  readingText: 'La maison est grande et le jardin est beau...',
  targetCEFRLevel: 'B1',
  maxItems: 15,
});

if (result.success) {
  console.log('Vocabulary:', result.data.vocabulary);
  console.log('Cost:', result.costUSD); // e.g., 0.01
  console.log('Tokens used:', result.tokensUsed); // e.g., 500
  console.log('Generation ID:', result.generationId); // For resuming later
}
```

### Example 2: Generate Grammar Only

```typescript
const result = await generateGrammar({
  lessonId: '123e4567-e89b-12d3-a456-426614174000',
  readingText: 'La maison est grande et le jardin est beau...',
  targetCEFRLevel: 'B1',
  maxConcepts: 5,
});

if (result.success) {
  console.log('Grammar:', result.data.grammar_concepts);
  console.log('Cost:', result.costUSD); // e.g., 0.008
}
```

### Example 3: Generate Exercises

```typescript
const result = await generateExercises({
  lessonId: '123e4567-e89b-12d3-a456-426614174000',
  readingText: 'La maison est grande et le jardin est beau...',
  vocabularyItems: ['maison', 'grande', 'jardin', 'beau'],
  grammarConcepts: ['Adjective Agreement', 'Present Tense'],
  targetCEFRLevel: 'B1',
  exerciseTypes: ['translation', 'multiple_choice', 'fill_blank'],
  exercisesPerType: 3,
});

if (result.success) {
  console.log('Exercises:', result.data.exercises);
  console.log('Cost:', result.costUSD); // e.g., 0.015
}
```

### Example 4: Generate Complete Lesson

```typescript
const result = await generateCompleteLesson({
  lessonId: '123e4567-e89b-12d3-a456-426614174000',
  readingText: 'La maison est grande et le jardin est beau...',
  targetCEFRLevel: 'B1',
});

if (result.success) {
  const { vocabulary, grammar, exercises } = result.data;
  console.log('Complete lesson generated!');
  console.log('Total cost:', result.costUSD); // e.g., 0.033
  console.log('Total tokens:', result.tokensUsed); // e.g., 2500
}
```

## Using in API Routes

### Example API Route: `/api/lessons/[id]/generate/vocabulary`

```typescript
import { NextResponse } from 'next/server';
import { generateVocabulary } from '@/lib/mastra';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { readingText, targetCEFRLevel } = await request.json();

  // Generate vocabulary
  const result = await generateVocabulary({
    lessonId: params.id,
    readingText,
    targetCEFRLevel,
    maxItems: 15,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  // Save to ai_generations table
  const { error } = await supabase
    .from('ai_generations')
    .insert({
      lesson_id: params.id,
      generation_type: 'vocabulary',
      status: 'completed',
      input_data: { readingText, targetCEFRLevel },
      output_data: result.data,
      tokens_used: result.tokensUsed,
      cost_usd: result.costUSD,
      completed_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to save generation' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    vocabulary: result.data.vocabulary,
    generationId: result.generationId,
    cost: result.costUSD,
    tokensUsed: result.tokensUsed,
  });
}
```

## Workflow with Checkpoints

The workflow supports suspend/resume at three checkpoints:

```
1. Vocabulary Generation → CHECKPOINT
   ↓ (User reviews/approves)
2. Grammar Generation → CHECKPOINT
   ↓ (User reviews/approves)
3. Exercise Generation → CHECKPOINT
   ↓ (User reviews/approves)
✅ Complete!
```

### Example: Resume from Checkpoint

```typescript
import { resumeFromCheckpoint } from '@/lib/mastra';

// User approved vocabulary, now generate grammar
const result = await resumeFromCheckpoint(
  generationId, // From initial generation
  'grammar'      // Continue from grammar step
);

if (result.success) {
  console.log('Grammar generated:', result.data);
  console.log('Additional cost:', result.costUSD);
}
```

## Cost Tracking

### Model Pricing (GPT-4o-mini)

- Input: $0.150 per 1M tokens
- Output: $0.600 per 1M tokens

### Typical Costs per Generation

| Generation Type | Avg Tokens | Avg Cost  |
|----------------|-----------|-----------|
| Vocabulary     | 1,500     | ~$0.01    |
| Grammar        | 1,200     | ~$0.008   |
| Exercises      | 2,000     | ~$0.015   |
| **Complete**   | **4,700** | **~$0.035** |

### Budget Estimation

For 100 lessons per day:
- Daily: 100 × $0.035 = **$3.50/day**
- Monthly: $3.50 × 30 = **$105/month**

**Actual costs will vary** based on reading text length and complexity.

### Tracking Costs

All costs are automatically tracked in the `ai_generations` table:

```sql
SELECT
  generation_type,
  COUNT(*) as count,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost,
  SUM(tokens_used) as total_tokens
FROM ai_generations
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY generation_type;
```

## Error Handling

### Common Errors

**1. Missing API Key**
```
Error: OPENAI_API_KEY environment variable is required
```
**Fix**: Add `OPENAI_API_KEY` to `.env.local`

**2. Invalid JSON Response**
```
Error: Failed to parse LLM output
```
**Fix**: This is rare. Retry the generation. LLM outputs are validated with Zod schemas.

**3. Rate Limit Exceeded**
```
Error: Rate limit exceeded
```
**Fix**: Implement retry with exponential backoff (Story 7.7)

### Error Handling Pattern

```typescript
const result = await generateVocabulary(input);

if (!result.success) {
  console.error('Generation failed:', result.error);
  // Handle error (show message to user, retry, etc.)
  return;
}

// Success! Use result.data
```

## Testing

### Manual Test

Create `scripts/test-mastra.ts`:

```typescript
import { generateVocabulary } from '../lib/mastra';

async function test() {
  const result = await generateVocabulary({
    lessonId: '00000000-0000-0000-0000-000000000000',
    readingText: 'La maison est grande et belle. Le jardin est magnifique.',
    targetCEFRLevel: 'A2',
    maxItems: 5,
  });

  console.log(JSON.stringify(result, null, 2));
}

test();
```

Run:
```bash
npx tsx scripts/test-mastra.ts
```

Expected output:
```json
{
  "success": true,
  "data": {
    "vocabulary": [
      {
        "word": "maison",
        "translation": "house",
        "definition": "A building for people to live in",
        "cefr_level": "A1",
        "is_new": false
      },
      // ... more items
    ]
  },
  "tokensUsed": 450,
  "costUSD": 0.008,
  "generationId": "wf_abc123"
}
```

## Streaming (Future)

Mastra supports streaming for real-time updates. This will be implemented in Story 7.2.

Example:
```typescript
// Future feature
const stream = await generateVocabularyStream(input);

for await (const chunk of stream) {
  console.log('Received:', chunk); // Update UI in real-time
}
```

## Troubleshooting

### Issue: Generations are slow
- **Check**: Network latency to OpenAI API
- **Solution**: Consider using streaming for better UX

### Issue: Unexpected costs
- **Check**: Query the `ai_generations` table for cost breakdown
- **Solution**: Adjust `maxTokens` in `lib/mastra/providers/openai.ts`

### Issue: Generated content is poor quality
- **Check**: Prompt templates in `lib/mastra/tools/*.ts`
- **Solution**: Iterate on prompts, adjust temperature, or change model

### Issue: Can't resume workflow
- **Check**: Ensure `generationId` is saved after initial generation
- **Solution**: Store generation ID in your database/state

## Next Steps

After Story 7.1 (this setup):

1. **Story 7.2**: Implement vocabulary extraction with streaming
2. **Story 7.3**: Build review UI with approve/edit/regenerate
3. **Story 7.4**: Add grammar and exercise generation
4. **Story 7.5**: Complete review UI for all content types
5. **Story 7.6**: Database insertion of approved content
6. **Story 7.7**: Error handling and rate limiting
7. **Story 7.8**: Testing and comprehensive documentation

## Resources

- **Mastra Docs**: https://mastra.dev/docs
- **OpenAI API**: https://platform.openai.com/docs
- **GPT-4o-mini Pricing**: https://openai.com/api/pricing/

## Support

For issues or questions:
1. Check this guide first
2. Review error messages in console
3. Check `ai_generations` table for generation history
4. Create a GitHub issue with reproduction steps
