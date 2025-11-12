# Language Module Architecture - Future Migration Plan

> **Status:** DOCUMENTED BUT NOT YET EXECUTED
> **Created:** 2025-11-10
> **Philosophy:** Build each language separately until it hurts, then migrate to unified architecture

---

## Executive Summary

This document captures the **comprehensive plan for migrating from per-language "polyp" systems to a unified language module architecture**. We are NOT executing this now because shipping features and validating product-market fit is more important than perfect architecture.

**Current State:** Each language is a standalone system (Spanish in `/reader`, Latin in `/latin/demo`)
**Future State:** Shared core infrastructure + pluggable language modules
**Migration Cost:** 6-8 weeks of engineering work
**When to Execute:** After 1000+ users OR $10K MRR OR 3+ languages causing pain

---

## When to Execute This Migration

### ✅ Migration Triggers (Execute when ANY of these are true)

1. **User Scale**
   - 1,000+ active users
   - Multiple concurrent users experiencing issues
   - Support burden from per-language bugs

2. **Revenue Validation**
   - $10K+ Monthly Recurring Revenue
   - Paying customers requesting features
   - Business viability confirmed

3. **Language Pressure**
   - 3+ languages in production
   - Duplicate code maintenance becomes painful
   - Adding new language takes >1 week

4. **Technical Debt Pain**
   - Database inconsistencies causing actual bugs
   - API duplication causing maintenance overhead
   - Component duplication causing UI inconsistencies

5. **Team Growth**
   - Hiring additional developers
   - Need clear separation of concerns
   - Onboarding made difficult by architecture chaos

### ❌ Do NOT Execute If:
- Still validating product-market fit
- <100 active users
- <3 languages in production
- Engineering time better spent on features
- No revenue to fund 6-8 weeks of refactoring

---

## Current "Polyp" State (Good Enough for MVP)

### Spanish System
```
app/reader/
  ├── page.tsx                    # Main reader interface
  ├── reader-client.tsx           # Language hardcoded to 'es'
components/reader/
  ├── ClickableWord.tsx           # Works for Spanish only
  ├── DefinitionSidebar.tsx       # Merriam-Webster API
  └── TextRenderPanel.tsx         # Spanish text rendering
app/api/
  └── dictionary/[word]/route.ts  # Spanish-only MW API
lib/db/schema.ts
  └── library_texts.language      # DEFAULT 'es'
```

### Latin System (Standalone "Polyp")
```
app/latin/demo/
  └── page.tsx                    # Separate Latin demo
src/components/latin/
  └── LatinTextReader.tsx         # DUPLICATE of reader components
app/api/latin/
  ├── analyze/route.ts            # Separate Latin API
  └── health/route.ts             # Separate health check
src/services/
  └── LatinAnalysisService.ts     # Lewis & Short + CLTK
```

### Problems with Current State
- ❌ Duplicate components (`LatinTextReader` vs `Reader`)
- ❌ Separate API endpoints (`/api/dictionary` vs `/api/latin/analyze`)
- ❌ Database inconsistency (Spanish defaults, Latin ad-hoc)
- ❌ Adding Norse/Greek = duplicate EVERYTHING again
- ⚠️ **But it works and ships fast!**

---

## Future Desired State: Language Module Architecture

### Core Philosophy
**"Shared core, specialized modules"**

- ONE vocabulary system across all languages
- ONE library system with language metadata
- ONE AI tutor framework with language-specific prompts
- But SEPARATE reader implementations tuned per language

### Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│         SHARED CORE INFRASTRUCTURE (Unified)            │
│                                                         │
│  • Database: library_texts, vocabulary, flashcards     │
│  • Services: VocabularyService, LibraryService         │
│  • AI Tutor: Framework + language-specific prompts    │
│  • Auth: User management, settings, progress           │
│  • Types: LanguageCode, LanguageMetadata               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│       LANGUAGE MODULES (Specialized per Language)       │
│                                                         │
│  /reader/spanish/     - MW API, simple lookup          │
│  /reader/latin/       - Lewis & Short, morphology UI   │
│  /reader/norse/       - Multi-source custom dict API   │
│  /reader/greek/       - LSJ dictionary, accents        │
│  /reader/sanskrit/    - Devanagari rendering           │
│                                                         │
│  Each module can:                                      │
│  • Use different dictionary backends                   │
│  • Render text differently (scripts, accents)         │
│  • Show language-specific features (morphology, etc.) │
│  • But share core vocabulary/library/tutor            │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure (After Migration)

