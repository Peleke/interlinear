# Next Session Context - Dialog Gen + Generate Lesson

## 🎯 Mission
Implement Issue #44 (Dialog Generation) and Issue #45 (Generate Lesson from Reading) to complete demo-ready features.

## ✅ Current State
- **All LLM generators working**: Vocabulary, Grammar, Exercises
- **All bugs fixed**: Exercise save, Grammar save, RLS policies
- **All UX complete**: Loading spinners, Save All, config UI
- **Build status**: ✅ Passing
- **Server running**: :3000

## 🔧 Action Required FIRST
```sql
-- Run this in Supabase SQL Editor to fix Grammar save RLS:
-- File: fix-grammar-rls.sql
DROP POLICY IF EXISTS "Authors can create grammar concepts" ON public.grammar_concepts;
DROP POLICY IF EXISTS "Authors can update grammar concepts" ON public.grammar_concepts;
DROP POLICY IF EXISTS "Authors can delete grammar concepts" ON public.grammar_concepts;

CREATE POLICY "Authors can create grammar concepts"
  ON public.grammar_concepts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authors can update grammar concepts"
  ON public.grammar_concepts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authors can delete grammar concepts"
  ON public.grammar_concepts FOR DELETE TO authenticated USING (true);
```

## 📋 Issue #44: Dialog Generation (Estimated: 3-4 hours)

### Task 1: Create Dialog LLM Tool (~1 hour)
**File**: `lib/content-generation/tools/generate-dialogs.ts`
**Pattern**: Copy from `generate-exercises.ts`

```typescript
// Input Schema
const DialogInputSchema = z.object({
  content: z.string(),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  language: z.enum(['es', 'la']),
  dialogCount: z.number().default(2),
  complexity: z.enum(['simple', 'intermediate', 'advanced']).default('intermediate'),
})

// Output Schema
const DialogTurnSchema = z.object({
  speaker: z.string(), // "Speaker A", "Speaker B", etc.
  text: z.string(), // Spanish/Latin text
  translation: z.string(), // English translation
  notes: z.string().optional(), // Grammar/vocab notes
})

const DialogSchema = z.object({
  title: z.string(),
  context: z.string(), // Setup/scenario description
  turns: z.array(DialogTurnSchema),
  difficulty_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
})

export const DialogOutputSchema = z.object({
  dialogs: z.array(DialogSchema),
  status: z.enum(['completed', 'failed']),
  metadata: z.object({
    dialogCount: z.number(),
    executionTime: z.number(),
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
})

// LLM Prompt
const prompt = `You are an expert ${languageName} language teacher creating conversational dialogs for ${targetLevel} level learners.

Content context:
${content}

Task: Create ${dialogCount} realistic conversational dialogs based on this content.

For each dialog:
1. Title (e.g., "At the Restaurant", "Meeting a Friend")
2. Context (brief scenario setup)
3. Conversation turns (4-8 exchanges)
4. Each turn: speaker, text, translation, optional notes

Guidelines:
- Keep language appropriate for ${targetLevel}
- Use vocabulary/grammar from the content
- Make conversations natural and practical
- Include cultural context when relevant
- Provide clear English translations
- Add notes for complex grammar/vocab

Create ${dialogCount} dialogs.`
```

### Task 2: Create Dialog API Endpoint (~30 min)
**File**: `app/api/content-generation/dialogs/route.ts`
**Pattern**: Copy from `app/api/content-generation/exercises/route.ts`

```typescript
import { generateDialogs } from '@/lib/content-generation/tools/generate-dialogs'

export async function POST(request: Request) {
  const body = await request.json()
  const { content, targetLevel, language, dialogCount, complexity } = body

  const result = await generateDialogs({
    content,
    targetLevel,
    language,
    dialogCount,
    complexity,
  })

  return NextResponse.json(result)
}
```

### Task 3: Create DialogBuilder Component (~1.5 hours)
**File**: `components/author/DialogBuilder.tsx`
**Pattern**: Copy from `components/author/ExerciseBuilder.tsx` (95% identical structure)

**Key Changes**:
- Generate dialogs instead of exercises
- Display turns with speakers
- Save to `lesson_dialogs` table
- Show translations + notes in preview

### Task 4: Integrate into Lesson Editor (~30 min)
**File**: Find lesson editor Dialogs tab and add DialogBuilder component
**Search**: `Grep` for "Dialogs" tab in lesson editor

---

## 📋 Issue #45: Generate Lesson from Reading (Estimated: 4-5 hours)

### Task 1: Create GenerateLessonModal Component (~2 hours)
**File**: `components/author/GenerateLessonModal.tsx`

```typescript
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

    // Dialogs
    dialogCount?: number
    complexity?: 'simple' | 'intermediate' | 'advanced'
  }
}

// Modal with 4 sections:
// ☑ Vocabulary Extraction [CEFR dropdown] [Max items input]
// ☑ Grammar Concepts [Max concepts input]
// ☑ Exercise Generation [Types checkboxes] [Per type input]
// ☑ Dialog Generation [Count input] [Complexity dropdown]
```

