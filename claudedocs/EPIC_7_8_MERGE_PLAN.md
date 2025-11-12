# Epic 7 + Epic 8 Merge Plan

**Date**: 2025-11-10
**Branches**: `feat/epic-07-llm-content-generation` + `feat/epic-08-polish-bilingual-ux`
**Goal**: Merge Latin foundation with content generation system
**Status**: 🟡 Planning Phase

---

## Executive Summary

Epic 7 (Content Generation) and Epic 8 (Latin Foundation) are **highly compatible** with minimal conflicts. Epic 7 already has `language: 'es' | 'la'` support built-in, but the Latin dictionary lookup is stubbed out. Epic 8 provides the working Latin API that Epic 7 needs.

**Merge Strategy**: Merge Epic 8 INTO Epic 7 (not the reverse)

**Reason**: Epic 7 is the "main" development branch with active content generation features. Epic 8 is a foundation layer that Epic 7 depends on.

---

## File Analysis

### Files Added by Epic 8 (63 files)
**Latin API & Services:**
- `app/api/latin/analyze/route.ts` ✅ NEW
- `app/api/latin/health/route.ts` ✅ NEW
- `lib/services/latin-dictionary.ts` ✅ NEW
- `src/services/LatinAnalysisService.ts` ✅ NEW

**Latin Dictionary Data:**
- `data/latin-dictionary/ls_*.json` (26 files, ~38MB) ✅ NEW

**CLTK Microservice:**
- `services/latin-analyzer/*` (Docker + Python service) ✅ NEW

**Latin UI Components:**
- `src/components/latin/LatinTextReader.tsx` ✅ NEW
- `src/components/latin/LatinWordPopover.tsx` ✅ NEW
- `app/latin/demo/page.tsx` ✅ NEW

**Database Migrations:**
- `supabase/migrations/20251110_latin_dictionary_schema.sql` ✅ NEW

**Documentation:**
- `claudedocs/LATIN_READER_INTEGRATION.md` ✅ NEW
- `docs/stories/epic-8-latin-foundation/*` (7 files) ✅ NEW
- `docs/PRD-v3-LATIN.md` ✅ NEW

### Files Added by Epic 7 (22 files)
**Content Generation System:**
- `lib/content-generation/workflows/content-generation.ts` ✅ KEEP
- `lib/content-generation/tools/extract-vocabulary.ts` ✅ KEEP
- `lib/content-generation/tools/spanish-nlp-helper.ts` ✅ KEEP

**DictionaryRouter (CRITICAL):**
- `lib/services/dictionary-router.ts` ✅ KEEP (needs Latin implementation)

**API Routes:**
- `app/api/lessons/[lessonId]/vocabulary/approve/route.ts` ✅ KEEP
- `app/api/workflows/content-generation/route.ts` ✅ KEEP

**UI Components:**
- `components/authoring/ContentGenerationButton.tsx` ✅ KEEP
- `components/authoring/VocabularyReviewModal.tsx` ✅ KEEP
- `components/authoring/VocabularyReviewCard.tsx` ✅ KEEP

**Database Migrations:**
- `supabase/migrations/20251110161807_ai_generation_metadata.sql` ✅ KEEP
- `supabase/migrations/20251111_add_ai_generated_to_lesson_vocabulary.sql` ✅ KEEP

### Files Modified by BOTH (14 files)

#### 🔴 HIGH CONFLICT RISK
**`components/reader/DefinitionSidebar.tsx`**
- **Epic 7**: Uses `DictionaryRouter.lookup(word, language)`
- **Epic 8**: Direct API call to `/api/latin/analyze` with adapter
- **Resolution**: Keep Epic 8's implementation (adapter works, DictionaryRouter will catch up)

**`app/api/dictionary/[word]/route.ts`**
- **Epic 7**: Added `language` query param, returns 501 for non-Spanish
- **Epic 8**: Same changes (identical!)
- **Resolution**: No conflict! Both made same change ✅

#### 🟡 MEDIUM CONFLICT RISK
**`app/reader/reader-client.tsx`**
- **Epic 7**: No changes to language handling
- **Epic 8**: Added language selector dropdown + state
- **Resolution**: Keep Epic 8's changes (adds language support)

**`components/reader/AudioPlayer.tsx`**
- **Epic 7**: No changes
- **Epic 8**: Added `language` prop for TTS voice selection
- **Resolution**: Keep Epic 8's changes

**`components/reader/TextInputPanel.tsx`**
- **Epic 7**: No changes
- **Epic 8**: Bilingual placeholders
- **Resolution**: Keep Epic 8's changes

**`components/reader/TextRenderPanel.tsx`**
- **Epic 7**: No changes
- **Epic 8**: Pass `language` prop to children
- **Resolution**: Keep Epic 8's changes