```
lib/
├── services/
│   ├── core/
│   │   ├── VocabularyService.ts      # Shared vocab tracking
│   │   ├── LibraryService.ts         # Shared text storage
│   │   └── TutorService.ts           # Shared tutor framework
│   └── languages/
│       ├── LanguageService.ts        # Abstract base class
│       ├── SpanishService.ts         # MW API wrapper
│       ├── LatinService.ts           # Lewis & Short + CLTK
│       ├── NorseService.ts           # Multi-source custom API
│       └── LanguageServiceFactory.ts # Service instantiation
├── contexts/
│   └── LanguageContext.tsx           # React context for language state
├── prompts/
│   ├── spanish-tutor.ts              # Spanish AI prompts
│   ├── latin-tutor.ts                # Latin AI prompts
│   └── norse-tutor.ts                # Norse AI prompts
└── db/
    └── schema.ts                     # Unified multi-language schema

app/
├── reader/
│   ├── spanish/
│   │   ├── page.tsx
│   │   ├── SpanishDictionary.tsx
│   │   └── components/
│   ├── latin/
│   │   ├── page.tsx
│   │   ├── LatinDictionary.tsx
│   │   ├── MorphologyPanel.tsx       # Latin-specific UI
│   │   └── components/
│   ├── norse/
│   │   ├── page.tsx
│   │   ├── NorseMultiDict.tsx        # Custom multi-source API
│   │   └── components/
│   └── [language]/                   # Template for new languages
│       └── README.md                 # How to add a language
└── api/
    └── v1/
        └── [language]/
            ├── dictionary/[word]/route.ts
            ├── analyze/route.ts
            └── tutor/route.ts

types/
└── language.ts
    ├── LanguageCode = 'es' | 'la' | 'on' | 'grc' | 'sa'
    ├── LanguageMetadata (name, script, features)
    └── SUPPORTED_LANGUAGES config
```

---

## Migration Plan: 6-8 Week Timeline

### Phase 1: Foundation (Week 1-2) - Shared Core

**Objective:** Extract shared infrastructure without breaking Spanish

**Tasks:**
1. Create type definitions (`types/language.ts`)
2. Create abstract `LanguageService` base class
3. Create `LanguageServiceFactory` with singleton pattern
4. Wrap existing Spanish logic in `SpanishService`
5. Create `VocabularyService` (language-agnostic)
6. Create `LibraryService` (language-agnostic)
7. Create `LanguageContext` with React hooks
8. Database migration: Add language columns, update constraints

**Database Migration:**
```sql
-- Add language column to vocabulary
ALTER TABLE vocabulary ADD COLUMN language TEXT NOT NULL DEFAULT 'es';

-- Add multi-language unique constraint
ALTER TABLE vocabulary
  DROP CONSTRAINT IF EXISTS vocabulary_user_id_word_key;
ALTER TABLE vocabulary
  ADD CONSTRAINT vocabulary_user_id_word_language_key
  UNIQUE(user_id, word, language);

-- Add validation
ALTER TABLE vocabulary
  ADD CONSTRAINT vocabulary_valid_language
  CHECK (language IN ('es', 'la', 'on', 'grc', 'sa'));
```

**Validation:**
- [ ] All Spanish tests pass
- [ ] Vocabulary saves with language field
- [ ] Library texts have language metadata
- [ ] No breaking changes to existing functionality

---

### Phase 2: Spanish Module Extraction (Week 2-3)

**Objective:** Move Spanish to module pattern

**Tasks:**
1. Create `/reader/spanish/` directory
2. Move Spanish-specific components to module
3. Create `SpanishDictionary.tsx` wrapping MW API
4. Update routes to use `/reader/spanish`
5. Add language switcher UI (simple links)
6. Redirect `/reader` → `/reader/spanish` for backwards compat

**Validation:**
- [ ] Spanish feature parity maintained
- [ ] All clickable words work
- [ ] Dictionary lookups work
- [ ] Vocabulary tracking works
- [ ] AI tutor works with Spanish prompts

