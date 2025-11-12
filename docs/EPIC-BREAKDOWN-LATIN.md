# Epic Breakdown: Conversational Latin Learning Platform

**Based on**: PRD v3: Conversational Language Learning with Latin Foundation
**Date**: 2025-11-10
**Status**: ACTIVE DEVELOPMENT

---

## 📋 Epic Overview

| Epic | Title | Priority | Status | Estimated Time |
|------|-------|----------|--------|----------------|
| **8** | **Latin Foundation** | 🔴 **P0 - START HERE** | 🟢 **ACTIVE** | 1-2 weeks |
| **9** | winkNLP Text Intelligence | 🟡 P1 | ⏸️ Planned | 1-2 weeks |
| **10** | Conversational Dialogs MVP | 🟡 P1 | ⏸️ Planned | 1-2 weeks |
| **11** | Grammar Index System | 🟢 P2 | ⏸️ Planned | 2-3 weeks |
| **12** | Content Transformation Engine | 🔵 P3 | ⏸️ Future | 3-4 weeks |
| **13** | Advanced Conversational Features | 🔵 P3 | ⏸️ Future | 3-4 weeks |

---

# 🏛️ EPIC 8: Latin Foundation (DETAILED BREAKDOWN)

**Goal**: Get Latin dictionary working with hybrid architecture (static + CLTK enhancement)

**Why This First**: Validates entire architecture, fastest path to working prototype, best resources

**Success Criteria**:
- ✅ 50,000 Latin words available instantly from Lewis & Short
- ✅ <50ms cached lookups, <2s first-time lookups with CLTK
- ✅ All cached entries have morphological data (inflections, POS, gender)
- ✅ Can read sample Latin texts and get definitions with one click
- ✅ Language-agnostic design allows easy swap to Old Norse later

---

## 📦 Story 8.1: Lewis & Short JSON Integration

**Priority**: 🔴 P0
**Estimated Time**: 2-3 hours
**Dependencies**: None (START HERE)

### **Acceptance Criteria**:
- [ ] Lewis & Short JSON files downloaded and stored in `data/latin-dictionary/`
- [ ] All 26 files (ls_A.json through ls_Z.json) present
- [ ] Can load dictionary into memory (~50k entries)
- [ ] Can perform exact match lookups by headword
- [ ] Can handle macron variations (ā → a)
- [ ] Basic search functionality works (substring matching)

### **Implementation Steps**:

#### 1. Download Dictionary Data
```bash
# Clone repository
gh repo clone IohannesArnold/lewis-short-json

# Create data directory
mkdir -p data/latin-dictionary

# Move JSON files
mv lewis-short-json/ls_*.json data/latin-dictionary/

# Verify all 26 files present
ls data/latin-dictionary/ | wc -l  # Should output 26
```

#### 2. Create TypeScript Service

**File**: `lib/services/latin-dictionary.ts`

```typescript
import fs from 'fs';
import path from 'path';

export interface LewisShortEntry {
  key: string;                    // Headword (lemma)
  entry_type: string;              // main, spur, hapax, greek, gloss
  part_of_speech: string;          // noun, verb, adj, etc.
  gender?: string;                 // M, F, N
  declension?: number;             // 1-5 for nouns
  conjugation?: number;            // 1-4 for verbs
  title_genitive?: string;         // Genitive ending
  title_orthography?: string;      // With macrons
  senses: string[];                // English definitions
  main_notes?: string;             // Etymology, usage notes
  alternative_orthography?: string;// Variant spellings
}

export class LatinDictionaryService {
  private dictionary: LewisShortEntry[] = [];
  private isLoaded: boolean = false;

  constructor() {
    this.loadDictionary();
  }

  /**
   * Load all Lewis & Short JSON files into memory
   * This runs once on service initialization
   */
  private loadDictionary(): void {
    const dataDir = path.join(process.cwd(), 'data/latin-dictionary');

    if (!fs.existsSync(dataDir)) {
      throw new Error(`Latin dictionary directory not found: ${dataDir}`);
    }

    const files = fs.readdirSync(dataDir)
      .filter(f => f.startsWith('ls_') && f.endsWith('.json'))
      .sort(); // Ensure consistent loading order

    console.log(`Loading Lewis & Short dictionary from ${files.length} files...`);

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (!Array.isArray(data)) {
        console.warn(`Skipping ${file}: not an array`);
        continue;
      }

      this.dictionary.push(...data);
    }

    this.isLoaded = true;
    console.log(`✅ Loaded ${this.dictionary.length} Latin entries`);
  }

  /**
   * Normalize word for lookup (lowercase, remove macrons)
   */
  private normalize(word: string): string {
    return word
      .toLowerCase()
      .normalize('NFD') // Decompose accents
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
  }

  /**
   * Lookup word in Lewis & Short
   * Tries exact match first, then normalized (no macrons)
   */
  async lookup(word: string): Promise<LewisShortEntry | null> {
    if (!this.isLoaded) {
      throw new Error('Dictionary not loaded');
    }

    const normalized = this.normalize(word);

    // Try exact match first (case-insensitive)
    let entry = this.dictionary.find(e =>
      e.key.toLowerCase() === word.toLowerCase()
    );

    // Try without macrons
    if (!entry) {
      entry = this.dictionary.find(e =>
        this.normalize(e.key) === normalized
      );
    }

    return entry || null;
  }

  /**
   * Search for words matching query (autocomplete, suggestions)
   */
  async search(query: string, limit: number = 10): Promise<LewisShortEntry[]> {
    if (!this.isLoaded) {
      throw new Error('Dictionary not loaded');
    }

    const normalized = this.normalize(query);

    return this.dictionary
      .filter(e => this.normalize(e.key).includes(normalized))
      .slice(0, limit);
  }

  /**
   * Get dictionary statistics
   */
  getStats(): { totalEntries: number; loaded: boolean } {
    return {
      totalEntries: this.dictionary.length,
      loaded: this.isLoaded,
    };
  }
}

// Singleton instance (loaded once, reused across requests)
let instance: LatinDictionaryService | null = null;

export function getLatinDictionary(): LatinDictionaryService {
  if (!instance) {
    instance = new LatinDictionaryService();
  }
  return instance;
}
```

#### 3. Create Test Script

**File**: `scripts/test-latin-dictionary.ts`