**`app/api/tts/synthesize/route.ts`**
- **Epic 7**: No changes
- **Epic 8**: Language-based voice selection (Spanish vs Latin)
- **Resolution**: Keep Epic 8's changes

#### 🟢 LOW CONFLICT RISK
**`package.json` / `package-lock.json`**
- **Epic 7**: Added Mastra, NLP.js, Langchain
- **Epic 8**: No package changes
- **Resolution**: Keep Epic 7's packages (merge trivial)

**`.gitignore`**
- **Epic 7**: Added test artifacts
- **Epic 8**: Added CLTK service files
- **Resolution**: Merge both

**`next.config.ts` / `tailwind.config.ts`**
- **Epic 7**: Config changes for Mastra
- **Epic 8**: No changes
- **Resolution**: Keep Epic 7's config

**`.github/workflows/*`**
- **Epic 7**: CI improvements
- **Epic 8**: Removed Epic 7's CI changes
- **Resolution**: Keep Epic 7's CI setup

---

## Critical Integration Point: DictionaryRouter

### Current State (Epic 7)
```typescript
// lib/services/dictionary-router.ts
private static async lookupLatin(word: string): Promise<DictionaryResponse> {
  // TODO: Integration point for Latin dictionary API
  // For now, return not found
  return {
    word,
    found: false,
    language: 'la',
    definitions: [],
    source: 'latin-dict',
  }
}
```

### Required Implementation (from Epic 8)
```typescript
private static async lookupLatin(word: string): Promise<DictionaryResponse> {
  const baseUrl = this.getBaseUrl()
  const url = `${baseUrl}/api/latin/analyze?word=${encodeURIComponent(word)}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Latin API failed: ${response.status}`)
    }

    const latinData = await response.json()

    // Adapt Latin API response to DictionaryResponse format
    if (!latinData.dictionary || latinData.dictionary.definitions.length === 0) {
      return {
        word: latinData.form || word,
        found: false,
        language: 'la',
        definitions: [],
        source: 'latin-dict',
      }
    }

    return {
      word: latinData.dictionary.word,
      found: true,
      language: 'la',
      definitions: [{
        partOfSpeech: latinData.pos || 'unknown',
        meanings: latinData.dictionary.definitions,
      }],
      pronunciations: [],
      source: 'latin-dict',
    }
  } catch (error) {
    console.error(`Latin lookup failed for ${word}:`, error)
    return {
      word,
      found: false,
      language: 'la',
      definitions: [],
      source: 'latin-dict',
    }
  }
}
```

---

## Step-by-Step Merge Procedure

### Phase 1: Preparation (15 minutes)
1. **Checkout Epic 7 branch**
   ```bash
   git checkout feat/epic-07-llm-content-generation
   git pull origin feat/epic-07-llm-content-generation
   ```

2. **Create merge branch**
   ```bash
   git checkout -b feat/epic-07-08-merge
   ```

3. **Verify starting state**
   ```bash
   npm run type-check  # Should pass
   git status           # Should be clean
   ```

### Phase 2: Merge Epic 8 (30 minutes)
4. **Merge Epic 8 polish branch**
   ```bash
   git merge origin/feat/epic-08-polish-bilingual-ux --no-ff
   ```

5. **Resolve conflicts** (expected conflicts below)

#### Conflict Resolution Strategy

**A. `components/reader/DefinitionSidebar.tsx`**
- **Strategy**: Accept Epic 8's version ENTIRELY
- **Reason**: Epic 8's adapter works independently of DictionaryRouter
- **Command**: `git checkout --theirs components/reader/DefinitionSidebar.tsx`

**B. `app/reader/reader-client.tsx`**
- **Strategy**: Accept Epic 8's version (language selector)
- **Reason**: Adds bilingual support that Epic 7 needs
- **Command**: `git checkout --theirs app/reader/reader-client.tsx`

**C. Reader child components**
- `AudioPlayer.tsx`: Accept Epic 8 (language prop for TTS)
- `TextInputPanel.tsx`: Accept Epic 8 (bilingual placeholders)
- `TextRenderPanel.tsx`: Accept Epic 8 (pass language to children)
- **Command**: `git checkout --theirs components/reader/*.tsx`

**D. `app/api/tts/synthesize/route.ts`**
- **Strategy**: Accept Epic 8 (language-based voices)
- **Command**: `git checkout --theirs app/api/tts/synthesize/route.ts`

**E. `.gitignore`**
- **Strategy**: Merge both (add Epic 8's CLTK ignores to Epic 7's base)
- **Manual edit required**

**F. `package.json` / `package-lock.json`**
- **Strategy**: Keep Epic 7 entirely (no package changes in Epic 8)
- **Command**: `git checkout --ours package*.json`

6. **Stage resolved files**
   ```bash
   git add .
   ```

