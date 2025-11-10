# PRD v3: Conversational Language Learning with Latin Foundation

**Version**: 3.0
**Date**: 2025-11-10
**Status**: ACTIVE DEVELOPMENT
**Language**: Latin (first implementation), designed for multi-language expansion

---

## 🎯 Executive Summary

We're building the **world's most engaging conversational language learning platform** that solves two fundamental problems in classical language education:

1. **The "Ovid Problem"**: Learners want to read authentic texts (Virgil, Cicero, Ovid) but lack the foundational grammar to understand them
2. **The Engagement Problem**: Traditional language learning is boring as hell—exercises feel like homework, not communication

**Our Solution**:
- **AI-powered content transformation** that adapts complex texts to learner level while maintaining narrative continuity
- **Conversation-first UX** where you chat with AI characters (Cicero, Aeneas) about readings in the target language
- **Grammar-aware pedagogy** that maps sentences to specific grammar concepts for targeted practice
- **Self-improving hybrid dictionary** that incrementally enriches itself with morphological data

**First Implementation**: Latin (best resources, strongest tooling, validate approach)
**Architecture**: Language-agnostic design for easy expansion to Old Norse, Ancient Greek, etc.

---

## 💡 The Vision: Three Interconnected Systems

### 1. **Adaptive Content Transformation** ("Leveling Model")

**Problem**: Student says "I want to learn Latin with the Aeneid" but they're absolute beginners.

**Traditional Response**: "LOL no, you need 4 years of grammar first"

**Our Response**: Transform the Aeneid into a 50-lesson scaffolded sequence:

```
Original (C2 level):
"Arma virumque cano, Troiae qui primus ab oris..."
(Complex syntax, ablative of separation, relative clauses, heroic meter)

↓ TRANSFORMATION ↓

Lesson 1 (A1 level):
"Vir est. Troia est. Bellum est."
(Basic vocabulary, nominative case, simple sentences)

Lesson 5 (A2 level):
"Vir bellum facit. Vir a Troia navigat."
(Accusative objects, ablative of separation introduced)

Lesson 25 (B2 level):
"Vir qui fortis est a Troia navigat."
(Relative clauses, complex sentences)

Lesson 50 (C2 level):
"Arma virumque cano, Troiae qui primus ab oris..."
(ACTUAL Aeneid—you've earned it!)
```

**Key Insight**: Keep grammar skeleton, transform vocabulary/syntax/complexity while maintaining narrative continuity.

**Benefits**:
- ✅ Intrinsic motivation (progressing toward material you care about)
- ✅ Grammar in context (not abstract rules)
- ✅ Adaptive difficulty (speed up/slow down per student)
- ✅ Story continuity (still learning the Aeneid, just scaffolded)

---

### 2. **Conversation-First Learning**

**Why Conversations > Exercises**:

| Traditional | Conversation-First |
|-------------|-------------------|
| Multiple choice → passive recognition | AI dialog → active production |
| Fill-in-blank → pattern matching | Contextual conversation → real communication |
| Translation → equivalence focus | Role-play → language in use |

**Core Interaction Pattern**:

```
1. Student reads text (e.g., Cicero's First Catiline Oration)
2. Click character icon: 💬 "Talk to Cicero"
3. Cicero: "You've read my speech. Tell me, quid putas de Catilinae audacia?"
   (What do you think of Catiline's audacity?)
4. Student responds (Latin or English, AI adapts)
5. Cicero corrects grammar gently, asks follow-up questions
6. AI detects struggles → Generates targeted exercises → Returns to conversation
```

**Conversation Innovations We'll Build**:

#### **A. Contextual Dialog Characters**
Every reading comes with AI characters you can discuss it with:
- **Cicero** discussing his orations
- **Aeneas** telling his story from the Aeneid
- **Caesar** explaining his Gallic Wars
- **Ovid** discussing love poetry and mythology

**Character Constraints**:
- Uses ONLY grammar from current lesson + previous lessons
- Maintains consistent personality and speaking style
- Adapts complexity based on student responses
- Provides corrections with explanations

