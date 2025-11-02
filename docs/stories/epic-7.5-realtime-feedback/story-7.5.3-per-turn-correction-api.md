# Story 7.5.3: Per-Turn Error Correction API

**Epic**: 7.5 - Real-Time Tutor Feedback
**Status**: ✅ Completed
**Priority**: P0
**Estimated Effort**: 2 hours
**Dependencies**: None

---

## User Story

**As a** language learner
**I want** the AI to analyze my message after each turn
**So that** I can see corrections immediately, not just at the end

---

## Acceptance Criteria

- [ ] `/api/tutor/turn` returns correction data alongside AI response
- [ ] Correction analysis completes in < 2 seconds
- [ ] Response includes: hasErrors, correctedText, errors array
- [ ] Works for messages with 0 errors (positive feedback)
- [ ] Works for messages with multiple errors
- [ ] Errors include: errorText, correction, explanation, category
- [ ] Uses GPT-4o mini for cost efficiency
- [ ] Timeout handling (30s max)
- [ ] Error handling returns graceful fallback

---

## Technical Specification

### API Route Update

**File**: `app/api/tutor/turn/route.ts`

**Current Response**:
```typescript
{
  aiMessage: string
  turnNumber: number
  shouldEnd: boolean
}
```

**New Response**:
```typescript
{
  aiMessage: string
  turnNumber: number
  shouldEnd: boolean
  correction: {
    hasErrors: boolean
    correctedText: string
    errors: Array<{
      errorText: string
      correction: string
      explanation: string
      category: 'grammar' | 'vocabulary' | 'syntax'
    }>
  }
}
```

### Implementation

```typescript
import { analyzeUserMessageTool } from '@/lib/tutor-tools'

export async function POST(request: Request) {
  const { sessionId, message } = await request.json()

  // 1. Generate AI response (existing logic)
  const aiResponse = await generateTutorResponse(sessionId, message)

  // 2. Analyze user message in parallel (NEW)
  const correctionPromise = analyzeUserMessageTool.invoke({
    userMessage: message,
    targetLanguage: 'Spanish',
    level: session.cefrLevel
  })

  // 3. Wait for both (parallel execution)
  const [aiMessage, correction] = await Promise.all([
    Promise.resolve(aiResponse),
    correctionPromise
  ])

  // 4. Store turn with correction data
  await supabase.from('dialog_turns').insert({
    session_id: sessionId,
    turn_number: turnNumber,
    role: 'user',
    content: message,
    metadata: { correction }  // Store for flashcard creation later
  })

  return NextResponse.json({
    aiMessage,
    turnNumber,
    shouldEnd: false,
    correction
  })
}
```

---

## LangChain Tool Implementation

**File**: `lib/tutor-tools.ts`

### New Tool: `analyzeUserMessageTool`

```typescript
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { ChatOpenAI } from '@langchain/openai'

const CorrectionSchema = z.object({
  hasErrors: z.boolean(),
  correctedText: z.string(),
  errors: z.array(
    z.object({
      errorText: z.string(),
      correction: z.string(),
      explanation: z.string(),
      category: z.enum(['grammar', 'vocabulary', 'syntax'])
    })
  )
})

export const analyzeUserMessageTool = tool(
  async ({ userMessage, targetLanguage, level }) => {
    const model = new ChatOpenAI({
      model: 'gpt-4o-mini',  // Cost-effective for simple corrections
      temperature: 0.3
    })

    const prompt = `You are a ${targetLanguage} language teacher analyzing a student's message.

CEFR Level: ${level}
Student Message: "${userMessage}"

Analyze this message for errors. Return:
1. Whether it has any errors (true/false)
2. The fully corrected version
3. List of specific errors with explanations

Categories:
- grammar: verb conjugation, agreement, tense, etc.
- vocabulary: wrong word choice, false cognates
- syntax: word order, missing words, extra words

Be encouraging! If there are no errors, praise the student.

Return JSON matching this schema:
{
  "hasErrors": boolean,
  "correctedText": "fully corrected version",
  "errors": [
    {
      "errorText": "exact text from student message",
      "correction": "corrected version",
      "explanation": "why it's wrong and how to fix",
      "category": "grammar|vocabulary|syntax"
    }
  ]
}`

    const response = await model.invoke([
      { role: 'system', content: prompt },
      { role: 'user', content: userMessage }
    ])

    const parsed = CorrectionSchema.safeParse(
      JSON.parse(response.content as string)
    )

    if (!parsed.success) {
      console.error('Invalid correction response:', parsed.error)
      return {
        hasErrors: false,
        correctedText: userMessage,
        errors: []
      }
    }

    return parsed.data
  },
  {
    name: 'analyzeUserMessage',
    description: 'Analyze a single user message for language errors',
    schema: z.object({
      userMessage: z.string(),
      targetLanguage: z.string(),
      level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    })
  }
)
```

