# Latin Reader Integration into Main `/reader` System

**Date**: 2025-11-10
**Status**: PLANNING - Ready for Implementation
**Estimated Time**: 3-4 hours

---

## Executive Summary

**THE FUCKING PROBLEM**: Latin is a standalone `/latin/demo` route with separate components. You can't copypasta Caesar into the main `/reader` and get the same Spanish experience.

**THE GOAL**: Make `/reader` work for BOTH Spanish and Latin so you can:
1. Select language (Spanish | Latin)
2. Paste Caesar or Cicero
3. Click words → get Latin dictionary definitions from Lewis & Short
4. Save to vocabulary, flashcards, use tutor - same as Spanish

**THE WIN**: One unified reader, two language backends. Ship Latin without rewriting the whole app.

---

## Current Architecture Analysis

### Spanish Flow (WORKING)

```
/reader
  ↓
ReaderClient (reader-client.tsx)
  - language: 'es' (hardcoded line 89)
  - saves text with language='es'
  ↓
TextRenderPanel
  - tokenizeText() splits words
  - click word → setLookupWord()
  ↓
DefinitionSidebar
  - fetches `/api/dictionary/${word}`
  - receives DictionaryResponse
  - displays definitions
```

**Spanish API Response** (`/api/dictionary/[word]`):
```json
{
  "word": "casa",
  "found": true,
  "definitions": [
    {
      "partOfSpeech": "noun",
      "meanings": ["house", "home"]
    }
  ],
  "pronunciations": [
    {
      "text": "ˈka-sa",
      "audio": "https://..."
    }
  ]
}
```

### Latin Flow (ISOLATED)

```
/latin/demo
  ↓
LatinDemoPage
  ↓
LatinTextReader (standalone component)
  - Custom tokenization
  - Custom popover
  - Separate from main app
  ↓
LatinWordPopover
  - fetches `/api/latin/analyze?word=Gallia`
  - Custom display logic
```

**Latin API Response** (`/api/latin/analyze`):
```json
{
  "form": "Gallia",
  "lemma": null,
  "pos": null,
  "morphology": null,
  "dictionary": {
    "language": "latin",
    "word": "Gallia",
    "definitions": ["Gallia, ae, f. Gaul (the country)"],
    "examples": [],
    "etymology": "from Celtic tribal name"
  },
  "index": 0
}
```

---

## API Response Format Gap

### Problem: Different Structures

**Spanish** expects:
```typescript
{
  definitions?: {
    partOfSpeech: string
    meanings: string[]  // ← ARRAY
  }[]
}
```

**Latin** returns:
```typescript
{
  dictionary: {
    definitions: string[]  // ← DIRECT ARRAY, no partOfSpeech
  }
}
```

### Solution: Adapter Pattern

Create `LanguageAdapter` to normalize both formats into a common interface.

---

## Implementation Plan

### Phase 1: Add Language Selection (30 min)

**File**: `app/reader/reader-client.tsx`

**Changes**:
1. Add language state
2. Add language selector UI
3. Pass language to components

```typescript
// ADD: Language state (after line 24)
const [language, setLanguage] = useState<'es' | 'la'>('es')

// MODIFY: Line 89 - use language state instead of hardcoded 'es'
body: JSON.stringify({
  title: `Reading ${new Date().toLocaleDateString()}`,
  content: text,
  language: language,  // ← CHANGED from 'es'
}),

// ADD: Language selector UI (after line 143, before Input Text button)
<div className="flex items-center gap-2 px-6 py-3 border-r border-sepia-300">
  <label className="text-sm text-sepia-600">Language:</label>
  <select
    value={language}
    onChange={(e) => setLanguage(e.target.value as 'es' | 'la')}
    className="px-2 py-1 border border-sepia-300 rounded text-sm"
  >
    <option value="es">Spanish</option>
    <option value="la">Latin</option>
  </select>
</div>

// MODIFY: Pass language to TextRenderPanel (line 199)
<TextRenderPanel
  text={text}
  language={language}  // ← ADD THIS
  onEditClick={() => setMode('input')}
  libraryId={currentLibraryId}
/>
```