#### **B. Grammar-Targeted Socratic Dialogs**
AI asks questions that FORCE production of target grammar:

```
Teaching Dative Case:

AI: "I gave you a gift. How would you say 'I gave Marcus a book' in Latin?"
Student: "Dedi Marcus liber" ❌
AI: "Close! But Marcus receives the book. In Latin, the receiver uses
     the dative case. Try: Dedi Marco librum."
AI: "Now you try. Tell me: cui dedisti aliquid hodie?" (To whom did you
     give something today?)
Student: "Dedi amico meo pecuniam" ✅
AI: "Perfecte! Amico is dative. What did your friend do with the money?"
```

#### **C. Roleplay Scenarios**
Immersive simulations where you MUST communicate to succeed:

```
Scenario: "At the Roman Forum"
Goal: Buy bread from a merchant

MERCHANT: "Salve! Quid vis?" (Hello! What do you want?)
→ Student must respond to continue
→ Grammar targets: Accusative (what you want), Genitive (price), Imperative

Progression:
- Beginner: Template responses (select from options)
- Intermediate: Guided free text (AI prompts structure)
- Advanced: Full free conversation (AI tracks grammar)
```

#### **D. Persistent Character Relationships**
Build relationships over time, creating emotional investment:

```
Day 1: "Salve! Ego sum Lucius. Quis es tu?"
Day 5: "Hodie tristis sum. Pater meus aegrotat." (Father is sick—practice sympathy)
Day 15: "Gratias tibi ago! Tu bonus amicus es." (You've helped through narrative arc)
```

**Database Schema**:
```sql
CREATE TABLE character_relationships (
  user_id UUID,
  character_id UUID,
  relationship_level INTEGER, -- 0-100
  conversation_history JSONB[],
  narrative_arc_position INTEGER,
  unlocked_topics TEXT[]
);
```

#### **E. Adaptive Reinforcement Loop**
AI detects conversation struggles → auto-generates exercises → returns to conversation:

```
Conversation → Student struggles with dative case (3+ errors)
           ↓
    Pause conversation
           ↓
    "Let's practice this grammar point..."
           ↓
    Generate 5 dative exercises
           ↓
    Exercises complete
           ↓
    Return to conversation
           ↓
    Cicero: "Bene! Now, let's try again. Cui dedisti?"
    Student: "Dedi Marco librum" ✅
    Cicero: "Optime!" (Excellent!)
```

#### **F. Multimodal Immersion**
Combine text, audio, images for total sensory engagement:
- **TTS**: ElevenLabs for character voices
- **STT**: Whisper API for voice input
- **Images**: AI-generated scenes (DALL-E) or historical images
- **Interactive hotspots**: Click objects to describe them

#### **G. Debate & Persuasion**
Use conversation as game mechanics:

```
Mission: Convince Senator Brutus to support your law

Grammar targets: Subjunctive mood, rhetorical questions, comparatives

BRUTUS: "Cur hanc legem approbem?" (Why should I approve?)
Student: "Si hanc legem approbes, cives feliciores erunt"
         (If you approve, citizens will be happier)

AI tracks: persuasiveness score, grammar accuracy, vocabulary richness
Success → Unlock next scenario
```

---

### 3. **Hybrid Self-Improving Dictionary**

**Problem**:
- Small dictionaries (ordbok: 4.5k words) miss rare words
- Large dictionaries (Fritzner: 40k) may have foreign language definitions
- Static dictionaries lack morphological intelligence

**Solution**: Incrementally-enriched dictionary that gets smarter with every lookup

**Architecture**:

```
User clicks word "puella"
        ↓
Step 1: Check PostgreSQL cache
        ↓ (miss)
Step 2: Lookup Lewis & Short JSON (50k entries)
        → Found: "girl, maiden" + declension info
        ↓
Step 3: CLTK morphological enhancement
        → Lemmatize: "puellae" → "puella"
        → Generate inflections: puella, puellae, puellam, puellae, puella...
        → POS: noun, 1st declension, feminine
        ↓
Step 4: Persist enriched entry to PostgreSQL
        → Cache for instant future lookups
        ↓
Step 5: Return to user with full morphological data
```