```typescript
import { getLatinDictionary } from '@/lib/services/latin-dictionary';

async function main() {
  const dict = getLatinDictionary();

  console.log('Dictionary stats:', dict.getStats());

  // Test 1: Basic lookup
  console.log('\n--- Test 1: Lookup "puella" ---');
  const puella = await dict.lookup('puella');
  console.log(JSON.stringify(puella, null, 2));

  // Test 2: Macron handling
  console.log('\n--- Test 2: Lookup "pŭella" (with macron) ---');
  const puellaMacron = await dict.lookup('pŭella');
  console.log(JSON.stringify(puellaMacron, null, 2));

  // Test 3: Case insensitive
  console.log('\n--- Test 3: Lookup "PUELLA" (uppercase) ---');
  const puellaUpper = await dict.lookup('PUELLA');
  console.log(JSON.stringify(puellaUpper, null, 2));

  // Test 4: Search
  console.log('\n--- Test 4: Search "puel" ---');
  const results = await dict.search('puel', 5);
  console.log(results.map(r => r.key));

  // Test 5: Not found
  console.log('\n--- Test 5: Lookup "asdfghjkl" (not a word) ---');
  const notFound = await dict.lookup('asdfghjkl');
  console.log(notFound);
}

main();
```

**Run test**:
```bash
npx tsx scripts/test-latin-dictionary.ts
```

### **Testing Checklist**:
- [ ] Dictionary loads without errors
- [ ] Exact match works: `lookup("puella")` → returns entry
- [ ] Macron handling works: `lookup("pŭella")` → returns same entry
- [ ] Case insensitive: `lookup("PUELLA")` → returns entry
- [ ] Search works: `search("puel")` → returns puella, puellar, etc.
- [ ] Not found returns null: `lookup("asdfghjkl")` → null
- [ ] Stats show correct count: ~50,000 entries

---

## 📦 Story 8.2: Database Schema Creation

**Priority**: 🔴 P0
**Estimated Time**: 1 hour
**Dependencies**: Story 8.1 (need to understand data structure)

### **Acceptance Criteria**:
- [ ] Database migration creates all required tables
- [ ] `dictionary_entries` table exists with proper columns
- [ ] `translation_cache` table exists (for future Norwegian translations)
- [ ] `cltk_analysis_cache` table exists (for CLTK results)
- [ ] Indexes created for performance
- [ ] RLS policies configured (if needed)

### **Implementation**:

**File**: `supabase/migrations/20251110_latin_dictionary_schema.sql`

```sql
-- ============================================================================
-- EPIC 8: Latin Dictionary Schema
-- Created: 2025-11-10
-- Description: Hybrid self-improving dictionary with CLTK enhancement
-- ============================================================================

-- ============================================================================
-- MAIN DICTIONARY TABLE (language-agnostic design)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dictionary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identification
  language TEXT NOT NULL CHECK (language IN ('la', 'on', 'grc', 'es', 'en')),
  word TEXT NOT NULL, -- Inflected form as seen in text
  lemma TEXT NOT NULL, -- Base dictionary form (headword)

  -- Linguistic metadata
  pos TEXT, -- Part of speech: noun, verb, adj, prep, etc.
  gender TEXT CHECK (gender IN ('M', 'F', 'N', 'C')), -- M/F/N/Common
  declension_class TEXT, -- For nouns: 1st, 2nd, 3rd, 4th, 5th
  conjugation_class TEXT, -- For verbs: 1st, 2nd, 3rd, 4th, irregular

  -- Definitions (multi-language support)
  definition_en TEXT NOT NULL, -- English definition (primary)
  definition_native TEXT, -- Original source language (e.g., Norwegian for Fritzner)

  -- Morphological data (CLTK-enhanced)
  inflections JSONB, -- All inflected forms: {nom_sg: "puella", gen_sg: "puellae", ...}
  phonetic_transcription TEXT, -- IPA or similar

  -- Usage examples
  examples JSONB, -- [{text: "puella in horto", translation: "girl in garden", source: "..."}]

  -- Metadata
  source TEXT NOT NULL, -- 'lewis-short', 'ordbok', 'fritzner', 'cltk', 'manual'
  source_data JSONB, -- Original entry from source dictionary
  enriched_at TIMESTAMPTZ, -- When CLTK analysis was added
  lookup_count INTEGER DEFAULT 0, -- Popularity tracking

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Uniqueness: one entry per word per language
  UNIQUE(language, word)
);

-- Performance indexes
CREATE INDEX idx_dictionary_language_word ON public.dictionary_entries(language, word);
CREATE INDEX idx_dictionary_lemma ON public.dictionary_entries(language, lemma);
CREATE INDEX idx_dictionary_pos ON public.dictionary_entries(language, pos);
CREATE INDEX idx_dictionary_lookup_count ON public.dictionary_entries(lookup_count DESC);
CREATE INDEX idx_dictionary_source ON public.dictionary_entries(source);

-- Full-text search index (for fuzzy matching)
CREATE INDEX idx_dictionary_search ON public.dictionary_entries
  USING gin(to_tsvector('simple', word || ' ' || lemma || ' ' || COALESCE(definition_en, '')));

-- ============================================================================
-- TRANSLATION CACHE (for non-English source dictionaries)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.translation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  source_lang TEXT NOT NULL, -- 'no' (Norwegian), 'de' (German), etc.
  target_lang TEXT NOT NULL DEFAULT 'en', -- Usually English
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,

  -- Translation metadata
  service TEXT, -- 'openai', 'google', 'deepl', 'manual'
  confidence FLOAT, -- 0.0-1.0 if provided by service

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(source_lang, target_lang, source_text)
);

CREATE INDEX idx_translation_lookup ON public.translation_cache(source_lang, target_lang, source_text);

-- ============================================================================
-- CLTK ANALYSIS CACHE (expensive computations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cltk_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  language TEXT NOT NULL,
  word TEXT NOT NULL,

  -- Full CLTK output (JSON)
  analysis JSONB NOT NULL,

  -- Quick access fields (denormalized from analysis)
  lemma TEXT,
  pos TEXT,
  morphology JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(language, word)
);

CREATE INDEX idx_cltk_cache_lookup ON public.cltk_analysis_cache(language, word);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_dictionary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dictionary_entries_updated_at ON public.dictionary_entries;
CREATE TRIGGER update_dictionary_entries_updated_at
  BEFORE UPDATE ON public.dictionary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_dictionary_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (PUBLIC READ)
-- ============================================================================
-- Dictionary is public read-only for all users
ALTER TABLE public.dictionary_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dictionary entries are publicly readable" ON public.dictionary_entries;
CREATE POLICY "Dictionary entries are publicly readable"
  ON public.dictionary_entries FOR SELECT
  USING (true);

-- Only service role can write (via API)
DROP POLICY IF EXISTS "Service role can manage dictionary" ON public.dictionary_entries;
CREATE POLICY "Service role can manage dictionary"
  ON public.dictionary_entries FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Translation cache: public read, service write
ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Translation cache publicly readable" ON public.translation_cache;
CREATE POLICY "Translation cache publicly readable"
  ON public.translation_cache FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage translations" ON public.translation_cache;
CREATE POLICY "Service role can manage translations"
  ON public.translation_cache FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- CLTK cache: public read, service write
ALTER TABLE public.cltk_analysis_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CLTK cache publicly readable" ON public.cltk_analysis_cache;
CREATE POLICY "CLTK cache publicly readable"
  ON public.cltk_analysis_cache FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage CLTK cache" ON public.cltk_analysis_cache;
CREATE POLICY "Service role can manage CLTK cache"
  ON public.cltk_analysis_cache FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Get dictionary statistics
CREATE OR REPLACE FUNCTION get_dictionary_stats(p_language TEXT DEFAULT NULL)
RETURNS TABLE (
  language TEXT,
  total_entries BIGINT,
  enriched_entries BIGINT,
  top_sources JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.language,
    COUNT(*)::BIGINT as total_entries,
    COUNT(de.enriched_at)::BIGINT as enriched_entries,
    jsonb_object_agg(de.source, source_count) as top_sources
  FROM dictionary_entries de
  CROSS JOIN LATERAL (
    SELECT COUNT(*)::INTEGER as source_count
    FROM dictionary_entries
    WHERE source = de.source AND language = de.language
  ) subquery
  WHERE p_language IS NULL OR de.language = p_language
  GROUP BY de.language;
END;
$$ LANGUAGE plpgsql;

-- Get most looked up words
CREATE OR REPLACE FUNCTION get_popular_words(
  p_language TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  word TEXT,
  lemma TEXT,
  lookup_count INTEGER,
  definition_en TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.word,
    de.lemma,
    de.lookup_count,
    de.definition_en
  FROM dictionary_entries de
  WHERE de.language = p_language
  ORDER BY de.lookup_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.dictionary_entries IS 'Self-improving dictionary with incremental CLTK enhancement';
COMMENT ON COLUMN public.dictionary_entries.language IS 'ISO 639-1 code: la=Latin, on=Old Norse, grc=Greek, etc.';
COMMENT ON COLUMN public.dictionary_entries.word IS 'Inflected form as it appears in texts';
COMMENT ON COLUMN public.dictionary_entries.lemma IS 'Base dictionary form (headword for lookup)';
COMMENT ON COLUMN public.dictionary_entries.enriched_at IS 'When morphological analysis was added via CLTK';
COMMENT ON COLUMN public.dictionary_entries.lookup_count IS 'Popularity tracking for cache optimization';
```