7. **Complete merge**
   ```bash
   git commit -m "merge: Epic 7 (Content Generation) + Epic 8 (Latin Foundation)"
   ```

### Phase 3: Integration (45 minutes)
8. **Update DictionaryRouter with Latin implementation**
   - Edit `lib/services/dictionary-router.ts`
   - Replace `lookupLatin()` stub with working implementation (see above)
   - Test: `npm run type-check`

9. **Verify vocabulary extraction works with Latin**
   - Check `lib/content-generation/tools/extract-vocabulary.ts`
   - Should already accept `language: 'la'` (line 57) ✅
   - Add Latin NLP support (currently only Spanish wink-nlp)

10. **Update extract-vocabulary.ts for Latin NLP**
    ```typescript
    // Add to extract-vocabulary.ts
    if (language === 'la') {
      // Latin: Use simple tokenization (CLTK via API)
      const latinTokens = readingText
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2)

      // Get frequency counts
      const frequency = new Map<string, number>()
      latinTokens.forEach(token => {
        frequency.set(token, (frequency.get(token) || 0) + 1)
      })

      // Convert to candidate format
      nlpCandidates = Array.from(frequency.entries())
        .map(([word, freq]) => ({ word, frequency: freq, normalized: word }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, maxItems * 2)
    } else {
      // Spanish: Use wink-nlp
      nlpCandidates = extractSpanishVocabCandidates(readingText, maxItems * 2)
    }
    ```

11. **Update DictionaryRouter.lookup() calls**
    - Verify all calls pass `language` parameter
    - Check: `extract-vocabulary.ts`, `DefinitionSidebar.tsx`, `VocabularyReviewModal.tsx`

### Phase 4: Testing (60 minutes)
12. **Type-check**
    ```bash
    npm run type-check  # Must pass with 0 errors
    ```

13. **Build test**
    ```bash
    npm run build       # Must succeed
    ```

14. **Start services**
    ```bash
    # Terminal 1: CLTK service
    cd services/latin-analyzer && docker-compose up

    # Terminal 2: Next.js app
    npm run dev
    ```

15. **Manual testing checklist** (see Phase 5 below)

### Phase 5: Manual Testing Checklist

#### Test 1: Spanish Reader (Baseline)
- [ ] Navigate to `/reader`
- [ ] Select "Spanish" from language dropdown
- [ ] Paste Spanish text: "El perro corre rápido"
- [ ] Click "Render"
- [ ] Click word "perro"
- [ ] Verify: Definition sidebar shows Spanish → English translation
- [ ] Click play button
- [ ] Verify: Sarah's voice (Spanish female)

#### Test 2: Latin Reader (Epic 8)
- [ ] Navigate to `/reader`
- [ ] Select "Latin" from language dropdown
- [ ] Paste Latin text: "Gallia est omnis divisa in partes tres"
- [ ] Click "Render"
- [ ] Click word "Gallia"
- [ ] Verify: Definition sidebar shows Latin → English translation from Lewis & Short
- [ ] Click play button
- [ ] Verify: Adam's voice (Latin male)

#### Test 3: Spanish Vocabulary Generation (Epic 7)
- [ ] Navigate to `/author/lessons/new`
- [ ] Create lesson with Spanish content: "Los estudiantes aprenden español"
- [ ] Select language: "Spanish"
- [ ] Click "Generate Vocabulary"
- [ ] Verify: Modal shows extracted Spanish words with English translations
- [ ] Approve 3-5 words
- [ ] Verify: Words saved to lesson_vocabulary table

#### Test 4: Latin Vocabulary Generation (INTEGRATION TEST)
- [ ] Navigate to `/author/lessons/new`
- [ ] Create lesson with Latin content: "Caesar Galliam vicit"
- [ ] Select language: "Latin"
- [ ] Click "Generate Vocabulary"
- [ ] Verify: Modal shows extracted Latin words with English translations
- [ ] Verify: Definitions come from Lewis & Short dictionary
- [ ] Approve 3-5 words
- [ ] Verify: Words saved with language='la'

#### Test 5: CLTK Microservice Health
- [ ] Check `http://localhost:3002/latin/health`
- [ ] Verify: Returns `{"status": "healthy", "cltk_version": "..."}`
- [ ] Check `http://localhost:3002/latin/demo`
- [ ] Verify: Shows Latin analysis example

#### Test 6: Database Integrity
```sql
-- Verify Latin dictionary schema
SELECT COUNT(*) FROM latin_dictionary_cache;
-- Should be 0 initially, populated on first lookups

-- Verify lesson vocabulary has language field
SELECT word, language FROM lesson_vocabulary
WHERE language = 'la'
LIMIT 5;

-- Verify ai_generated columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'lesson_vocabulary'
AND column_name LIKE 'ai_%';
```

---

## Rollback Plan

If merge fails or tests don't pass:

1. **Abandon merge branch**
   ```bash
   git checkout feat/epic-07-llm-content-generation
   git branch -D feat/epic-07-08-merge
   ```

2. **Create issue** documenting what failed
3. **Fix issues** on separate feature branches
4. **Retry merge** when ready

---

## Post-Merge Tasks

### Immediate (Same Day)
- [ ] Push merged branch to remote
- [ ] Create PR: `feat/epic-07-08-merge` → `main`
- [ ] Request review from team
- [ ] Update Epic 8 status doc

### Short-term (This Week)
- [ ] Deploy to staging environment
- [ ] Run E2E tests on staging
- [ ] Performance testing: Latin lookup times (<50ms cached, <2s first)
- [ ] Load testing: 100 concurrent Latin lookups

### Medium-term (Next Sprint)
- [ ] Add Latin NLP enhancements to vocabulary extraction
- [ ] Optimize Lewis & Short dictionary loading (lazy load by letter?)
- [ ] Add Latin grammar extraction to content generation workflow
- [ ] Create Latin sample lessons in database

---

## Success Criteria

Merge is considered **SUCCESSFUL** if:

✅ **Build & Type-check**
- `npm run type-check` passes with 0 errors
- `npm run build` succeeds
- No ESLint errors in critical paths

✅ **Reader Functionality**
- Spanish reader works (baseline)
- Latin reader works with Lewis & Short definitions
- Language selector switches cleanly
- TTS uses correct voices per language

✅ **Content Generation**
- Spanish vocabulary extraction works (baseline)
- Latin vocabulary extraction works with Latin dictionary
- DictionaryRouter routes to correct API per language
- Vocabulary approval saves with correct language tag

✅ **Services**
- CLTK microservice runs and responds
- Latin API routes return valid data
- No errors in console during normal operation

✅ **Performance**
- Latin cached lookups: <50ms (target)
- Latin first lookups: <2s (target)
- Page load time: <3s (baseline)
- No memory leaks during extended use

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| DictionaryRouter integration breaks Spanish | Low | High | Keep Epic 7's Spanish lookup unchanged, only add Latin |
| CLTK service not running | Medium | High | Document Docker setup, add health check to CI |
| Package.json conflicts | Low | Medium | Keep Epic 7's packages entirely |
| DefinitionSidebar conflicts | High | Medium | Use Epic 8's version (adapter pattern more flexible) |
| TypeScript errors after merge | Medium | High | Thorough type-checking before committing |
| Performance degradation | Low | Medium | Profile before/after, optimize if needed |

---

## Notes & Gotchas

### DictionaryRouter Pattern
- Epic 7's `DictionaryRouter` is a **facade pattern** - single interface for multiple dictionaries
- Epic 8's direct API calls work but bypass the router
- **Solution**: Implement Latin in router, update DefinitionSidebar to use router

### Language Parameter Flow
- Must flow through: `reader-client` → `TextRenderPanel` → `DefinitionSidebar` → API
- Check: All components accept and pass `language: 'es' | 'la'`

### Database Migrations
- Epic 7 migrations: `ai_generated` columns
- Epic 8 migrations: `latin_dictionary_cache` table
- Both needed! Run migrations in order:
  1. Epic 7's AI metadata migrations
  2. Epic 8's Latin dictionary migration

### CLTK Service Dependencies
- Requires Docker and Docker Compose
- Port 3002 must be available
- Python dependencies: CLTK 1.0+, FastAPI
- **Fallback**: If CLTK fails, Latin API still returns Lewis & Short data

### Lewis & Short Dictionary Size
- 26 JSON files, ~38MB total
- Loaded in-memory on first Latin API call
- **Optimization idea**: Lazy load by first letter (only load ls_G.json when needed)

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Preparation | 15 min | 15 min |
| Merge | 30 min | 45 min |
| Integration | 45 min | 90 min |
| Testing | 60 min | 150 min |
| **Total** | **2.5 hours** | |

Add 1-2 hours buffer for unexpected issues.

**Realistic estimate**: **3-4 hours** for complete merge + testing

---

## Conclusion

Epic 7 and Epic 8 are **highly compatible** with **minimal conflicts**. The merge is **low-risk** because:

1. Epic 7 already designed for multi-language (`language: 'es' | 'la'`)
2. Epic 8 provides the Latin implementation Epic 7 needs
3. Most conflicts are reader UI components where Epic 8's changes are additive
4. No database schema conflicts (orthogonal migrations)
5. Clear integration point: `DictionaryRouter.lookupLatin()`

**Recommendation**: Proceed with merge. Epic 7's content generation + Epic 8's Latin foundation = 🚀 **POWERFUL COMBO, BUTTHOLIO!**

---

**Document Version**: 1.0
**Last Updated**: 2025-11-10
**Author**: Claude Code
**Status**: ✅ Ready for Execution