**Key Benefits**:
- ✅ **Cold start**: 50,000 Latin words instantly available (Lewis & Short)
- ✅ **Incremental enhancement**: First lookup costs ~2s, subsequent lookups <50ms
- ✅ **Self-improving**: Database gets richer with usage
- ✅ **Morphological awareness**: Every cached word has inflection tables
- ✅ **Language-agnostic**: Same architecture works for Old Norse, Greek, etc.

**Database Schema**:

```sql
CREATE TABLE dictionary_entries (
  id UUID PRIMARY KEY,
  language TEXT NOT NULL, -- 'la', 'on', 'grc', etc.
  word TEXT NOT NULL, -- Inflected form as seen
  lemma TEXT NOT NULL, -- Base dictionary form

  -- Linguistic metadata
  pos TEXT, -- noun, verb, adj, etc.
  gender TEXT, -- M, F, N
  declension_class TEXT, -- 1st, 2nd, 3rd declension
  conjugation_class TEXT, -- For verbs

  -- Definitions
  definition_en TEXT NOT NULL,
  definition_native TEXT, -- Original language (if translated)

  -- Morphology (CLTK-enhanced)
  inflections JSONB, -- {nom_sg: "puella", gen_sg: "puellae", ...}
  phonetic_transcription TEXT,

  -- Usage examples
  examples JSONB[],

  -- Metadata
  source TEXT, -- 'lewis-short', 'ordbok', 'fritzner', 'cltk'
  enriched_at TIMESTAMPTZ, -- When CLTK analysis added
  lookup_count INTEGER DEFAULT 0, -- Popularity tracking

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(language, word)
);

-- Translation cache (for Norwegian → English, etc.)
CREATE TABLE translation_cache (
  source_lang TEXT,
  target_lang TEXT,
  source_text TEXT,
  translated_text TEXT,
  service TEXT, -- 'openai', 'google', 'deepl'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_lang, target_lang, source_text)
);

-- CLTK analysis cache (expensive computations)
CREATE TABLE cltk_analysis_cache (
  language TEXT,
  word TEXT,
  analysis JSONB, -- Full CLTK output
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(language, word)
);
```

---

## 🏗️ Technical Architecture

### **Component Overview**

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  - Reader with click-to-define                          │
│  - Character chat interface                              │
│  - Exercise UI                                           │
│  - Progress tracking                                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Next.js API Routes (Node.js)                │
│  - Dictionary lookup orchestration                       │
│  - Character conversation endpoints                      │
│  - Exercise generation                                   │
│  - Progress/analytics                                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────┬─────────────────────────────────┐
│  Dictionary Service   │  CLTK Microservice (Python)     │
│  (Node.js)            │  - Morphological analysis       │
│  - Lewis & Short JSON │  - Lemmatization                │
│  - Cache management   │  - Inflection generation        │
│  - Fallback logic     │  - POS tagging                  │
└───────────────────────┴─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                PostgreSQL (Supabase)                     │
│  - dictionary_entries (enriched cache)                   │
│  - character_relationships (persistent state)            │
│  - conversation_history (dialog logs)                    │
│  - grammar_taxonomy (concept index)                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  External Services                       │
│  - OpenAI GPT-4 (conversations, exercises, translation) │
│  - ElevenLabs (TTS for character voices)                │
│  - Whisper API (STT for voice input - future)           │
└─────────────────────────────────────────────────────────┘
```

### **Language-Agnostic Design Patterns**

**1. Dictionary Service Interface** (abstract base):

```typescript
interface LanguageDictionaryService {
  language: string; // 'la', 'on', 'grc'

  // Core methods all languages must implement
  lookup(word: string): Promise<DictionaryEntry | null>;
  search(query: string, limit?: number): Promise<DictionaryEntry[]>;

  // Optional enhancements
  lemmatize?(word: string): Promise<string>;
  getInflections?(lemma: string): Promise<Record<string, string>>;
}

// Latin implementation
class LatinDictionaryService implements LanguageDictionaryService {
  language = 'la';
  private lewisShort: LewisShortEntry[];