---

### Phase 3: Latin Module Integration (Week 3-4)

**Objective:** Delete duplicate Latin code, build proper module

**Tasks:**
1. Create `/reader/latin/` directory
2. **DELETE** `src/components/latin/LatinTextReader.tsx`
3. **DELETE** `/app/latin/demo/` standalone demo
4. Create `LatinDictionary.tsx` using existing `LatinAnalysisService`
5. Create `MorphologyPanel.tsx` (Latin-specific feature)
6. Build Latin-optimized UI components
7. Integrate with shared vocabulary/library services

**Validation:**
- [ ] Latin dictionary lookups work
- [ ] Lewis & Short entries display correctly
- [ ] Morphology panel shows CLTK analysis
- [ ] Latin vocab saves to unified table
- [ ] No duplicate code remains

---

### Phase 4: API Unification (Week 4-5)

**Objective:** Create versioned unified APIs

**Tasks:**
1. Create `/api/v1/[language]/dictionary/[word]/route.ts`
2. Create `/api/v1/[language]/analyze/route.ts`
3. Implement `LanguageServiceFactory` routing in API
4. Keep old routes as redirects during transition
5. Update frontend to use new API routes
6. **DELETE** old `/api/latin/*` routes after validation

**API Design:**
```typescript
// app/api/v1/[language]/dictionary/[word]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ language: string, word: string }> }
) {
  const { language, word } = await params

  if (!LanguageServiceFactory.isSupported(language)) {
    return NextResponse.json({ error: 'Unsupported language' }, { status: 400 })
  }

  const service = LanguageServiceFactory.getService(language as LanguageCode)
  const definition = await service.lookupWord(word)

  return NextResponse.json({
    language,
    word,
    found: !!definition,
    ...definition
  })
}
```

**Validation:**
- [ ] Spanish API works via v1 routes
- [ ] Latin API works via v1 routes
- [ ] Old routes redirect correctly
- [ ] Type safety enforced

---

### Phase 5: AI Tutor Refactoring (Week 5-6)

**Objective:** Language-aware tutor with templated prompts

**Tasks:**
1. Extract Spanish prompts to `lib/prompts/spanish-tutor.ts`
2. Create Latin prompts in `lib/prompts/latin-tutor.ts`
3. Update `TutorService` to use language-based templates
4. Update `/api/tutor/start` to detect language from textId
5. Test tutor conversations in both languages

**Prompt Template Pattern:**
```typescript
// lib/prompts/spanish-tutor.ts
export const spanishTutorPrompts = {
  system: (level: string) => `Eres un tutor de español en nivel CEFR ${level}...`,
  constraints: "Responde SOLO en español. No uses inglés.",
  // ...
}

// lib/prompts/latin-tutor.ts
export const latinTutorPrompts = {
  system: (level: string) => `You are a Latin tutor. Conduct conversations in Latin...`,
  constraints: "Focus on classical Latin grammar and vocabulary.",
  // ...
}
```

**Validation:**
- [ ] Spanish tutor maintains existing behavior
- [ ] Latin tutor uses appropriate prompts
- [ ] Conversations stay in target language
- [ ] Level system works across languages

---

### Phase 6: Module Template & Documentation (Week 6-7)

**Objective:** Make adding new languages trivial

**Tasks:**
1. Create `/reader/[language]/` template directory
2. Write `HOW_TO_ADD_A_LANGUAGE.md` guide
3. Create boilerplate files for new languages
4. Document language service interface requirements
5. Create checklist for language integration

**Template Structure:**
```
app/reader/[language]/
├── README.md                   # Language-specific notes
├── page.tsx                    # Main reader interface
├── components/
│   ├── Dictionary.tsx          # Dictionary lookup UI
│   ├── TextRenderer.tsx        # Language-specific rendering
│   └── SpecialFeatures.tsx     # Language-specific panels
└── language-config.ts          # Metadata and capabilities
```

**Adding a Language Checklist:**
- [ ] Add LanguageCode to type definitions
- [ ] Add LanguageMetadata configuration
- [ ] Implement LanguageService class
- [ ] Add to LanguageServiceFactory switch
- [ ] Create `/reader/[language]/` module
- [ ] Implement dictionary lookup UI
- [ ] Create AI tutor prompts
- [ ] Add to language switcher
- [ ] Write integration tests
- [ ] Update documentation