**Run migration**:
```bash
npx supabase db push
```

### **Testing Checklist**:
- [ ] Tables created successfully
- [ ] Can insert test entry: `INSERT INTO dictionary_entries (...)`
- [ ] Can query by language: `SELECT * FROM dictionary_entries WHERE language = 'la'`
- [ ] Unique constraint works: inserting duplicate word fails
- [ ] Indexes exist: `\d dictionary_entries` shows indexes
- [ ] Functions work: `SELECT * FROM get_dictionary_stats('la')`

---

## 📦 Story 8.3: CLTK Python Microservice Setup

**Priority**: 🔴 P0
**Estimated Time**: 2-3 hours
**Dependencies**: Story 8.2 (need database schema for caching)

### **Acceptance Criteria**:
- [ ] FastAPI service running on port 8001
- [ ] Endpoint `/analyze/latin` accepts word, returns morphology
- [ ] CLTK models downloaded and working
- [ ] Lemmatization functional
- [ ] POS tagging functional
- [ ] Service containerized with Docker
- [ ] Health check endpoint exists

### **Implementation**:

#### 1. Create Service Directory

```bash
mkdir -p services/cltk-latin
cd services/cltk-latin
```

#### 2. Create Requirements File

**File**: `services/cltk-latin/requirements.txt`

```txt
fastapi==0.109.0
uvicorn==0.27.0
cltk==1.3.0
pydantic==2.5.0
```

#### 3. Create FastAPI Service

**File**: `services/cltk-latin/main.py`

```python
"""
CLTK Latin Microservice
Provides morphological analysis, lemmatization, and POS tagging for Latin text
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List
import logging

# CLTK imports
from cltk import NLP
from cltk.lemmatize.lat import LatinBackoffLemmatizer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="CLTK Latin Service",
    description="Morphological analysis for Latin text using Classical Language Toolkit",
    version="1.0.0"
)

# Initialize CLTK (do this once on startup)
logger.info("Initializing CLTK NLP pipeline for Latin...")
nlp = NLP(language='lat', suppress_banner=True)
lemmatizer = LatinBackoffLemmatizer()
logger.info("✅ CLTK initialized successfully")

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class AnalysisRequest(BaseModel):
    word: str
    context: Optional[str] = None  # Optional sentence context for better analysis

class AnalysisResponse(BaseModel):
    word: str
    lemma: str
    pos: Optional[str] = None
    features: Optional[Dict[str, str]] = None
    confidence: Optional[float] = None

class HealthResponse(BaseModel):
    status: str
    service: str
    cltk_version: str

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    import cltk
    return HealthResponse(
        status="healthy",
        service="CLTK Latin Microservice",
        cltk_version=cltk.__version__
    )

@app.post("/analyze/latin", response_model=AnalysisResponse)
async def analyze_latin(request: AnalysisRequest):
    """
    Analyze a Latin word for morphological information

    Args:
        request: AnalysisRequest with word (required) and optional context

    Returns:
        AnalysisResponse with lemma, POS, and morphological features
    """
    try:
        word = request.word.strip()

        if not word:
            raise HTTPException(status_code=400, detail="Word cannot be empty")

        logger.info(f"Analyzing word: {word}")

        # Step 1: Lemmatize
        lemma_result = lemmatizer.lemmatize([word])
        lemma = lemma_result[0][1] if lemma_result else word

        # Step 2: Full NLP analysis (if context provided, use it for better accuracy)
        text = request.context if request.context else word
        doc = nlp.analyze(text=text)

        # Extract POS and features
        pos = None
        features = None

        if doc.words:
            # Find the target word in the analyzed document
            target_word = None
            if request.context:
                # Find word in context
                target_word = next((w for w in doc.words if w.string.lower() == word.lower()), None)
            else:
                # Single word analysis
                target_word = doc.words[0]

            if target_word:
                pos = target_word.pos if hasattr(target_word, 'pos') else None

                # Extract morphological features
                if hasattr(target_word, 'features') and target_word.features:
                    features = {
                        'Case': target_word.features.get('Case'),
                        'Gender': target_word.features.get('Gender'),
                        'Number': target_word.features.get('Number'),
                        'Tense': target_word.features.get('Tense'),
                        'Mood': target_word.features.get('Mood'),
                        'Voice': target_word.features.get('Voice'),
                        'Person': target_word.features.get('Person'),
                    }
                    # Remove None values
                    features = {k: v for k, v in features.items() if v is not None}

        return AnalysisResponse(
            word=word,
            lemma=lemma,
            pos=pos,
            features=features if features else None,
            confidence=0.85  # TODO: Implement actual confidence scoring
        )

    except Exception as e:
        logger.error(f"Error analyzing word '{request.word}': {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/lemmatize", response_model=Dict[str, str])
async def lemmatize_words(words: List[str]):
    """
    Lemmatize multiple words at once (batch operation)

    Args:
        words: List of Latin words to lemmatize

    Returns:
        Dictionary mapping words to their lemmas
    """
    try:
        results = lemmatizer.lemmatize(words)
        return {word: lemma for word, lemma in results}
    except Exception as e:
        logger.error(f"Error lemmatizing words: {e}")
        raise HTTPException(status_code=500, detail=f"Lemmatization failed: {str(e)}")

# ============================================================================
# STARTUP EVENT
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Download CLTK models on startup if not already present"""
    logger.info("CLTK Latin service started successfully")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

#### 4. Create Dockerfile

**File**: `services/cltk-latin/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download CLTK models
RUN python -c "from cltk.data.fetch import FetchCorpus; \
    corpus_downloader = FetchCorpus(language='latin'); \
    corpus_downloader.import_corpus('latin_models_cltk')"

