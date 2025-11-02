# Tutor Mode - Complete Specification

**Status**: Ready for Implementation
**Sprint**: 4-Day MVP (Days 2-3)
**Scope**: Option B - Full Learning Loop (Lesson Summary → Dialog → Review)
**Tech Stack**: LangChain 1.x with `createAgent` pattern + OpenAI

---

## Overview

AI-powered conversational tutor that provides structured language learning through three phases: lesson preparation, interactive dialog, and personalized review.

---

## Technical Architecture

### LangChain v1.x Setup

**Dependencies**:
```json
{
  "@langchain/core": "^0.3.0",
  "@langchain/openai": "^0.3.0",
  "@langchain/langgraph": "^0.2.0",
  "langchain": "^0.3.0"
}
```

**Pattern**: Use `createReactAgent` from LangChain 1.x (NOT deprecated 0.3.x LCEL chains)

**Agent Structure**:
```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";

// Define individual tool functions
const generateLessonPlan = tool(
  async ({ text, level }) => { /* implementation */ },
  {
    name: "generate_lesson_plan",
    description: "Analyzes Spanish text and extracts learning objectives",
    schema: z.object({
      text: z.string(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"])
    })
  }
);

// Create agent with tools
const tutorAgent = createReactAgent({
  llm: new ChatOpenAI({ model: "gpt-4o-mini" }),
  tools: [generateLessonPlan, analyzeResponse, /* ... */]
});
```

**No Class-Based Services**: Use individual `tool()` functions, not class-based tool definitions

---

## UX Wireframes

### Phase 1: Lesson Summary Screen

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Library          TUTOR MODE          [Level: B1] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────── LESSON SUMMARY ──────────────┐             │
│  │                                              │             │
│  │  📚 Learning Objectives                     │             │
│  │  • Past Perfect Tense (había + participle)  │             │
│  │  • Subjunctive Mood (expressions of doubt)  │             │
│  │  • Preterite vs Imperfect                   │             │
│  │                                              │             │
│  │  📖 Key Vocabulary                          │             │
│  │  • había - there was/were                   │             │
│  │  • aunque - although                        │             │
│  │  • mientras - while                         │             │
│  │                                              │             │
│  │  🎯 Text Difficulty                         │             │
│  │  Level: B1 (Intermediate)                   │             │
│  │  This text is appropriate for your level    │             │
│  │  and focuses on past tense usage.           │             │
│  │                                              │             │
│  │         [Start Dialog →]                    │             │
│  │                                              │             │
│  └──────────────────────────────────────────────┘             │
│                                                               │
│  Text Preview:                                                │
│  "En aquel tiempo, había una casa vieja..."                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Dialog Interface

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back                    CONVERSATION              [End]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Learning: Past Perfect Tense, Subjunctive Mood       Turn 3 │
│                                                               │
│  ┌─ CONVERSATION ─────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  🤖 Tutor:                                             │  │
│  │  Hola! He leído el texto. ¿Qué parte te pareció       │  │
│  │  más interesante?                                      │  │
│  │                                                         │  │
│  │  👤 You:                                               │  │
│  │  Me gustó la parte sobre la casa vieja.               │  │
│  │                                                         │  │
│  │  🤖 Tutor:                                             │  │
│  │  ¡Qué bueno! ¿Habías visto una casa así antes?        │  │
│  │                                                         │  │
│  │  👤 You:                                               │  │
│  │  Sí, yo vi una casa similar cuando era niño.          │  │
│  │                                                         │  │
│  │  🤖 Tutor:                                             │  │
│  │  Interesante. ¿Qué sentiste cuando la viste?          │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Type your response...                                 │    │
│  │                                                       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                              [Send →]         │
│                                                               │
│  💡 Tip: Try using the past perfect tense (había + verb)     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Session Review Screen