---

## Implementation Steps

1. **Create `analyzeUserMessageTool` in `tutor-tools.ts`**
   - Define Zod schemas
   - Implement prompt engineering
   - Add timeout wrapper (30s)
   - Add error handling

2. **Update `/api/tutor/turn` Route**
   - Import new tool
   - Call in parallel with AI response generation
   - Merge results into single response
   - Store correction in database metadata

3. **Add TypeScript Types**
   ```typescript
   // types/tutor.ts
   export interface TurnCorrection {
     hasErrors: boolean
     correctedText: string
     errors: ErrorDetail[]
   }

   export interface ErrorDetail {
     errorText: string
     correction: string
     explanation: string
     category: 'grammar' | 'vocabulary' | 'syntax'
   }
   ```

4. **Update Database Storage**
   ```typescript
   // Store in dialog_turns.metadata
   metadata: {
     correction: TurnCorrection
     timestamp: Date
     model: 'gpt-4o-mini'
   }
   ```

5. **Add Timeout Wrapper**
   ```typescript
   async function withTimeout<T>(
     promise: Promise<T>,
     timeoutMs: number
   ): Promise<T> {
     return Promise.race([
       promise,
       new Promise<T>((_, reject) =>
         setTimeout(() => reject(new Error('Timeout')), timeoutMs)
       )
     ])
   }

   // Usage
   const correction = await withTimeout(
     analyzeUserMessageTool.invoke(...),
     30000
   )
   ```

---

## Testing Checklist

### Unit Tests
- [ ] `analyzeUserMessageTool` with perfect message (no errors)
- [ ] Tool with single grammar error
- [ ] Tool with multiple error types
- [ ] Tool with complex Spanish sentence
- [ ] Zod schema validation catches invalid responses
- [ ] Timeout wrapper works correctly

### Integration Tests
- [ ] POST `/api/tutor/turn` returns correction data
- [ ] Correction stored in database metadata
- [ ] Parallel execution doesn't slow response time
- [ ] Error handling returns graceful fallback
- [ ] Rate limiting applied correctly

### Performance Tests
- [ ] Response time < 2 seconds for typical message
- [ ] No performance degradation over multiple turns
- [ ] Parallel execution faster than sequential

---

## Cost Analysis

### Token Usage per Turn
```
Prompt: ~200 tokens
User message: ~50 tokens (avg)
Response: ~150 tokens
Total: ~400 tokens per correction

Cost (GPT-4o mini):
Input: 400 tokens × $0.00015/1K = $0.00006
Output: 150 tokens × $0.0006/1K = $0.00009
Total: ~$0.00015 per turn

10 turns = $0.0015 per session
100 users × 10 sessions/month = 1000 sessions = $1.50/month
```

**Much cheaper than GPT-4o!**

---

## Error Handling

### Graceful Degradation
```typescript
try {
  const correction = await analyzeUserMessageTool.invoke(...)
  return correction
} catch (error) {
  console.error('Correction analysis failed:', error)

  // Return safe fallback
  return {
    hasErrors: false,
    correctedText: userMessage,
    errors: []
  }
}
```

### Timeout Strategy
- 30s timeout per analysis
- If timeout: return fallback (no errors)
- Log timeout for monitoring
- User still gets conversational response

---

## Success Criteria

**Story Complete When**:
- ✅ API returns correction data alongside AI response
- ✅ Response time < 2 seconds on average
- ✅ Handles 0 errors, single error, multiple errors
- ✅ All tests passing
- ✅ Error handling tested and working
- ✅ Cost per session acceptable (<$0.01)
- ✅ Code reviewed and merged

---

## Related Files

```
app/api/tutor/turn/route.ts          # Main API route
lib/tutor-tools.ts                    # New tool implementation
types/tutor.ts                        # TypeScript interfaces
supabase/migrations/...               # No schema changes needed
```

---

**Created**: 2025-10-31
**Author**: James (Dev Agent)