**Expected Time to Add New Language:** <1 week (vs current: duplicate everything)

---

### Phase 7: Testing & Validation (Week 7-8)

**Objective:** Ensure production readiness

**Tasks:**
1. Full regression testing of Spanish
2. Full integration testing of Latin
3. Performance benchmarking
4. Load testing with multiple concurrent languages
5. Security audit of new API routes
6. Database migration validation on staging
7. Production deployment plan

**Test Categories:**
- Unit tests for language services
- Integration tests for API routes
- E2E tests for each language module
- Performance tests (dictionary lookup latency)
- Database integrity tests

---

## Technical Design Details

### Abstract Language Service Interface

```typescript
// lib/services/languages/LanguageService.ts
export abstract class LanguageService {
  abstract readonly code: LanguageCode
  abstract readonly metadata: LanguageMetadata

  // REQUIRED: All languages must implement
  abstract tokenize(text: string): Token[]
  abstract lookupWord(word: string): Promise<Definition | null>

  // OPTIONAL: Graceful degradation for languages without these features
  getMorphology(word: string): Promise<Morphology | null> {
    return Promise.resolve(null) // Not all languages have morphology
  }

  getTutorPrompts(): PromptTemplates | null {
    return null // Not all languages have tutors yet
  }

  getVoiceConfig(): VoiceConfig {
    return { lang: this.code } // Default voice config
  }

  // Language-specific capabilities
  hasGrammarFeatures(): boolean {
    return this.metadata.hasCases || this.metadata.hasGenders
  }

  supportsModernCEFR(): boolean {
    return this.metadata.cefrApplicable
  }
}
```

### Example: Latin Service Implementation

```typescript
// lib/services/languages/LatinService.ts
import { LatinAnalysisService } from '@/services/LatinAnalysisService'
import { latinTutorPrompts } from '@/lib/prompts/latin-tutor'

export class LatinService extends LanguageService {
  readonly code = 'la' as const
  readonly metadata = SUPPORTED_LANGUAGES.la

  private latinAnalyzer: LatinAnalysisService

  constructor() {
    super()
    this.latinAnalyzer = getLatinAnalysisService()
  }

  tokenize(text: string): Token[] {
    // Latin-specific tokenization (handle enclitic -que, etc.)
    return latinTokenize(text)
  }

  async lookupWord(word: string): Promise<Definition | null> {
    await this.latinAnalyzer.initialize()
    const result = await this.latinAnalyzer.analyzeWord(word)

    if (!result.dictionary) return null

    return {
      word,
      lemma: result.lemma,
      definitions: result.dictionary.definitions,
      partOfSpeech: result.pos,
      // Latin-specific data
      morphology: result.morphology
    }
  }

  async getMorphology(word: string): Promise<Morphology | null> {
    await this.latinAnalyzer.initialize()
    const result = await this.latinAnalyzer.analyzeWord(word)
    return result.morphology || null
  }

  getTutorPrompts() {
    return latinTutorPrompts
  }
}
```

### Language Service Factory

```typescript
// lib/services/languages/LanguageServiceFactory.ts
const services: Partial<Record<LanguageCode, LanguageService>> = {}

export class LanguageServiceFactory {
  static getService(code: LanguageCode): LanguageService {
    // Singleton pattern - reuse instances
    if (services[code]) return services[code]!

    switch (code) {
      case 'es':
        return services.es = new SpanishService()
      case 'la':
        return services.la = new LatinService()
      case 'on':
        return services.on = new NorseService()
      case 'grc':
        return services.grc = new GreekService()
      case 'sa':
        return services.sa = new SanskritService()
      default:
        throw new Error(`Unsupported language: ${code}`)
    }
  }

  static isSupported(code: string): code is LanguageCode {
    return ['es', 'la', 'on', 'grc', 'sa'].includes(code)
  }

  static getAllSupported(): LanguageCode[] {
    return Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]
  }
}
```

### Language Metadata System