### Task 2: Create API Orchestration Endpoint (~1.5 hours)
**File**: `app/api/lessons/[id]/generate-from-reading/route.ts`

```typescript
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const lessonId = params.id
  const body = await request.json()
  const { readingId, generators } = body

  const results = {
    vocabulary: null,
    grammar: null,
    exercises: null,
    dialogs: null,
  }

  // Sequential execution with progress tracking
  if (generators.vocabulary?.enabled) {
    results.vocabulary = await fetch('/api/workflows/content-generation', {
      method: 'POST',
      body: JSON.stringify({ lessonId, ...generators.vocabulary.config })
    })
  }

  if (generators.grammar?.enabled) {
    results.grammar = await fetch('/api/content-generation/grammar', {
      method: 'POST',
      body: JSON.stringify({ content, ...generators.grammar.config })
    })
    // Auto-save all concepts
  }

  // ... repeat for exercises and dialogs

  return NextResponse.json({ status: 'completed', results })
}
```

### Task 3: Add "Generate Lesson" Button (~30 min)
**Find**: Reading detail view component
**Search**: `Grep` for "Update Reading" button
**Add**: "Generate Lesson" button next to it
**Action**: Opens GenerateLessonModal

### Task 4: Progress Indicator Component (~30 min)
Simple progress display showing:
- ✓ Vocabulary (12 items) [00:18]
- ✓ Grammar (5 concepts) [00:24]
- ⏳ Exercises [00:42]
- ⏸ Dialogs (pending)

---

## 🔍 Key Files Reference

**Existing Patterns to Copy**:
- `lib/content-generation/tools/generate-exercises.ts` → Dialog tool pattern
- `app/api/content-generation/exercises/route.ts` → Dialog endpoint pattern
- `components/author/ExerciseBuilder.tsx` → DialogBuilder UI pattern
- `components/author/GrammarConceptSelector.tsx` → Modal + generation pattern

**Database Tables**:
- `lesson_dialogs` - Already exists (check schema)
- `dialog_exchanges` - Already exists (check schema)

**Find Reading View**:
```bash
# Search for reading detail view component
find components -name "*.tsx" | xargs grep -l "Update Reading"
```

---

## 💡 Speed Tips

**Dialog Generation** (3-4 hours):
1. Copy `generate-exercises.ts` → rename to `generate-dialogs.ts` (20 min)
2. Update schemas + prompt for dialogs (30 min)
3. Copy exercises endpoint → update for dialogs (10 min)
4. Copy ExerciseBuilder → rename to DialogBuilder (30 min)
5. Update DialogBuilder for dialog structure (45 min)
6. Find Dialogs tab and integrate (15 min)
7. Test + fix bugs (30 min)

**Generate Lesson** (4-5 hours):
1. Create GenerateLessonModal with 4 config sections (90 min)
2. Create orchestration endpoint (60 min)
3. Add button to reading view (15 min)
4. Wire everything up (30 min)
5. Add progress indicator (30 min)
6. Test complete flow (45 min)

**Total**: 7-9 hours (not 12-16!)

---

## 🚀 Condensed Context for New Agent

```
Mission: Implement Dialog Generation + Generate Lesson from Reading

Current State:
- All generators working: Vocab, Grammar, Exercises ✅
- All bugs fixed, build passing ✅
- Server running :3000 ✅

Issue #44 - Dialog Generation:
1. Copy generate-exercises.ts → generate-dialogs.ts
2. Update schemas for dialog structure (speakers, turns, translations)
3. Copy exercises endpoint → dialogs endpoint
4. Copy ExerciseBuilder → DialogBuilder (same pattern)
5. Integrate into Dialogs tab

Issue #45 - Generate Lesson:
1. Create GenerateLessonModal (4 generator configs)
2. Create /api/lessons/[id]/generate-from-reading endpoint
3. Sequential execution: vocab → grammar → exercises → dialogs
4. Add "Generate Lesson" button to reading view
5. Progress indicator showing status

Pattern Files:
- lib/content-generation/tools/generate-exercises.ts
- app/api/content-generation/exercises/route.ts
- components/author/ExerciseBuilder.tsx

Estimate: 7-9 hours total (3-4 for dialogs, 4-5 for generate lesson)
```

---

## 🎯 Success Criteria

**Dialog Generation**:
- [ ] Can generate 1-5 dialogs from reading
- [ ] Dialogs show speakers, text, translations
- [ ] Can save dialogs to lesson
- [ ] Loading indicators work

**Generate Lesson**:
- [ ] Modal shows all 4 generator configs
- [ ] Can enable/disable each generator
- [ ] Sequential execution works
- [ ] Progress indicator shows status
- [ ] All content saves to lesson
- [ ] Can close modal and check results

**Demo Ready**:
- [ ] Complete workflow: Reading → Generate Lesson → Review all content
- [ ] No errors in console
- [ ] Professional UX with loading states
- [ ] Content quality meets demo standards

---

Ready to CRANK! 🚀