---

### Phase 2: Language-Aware API Routing (1 hour)

**File**: `components/reader/TextRenderPanel.tsx`

**Changes**:
1. Accept language prop
2. Pass to DefinitionSidebar

```typescript
// MODIFY: Interface (line 11)
interface TextRenderPanelProps {
  text: string
  language: 'es' | 'la'  // ← ADD THIS
  onEditClick: () => void
  libraryId: string | null
}

// MODIFY: Destructure language (line 17)
export function TextRenderPanel({
  text,
  language,  // ← ADD THIS
  onEditClick,
  libraryId
}: TextRenderPanelProps) {

// MODIFY: Pass language to DefinitionSidebar (line 256)
<DefinitionSidebar
  word={lookupWord}
  language={language}  // ← ADD THIS
  onClose={handleSidebarClose}
  onDefinitionLoaded={handleDefinitionLoaded}
/>
```

**File**: `components/reader/DefinitionSidebar.tsx`

**Changes**:
1. Accept language prop
2. Route to correct API based on language
3. Adapt response formats

```typescript
// MODIFY: Interface (line 11)
interface DefinitionSidebarProps {
  word: string | null
  language: 'es' | 'la'  // ← ADD THIS
  onClose: () => void
  onDefinitionLoaded?: (definition: DictionaryResponse) => void
}

// MODIFY: Destructure language (line 17)
export function DefinitionSidebar({
  word,
  language,  // ← ADD THIS
  onClose,
  onDefinitionLoaded
}: DefinitionSidebarProps) {

// ADD: Language adapter function (after line 50, before useEffect)
const adaptLatinResponse = (latinData: any): DictionaryResponse => {
  if (!latinData.dictionary || latinData.dictionary.definitions.length === 0) {
    return {
      word: latinData.form,
      found: false,
    }
  }

  return {
    word: latinData.dictionary.word,
    found: true,
    definitions: [
      {
        partOfSpeech: latinData.pos || 'unknown',
        meanings: latinData.dictionary.definitions,
      }
    ],
    // Latin doesn't have pronunciations like Spanish
    pronunciations: [],
  }
}

// MODIFY: fetchDefinition function (line 65-111)
const fetchDefinition = async () => {
  setLoading(true)
  setError(null)
  setCacheHit(false)

  try {
    // Check cache first (works for both languages)
    const cached = DictionaryCache.get(word)
    if (cached) {
      console.log('Cache hit:', word)
      setData(cached)
      setCacheHit(true)
      setLoading(false)
      onDefinitionLoaded?.(cached)
      return
    }

    // Cache miss - fetch from appropriate API
    console.log('Cache miss:', word, 'language:', language)

    let result: DictionaryResponse

    if (language === 'la') {
      // Latin: Call /api/latin/analyze
      const response = await fetch(
        `/api/latin/analyze?word=${encodeURIComponent(word)}`,
        { signal: controller.signal }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch Latin definition')
      }

      const latinData = await response.json()
      result = adaptLatinResponse(latinData)
    } else {
      // Spanish: Call /api/dictionary
      const response = await fetch(
        `/api/dictionary/${encodeURIComponent(word)}`,
        { signal: controller.signal }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch Spanish definition')
      }

      result = await response.json()
    }

    setData(result)

    // Store in cache if successful
    if (result.found) {
      DictionaryCache.set(word, result)
      onDefinitionLoaded?.(result)
    }
  } catch (err) {
    // Ignore abort errors
    if (err instanceof Error && err.name === 'AbortError') {
      return
    }
    setError(err instanceof Error ? err.message : 'Unknown error')
  } finally {
    setLoading(false)
  }
}
```

---

### Phase 3: Enhanced Latin Display (30 min)

**File**: `components/reader/DefinitionSidebar.tsx`

**Changes**: Show Latin morphology if available