# Copy application
COPY main.py .

# Expose port
EXPOSE 8001

# Run service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### 5. Create Docker Compose Entry

**File**: `docker-compose.yml` (add this service)

```yaml
services:
  # ... existing services ...

  cltk-latin:
    build:
      context: ./services/cltk-latin
      dockerfile: Dockerfile
    container_name: cltk-latin
    ports:
      - "8001:8001"
    environment:
      - PYTHONUNBUFFERED=1
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
```

#### 6. Create Test Script

**File**: `services/cltk-latin/test_service.py`

```python
"""
Test CLTK Latin service locally
"""

import requests
import json

BASE_URL = "http://localhost:8001"

def test_health():
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_analyze(word, context=None):
    print(f"Testing analysis: {word}")
    response = requests.post(
        f"{BASE_URL}/analyze/latin",
        json={"word": word, "context": context}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_lemmatize(words):
    print(f"Testing batch lemmatization: {words}")
    response = requests.post(
        f"{BASE_URL}/lemmatize",
        json=words
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

if __name__ == "__main__":
    # Test 1: Health check
    test_health()

    # Test 2: Single word analysis
    test_analyze("puella")

    # Test 3: Word with context
    test_analyze("puellae", context="puellae in horto ambulant")

    # Test 4: Verb analysis
    test_analyze("ambulat")

    # Test 5: Batch lemmatization
    test_lemmatize(["puella", "puellae", "puellam", "puellis"])
```

### **Running the Service**:

**Option 1: Docker Compose (recommended)**
```bash
docker-compose up -d cltk-latin
docker-compose logs -f cltk-latin
```

**Option 2: Local Development**
```bash
cd services/cltk-latin
pip install -r requirements.txt
python -c "from cltk.data.fetch import FetchCorpus; FetchCorpus('latin').import_corpus('latin_models_cltk')"
uvicorn main:app --reload --port 8001
```

**Test the service**:
```bash
python services/cltk-latin/test_service.py
```

### **Testing Checklist**:
- [ ] Service starts without errors
- [ ] Health check works: `curl http://localhost:8001/`
- [ ] Analyze endpoint works: `curl -X POST http://localhost:8001/analyze/latin -H "Content-Type: application/json" -d '{"word":"puella"}'`
- [ ] Returns lemma correctly
- [ ] Returns POS tag
- [ ] Returns morphological features
- [ ] Lemmatize endpoint works for batch operations
- [ ] Docker container runs successfully

---

## 📦 Story 8.4: Hybrid Dictionary Service with Cache

**Priority**: 🔴 P0
**Estimated Time**: 3-4 hours
**Dependencies**: Story 8.1, 8.2, 8.3 (need all components)

### **Acceptance Criteria**:
- [ ] Service checks PostgreSQL cache first
- [ ] Falls back to Lewis & Short if cache miss
- [ ] Calls CLTK service for enrichment
- [ ] Persists enriched entries to cache
- [ ] Returns unified `DictionaryEntry` format
- [ ] Tracks lookup count for popularity
- [ ] <50ms for cached lookups
- [ ] <2s for first-time lookups with CLTK

### **Implementation**:

**File**: `lib/services/hybrid-latin-dictionary.ts`