  async lookup(word: string): Promise<DictionaryEntry | null> {
    // 1. Check cache
    // 2. Lookup Lewis & Short
    // 3. Enhance with CLTK
    // 4. Persist
    // 5. Return
  }
}

// Old Norse implementation (later)
class OldNorseDictionaryService implements LanguageDictionaryService {
  language = 'on';
  private ordbok: OrdbokEntry[];
  private fritzner: FritznerEntry[];

  async lookup(word: string): Promise<DictionaryEntry | null> {
    // 1. Check cache
    // 2. Try ordbok
    // 3. Fallback to Fritzner + translate Norwegian → English
    // 4. Enhance with CLTK
    // 5. Persist
    // 6. Return
  }
}

// Factory pattern
function getDictionaryService(language: string): LanguageDictionaryService {
  switch (language) {
    case 'la': return new LatinDictionaryService();
    case 'on': return new OldNorseDictionaryService();
    case 'grc': return new GreekDictionaryService();
    default: throw new Error(`Unsupported language: ${language}`);
  }
}
```

**2. CLTK Microservice** (language-agnostic endpoints):

```python
# services/cltk-service/main.py
from fastapi import FastAPI

app = FastAPI()

@app.post("/analyze/{language}")
async def analyze(language: str, word: str):
    """
    Language-agnostic morphological analysis
    Supported: 'latin', 'old_norse', 'greek', 'old_english'
    """
    if language == 'latin':
        return analyze_latin(word)
    elif language == 'old_norse':
        return analyze_old_norse(word)
    elif language == 'greek':
        return analyze_greek(word)
    else:
        return {"error": f"Unsupported language: {language}"}
```

**3. Database Design** (language column for multi-language support):

```sql
-- All entries have 'language' column
-- Can easily query by language, add new languages without schema changes
SELECT * FROM dictionary_entries WHERE language = 'la';
SELECT * FROM dictionary_entries WHERE language = 'on';
```

---

## 📚 Latin Resources (First Implementation)

### **Why Latin First?**

| Resource | Latin | Old Norse | Winner |
|----------|-------|-----------|--------|
| Dictionary | Lewis & Short (50k, JSON, English) | ordbok (4.5k) + Fritzner (40k, Norwegian) | 🏆 **LATIN** |
| Morphology | CLTK excellent | CLTK limited | 🏆 **LATIN** |
| Lemmatization | Backoff Lemmatizer ✅ | Incomplete | 🏆 **LATIN** |
| Tools | Collatinus, Whitaker's Words | Minimal | 🏆 **LATIN** |
| Text Corpus | Perseus + massive classical corpus | Limited | 🏆 **LATIN** |
| Implementation Time | ~3 hours | ~5-6 hours | 🏆 **LATIN** |

### **Latin Dictionary: Lewis & Short**

**Source**: [GitHub: lewis-short-json](https://github.com/IohannesArnold/lewis-short-json)
**License**: Creative Commons (Perseus Digital Library)
**Format**: JSON, 26 files (A-Z), ~50,000 entries
**Quality**: Gold standard Latin dictionary

**Entry Structure**:
```json
{
  "key": "puella",
  "entry_type": "main",
  "part_of_speech": "noun",
  "gender": "F",
  "declension": 1,
  "title_genitive": "ae",
  "title_orthography": "pŭella",
  "senses": [
    "a girl, maiden, young woman",
    "a sweetheart, mistress"
  ],
  "main_notes": "dim. of puer"
}
```

**Fields Available**:
- `key`: Headword (lemma)
- `part_of_speech`: noun, verb, adj, prep, etc.
- `gender`: M/F/N
- `declension`: 1-5 for nouns
- `title_genitive`: Genitive ending for declension
- `senses`: Array of English definitions
- `main_notes`: Etymology, usage notes, cross-references

### **CLTK Latin Support**

**Capabilities**:
- ✅ **Lemmatization**: Backoff lemmatizer (corpus-based frequency disambiguation)
- ✅ **POS Tagging**: TnT tagger trained on Latin corpora
- ✅ **Morphological Analysis**: Full inflection generation
- ✅ **Tokenization**: Sentence and word tokenization
- ✅ **Scansion**: Metrical analysis for poetry
- ✅ **Named Entity Recognition**: Person/place identification

**Usage Example**:
```python
from cltk import NLP
from cltk.lemmatize.lat import LatinBackoffLemmatizer