```typescript
// ADD: After word header (around line 243), before definitions
{language === 'la' && data?.morphology && (
  <div className="bg-sepia-50 border border-sepia-200 rounded-lg p-3">
    <h4 className="text-xs uppercase tracking-wide text-sepia-600 mb-2">
      Morphology
    </h4>
    <div className="grid grid-cols-2 gap-2 text-sm">
      {data.morphology.case && (
        <div>
          <span className="text-sepia-500">Case:</span>{' '}
          <span className="text-sepia-900">{data.morphology.case}</span>
        </div>
      )}
      {data.morphology.number && (
        <div>
          <span className="text-sepia-500">Number:</span>{' '}
          <span className="text-sepia-900">{data.morphology.number}</span>
        </div>
      )}
      {data.morphology.gender && (
        <div>
          <span className="text-sepia-500">Gender:</span>{' '}
          <span className="text-sepia-900">{data.morphology.gender}</span>
        </div>
      )}
      {data.morphology.tense && (
        <div>
          <span className="text-sepia-500">Tense:</span>{' '}
          <span className="text-sepia-900">{data.morphology.tense}</span>
        </div>
      )}
      {data.morphology.voice && (
        <div>
          <span className="text-sepia-500">Voice:</span>{' '}
          <span className="text-sepia-900">{data.morphology.voice}</span>
        </div>
      )}
      {data.morphology.mood && (
        <div>
          <span className="text-sepia-500">Mood:</span>{' '}
          <span className="text-sepia-900">{data.morphology.mood}</span>
        </div>
      )}
    </div>
  </div>
)}
```

---

### Phase 4: Type Safety (30 min)

**File**: `types/index.ts`

**Changes**: Add Latin-specific types

```typescript
// ADD: Latin morphology interface
export interface LatinMorphology {
  case?: string
  number?: string
  gender?: string
  tense?: string
  voice?: string
  mood?: string
  person?: string
  degree?: string
}

// MODIFY: DictionaryResponse to support morphology
export interface DictionaryResponse {
  word: string
  found: boolean
  definitions?: {
    partOfSpeech: string
    meanings: string[]
  }[]
  pronunciations?: {
    text: string
    audio?: string
  }[]
  morphology?: LatinMorphology  // ← ADD THIS for Latin
  suggestions?: string[]
  error?: string
}
```

---

### Phase 5: Database Schema (30 min)

**Current Schema**: `library_texts` table has `language` column (already supports 'la')

**No Changes Needed!** The existing schema already supports:
- `language VARCHAR(10)` - can store 'la' or 'es'
- `vocabulary_entries` stores `definition` as JSONB - can store both formats

**Verify**:
```sql
-- Check library_texts can store Latin
SELECT * FROM library_texts WHERE language = 'la' LIMIT 1;

-- Check vocabulary can store Latin definitions
SELECT * FROM vocabulary_entries
WHERE definition->>'word' IS NOT NULL
LIMIT 1;
```

---

## Testing Checklist

### Integration Tests

1. **Language Selection**
   - [ ] Can select Latin in dropdown
   - [ ] Language persists when switching tabs
   - [ ] Saved text stores correct language

2. **Latin Text Input**
   - [ ] Paste "Gallia est omnis divisa in partes tres"
   - [ ] Click "Read" → saves to library with language='la'
   - [ ] Words are clickable

3. **Latin Dictionary Lookup**
   - [ ] Click "Gallia" → sidebar opens
   - [ ] Shows definition from Lewis & Short
   - [ ] Shows morphology if available
   - [ ] Cache works (second click instant)

4. **Vocabulary Integration**
   - [ ] Latin words save to vocabulary
   - [ ] Vocabulary panel shows Latin words
   - [ ] Can create flashcards from Latin words

5. **Spanish Still Works**
   - [ ] Select Spanish language
   - [ ] Paste Spanish text
   - [ ] Dictionary lookup works
   - [ ] No regression

### Edge Cases

- [ ] Switch language mid-text → shows appropriate dictionary
- [ ] Latin word not found → shows suggestions if available
- [ ] CLTK service down → still shows dictionary (no morphology)
- [ ] Cache contains Spanish word → doesn't affect Latin lookup

