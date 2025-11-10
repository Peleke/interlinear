# Mastra AI Content Generation

AI-powered lesson content generation using Mastra workflow orchestration.

## Quick Start

```typescript
import { generateVocabulary } from '@/lib/mastra';

const result = await generateVocabulary({
  lessonId: 'lesson-uuid',
  readingText: 'Your reading text...',
  targetCEFRLevel: 'B1',
  maxItems: 15,
});

if (result.success) {
  console.log(result.data.vocabulary);
  console.log('Cost:', result.costUSD);
}
```

## Documentation

See [docs/MASTRA_SETUP.md](/docs/MASTRA_SETUP.md) for complete setup and usage guide.

## API

### `generateVocabulary(input)`
Extract vocabulary from reading text.

### `generateGrammar(input)`
Identify grammar concepts from reading text.

### `generateExercises(input)`
Generate exercises for vocabulary and grammar practice.

### `generateCompleteLesson(input)`
Generate all content types in one workflow.

### `resumeFromCheckpoint(workflowId, fromStep)`
Resume a suspended workflow from a checkpoint.

## Testing

```bash
npx tsx scripts/test-mastra.ts
```

## Cost

- **Vocabulary**: ~$0.01 per generation
- **Grammar**: ~$0.008 per generation
- **Exercises**: ~$0.015 per generation
- **Complete Lesson**: ~$0.035 per generation

## Architecture

```
lib/mastra/
├── index.ts           # Public API
├── types/             # TypeScript types
├── providers/         # AI provider config
├── tools/             # Generation tools
└── workflows/         # Workflow orchestration
```

## Features

✅ Structured output with Zod validation
✅ Cost tracking per generation
✅ Suspend/resume at checkpoints
✅ Streaming support (Story 7.2)
✅ Error handling with retries (Story 7.7)

## Related

- **Epic 7**: LLM-Powered Content Generation
- **Story 7.1**: Database Schema + Mastra Setup (#33)
- **Database**: `ai_generations` table tracks all generations