```
┌─────────────────────────────────────────────────────────────┐
│                     SESSION REVIEW                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🎉 Great work! You completed 8 conversation turns.          │
│                                                               │
│  ┌─ GRAMMAR REVIEW ──────────────────────────────────────┐   │
│  │                                                         │   │
│  │  ⚠️ Verb Tense (3 instances)                           │   │
│  │                                                         │   │
│  │  Turn 4:                                               │   │
│  │  ❌ "Yo vi una casa similar"                          │   │
│  │  ✅ "Yo había visto una casa similar"                 │   │
│  │  💡 Use past perfect when referring to something       │   │
│  │     that happened before another past event.           │   │
│  │                                                         │   │
│  │  Turn 6:                                               │   │
│  │  ❌ "Cuando llegamos, la casa fue vacía"              │   │
│  │  ✅ "Cuando llegamos, la casa estaba vacía"           │   │
│  │  💡 Use imperfect (estaba) for descriptions in         │   │
│  │     the past, not preterite (fue).                     │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ VOCABULARY ───────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  ✅ Great use of:                                      │   │
│  │  • "mientras" (while)                                  │   │
│  │  • "aunque" (although)                                 │   │
│  │  • "había" (there was/were)                            │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ YOUR STRENGTHS ────────────────────────────────────────┐  │
│  │                                                         │   │
│  │  • Good use of subjunctive mood in Turn 7             │   │
│  │  • Natural conversation flow                           │   │
│  │  • Varied vocabulary choices                           │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                               │
│                         [Done]                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## User Flow

### Phase 1: Lesson Summary (Pre-Dialog)

**Entry Point**: User clicks Tutor tab from library text

**Display**:
- Preamble panel at top of interface
- "Analyzing text..." loading state
- Once ready, shows:
  - **Learning Objectives**: Grammar concepts in text (e.g., "Past Perfect Tense", "Subjunctive Mood")
  - **Key Vocabulary**: Important words/phrases
  - **Difficulty Assessment**: CEFR level + complexity notes
- **"Start Dialog"** button to begin conversation

**AI Tool**: `generateLessonPlan(text, userLevel)`
- Input: Library text content, user's selected CEFR level
- Output: Structured lesson plan with objectives

---

### Phase 2: Interactive Dialog

**Interface**: Chat-style conversation

**Flow**:
1. AI initiates conversation based on text content
2. Student responds (text input)
3. Each turn:
   - AI analyzes response for errors
   - Stores corrections internally
   - Continues conversation naturally (doesn't interrupt with corrections)
4. Conversation continues for 5-10 turns
5. AI gracefully ends session: "Great practice! Let's review your progress."

**AI Tools**:
- `startDialog(text, objectives, level)` - Generate opening message
- `continueDialog(conversationHistory, userResponse)` - Generate next AI message
- `analyzeResponse(userMessage, context)` - Detect errors, store corrections

**Error Tracking** (silent during conversation):
- Grammar mistakes
- Vocabulary misuse
- Sentence structure issues
- Store: original text, correction, explanation, category

---

### Phase 3: Session Review (Post-Dialog)

**Trigger**: Dialog ends (after 5-10 turns or user clicks "End Session")

**Display**:
- **Session Summary**:
  - "Great work! You completed X turns of conversation"
  - Overall performance indicator
- **Detailed Review**:
  - **Grammar Errors**: Grouped by type (verb tense, agreement, etc.)
    - Your text: "Yo comí mucho ayer"
    - Correction: "Yo comí mucho ayer" ✓ (correct) or highlighted error with fix
    - Explanation: Brief grammar rule explanation
  - **Vocabulary Notes**: Words used well or incorrectly
  - **Strong Points**: What student did well
- **"Done"** button returns to library

**AI Tool**: `generateReview(sessionErrors, dialogHistory)`
- Input: All tracked errors, conversation context
- Output: Structured review with categories and explanations

---

## Data Model

### tutor_sessions
```sql
CREATE TABLE public.tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text_id UUID NOT NULL REFERENCES public.library_texts(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  lesson_plan JSONB, -- Stores learning objectives
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_turns INT DEFAULT 0,
  total_tokens INT DEFAULT 0
);
```

### dialog_turns
```sql
CREATE TABLE public.dialog_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.tutor_sessions(id) ON DELETE CASCADE,
  turn_number INT NOT NULL,
  ai_message TEXT NOT NULL,
  user_response TEXT,
  errors_detected JSONB, -- Array of error objects
  tokens_used INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Error Object Structure (JSONB)
