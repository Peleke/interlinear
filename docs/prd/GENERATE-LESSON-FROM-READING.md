# Generate Lesson from Reading - Feature Specification

**Epic**: EPIC-7 LLM Content Generation
**Priority**: P1 - Demo Critical
**Status**: Planning
**Created**: 2025-11-11

---

## 📋 Overview

One-click lesson generation from readings. User configures and runs ALL LLM generators (Vocabulary, Grammar, Exercises, Dialogs) from a single modal, creating a complete lesson draft in the background.

---

## 🎯 User Story

**As a** lesson author
**I want to** generate a complete lesson from a reading with one workflow
**So that** I can quickly create comprehensive lesson content and review it holistically

---

## 🔧 Technical Architecture

### Components

**1. Reading View Enhancement**
- Location: `/author/lessons/[id]` → Readings tab → Reading detail view
- Add "Generate Lesson" button next to "Update Reading"
- Opens `GenerateLessonModal` component

**2. GenerateLessonModal Component**
```tsx
// Location: components/author/GenerateLessonModal.tsx

interface GeneratorConfig {
  enabled: boolean
  config: {
    // Vocabulary
    cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    maxVocabItems?: number

    // Grammar
    maxConcepts?: number

    // Exercises
    exerciseTypes?: ('fill_blank' | 'multiple_choice' | 'translation')[]
    exercisesPerType?: number
    translationDirection?: 'es_to_en' | 'en_to_es' | 'both'

    // Dialogs
    dialogCount?: number
    dialogComplexity?: 'simple' | 'intermediate' | 'advanced'
  }
}

interface Props {
  readingId: string
  lessonId: string
  readingContent: string
  onComplete: () => void
}
```

**3. API Orchestration Endpoint**
```typescript
// Location: app/api/lessons/[id]/generate-from-reading/route.ts

POST /api/lessons/[id]/generate-from-reading

Request Body:
{
  readingId: string,
  generators: {
    vocabulary: GeneratorConfig | null,
    grammar: GeneratorConfig | null,
    exercises: GeneratorConfig | null,
    dialogs: GeneratorConfig | null
  }
}

Response:
{
  status: 'processing' | 'completed' | 'failed',
  jobId?: string, // For async tracking
  results?: {
    vocabulary: { count: number, items: VocabItem[] },
    grammar: { count: number, concepts: GrammarConcept[] },
    exercises: { count: number, exercises: Exercise[] },
    dialogs: { count: number, dialogs: Dialog[] }
  },
  errors?: string[]
}
```

---

## 🎨 UI/UX Design

### Modal Layout

```
┌─────────────────────────────────────────────────────────┐
│ Generate Lesson from Reading                        [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Reading: "Nicolas Sarkozy Story" (A1 Level)            │
│                                                         │
│ ☑ Vocabulary Extraction                                │
│   ├─ CEFR Level: [A1 ▼]                               │
│   └─ Max Items:  [20    ]                             │
│                                                         │
│ ☑ Grammar Concepts                                      │
│   └─ Max Concepts: [5     ]                            │
│                                                         │
│ ☑ Exercise Generation                                   │
│   ├─ Types: ☑ Fill Blank  ☑ Multiple Choice  ☑ Translation │
│   ├─ Per Type: [3     ]                                │
│   └─ Translation Direction: [ES → EN ▼]                │
│                                                         │
│ ☑ Dialog Generation                                     │
│   ├─ Dialog Count: [2     ]                            │
│   └─ Complexity:   [Intermediate ▼]                    │
│                                                         │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Estimated Time: ~2-3 minutes                       │ │
│ │ Total Cost: ~$0.15                                 │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│              [Cancel]  [Generate Lesson Content]       │
└─────────────────────────────────────────────────────────┘
```

### Processing State