---

## Potential Issues & Solutions

### Issue 1: CLTK Service Unavailable

**Problem**: Latin morphology comes from external CLTK microservice on Docker.

**Impact**: Medium - Dictionary works, but no morphology (case, gender, etc.)

**Solution**: Already handled! `LatinAnalysisService` has fallback:
```typescript
// Returns lemma=null, pos=null, morphology=null
// But dictionary still works (Lewis & Short is in-memory)
```

**User Experience**: Still better than nothing. User gets definitions even without morphology.

---

### Issue 2: Lewis & Short Definitions Too Long

**Problem**: Some Lewis & Short entries have VERY long definitions (see "pater" example - 2KB of text).

**Impact**: Low - UI might feel overwhelming

**Solution**: Implement collapsible sections (FUTURE):
```typescript
{def.meanings.length > 3 && (
  <button onClick={() => setExpanded(!expanded)}>
    {expanded ? 'Show Less' : `Show ${def.meanings.length - 3} More`}
  </button>
)}
```

---

### Issue 3: Latin Doesn't Have Audio

**Problem**: Spanish has Merriam-Webster audio, Latin doesn't.

**Impact**: Low - Expected difference

**Solution**: None needed. Just don't show pronunciation section for Latin.

---

## File Changes Summary

| File | Lines Changed | Complexity |
|------|---------------|------------|
| `app/reader/reader-client.tsx` | ~20 lines | Low |
| `components/reader/TextRenderPanel.tsx` | ~5 lines | Low |
| `components/reader/DefinitionSidebar.tsx` | ~80 lines | Medium |
| `types/index.ts` | ~15 lines | Low |
| Database | 0 lines | None |

**Total**: ~120 lines of code

---

## Implementation Order

**Do this in order** (prevents breaking changes):

1. ✅ **Types First** - Add `LatinMorphology` interface to `types/index.ts`
2. ✅ **Backend Ready** - Verify `/api/latin/analyze` works (DONE)
3. ✅ **Language State** - Add language selection to ReaderClient
4. ✅ **Pass Props** - Thread language through TextRenderPanel → DefinitionSidebar
5. ✅ **API Routing** - Add if/else in DefinitionSidebar.fetchDefinition()
6. ✅ **Adapter** - Add `adaptLatinResponse()` function
7. ✅ **UI Enhancement** - Add morphology display
8. ✅ **Test Spanish** - Ensure no regression
9. ✅ **Test Latin** - Copypasta Caesar, verify it works
10. ✅ **Commit** - `feat(epic-8): integrate Latin into main /reader`

---

## Future Enhancements (NOT NOW)

These can wait until we add Old Norse and need full unification:

- **Language Detection**: Auto-detect language from text
- **Mixed Language**: Support texts with both Spanish and Latin
- **Morphology Tables**: Display full conjugation/declension tables
- **Etymology Links**: Link Latin words to their Spanish derivatives
- **Pronunciation TTS**: Use browser speech synthesis for Latin
- **Macrons**: Toggle display of Latin vowel length marks

---

## Verification Commands

```bash
# Test Latin API
curl "http://localhost:3002/api/latin/analyze?word=Gallia" | jq

# Test Spanish API (ensure no regression)
curl "http://localhost:3002/api/dictionary/casa" | jq

# Check database schema
psql -d interlinear -c "\d library_texts"
psql -d interlinear -c "\d vocabulary_entries"
```

---

## Summary

**THIS IS DOABLE.** The Latin backend is 100% working. We just need to:

1. Add language dropdown
2. Route API calls based on language
3. Adapt Latin response to match Spanish format
4. Display morphology for Latin

**3-4 hours max.** Then you can copypasta Caesar into `/reader` and get the same experience as Spanish.

**NO DATABASE CHANGES NEEDED.** Existing schema already supports multiple languages.

**NO BREAKING CHANGES.** Spanish functionality unchanged. Additive only.

Ship it and fuck the butthole! 🚀
