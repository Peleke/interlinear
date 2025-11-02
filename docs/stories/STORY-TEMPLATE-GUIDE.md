# Story Template Guide

**Purpose**: Guidelines for creating detailed, actionable stories from epics.

---

## Story Structure Template

```markdown
# Story X.Y: [Feature Name]

**Epic**: [Epic Number and Name]
**Status**: 🚧 In Progress | ✅ Complete
**Priority**: P0 | P1 | P2
**Estimated Effort**: [hours]
**Dependencies**: [Other stories that must be completed first]

---

## User Story

**As a** [user type]
**I want to** [action]
**So that** [benefit]

---

## Acceptance Criteria

- [ ] [Specific, testable criterion]
- [ ] [Another criterion]
- [ ] [Technical criterion]

---

## Technical Specification

### Database Changes

```sql
-- Migration SQL if needed
```

### API Endpoints

**Route**: `[METHOD] /api/path`

**Request**:
```json
{
  "field": "value"
}
```

**Response**:
```json
{
  "result": "value"
}
```

### Services

```typescript
// lib/service.ts
export class ServiceName {
  static async methodName(params): Promise<ReturnType> {
    // Implementation outline
  }
}
```

### Components

```
ComponentName/
├── ComponentName.tsx
├── ComponentName.test.tsx
└── types.ts
```

---

## Implementation Steps

1. **Setup**: [Initial setup tasks]
2. **Database**: [Schema changes, migrations]
3. **Backend**: [Service layer, API routes]
4. **Frontend**: [Components, hooks, pages]
5. **Testing**: [Unit, integration, E2E tests]
6. **Integration**: [Connect to existing features]

---

## Testing Checklist

### Unit Tests
- [ ] Test service methods
- [ ] Test utility functions
- [ ] Test component logic

### Integration Tests
- [ ] Test API routes
- [ ] Test database operations
- [ ] Test component integration

### E2E Tests
- [ ] Test user flow
- [ ] Test error handling
- [ ] Test edge cases

---

## Technical Notes

[Important implementation details, gotchas, patterns to follow]

---

## Success Criteria

**Story Complete When**:
- All acceptance criteria met
- All tests passing
- Code reviewed and merged
- Feature deployed to dev environment
```

---

## Key Enhancements from Architecture Review

### 1. LLM Integration Patterns

When working with LangChain/OpenAI:

```typescript
// Always use Zod for validation
import { z } from 'zod'

const ResponseSchema = z.object({
  field: z.string(),
  count: z.number()
})

// Validate before returning
const parsed = ResponseSchema.safeParse(llmResponse)
if (!parsed.success) {
  // Handle error or retry
}
```

### 2. Rate Limiting

Add to API routes that call external services:

```typescript
// middleware.ts pattern
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
})

if (req.url.startsWith('/api/tutor')) {
  return limiter(req)
}
```

### 3. Caching Strategy

For expensive operations (LLM calls, API requests):

```typescript
const cache = new Map<string, CachedValue>()

export async function getCachedResult(key: string): Promise<Result> {
  if (cache.has(key)) {
    return cache.get(key)
  }

  const result = await expensiveOperation()
  cache.set(key, result)
  return result
}
```

### 4. Timeout Wrappers

For all LLM and external API calls:

```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]) as Promise<T>
}

// Usage
const response = await withTimeout(
  openai.chat.completions.create(...),
  30000
)
```

### 5. Error Response Standard

All API routes must return consistent error format:

```typescript
interface ApiError {
  error: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

// In route.ts
return NextResponse.json(
  {
    error: 'VALIDATION_ERROR',
    message: 'Invalid input format',
    timestamp: new Date().toISOString()
  },
  { status: 400 }
)
```

### 6. Database Query Patterns

Always use RLS-aware queries:

```typescript
// Good - RLS automatically enforced
const { data, error } = await supabase
  .from('vocabulary_entries')
  .select('*')
  .eq('source_text_id', textId)

// Supabase automatically adds: WHERE user_id = auth.uid()
```

### 7. Sentence Extraction (Spanish)

Use enhanced regex for Spanish punctuation:

```typescript
function extractSentence(tokens: Token[], wordIndex: number): string {
  // Spanish sentence boundaries: . ! ? ¿ ¡
  const sentenceEnd = /[.!?]/
  const spanishStart = /[¿¡]/

  // Find boundaries accounting for inverted punctuation
  // Implementation in lib/tokenize.ts
}
```

---

## Story Sizing Guidelines

**2 hours**: Simple component, no backend
**4 hours**: Component + API route + service
**6 hours**: Feature with database changes
**8 hours**: Complex feature with multiple integrations

---

## Definition of Done

- [ ] Code written and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests for critical paths
- [ ] TypeScript strict mode: zero errors
- [ ] ESLint: zero warnings
- [ ] Manually tested in dev environment
- [ ] Documentation updated (if needed)
- [ ] Merged to main branch

---

## Dependencies Management

Track dependencies explicitly:

```yaml
Story 5.2 depends on:
  - Story 5.1 (database schema must exist)
  - Epic 1 complete (auth required)

Story 6.2 depends on:
  - Story 6.1 (session creation)
  - Epic 5 complete (library texts)

Story 7.1 depends on:
  - Epic 6 complete (backend APIs)
```

---

## Example: Story 5.1 (Reference)

See: `docs/stories/epic-5-library-system/story-5.1-database-migrations.md`

This story demonstrates:
- Complete database schema
- RLS policies
- Proper migration structure
- Testing checklist
- Clear acceptance criteria

Use this as the gold standard for story detail.

---

**Generated by**: Winston (System Architect)
**Date**: 2025-10-31
**For**: Interlinear 4-Day Sprint