```json
{
  "type": "grammar" | "vocabulary" | "structure",
  "category": "verb_tense" | "agreement" | "word_choice" | etc.,
  "original": "student's text",
  "correction": "corrected text",
  "explanation": "brief explanation of the rule"
}
```

---

## API Routes

### POST /api/tutor/lesson-plan
- Body: `{ textId, level }`
- Returns: `{ objectives, keyVocab, difficulty }`

### POST /api/tutor/start-session
- Body: `{ textId, level, lessonPlan }`
- Returns: `{ sessionId, firstMessage }`

### POST /api/tutor/respond
- Body: `{ sessionId, userMessage }`
- Returns: `{ aiMessage, turnNumber }`

### POST /api/tutor/end-session
- Body: `{ sessionId }`
- Returns: `{ review: { grammar, vocabulary, strengths } }`

---

## LangChain Tools (Epic 6)

### 1. generateLessonPlan
**Purpose**: Analyze text and extract learning objectives

**Input**:
```typescript
{
  text: string,
  userLevel: CEFRLevel
}
```

**Output**:
```typescript
{
  objectives: string[], // ["Past Perfect Tense", "Subjunctive Mood"]
  keyVocabulary: { word: string, definition: string }[],
  difficulty: {
    level: CEFRLevel,
    notes: string
  }
}
```

**Prompt Strategy**:
- "You are a Spanish language teacher analyzing a text for lesson planning..."
- Extract grammar concepts present
- Identify challenging vocabulary
- Assess appropriate for target level

---

### 2. startDialog
**Purpose**: Generate conversation opener based on text

**Input**:
```typescript
{
  text: string,
  objectives: string[],
  level: CEFRLevel
}
```

**Output**:
```typescript
{
  message: string // AI's opening in Spanish
}
```

**Prompt Strategy**:
- Reference text content naturally
- Ask question appropriate to level
- Encourage student to use target grammar

---

### 3. continueDialog
**Purpose**: Generate next AI response

**Input**:
```typescript
{
  conversationHistory: Message[],
  userResponse: string,
  objectives: string[],
  level: CEFRLevel
}
```

**Output**:
```typescript
{
  message: string,
  shouldEnd: boolean // true after 5-10 turns
}
```

**Prompt Strategy**:
- Respond naturally to student
- Encourage use of target grammar
- Don't correct during conversation
- After 5-10 turns, gracefully end

---

### 4. analyzeResponse
**Purpose**: Detect errors in student response

**Input**:
```typescript
{
  userMessage: string,
  conversationContext: string,
  targetLevel: CEFRLevel
}
```

**Output**:
```typescript
{
  errors: {
    type: string,
    category: string,
    original: string,
    correction: string,
    explanation: string
  }[]
}
```

**Prompt Strategy**:
- Identify grammar mistakes
- Note vocabulary issues
- Provide brief explanations
- Categorize by error type

---

### 5. generateReview
**Purpose**: Synthesize all errors into final report

**Input**:
```typescript
{
  allErrors: ErrorObject[],
  dialogHistory: Message[],
  objectives: string[]
}
```

**Output**:
```typescript
{
  grammar: {
    category: string,
    examples: { original, correction, explanation }[]
  }[],
  vocabulary: {
    word: string,
    issue: string,
    suggestion: string
  }[],
  strengths: string[],
  summary: string
}
```

**Prompt Strategy**:
- Group errors by category
- Identify patterns
- Highlight what student did well
- Provide encouraging summary

---

## UI Components (Epic 7)

### LessonSummary
- Displays learning objectives
- Shows key vocabulary
- Start Dialog button

### ChatInterface
- Message list (AI and user turns)
- Text input for student responses
- "End Session" button

### SessionReview
- Categorized error display
- Grammar explanations
- Vocabulary notes
- Strengths section
- "Done" button

---

## Deferred to Epic 8 (Flashcards)

- Auto-generate flashcards from errors
- Grammar rule cross-referencing
- Dynamic lesson planning from weak areas

---

## Success Metrics

**MVP Launch Targets**:
- User completes full 3-phase flow
- Errors correctly detected and categorized
- Review is helpful and accurate
- Session completes in <5 minutes
- User says "holy shit" 🎉