```typescript
// types/language.ts
export type LanguageCode = 'es' | 'la' | 'on' | 'grc' | 'sa'

export interface LanguageMetadata {
  code: LanguageCode
  name: string
  nativeName: string
  family: string
  script: 'latin' | 'greek' | 'devanagari' | 'runic'
  direction: 'ltr' | 'rtl'

  // Grammatical features
  hasGenders: boolean
  hasCases: boolean
  hasArticles: boolean

  // Application features
  cefrApplicable: boolean
  dictionaryType: 'modern' | 'historical'
  morphologyAvailable: boolean
  ttsSupported: boolean
}

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageMetadata> = {
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    family: 'Romance',
    script: 'latin',
    direction: 'ltr',
    hasGenders: true,
    hasCases: false,
    hasArticles: true,
    cefrApplicable: true,
    dictionaryType: 'modern',
    morphologyAvailable: false,
    ttsSupported: true
  },
  la: {
    code: 'la',
    name: 'Latin',
    nativeName: 'Latina',
    family: 'Italic',
    script: 'latin',
    direction: 'ltr',
    hasGenders: true,
    hasCases: true,
    hasArticles: false,
    cefrApplicable: false,
    dictionaryType: 'historical',
    morphologyAvailable: true,
    ttsSupported: false
  },
  on: {
    code: 'on',
    name: 'Old Norse',
    nativeName: 'Norrœnt mál',
    family: 'Germanic',
    script: 'latin',
    direction: 'ltr',
    hasGenders: true,
    hasCases: true,
    hasArticles: false,
    cefrApplicable: false,
    dictionaryType: 'historical',
    morphologyAvailable: false, // Until we implement it
    ttsSupported: false
  },
  grc: {
    code: 'grc',
    name: 'Ancient Greek',
    nativeName: 'Ἑλληνική',
    family: 'Hellenic',
    script: 'greek',
    direction: 'ltr',
    hasGenders: true,
    hasCases: true,
    hasArticles: true,
    cefrApplicable: false,
    dictionaryType: 'historical',
    morphologyAvailable: true,
    ttsSupported: false
  },
  sa: {
    code: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    family: 'Indo-Aryan',
    script: 'devanagari',
    direction: 'ltr',
    hasGenders: true,
    hasCases: true,
    hasArticles: false,
    cefrApplicable: false,
    dictionaryType: 'historical',
    morphologyAvailable: true,
    ttsSupported: false
  }
}
```

---

## Risk Assessment & Mitigation

### 🔴 Critical Risks

**Risk 1: Breaking existing Spanish functionality**
- **Impact:** Users lose access to Spanish texts/vocabulary (CATASTROPHIC)
- **Probability:** Medium (lots of changes to core functionality)
- **Mitigation:**
  - Maintain 'es' as default everywhere during migration
  - Parallel deployment (old + new routes coexist)
  - Extensive regression testing before deleting old code
  - Feature flags to toggle new/old behavior
  - Database migrations are additive only (no drops)
  - Rollback plan at every phase

**Risk 2: Database migration failure**
- **Impact:** Data corruption, downtime
- **Probability:** Low (migrations are additive)
- **Mitigation:**
  - Test on staging database first
  - Keep defaults to prevent NULL values
  - Write rollback script before deploying
  - Use transactions for atomic migrations
  - Full database backup before migration

**Risk 3: Performance degradation**
- **Impact:** Slow dictionary lookups, poor UX
- **Probability:** Low (Latin dictionary in-memory)
- **Mitigation:**
  - Latin dictionary already loaded in memory
  - Add Redis cache for Spanish API calls
  - Benchmark before/after migration
  - Monitor API response times in production

### 🟡 Medium Risks

**Risk 4: Over-engineering**
- **Impact:** Wasted time on abstractions that don't provide value
- **Probability:** Medium (easy to over-design)
- **Mitigation:**
  - Follow YAGNI principle strictly
  - Only add abstractions when 3rd language proves need
  - Keep interfaces simple, add complexity as needed
  - Validate architecture with real Norse/Greek implementation

**Risk 5: Type system complexity**
- **Impact:** Development slowdown, TypeScript errors
- **Probability:** Medium (adding types across codebase)
- **Mitigation:**
  - Make language prop optional first (backwards compatible)
  - Use union types, not generics (simpler)
  - Gradual type strictness increase
  - Comprehensive type tests

