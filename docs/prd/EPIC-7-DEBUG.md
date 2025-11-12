# EPIC 7 - LLM Content Generation - Debug & Enhancement

**Status**: 🔧 Debug & Polish Phase
**Priority**: P0 - Complete by EOD
**Created**: 2025-11-11

---

## 📋 Overview

After successfully implementing the core LLM content generation workflows, we've identified critical bugs and UX improvements needed before deployment. This epic tracks all debugging and enhancement work to make the generation flows production-ready.

---

## 🐛 Critical Bugs (Must Fix Before Deploy)

### Bug 7.5.7: Exercise Save Fails - Missing `answer` Field

**Severity**: 🔴 Critical
**Component**: ExerciseBuilder.tsx → API
**Error**: `{"error":"Missing required fields: lessonId, prompt, answer"}`

**Root Cause Analysis**:

**LLM Output Shape** (from `/api/content-generation/exercises`):
```json
{
  "type": "translation",
  "prompt": "Nicolas Sarkozy ha sido puesto en libertad vigilada.",
  "correct_answer": "Nicolas Sarkozy has been placed on probation.",
  "explanation": "..."
}
```

**API Expects** (`/api/exercises/fill-blank`):
```json
{
  "lessonId": "uuid",
  "prompt": "text",
  "answer": "text",  // ❌ LLM generates "correct_answer"
  "blankPosition": 0
}
```

**Database Schema** (Expected):
```sql
-- exercises table
prompt TEXT NOT NULL
answer TEXT NOT NULL  -- ❌ Mismatch with LLM output
```

**Fix Required**:
1. Map `correct_answer` → `answer` in `saveGeneratedExercise()`
2. Verify all exercise types (fill_blank, multiple_choice, translation)
3. Ensure proper field mapping for each type

**Files to Update**:
- `components/author/ExerciseBuilder.tsx:201-240` (saveGeneratedExercise function)

---

### Bug 7.5.8: Grammar Save Fails - Missing `name` Field

**Severity**: 🔴 Critical
**Component**: GrammarConceptSelector.tsx → API
**Error**: `{"error":"name and display_name are required"}`

**Root Cause Analysis**:

**LLM Output Shape** (from `/api/content-generation/grammar`):
```json
{
  "name": "Present Perfect Tense",
  "cefr_level": "A2",
  "explanation": "The Present Perfect Tense is used to...",
  "example_from_text": "Nicolas Sarkozy ha sido puesto...",
  "additional_examples": ["He estado...", "Hemos comido..."]
}
```

**API Expects** (`/api/grammar-concepts`):
```json
{
  "name": "kebab-case-slug",        // ❌ LLM generates human-readable
  "display_name": "Display Name",    // ✅ LLM generates this
  "description": "text",             // ✅ Maps to "explanation"
  "content": "markdown"              // ✅ Generated from fields
}
```

**Database Schema** (Expected):
```sql
-- grammar_concepts table
name VARCHAR(255) PRIMARY KEY  -- kebab-case slug
display_name VARCHAR(255)      -- human-readable
description TEXT
content TEXT (markdown)
```

**Fix Required**:
1. Generate `name` slug from `display_name`: `"Present Perfect Tense"` → `"present-perfect-tense"`
2. Map `explanation` → `description`
3. Build proper markdown `content` from all fields (including examples)
4. Handle undefined `example_from_text` in content template

**Files to Update**:
- `components/author/GrammarConceptSelector.tsx:188-204` (saveGeneratedConcept function)

---

## 🎨 UX Enhancements (Required for Production)

### Story 7.5.1: Add "Save All" Button to Grammar Modal

**Priority**: P1
**Effort**: 2 points

**Current State**:
- User must click "Save & Link to Lesson" for each concept individually
- 5 concepts = 5 clicks + 5 API calls

**Desired State**:
- "Save All & Link to Lesson" button at top of results
- Batch saves all concepts in parallel
- Single success/failure notification

**Implementation**:
```tsx
// Add to GrammarConceptSelector.tsx modal
<Button onClick={saveAllConcepts} disabled={isSaving}>
  Save All {generatedConcepts.length} Concepts
</Button>

const saveAllConcepts = async () => {
  setIsSaving(true);
  const promises = generatedConcepts.map(saveGeneratedConcept);
  await Promise.allSettled(promises);
  // Show summary: "Saved 5/5 concepts" or "Saved 4/5 (1 failed)"
};
```

**Files to Update**:
- `components/author/GrammarConceptSelector.tsx` (modal section)

---

### Story 7.5.2: Add Configurable Max Concepts to Grammar

**Priority**: P1
**Effort**: 3 points