nlp = NLP(language='lat')
lemmatizer = LatinBackoffLemmatizer()

# Lemmatize
word = "puellae"
lemma = lemmatizer.lemmatize([word])[0][1]  # "puella"

# Full analysis
doc = nlp.analyze(text="Puella in horto ambulat")
for word in doc.words:
    print(f"{word.string}: {word.lemma} ({word.pos})")
# Output:
# Puella: puella (NOUN)
# in: in (PREP)
# horto: hortus (NOUN)
# ambulat: ambulo (VERB)
```

---

## 🎯 Implementation Roadmap

### **Phase 1: Latin Foundation** (Week 1-2) 🟢 **START HERE**

**Goal**: Get Latin working with hybrid dictionary + basic conversations

**Stories** (detailed in Epic breakdown below):
1. Download and integrate Lewis & Short JSON
2. Create Latin dictionary service with cache
3. Set up CLTK Python microservice
4. Create database schema
5. Build API routes
6. Update frontend for Latin support
7. Seed sample Latin content (Cicero, Caesar)

**Deliverable**: Can read Latin texts, click words for definitions with morphology

---

### **Phase 2: Conversation MVP** (Week 3-4) 🟡

**Goal**: Prototype dialog system with ONE character for validation

**Features**:
1. Character definition schema (Cicero as test case)
2. Chat UI within lesson view
3. Grammar-bounded AI prompts
4. Error detection and feedback
5. Persistent conversation history

**Test Flow**:
- Student reads Cicero's First Catiline Oration
- Clicks "Talk to Cicero" button
- Chats about the speech in Latin
- Gets grammar corrections
- AI detects struggles → generates exercises → returns to chat

**Validation Questions**:
- Is this more engaging than traditional exercises?
- Does grammar-bounded AI stay in scope?
- Is feedback helpful and motivating?

**Deliverable**: Working conversation with Cicero about readings

---

### **Phase 3: winkNLP + Grammar Index** (Week 5-6) 🟡

**Goal**: Add linguistic intelligence and grammar-aware content generation

**Features**:
1. Integrate winkNLP for text processing
2. Scrape grammar index (Bennett's Latin Grammar)
3. Set up vector database (pgvector) for semantic search
4. Implement sentence-to-grammar mapping
5. Update Mastra workflows for grammar-aware generation

**Deliverable**: Readings auto-annotated with grammar concepts, exercises target specific grammar

---

### **Phase 4: Content Transformation Engine** (Week 7-10) 🔵 **FUTURE**

**Goal**: Adaptive leveling model for arbitrary content

**Features**:
1. Grammar skeleton extraction from complex texts
2. Content simplification model (fine-tuned GPT-4)
3. Lesson sequence generation (A1 → C2)
4. Vocabulary substitution (frequency-based)
5. Syntax transformation (dependency tree manipulation)

**Test Case**: Input Aeneid Book I → Output 50-lesson scaffolded sequence

**Deliverable**: "I want to learn with Ovid" → 50-lesson course from beginner to Ovid mastery

---

### **Phase 5: Advanced Conversations** (Week 11-14) 🔵 **FUTURE**

**Goal**: World-class immersive conversational experience

**Features**:
1. Speech-to-text integration (Whisper API)
2. Pronunciation feedback and accent scoring
3. Multimodal immersion (AI-generated scenes, interactive hotspots)
4. Roleplay scenarios with mission-based progression
5. Adaptive reinforcement loop (auto-generate exercises mid-conversation)

**Deliverable**: Fully immersive conversational learning with voice, images, and adaptive scaffolding

---

### **Phase 6: Old Norse Expansion** (Week 15+) 🟣 **FUTURE**

**Goal**: Apply proven architecture to Old Norse

**Changes Needed**:
1. Create `OldNorseDictionaryService` class
2. Add translation layer (Norwegian → English)
3. Configure CLTK for Old Norse
4. Update character roster (Norse gods, saga heroes)
5. Seed Old Norse content (Völuspá, Sagas)

**Deliverable**: Same features as Latin, but for Old Norse

---

## 📊 Success Metrics

### **Phase 1: Latin Foundation**
- ✅ 50,000 Latin words available instantly
- ✅ <50ms for cached dictionary lookups
- ✅ <2s for first-time lookups (with CLTK enhancement)
- ✅ 100% of cached entries have morphological data
- ✅ Can read sample texts and get definitions

### **Phase 2: Conversation MVP**
- ✅ 80%+ of users find conversations more engaging than exercises (survey)
- ✅ Grammar corrections improve student accuracy by 30%+
- ✅ 60%+ conversation retention (students return to chat)
- ✅ <2s latency for AI responses
- ✅ Grammar-bounded AI stays within lesson scope 95%+ of time

### **Phase 3: Grammar Awareness**
- ✅ 90%+ of sentences correctly mapped to grammar concepts
- ✅ Exercises target specific struggles 80%+ accuracy
- ✅ Students report "exercises feel relevant" 75%+

### **Phase 4: Content Transformation**
- ✅ Can generate 50-lesson sequence from any classical text
- ✅ Students progress from A1 → C2 in target material
- ✅ 70%+ complete scaffolded sequences (retention)

### **Phase 5: Advanced Conversations**
- ✅ Voice input works 95%+ accuracy
- ✅ Pronunciation feedback improves accent scores by 40%+
- ✅ Students engage with conversations 3x more than exercises

---

## 💰 Cost Estimates

### **Phase 1: Latin Foundation**
- **CLTK**: Free (self-hosted Python microservice)
- **Lewis & Short**: Free (open source)
- **Database**: Free tier (under 500MB)
- **Total**: $0/month

### **Phase 2: Conversation MVP**
- **OpenAI GPT-4o**: ~$0.005 per conversation turn
- **Estimated**: 1000 students × 10 conversations/day × 5 turns = 50k turns/day
- **Daily cost**: $250
- **Monthly cost**: ~$7,500

**Optimization strategies**:
- Cache common responses
- Use GPT-4o-mini for simpler interactions ($0.001/turn = 80% savings)
- Batch API calls where possible

### **Phase 3-5: Full Platform**
- **AI Conversations**: ~$5,000-7,500/month (depending on usage)
- **TTS (ElevenLabs)**: ~$500/month (with caching)
- **STT (Whisper API)**: ~$200/month
- **Database**: ~$25/month (Supabase Pro)
- **Compute**: ~$100/month (Cloud Run)
- **Total**: ~$6,000-8,500/month for 1,000 active users

**Revenue Target**: $15/user/month → $15,000/month at 1,000 users → **Profitable at scale**

---

## 🚀 Getting Started (Phase 1)

See **Epic 8: Latin Foundation** below for detailed implementation steps.

**Quick Start**:
```bash
# 1. Clone Lewis & Short dictionary
gh repo clone IohannesArnold/lewis-short-json
mv lewis-short-json/ls_*.json data/latin-dictionary/