---

## Success Metrics

### Technical Metrics
- **Code Duplication:** 0% (unified components)
- **Type Safety:** 100% (no `any` types for language operations)
- **API Response Time:** <500ms for dictionary lookups
- **Bundle Size:** No increase (remove duplicate code)
- **Time to Add Language:** <1 week (from weeks)

### Business Metrics
- **Spanish Functionality:** 100% working (backwards compatible)
- **Latin Integration:** Uses shared infrastructure
- **Development Velocity:** Faster feature shipping after migration
- **Maintenance Overhead:** Reduced by 50%

### User Experience Metrics
- **Language Switching:** Seamless, no page reload
- **Vocabulary Tracking:** Works across all languages
- **AI Tutor:** Adapts to language automatically
- **Performance:** No degradation vs pre-migration

---

## Why We're NOT Doing This Now

### Startup Reality
1. **Product-Market Fit Unproven**
   - Don't know if users want this
   - Architecture doesn't matter if no one uses it
   - Need to validate value prop first

2. **Revenue > Architecture**
   - 6-8 weeks of refactoring = $0 revenue
   - Features generate revenue
   - Architecture can wait until we're sustainable

3. **Current System Works**
   - Spanish system is proven and stable
   - Latin demo validates demand
   - Can scale to 1000 users without migration

4. **Premature Optimization**
   - Don't know which languages users want
   - Norse might not be needed (save engineering time)
   - Let user demand drive architecture decisions

5. **Risk vs Reward**
   - High risk of breaking Spanish (lose existing users)
   - Low reward at current scale (<100 users)
   - Better risk/reward ratio after validation

---

## When This Document Becomes Urgent

### Phase 1: Validation (Current - 1000 users)
- **Focus:** Ship features, get users, make money
- **Architecture:** Current "polyp" systems are fine
- **Action:** None, keep building features

### Phase 2: Scale (1000+ users)
- **Focus:** Handle growth, improve reliability
- **Architecture:** Start feeling pain from duplication
- **Action:** Re-read this document, plan migration

### Phase 3: Growth (5000+ users)
- **Focus:** Multi-language expansion
- **Architecture:** Migration becomes CRITICAL
- **Action:** Execute this 6-8 week migration plan

---

## Conclusion

This migration plan represents the **ideal end-state architecture** for a multi-language learning platform. It provides:
- ✅ Clear separation of concerns
- ✅ Easy language extensibility
- ✅ Minimal code duplication
- ✅ Type-safe language operations
- ✅ Scalable to 10+ languages

**But we're not executing it now because:**
- ⚡ Speed to market matters more than perfect architecture
- 💰 Revenue validation comes before refactoring
- 🎯 Features generate user value, architecture doesn't
- 🚀 Can scale to 1000 users with current "polyp" systems

**When you hit the migration triggers (users, revenue, pain), come back to this document and execute the 6-8 week plan.**

Until then: **Build features. Ship fast. Validate demand. Make money.**

The architecture will be here when you need it. 🚀

---

## Appendix: Quick Reference

### File Paths to Create (During Migration)
```
types/language.ts
lib/services/languages/LanguageService.ts
lib/services/languages/LanguageServiceFactory.ts
lib/services/languages/SpanishService.ts
lib/services/languages/LatinService.ts
lib/services/core/VocabularyService.ts
lib/services/core/LibraryService.ts
lib/contexts/LanguageContext.tsx
lib/prompts/spanish-tutor.ts
lib/prompts/latin-tutor.ts
app/reader/spanish/page.tsx
app/reader/latin/page.tsx
app/api/v1/[language]/dictionary/[word]/route.ts
app/api/v1/[language]/analyze/route.ts
```

### Files to DELETE (During Migration)
```
src/components/latin/LatinTextReader.tsx
app/latin/demo/page.tsx
app/api/latin/analyze/route.ts (replace with v1 route)
app/api/latin/health/route.ts (replace with v1 route)
```

### Database Migrations
```
supabase/migrations/20251111_add_language_to_vocabulary.sql
supabase/migrations/20251111_add_language_unique_constraint.sql
supabase/migrations/20251111_add_language_validation.sql
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Next Review:** When migration triggers are met