**Current State**:
- Hardcoded `maxConcepts: 5` in Grammar generation
- No user control over extraction volume

**Desired State**:
- Number input for max concepts (1-10)
- Prompt updated to say "up to N concepts" (not exactly N)
- Default: 5 concepts

**UI Changes**:
```tsx
// Add to ReadingSelector or Grammar modal
<Label>Max Grammar Concepts (1-10)</Label>
<Input
  type="number"
  min={1}
  max={10}
  value={maxConcepts}
  onChange={(e) => setMaxConcepts(parseInt(e.target.value))}
/>
```

**Prompt Update**:
```typescript
// In identify-grammar.ts buildPrompt()
// OLD: "Identify exactly {maxConcepts} grammar concepts"
// NEW: "Identify up to {maxConcepts} of the most important grammar concepts"
```

**Files to Update**:
- `components/author/GrammarConceptSelector.tsx` (add state + UI)
- `lib/content-generation/tools/identify-grammar.ts` (update prompt)

---

### Story 7.5.3: Add Loading Indicators to All Generation

**Priority**: P0
**Effort**: 2 points

**Current State**:
- No visual feedback during generation
- User clicks "Generate" → silent wait → results appear
- Confusing UX, looks broken

**Desired State**:
- Button shows "Generating..." with spinner
- Modal shows loading state during API call
- Clear feedback that work is happening

**Implementation**:
All three components already have `isGenerating` state, just need to show it:

**Vocabulary**:
```tsx
{isGenerating && (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Extracting vocabulary...</span>
  </div>
)}
```

**Grammar**: Same pattern
**Exercises**: Same pattern

**Files to Update**:
- `components/author/VocabularyManager.tsx` (add loading state to modal)
- `components/author/GrammarConceptSelector.tsx` (add loading state to modal)
- `components/author/ExerciseBuilder.tsx` (add loading state to modal)

---

### Story 7.5.4: Add CEFR Level + Max Items to Vocabulary

**Priority**: P1
**Effort**: 3 points

**Current State**:
- CEFR level inferred from first reading's difficulty
- No way to override or specify
- No control over max vocabulary items

**Desired State**:
- Dropdown to select CEFR level (A1-C2)
- Number input for max vocabulary items (5-50)
- Defaults from reading but user can override

**UI Changes**:
```tsx
// Add to VocabularyManager modal (before ReadingSelector)
<div className="space-y-4">
  <div>
    <Label>Target CEFR Level</Label>
    <Select value={cefrLevel} onValueChange={setCefrLevel}>
      <SelectItem value="A1">A1 - Beginner</SelectItem>
      {/* ... */}
    </Select>
  </div>

  <div>
    <Label>Max Vocabulary Items (5-50)</Label>
    <Input type="number" min={5} max={50} value={maxVocab} />
  </div>
</div>
```

**Files to Update**:
- `components/author/VocabularyManager.tsx` (add UI + pass to API)
- Workflow already supports this via `maxVocabularyItems` param

---

### Story 7.5.5: Fix Grammar Explanations Language (Configurable)

**Priority**: P1
**Effort**: 3 points

**Current Issue**:
- Grammar explanations generated in Spanish
- Exercises explanations generated in English
- Inconsistent and confusing

**Desired State**:
- Configurable explanation language (default: English)
- Consistent across all generation types
- Add to prompt: "Provide explanations in {explanationLanguage}"

**Implementation**:
```typescript
// Add to all generation tool prompts
const explanationLang = input.explanationLanguage || 'English';

const prompt = `
You are analyzing ${input.language === 'es' ? 'Spanish' : 'Latin'} text.
Provide all explanations in ${explanationLang}.
...
`;
```

**Files to Update**:
- `lib/content-generation/tools/identify-grammar.ts` (add explanationLanguage param)
- `lib/content-generation/tools/generate-exercises.ts` (verify already English)
- `components/author/GrammarConceptSelector.tsx` (add language selector UI)

---

### Story 7.5.6: Create Dialog Generation Flow

**Priority**: P2
**Effort**: 8 points

**Scope**: Analogous to Grammar/Exercise generation but for conversational dialogs

**Requirements**:
1. New "Dialogs" tab in lesson editor
2. Generate contextual dialogs from reading content
3. Include roles (e.g., Speaker A, Speaker B)
4. Include translations and grammar notes
5. Save to `lesson_dialogs` table

**Implementation Plan**:
1. Create `DialogBuilder.tsx` component (copy ExerciseBuilder pattern)
2. Create `/api/content-generation/dialogs` endpoint
3. Create `generate-dialogs.ts` LLM tool
4. Define dialog schema (speakers, turns, translations)
5. Add to lesson editor tabs