```typescript
import { getLatinDictionary, LewisShortEntry } from './latin-dictionary';
import { createClient } from '@/lib/supabase/service';

export interface DictionaryEntry {
  word: string;
  lemma: string;
  pos?: string;
  gender?: string;
  declension?: number;
  definition: string;
  senses: string[];
  inflections?: Record<string, string>;
  phonetic?: string;
  examples?: Array<{
    text: string;
    translation: string;
    source?: string;
  }>;
  etymology?: string;
  source: 'cache' | 'lewis-short' | 'enhanced';
  lookupCount?: number;
}

interface CLTKAnalysis {
  word: string;
  lemma: string;
  pos?: string;
  features?: Record<string, string>;
  confidence?: number;
}

export class HybridLatinDictionary {
  private lewisShort = getLatinDictionary();
  private supabase = createClient();
  private cltkUrl = process.env.CLTK_SERVICE_URL || 'http://localhost:8001';

  /**
   * Main lookup method - orchestrates cache → static → enhancement → persist
   */
  async lookup(word: string): Promise<DictionaryEntry | null> {
    // Step 1: Check cache
    const cached = await this.checkCache(word);
    if (cached) {
      return cached;
    }

    // Step 2: Lookup in Lewis & Short
    const lewisShortEntry = await this.lewisShort.lookup(word);
    if (!lewisShortEntry) {
      return null; // Word not found
    }

    // Step 3: Convert to unified format
    let entry: DictionaryEntry = this.convertLewisShort(lewisShortEntry);

    // Step 4: Enhance with CLTK (async, don't block on failure)
    try {
      const cltkAnalysis = await this.enhanceWithCLTK(word);
      entry = this.mergeCLTKData(entry, cltkAnalysis);
      entry.source = 'enhanced';
    } catch (error) {
      console.warn(`CLTK enhancement failed for "${word}":`, error);
      // Continue without enhancement
      entry.source = 'lewis-short';
    }

    // Step 5: Persist to cache
    await this.persistToCache(entry);

    return entry;
  }

  /**
   * Step 1: Check PostgreSQL cache
   */
  private async checkCache(word: string): Promise<DictionaryEntry | null> {
    const { data, error } = await this.supabase
      .from('dictionary_entries')
      .select('*')
      .eq('language', 'la')
      .eq('word', word.toLowerCase())
      .single();

    if (error || !data) {
      return null;
    }

    // Increment lookup count (fire and forget)
    this.supabase
      .from('dictionary_entries')
      .update({ lookup_count: data.lookup_count + 1 })
      .eq('id', data.id)
      .then(() => {})
      .catch(err => console.warn('Failed to increment lookup count:', err));

    return {
      word: data.word,
      lemma: data.lemma,
      pos: data.pos,
      gender: data.gender,
      declension: data.declension_class ? parseInt(data.declension_class) : undefined,
      definition: data.definition_en,
      senses: [data.definition_en], // TODO: Parse from source_data
      inflections: data.inflections,
      phonetic: data.phonetic_transcription,
      examples: data.examples,
      etymology: data.source_data?.main_notes,
      source: 'cache',
      lookupCount: data.lookup_count,
    };
  }

  /**
   * Step 2: Convert Lewis & Short entry to unified format
   */
  private convertLewisShort(entry: LewisShortEntry): DictionaryEntry {
    return {
      word: entry.key,
      lemma: entry.key,
      pos: entry.part_of_speech,
      gender: entry.gender,
      declension: entry.declension,
      definition: entry.senses.join('; '),
      senses: entry.senses,
      etymology: entry.main_notes,
      source: 'lewis-short',
    };
  }

  /**
   * Step 4: Call CLTK microservice for morphological analysis
   */
  private async enhanceWithCLTK(word: string): Promise<CLTKAnalysis> {
    // Check CLTK cache first
    const { data: cached } = await this.supabase
      .from('cltk_analysis_cache')
      .select('analysis')
      .eq('language', 'la')
      .eq('word', word.toLowerCase())
      .single();

    if (cached) {
      return cached.analysis as CLTKAnalysis;
    }

    // Call CLTK service
    const response = await fetch(`${this.cltkUrl}/analyze/latin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    });

    if (!response.ok) {
      throw new Error(`CLTK service error: ${response.statusText}`);
    }

    const analysis: CLTKAnalysis = await response.json();

    // Cache CLTK result
    await this.supabase.from('cltk_analysis_cache').insert({
      language: 'la',
      word: word.toLowerCase(),
      analysis,
      lemma: analysis.lemma,
      pos: analysis.pos,
      morphology: analysis.features,
    });

    return analysis;
  }

  /**
   * Step 4b: Merge CLTK data into entry
   */
  private mergeCLTKData(entry: DictionaryEntry, cltk: CLTKAnalysis): DictionaryEntry {
    return {
      ...entry,
      lemma: cltk.lemma || entry.lemma,
      pos: cltk.pos || entry.pos,
      // TODO: Generate full inflection table from CLTK features
      inflections: this.generateInflections(cltk),
    };
  }

  /**
   * Generate inflection table from CLTK features
   * TODO: Implement full inflection generation
   */
  private generateInflections(cltk: CLTKAnalysis): Record<string, string> | undefined {
    if (!cltk.features) return undefined;

    // Simplified: just return the analyzed form
    const { Case, Gender, Number } = cltk.features;
    if (Case && Number) {
      const key = `${Case.toLowerCase()}_${Number.toLowerCase()}`;
      return { [key]: cltk.word };
    }

    return undefined;
  }

  /**
   * Step 5: Persist enriched entry to PostgreSQL
   */
  private async persistToCache(entry: DictionaryEntry): Promise<void> {
    const { error } = await this.supabase.from('dictionary_entries').insert({
      language: 'la',
      word: entry.word.toLowerCase(),
      lemma: entry.lemma,
      pos: entry.pos,
      gender: entry.gender,
      declension_class: entry.declension?.toString(),
      definition_en: entry.definition,
      inflections: entry.inflections,
      phonetic_transcription: entry.phonetic,
      examples: entry.examples,
      source: entry.source === 'enhanced' ? 'lewis-short+cltk' : 'lewis-short',
      source_data: {}, // TODO: Store original Lewis & Short entry
      enriched_at: entry.source === 'enhanced' ? new Date().toISOString() : null,
      lookup_count: 1,
    });

    if (error) {
      console.error('Failed to persist dictionary entry:', error);
    }
  }

  /**
   * Search for words (autocomplete, suggestions)
   */
  async search(query: string, limit: number = 10): Promise<DictionaryEntry[]> {
    // Try cache first
    const { data: cached } = await this.supabase
      .from('dictionary_entries')
      .select('word, lemma, pos, definition_en')
      .eq('language', 'la')
      .ilike('word', `%${query}%`)
      .limit(limit);

    if (cached && cached.length > 0) {
      return cached.map(d => ({
        word: d.word,
        lemma: d.lemma,
        pos: d.pos,
        definition: d.definition_en,
        senses: [d.definition_en],
        source: 'cache' as const,
      }));
    }

    // Fallback to Lewis & Short
    const results = await this.lewisShort.search(query, limit);
    return results.map(r => this.convertLewisShort(r));
  }
}

// Singleton instance
let instance: HybridLatinDictionary | null = null;

export function getHybridLatinDictionary(): HybridLatinDictionary {
  if (!instance) {
    instance = new HybridLatinDictionary();
  }
  return instance;
}
```

### **Testing Checklist**:
- [ ] First lookup: Checks cache (miss) → Lewis & Short → CLTK → Persist
- [ ] Second lookup: Checks cache (hit) → Returns immediately (<50ms)
- [ ] CLTK failure: Still returns Lewis & Short entry (graceful degradation)
- [ ] Lookup count increments on each cache hit
- [ ] Search works for autocomplete
- [ ] All data properly stored in database

---

## 📦 Story 8.5: API Routes for Dictionary

**Priority**: 🔴 P0
**Estimated Time**: 1-2 hours
**Dependencies**: Story 8.4 (need hybrid service)

### **Acceptance Criteria**:
- [ ] GET `/api/dictionary/latin/[word]` returns dictionary entry
- [ ] GET `/api/dictionary/latin/search?q=[query]` returns suggestions
- [ ] Proper error handling (404 for not found, 500 for errors)
- [ ] Response format matches existing dictionary API
- [ ] Rate limiting considered (optional for MVP)

### **Implementation**:

**File**: `app/api/dictionary/latin/[word]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getHybridLatinDictionary } from '@/lib/services/hybrid-latin-dictionary';