```
┌─────────────────────────────────────────────────────────┐
│ Generating Lesson Content...                       [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✓ Vocabulary Extraction (12 items)     [00:18]        │
│ ✓ Grammar Concepts (5 concepts)        [00:24]        │
│ ⏳ Exercise Generation                  [00:42]        │
│ ⏸  Dialog Generation (pending)                         │
│                                                         │
│ ████████████░░░░░░░░░░░░░░░  60%                      │
│                                                         │
│ You can close this modal - generation will continue    │
│ in the background. You'll be notified when complete.   │
│                                                         │
│              [Close]  [Cancel Generation]              │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Phases

### Phase 1: Synchronous MVP (Demo Ready)
**Goal**: Working but blocking UI
**Timeline**: EOD 2025-11-11

**Tasks**:
1. Create `GenerateLessonModal` component
2. Add "Generate Lesson" button to reading detail view
3. Create `/api/lessons/[id]/generate-from-reading` endpoint
4. Sequential execution of all generators
5. Progress indicator with status updates
6. Success modal with results summary

**Acceptance Criteria**:
- ✅ User can configure all 4 generators from one modal
- ✅ All generators run sequentially
- ✅ Progress shown with status per generator
- ✅ Results saved to lesson
- ✅ User can review generated content immediately

### Phase 2: Async Background Processing (Future Enhancement)
**Goal**: Non-blocking UI with real-time updates
**Timeline**: Post-demo

**Tasks**:
1. Implement job queue (BullMQ or similar)
2. WebSocket connection for real-time updates
3. Background job processing
4. Notification system for completion
5. Resume/retry failed generators
6. Job history and logs

**Technical Approach**:
- Use Supabase Realtime for WebSocket updates
- Store job status in `lesson_generation_jobs` table
- Implement exponential backoff retry logic
- Add job cancellation support

---

## 📊 Database Schema Changes

### New Table: `lesson_generation_jobs` (Future)

```sql
CREATE TABLE lesson_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  reading_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed

  config JSONB NOT NULL, -- Full generator configuration
  progress JSONB, -- { vocabulary: 'completed', grammar: 'processing', ... }
  results JSONB, -- Results from each generator
  errors JSONB[], -- Array of error objects

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generation_jobs_lesson ON lesson_generation_jobs(lesson_id);
CREATE INDEX idx_generation_jobs_status ON lesson_generation_jobs(status);
CREATE INDEX idx_generation_jobs_user ON lesson_generation_jobs(user_id);
```

---

## 🎯 Success Metrics

**Quantitative**:
- Generation success rate: > 95%
- Average generation time: < 3 minutes
- User completion rate: > 80% (don't cancel mid-generation)
- Content quality score: > 4.0/5.0 (user ratings)

**Qualitative**:
- Reduces lesson creation time by 60-80%
- Authors spend more time reviewing/refining vs creating
- Generated content requires minimal manual fixes

---

## 🔒 Security & Validation

**Input Validation**:
- Reading exists and user has access
- Lesson exists and user is author
- Configuration values within acceptable ranges
- Total estimated cost within user budget

**Rate Limiting**:
- Max 5 concurrent generations per user
- Max 20 generations per hour per user
- Queue overflow handling

**Error Handling**:
- Graceful degradation (partial success)
- Rollback on critical failures
- Detailed error logging for debugging
- User-friendly error messages

---

## 🧪 Testing Strategy

**Unit Tests**:
- Generator config validation
- API endpoint request/response handling
- Error condition handling

**Integration Tests**:
- End-to-end generation workflow
- Partial failure scenarios
- Database transaction integrity
- Concurrent generation handling

**Manual Tests**:
- UI/UX flow for all configurations
- Progress indicator accuracy
- Error message clarity
- Generated content quality

---

## 📝 Future Enhancements

1. **Smart Defaults**: AI suggests optimal configuration based on reading
2. **Template Presets**: Save/load generator configuration templates
3. **Batch Generation**: Generate lessons for multiple readings
4. **Quality Scoring**: Auto-score generated content quality
5. **A/B Testing**: Compare different generator configurations
6. **Cost Optimization**: Suggest cheaper configurations with similar results

---

## 🔗 Related Issues

- #XX - Translation direction configuration
- #XX - Exercise notes/explanation persistence
- #XX - Dialog generation implementation
- #XX - Background job processing
- #XX - WebSocket real-time updates