# 2. Install dependencies
npm install

# 3. Set up CLTK microservice
cd services/cltk-latin
pip install -r requirements.txt
python -c "from cltk.data.fetch import FetchCorpus; FetchCorpus('latin').import_corpus('latin_models_cltk')"
uvicorn main:app --port 8001

# 4. Run migrations
npx supabase db push

# 5. Seed sample content
npx tsx scripts/seed-latin-demo.ts

# 6. Start dev server
npm run dev
```

---

## 🎓 Pedagogical Philosophy

### **Core Principles**

1. **Context Over Rules**: Learn grammar in authentic texts, not abstract examples
2. **Communication Over Translation**: Practice producing language, not just recognizing it
3. **Engagement Over Exercises**: Conversations feel like talking to a friend, not homework
4. **Intrinsic Motivation**: Progress toward texts you actually care about (Virgil, Ovid)
5. **Adaptive Scaffolding**: System meets you where you are, adjusts to your pace
6. **Incremental Challenge**: Slightly above current level (i+1 principle)

### **Research Foundations**

- **Comprehensible Input** (Krashen): Maximum exposure to language slightly above current level
- **Communicative Language Teaching**: Focus on functional communication, not just grammar drills
- **Task-Based Learning**: Real communicative tasks (persuade, explain, narrate)
- **Spaced Repetition**: Revisit material at increasing intervals (implicit in conversation continuity)
- **Flow State**: Balance challenge and skill to maintain engagement (Csikszentmihalyi)

---

## 🔮 Future Enhancements

### **Additional Languages**
- **Ancient Greek** (similar approach to Latin: Perseus texts + CLTK)
- **Old Norse** (ordbok + Fritzner + CLTK)
- **Old English** (Bosworth-Toller + CLTK)
- **Sanskrit** (extensive CLTK support)

### **Advanced Features**
- **Collaborative Learning**: Students chat with each other in target language (moderated by AI)
- **Writing Workshops**: AI provides feedback on longer compositions
- **Cultural Context**: Historical simulations (e.g., Roman Senate debates)
- **Gamification**: XP, achievements, leaderboards for conversations
- **Mobile App**: Native iOS/Android with offline dictionary cache
- **Browser Extension**: Read any Latin webpage with click-to-define

### **Content Expansion**
- **Complete Classical Corpus**: All major Latin authors with conversational companions
- **Medieval Texts**: Integrate medieval Latin (Thomas Aquinas, etc.)
- **Interactive Mythology**: Chat with mythological characters (Jupiter, Minerva)
- **Historical Simulations**: "Live through" Roman history via conversations

---

## 📝 Notes & Decisions

### **Why Latin First?**
- Better resources (Lewis & Short is gold standard)
- Stronger CLTK support
- Faster implementation (no translation layer)
- Validates approach for later expansion

### **Why Conversation-First?**
- Traditional exercises are boring and demotivating
- Active production > passive recognition for retention
- Emotional engagement through characters creates better memory anchors
- Immediate feedback like a human tutor

### **Why Hybrid Dictionary?**
- Static dictionaries (Lewis & Short) provide instant coverage (50k words)
- CLTK enhancement adds morphological intelligence
- Incremental enrichment avoids upfront cost
- Self-improving: gets better with usage

### **Architecture Decisions**
- **Language-agnostic design**: Easy to add Old Norse, Greek later
- **Microservices**: CLTK in Python (natural fit), core in Node.js (Next.js ecosystem)
- **Cache-first**: Optimize for speed (dictionary lookups <50ms)
- **Progressive enhancement**: Works without CLTK, better with it

---

## 🔗 References

### **Dictionaries**
- [Lewis & Short JSON](https://github.com/IohannesArnold/lewis-short-json) - Latin dictionary
- [old-norse-ordbok](https://github.com/stscoundrel/old-norse-ordbok) - Old Norse → English (4.5k)
- [old-norwegian-dictionary](https://github.com/stscoundrel/old-norwegian-dictionary) - Old Norse → Norwegian (40k)

### **NLP Tools**
- [CLTK Documentation](https://docs.cltk.org/) - Classical Language Toolkit
- [Collatinus](https://github.com/biblissima/collatinus) - Latin lemmatizer
- [Whitaker's Words](https://github.com/ArchimedesDigital/open_words) - Latin morphology

### **Academic Resources**
- [Perseus Digital Library](http://www.perseus.tufts.edu/) - Classical texts and tools
- [Logeion](https://logeion.uchicago.edu/) - Ancient language dictionaries
- [Bennett's Latin Grammar](https://www.thelatinlibrary.com/bennett.html) - Grammar reference

### **Research Papers**
- Krashen, S. (1982). *Principles and Practice in Second Language Acquisition*
- Godwin-Jones, R. (2018). "Chasing the Butterfly Effect: Informal Language Learning Online"
- VanPatten, B. (2004). "Input Processing in SLA"

---

**END OF PRD v3**