**Database Schema** (may need migration):
```sql
CREATE TABLE lesson_dialogs (
  id UUID PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id),
  title TEXT,
  context TEXT,
  turns JSONB[], -- [{speaker, text, translation, notes}]
  difficulty_level TEXT,
  created_at TIMESTAMP
);
```

**Files to Create**:
- `components/author/DialogBuilder.tsx`
- `lib/content-generation/tools/generate-dialogs.ts`
- `app/api/content-generation/dialogs/route.ts`

---

## 🔧 Technical Debt

### Issue: Hardcoded Model References

**Priority**: P3 (post-deployment)
**Effort**: 5 points

**Files Requiring Fix**:
```
lib/langchain/tools/vocabulary.ts:      model: "gpt-4o-mini"
lib/langchain/tools/grammar.ts:         model: "gpt-4o-mini"
lib/langchain/tools/exercises.ts:       model: "gpt-4o-mini"
lib/langchain/agents/content-supervisor.ts: model: "gpt-4o-mini"
lib/tutor-tools.ts:                     model: "gpt-4o" (7 instances)
app/api/onboarding/assess/route.ts:    model: 'gpt-4o'
app/api/onboarding/chat/route.ts:       model: 'gpt-4o-mini'
app/api/tutor/generate-examples/route.ts: modelName: 'gpt-4'
```

**Fix**: Replace all with `process.env.OPENAI_MODEL || 'gpt-4o-mini'`

**GitHub Issue**: To be created via `gh issue create`

---

## 📊 Schema Reference

### Grammar Concepts Schema
```typescript
// LLM Output (lib/content-generation/tools/identify-grammar.ts)
{
  name: string              // "Present Perfect Tense"
  cefr_level: "A1"|"A2"|...
  explanation: string
  example_from_text: string
  additional_examples?: string[]
}

// Database (grammar_concepts table)
{
  name: string              // "present-perfect-tense" (slug)
  display_name: string      // "Present Perfect Tense"
  description: string       // explanation
  content: string           // markdown with all fields
}
```

### Exercise Schema
```typescript
// LLM Output (lib/content-generation/tools/generate-exercises.ts)
{
  type: "fill_blank" | "multiple_choice" | "translation"
  prompt: string
  correct_answer: string    // ❌ API expects "answer"
  explanation?: string
  options?: string[]        // for multiple_choice
}

// Database (exercises table)
{
  lesson_id: uuid
  exercise_type: string
  prompt: string
  answer: string            // ❌ Mismatch
  options?: json
  explanation?: string
}
```

### Vocabulary Schema
```typescript
// Workflow Output (working correctly)
{
  spanish: string
  english: string
  part_of_speech?: string
  difficulty_level?: string
  is_new: boolean
}
```

---

## ✅ Acceptance Criteria

### Before EOD:
- [x] EPIC-7-DEBUG.md created with all documentation
- [ ] Bug 7.5.7 (Exercise save) fixed and tested
- [ ] Bug 7.5.8 (Grammar save) fixed and tested
- [ ] Story 7.5.1 (Save All) implemented
- [ ] Story 7.5.2 (Max concepts) implemented
- [ ] Story 7.5.3 (Loading indicators) implemented
- [ ] Story 7.5.4 (CEFR + max vocab) implemented
- [ ] Story 7.5.5 (Grammar language) implemented
- [ ] GitHub issue created for hardcoded models

### Post-EOD (Optional):
- [ ] Story 7.5.6 (Dialog generation) implemented
- [ ] Technical debt (hardcoded models) resolved

---

## 🎯 Testing Checklist

### Grammar Generation
- [ ] Generate grammar from single reading
- [ ] Generate grammar from multiple readings
- [ ] Generate grammar from manual text
- [ ] Configure max concepts (1-10)
- [ ] Verify explanations in English
- [ ] Save single concept
- [ ] Save all concepts
- [ ] Verify concepts link to lesson

### Exercise Generation
- [ ] Generate fill_blank exercises
- [ ] Generate multiple_choice exercises
- [ ] Generate translation exercises
- [ ] Configure exercise count
- [ ] Save exercise successfully
- [ ] Verify exercise links to lesson

### Vocabulary Generation
- [ ] Generate from single reading
- [ ] Generate from multiple readings
- [ ] Configure CEFR level
- [ ] Configure max items
- [ ] Verify saves to lesson

---

## 📝 Notes

- All generation flows use OpenAI via `OPENAI_MODEL` env var (default: gpt-4o-mini)
- Structured output requires gpt-4o, gpt-4o-mini, or newer
- Grammar/Exercise endpoints return success + results structure
- Vocabulary uses workflow endpoint (different pattern)