export async function GET(
  request: NextRequest,
  { params }: { params: { word: string } }
) {
  try {
    const { word } = params;

    if (!word || word.trim() === '') {
      return NextResponse.json(
        { error: 'Word parameter is required' },
        { status: 400 }
      );
    }

    const dictionary = getHybridLatinDictionary();
    const entry = await dictionary.lookup(word);

    if (!entry) {
      return NextResponse.json(
        { error: 'Word not found', word },
        { status: 404 }
      );
    }

    // Format response to match existing dictionary API
    return NextResponse.json({
      word: entry.word,
      lemma: entry.lemma,
      meanings: [
        {
          partOfSpeech: entry.pos || 'unknown',
          definitions: entry.senses.map(sense => ({
            definition: sense,
            example: null,
          })),
        },
      ],
      gender: entry.gender,
      declension: entry.declension,
      inflections: entry.inflections,
      etymology: entry.etymology,
      phonetics: entry.phonetic ? [{ text: entry.phonetic }] : [],
      source: entry.source,
      lookupCount: entry.lookupCount,
    });
  } catch (error) {
    console.error('Dictionary lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File**: `app/api/dictionary/latin/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getHybridLatinDictionary } from '@/lib/services/hybrid-latin-dictionary';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const dictionary = getHybridLatinDictionary();
    const results = await dictionary.search(query, limit);

    return NextResponse.json({
      query,
      results: results.map(entry => ({
        word: entry.word,
        lemma: entry.lemma,
        pos: entry.pos,
        definition: entry.definition,
      })),
    });
  } catch (error) {
    console.error('Dictionary search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### **Testing Checklist**:
- [ ] `curl http://localhost:3000/api/dictionary/latin/puella` returns entry
- [ ] `curl http://localhost:3000/api/dictionary/latin/asdfghjkl` returns 404
- [ ] `curl http://localhost:3000/api/dictionary/latin/search?q=puel` returns suggestions
- [ ] Response format matches existing dictionary API (compatible with frontend)
- [ ] Error responses are properly formatted

---

## 📦 Story 8.6: Frontend Integration

**Priority**: 🔴 P0
**Estimated Time**: 2-3 hours
**Dependencies**: Story 8.5 (need API routes)

### **Acceptance Criteria**:
- [ ] Reader component updated to support language parameter
- [ ] Latin readings can be created and viewed
- [ ] Click-to-define works for Latin words
- [ ] Dictionary popover displays Latin-specific fields (declension, gender)
- [ ] Language selector shows Latin option
- [ ] Existing Spanish/English functionality unaffected

### **Implementation**:

**File**: `lib/services/dictionary.ts` (update existing)

```typescript
// Add language-aware lookup
export async function lookupWord(
  word: string,
  language: string = 'en'
): Promise<DictionaryEntry | null> {

  // Route to appropriate dictionary based on language
  switch (language) {
    case 'la': // Latin
      return fetchLatinDictionary(word);
    case 'es': // Spanish
      return fetchSpanishDictionary(word); // If you have this
    case 'en': // English
    default:
      return fetchEnglishDictionary(word); // Your existing Free Dictionary API
  }
}

async function fetchLatinDictionary(word: string): Promise<DictionaryEntry | null> {
  const response = await fetch(`/api/dictionary/latin/${encodeURIComponent(word)}`);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Dictionary lookup failed');
  }

  return response.json();
}
```

**File**: `components/reader/DictionaryPopover.tsx` (update existing)

```typescript
// Add Latin-specific fields
export function DictionaryPopover({ entry, ...props }: Props) {
  return (
    <Popover>
      <PopoverContent>
        <div className="space-y-2">
          <div className="font-bold text-lg">{entry.word}</div>

          {/* Latin-specific: show lemma if different from word */}
          {entry.lemma && entry.lemma !== entry.word && (
            <div className="text-sm text-gray-600">
              Lemma: <span className="italic">{entry.lemma}</span>
            </div>
          )}

          {/* Latin-specific: declension and gender */}
          {entry.declension && entry.gender && (
            <div className="text-sm text-gray-600">
              {entry.gender}, {entry.declension}st declension
            </div>
          )}

          {/* Definitions */}
          <div className="space-y-1">
            {entry.meanings.map((meaning, i) => (
              <div key={i}>
                <span className="text-xs uppercase text-gray-500">
                  {meaning.partOfSpeech}
                </span>
                {meaning.definitions.map((def, j) => (
                  <div key={j} className="text-sm">{def.definition}</div>
                ))}
              </div>
            ))}
          </div>

          {/* Latin-specific: inflections table */}
          {entry.inflections && (
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600">
                Show inflections
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {Object.entries(entry.inflections).map(([form, word]) => (
                  <div key={form} className="text-xs">
                    <span className="text-gray-500">{form}:</span> {word}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Etymology (if available) */}
          {entry.etymology && (
            <div className="text-xs text-gray-500 italic border-t pt-2">
              {entry.etymology}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

**File**: `app/library/page.tsx` (update to show Latin readings)

```typescript
// Add language filter
export default function LibraryPage() {
  const [languageFilter, setLanguageFilter] = useState<string>('all');

  // ... existing code ...

  const filteredReadings = readings.filter(r =>
    languageFilter === 'all' || r.language === languageFilter
  );

  return (
    <div>
      {/* Language filter */}
      <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
        <option value="all">All Languages</option>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="la">Latin</option>
      </select>

      {/* Display readings */}
      {filteredReadings.map(reading => (
        <ReadingCard key={reading.id} reading={reading} />
      ))}
    </div>
  );
}
```

### **Testing Checklist**:
- [ ] Can create Latin reading via author interface
- [ ] Latin reading displays properly in reader
- [ ] Clicking Latin word shows dictionary popover
- [ ] Popover displays declension, gender, inflections
- [ ] Language selector shows Latin option
- [ ] Spanish/English readings still work correctly

---

## 📦 Story 8.7: Seed Sample Latin Content

**Priority**: 🟡 P1 (nice to have for MVP)
**Estimated Time**: 2 hours
**Dependencies**: Story 8.6 (need frontend working)

### **Acceptance Criteria**:
- [ ] 2-3 sample Latin readings created (Cicero, Caesar, Virgil)
- [ ] Sample lesson created linking to reading
- [ ] Can test full flow: read → click word → see definition
- [ ] Demo-ready content for showing off the platform

### **Implementation**:

**File**: `scripts/seed-latin-demo.ts`

```typescript
import { createClient } from '@/lib/supabase/service';

const CICERO_CATILINE = `
Quo usque tandem abutere, Catilina, patientia nostra?
Quam diu etiam furor iste tuus nos eludet?
Quem ad finem sese effrenata iactabit audacia?
`.trim();

const CAESAR_GALLIC = `
Gallia est omnis divisa in partes tres,
quarum unam incolunt Belgae,
aliam Aquitani,
tertiam qui ipsorum lingua Celtae, nostra Galli appellantur.
`.trim();

const VIRGIL_AENEID = `
Arma virumque cano, Troiae qui primus ab oris
Italiam, fato profugus, Laviniaque venit
litora, multum ille et terris iactatus et alto
vi superum saevae memorem Iunonis ob iram.
`.trim();

async function main() {
  const supabase = createClient();

  // 1. Create Cicero reading
  const { data: cicero } = await supabase
    .from('library_readings')
    .insert({
      title: 'In Catilinam I (Opening)',
      author: 'Marcus Tullius Cicero',
      source: 'First Catiline Oration',
      content: CICERO_CATILINE,
      language: 'la',
      difficulty_level: 'intermediate',
      is_public: true,
    })
    .select()
    .single();

  console.log('✅ Created Cicero reading:', cicero?.id);

  // 2. Create Caesar reading
  const { data: caesar } = await supabase
    .from('library_readings')
    .insert({
      title: 'De Bello Gallico I.1 (Opening)',
      author: 'Gaius Julius Caesar',
      source: 'Commentarii de Bello Gallico',
      content: CAESAR_GALLIC,
      language: 'la',
      difficulty_level: 'beginner',
      is_public: true,
    })
    .select()
    .single();

  console.log('✅ Created Caesar reading:', caesar?.id);

  // 3. Create Virgil reading
  const { data: virgil } = await supabase
    .from('library_readings')
    .insert({
      title: 'Aeneid I.1-4 (Opening)',
      author: 'Publius Vergilius Maro',
      source: 'Aeneid',
      content: VIRGIL_AENEID,
      language: 'la',
      difficulty_level: 'advanced',
      is_public: true,
    })
    .select()
    .single();

  console.log('✅ Created Virgil reading:', virgil?.id);

  // 4. Create sample lesson
  const { data: lesson } = await supabase
    .from('lessons')
    .insert({
      title: 'Introduction to Latin: Cicero\'s Rhetoric',
      description: 'Learn Latin through Cicero\'s powerful opening to the First Catiline Oration',
      language: 'la',
      difficulty_level: 'intermediate',
      is_published: true,
    })
    .select()
    .single();

  console.log('✅ Created lesson:', lesson?.id);

  // 5. Link Cicero reading to lesson
  if (cicero && lesson) {
    await supabase.from('lesson_readings').insert({
      lesson_id: lesson.id,
      reading_id: cicero.id,
      title: cicero.title,
      content: cicero.content,
      language: 'la',
      display_order: 1,
    });

    console.log('✅ Linked Cicero reading to lesson');
  }

  console.log('\n🎉 Latin demo content seeded successfully!');
  console.log(`Visit /library to see readings`);
  console.log(`Visit /courses to see lesson`);
}

main();
```

**Run seeding**:
```bash
npx tsx scripts/seed-latin-demo.ts
```

### **Testing Checklist**:
- [ ] Script runs without errors
- [ ] 3 readings appear in library
- [ ] 1 lesson appears in courses
- [ ] Can open Cicero reading and click words
- [ ] Dictionary lookups work for common words (quo, usque, tandem, etc.)

---

## 🎯 Epic 8 Completion Checklist

**Before marking Epic 8 as DONE**:

- [ ] All 7 stories completed
- [ ] Lewis & Short dictionary integrated (50k words)
- [ ] Database schema created and migrated
- [ ] CLTK microservice running
- [ ] Hybrid dictionary service orchestrates all layers
- [ ] API routes functional
- [ ] Frontend displays Latin content properly
- [ ] Sample Latin content seeded
- [ ] End-to-end test: Read Latin → Click word → See enriched definition
- [ ] Performance targets met (<50ms cached, <2s first lookup)
- [ ] Documentation updated (README, deployment guide)

---

# 📚 EPIC 9: winkNLP Text Intelligence (HIGH-LEVEL)

**Goal**: Upgrade vocabulary and text processing with linguistic intelligence

**Priority**: 🟡 P1
**Status**: ⏸️ Planned (after Epic 8)
**Estimated Time**: 1-2 weeks

## **Features Checklist**:

- [ ] **9.1: winkNLP Integration**
  - Install winkNLP + Latin model
  - Create text processing service
  - Implement tokenization, lemmatization, POS tagging
  - Test with sample Latin texts

- [ ] **9.2: Enhanced Vocabulary Extraction**
  - Update Mastra vocabulary tool to use winkNLP
  - Extract lemmas automatically
  - Filter by POS (prioritize nouns, verbs, adjectives)
  - Calculate vocabulary density metrics

- [ ] **9.3: Database Schema Updates**
  - Add `lemma`, `pos`, `frequency_rank`, `morphology` to vocabulary tables
  - Create indexes for efficient querying
  - Migration script for existing vocabulary data

- [ ] **9.4: UI Updates**
  - Display lemmas in vocabulary lists
  - Show POS tags (noun, verb, adj, etc.)
  - Add morphological information tooltips
  - Vocabulary analytics dashboard

**Deliverable**: Vocabulary lists with linguistic intelligence (lemmas, POS, morphology)

---

# 💬 EPIC 10: Conversational Dialogs MVP (HIGH-LEVEL)

**Goal**: Implement conversation-first learning with AI characters

**Priority**: 🟡 P1
**Status**: ⏸️ Planned
**Estimated Time**: 1-2 weeks

## **Features Checklist**:

- [ ] **10.1: Dialog System Architecture**
  - Design character definition schema
  - Create conversation state management
  - Implement grammar-bounded AI prompts
  - Character personality engine

- [ ] **10.2: Contextual Characters**
  - Create Cicero character (test case)
  - Character personality + speaking style
  - Grammar level constraints (only use lesson grammar)
  - Context awareness (references reading content)

- [ ] **10.3: Conversation UI**
  - Chat interface within lesson view
  - Text input with submit
  - Audio playback for character responses
  - Grammar hints and corrections display
  - "Talk to [Character]" button on readings

- [ ] **10.4: Error Detection & Feedback**
  - Analyze student responses for grammar errors
  - Provide corrections with explanations
  - Track error patterns
  - Suggest practice exercises for struggles

- [ ] **10.5: Persistent Character Relationships**
  - Store conversation history per character
  - Track relationship level (0-100)
  - Unlock new topics based on progress
  - Narrative arc system

**Deliverable**: Students can chat with Cicero about readings, get grammar feedback in real-time

**Test Scenario**:
1. Student reads Cicero's First Catiline Oration
2. Clicks "Talk to Cicero" button
3. Cicero asks: "Quid putas de Catilinae audacia?" (What do you think of Catiline's audacity?)
4. Student responds (Latin or English)
5. Cicero corrects grammar gently
6. Conversation continues with follow-up questions
7. If student struggles (3+ errors), AI generates exercises
8. After exercises, return to conversation

---

# 🗂️ EPIC 11: Grammar Index System (HIGH-LEVEL)

**Goal**: Build searchable grammar taxonomy with semantic search

**Priority**: 🟢 P2
**Status**: ⏸️ Planned
**Estimated Time**: 2-3 weeks

## **Features Checklist**:

- [ ] **11.1: Grammar Taxonomy Schema**
  - Create `grammar_taxonomy` table with vector embeddings
  - Set up Supabase pgvector extension
  - Design concept hierarchy (cases → conjugation → syntax)
  - Import Bennett's Latin Grammar concepts

- [ ] **11.2: Grammar Index Ingestion**
  - Scrape Bennett's Latin Grammar (50-100 concepts)
  - Parse concept name, examples, explanations
  - Generate embeddings with OpenAI
  - Persist to database

- [ ] **11.3: Semantic Search API**
  - Build vector similarity search
  - Query: "ablative case" → matching concepts
  - Rank by relevance
  - Return examples and explanations

- [ ] **11.4: Sentence-to-Grammar Mapping**
  - winkNLP: Parse sentence syntax
  - AI: Map sentence features → grammar concepts
  - Store mappings in `sentence_grammar_mappings` table
  - Confidence scoring

- [ ] **11.5: Grammar-Aware Content Generation**
  - Update Mastra workflows to use grammar mappings
  - Generate exercises targeting specific grammar
  - Sequence lessons by grammar progression (A1 → C2)
  - Adaptive difficulty based on student performance

**Deliverable**: Readings automatically annotated with grammar concepts, exercises target specific grammar points

**Test Case**:
- Input: "Puella in horto ambulat"
- Output: Mapped to grammar concepts:
  - "Nominative case" (puella)
  - "Prepositional phrases with 'in'" (in horto)
  - "Present tense active indicative" (ambulat)
  - "3rd declension nouns" (horto)

---

# 🔄 EPIC 12: Content Transformation Engine (HIGH-LEVEL)

**Goal**: Adaptive leveling model for arbitrary content

**Priority**: 🔵 P3 (Future)
**Status**: ⏸️ Planned
**Estimated Time**: 3-4 weeks

## **Features Checklist**:

- [ ] **12.1: Grammar Skeleton Extraction**
  - Analyze text for grammar concept frequency
  - Extract pedagogical sequence (A1 → C2)
  - Create grammar dependency graph
  - Identify teaching order

- [ ] **12.2: Content Simplification Model**
  - Fine-tune GPT-4 for Latin text simplification
  - Vocabulary substitution (frequency-based)
  - Syntax transformation (dependency tree manipulation)
  - Maintain narrative continuity

- [ ] **12.3: Lesson Sequence Generation**
  - Input: Complex text (e.g., Aeneid)
  - Output: N lessons progressing from A1 to C2
  - Each lesson: simplified reading + exercises + conversation
  - Grammar scaffolding

- [ ] **12.4: Adaptive Difficulty**
  - Track student performance per lesson
  - Dynamically adjust pacing (skip/repeat lessons)
  - Personalized paths through content
  - Difficulty calibration

**Deliverable**: "I want to learn with Ovid" → 50-lesson course from beginner to Ovid mastery

**Test Case**:
- Input: Aeneid Book I (1000 lines, C2 level)
- Output: 50 lessons
  - Lesson 1: "Vir est. Troia est." (A1)
  - Lesson 25: "Vir qui fortis est..." (B2)
  - Lesson 50: "Arma virumque cano..." (C2, actual Aeneid)

---

# 🎭 EPIC 13: Advanced Conversational Features (HIGH-LEVEL)

**Goal**: World-class immersive conversational experience

**Priority**: 🔵 P3 (Future)
**Status**: ⏸️ Planned
**Estimated Time**: 3-4 weeks

## **Features Checklist**:

- [ ] **13.1: Speech-to-Text Integration**
  - Whisper API for voice input
  - Pronunciation feedback
  - Accent scoring
  - Phonetic analysis

- [ ] **13.2: Multimodal Immersion**
  - AI-generated scene images (DALL-E 3)
  - Interactive hotspots (click-to-describe)
  - Ambient sounds for context
  - 360° environment views

- [ ] **13.3: Roleplay Scenarios**
  - Mission-based conversations (convince, negotiate, explain)
  - Success scoring (persuasiveness, grammar, vocab)
  - Unlock progression system
  - Branching narratives

- [ ] **13.4: Adaptive Reinforcement Loop**
  - Auto-detect conversation struggles
  - Generate exercises mid-conversation
  - Return seamlessly after practice
  - Spaced repetition integration

**Deliverable**: Fully immersive conversational learning with voice, images, and adaptive scaffolding

**Test Scenario**:
1. Student starts "At the Forum" scenario
2. AI shows image of Roman marketplace
3. Student speaks into microphone: "Volo panem" (I want bread)
4. Merchant responds with voice: "Quantum vis?" (How much do you want?)
5. Student clicks bread in image to describe it
6. If pronunciation is off, AI provides feedback
7. Success → XP earned → Unlock next scenario

---

## 🎯 Summary: What to Build First

**IMMEDIATE (This Week)**:
✅ **Epic 8: Latin Foundation** - All stories fully detailed above

**NEXT (Week 3-4)**:
⏸️ **Epic 10: Conversation MVP** - Validate the big idea with Cicero character

**THEN (Week 5-6)**:
⏸️ **Epic 9: winkNLP** - Add linguistic intelligence
⏸️ **Epic 11: Grammar Index** - Grammar-aware content generation

**FUTURE (Month 3+)**:
⏸️ **Epic 12: Content Transformation** - The "Ovid Problem" solver
⏸️ **Epic 13: Advanced Conversations** - Voice, images, full immersion

---

**END OF EPIC BREAKDOWN**
