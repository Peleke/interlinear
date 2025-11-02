# Lesson Content Architecture

**Epic**: 5 - Library System
**Story**: 1.3 - Sample Content Authoring
**Status**: Design Phase
**Date**: 2025-11-02

---

## Overview

This document defines the architecture for lesson content authoring, storage, and seeding for the Spanish A1 curriculum.

---

## Design Principles

1. **Dialog-First Learning**: Lessons center on authentic conversational exchanges
2. **Entity Normalization**: Vocabulary and grammar are atomic, reusable entities
3. **LLM-Enhanced Authoring**: AI assists with content generation and variation
4. **Migration-Ready**: YAML → Postgres transition path built-in
5. **Translation Focus**: Core exercises emphasize bidirectional translation

---

## Database Schema

### Core Entities

#### `vocabulary`
```sql
CREATE TABLE vocabulary (
  id SERIAL PRIMARY KEY,
  spanish TEXT NOT NULL,
  english TEXT NOT NULL,
  part_of_speech TEXT,
  difficulty_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(spanish, english)  -- Natural key for lookup-or-create
);
```

#### `grammar_concepts`
```sql
CREATE TABLE grammar_concepts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,  -- e.g., "verb_ser_present"
  display_name TEXT NOT NULL,  -- e.g., "El verbo SER - Present Tense"
  description TEXT,
  content TEXT,  -- Rich content explanation (markdown)
  associated_vocab_ids INTEGER[],  -- Array of vocabulary.id
  related_grammar_ids INTEGER[],   -- Array of grammar_concepts.id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `lessons` (existing, enhanced)
```sql
-- Relationships to normalized entities
CREATE TABLE lesson_vocabulary (
  lesson_id INTEGER REFERENCES lessons(id),
  vocabulary_id INTEGER REFERENCES vocabulary(id),
  is_new BOOLEAN DEFAULT true,  -- New in this lesson vs review
  PRIMARY KEY (lesson_id, vocabulary_id)
);

CREATE TABLE lesson_grammar_concepts (
  lesson_id INTEGER REFERENCES lessons(id),
  grammar_concept_id INTEGER REFERENCES grammar_concepts(id),
  PRIMARY KEY (lesson_id, grammar_concept_id)
);
```

---

## YAML Content Structure

### Grammar Concepts (`grammar/verb_ser_present.yaml`)

```yaml
name: "verb_ser_present"
display_name: "El verbo SER - Present Tense"
description: "The verb 'to be' for identity, characteristics, and origin"

content: |
  ## SER - To Be (Present Tense)

  The verb **ser** expresses identity, characteristics, origin, and profession.

  ### Conjugation
  - Yo **soy** (I am)
  - Tú **eres** (You are)
  - Él/Ella **es** (He/She is)
  - Nosotros **somos** (We are)
  - Ellos/Ellas **son** (They are)

  ### Usage
  - Identity: "Yo soy María" (I am María)
  - Characteristics: "Ella es inteligente" (She is intelligent)
  - Origin: "Somos de España" (We are from Spain)

associated_vocabulary:
  - { spanish: "soy", english: "I am" }
  - { spanish: "eres", english: "you are" }
  - { spanish: "es", english: "he/she is" }

related_grammar:
  - "verb_estar_present"  # Contrasts with SER
  - "subject_pronouns"
```

### Lessons (`lessons/lesson-01.yaml`)

```yaml
id: 1
title: "Saludos y Presentaciones"
title_english: "Greetings & Introductions"
level: "A1"
lesson_number: 1

# Grammar concepts by name (natural key)
grammar_concepts:
  - "verb_ser_present"
  - "subject_pronouns"

# Core dialog that demonstrates grammar and vocab
dialog:
  context: "Two students meet at a university café"
  setting: "Universidad Complutense, Madrid"

  exchanges:
    - speaker: "María"
      spanish: "¡Hola! ¿Cómo te llamas?"
      english: "Hello! What's your name?"

    - speaker: "Juan"
      spanish: "Me llamo Juan. Mucho gusto."
      english: "My name is Juan. Nice to meet you."

    - speaker: "María"
      spanish: "Mucho gusto, Juan. Yo soy María."
      english: "Nice to meet you, Juan. I am María."

    - speaker: "Juan"
      spanish: "¿De dónde eres?"
      english: "Where are you from?"

    - speaker: "María"
      spanish: "Soy de Barcelona. ¿Y tú?"
      english: "I'm from Barcelona. And you?"

# Vocabulary auto-extracted via LLM, but can be manually specified
# Format: natural key for lookup-or-create
vocabulary:
  - { spanish: "hola", english: "hello" }
  - { spanish: "cómo", english: "how" }
  - { spanish: "te llamas", english: "your name is" }
  - { spanish: "mucho gusto", english: "nice to meet you" }
  - { spanish: "de dónde", english: "from where" }
  - { spanish: "soy", english: "I am" }

# Exercises: Dialog-based translation
exercises:
  - type: "translate_line_es_to_en"
    dialog_line: 0  # María's first line
    prompt: "Translate to English: '¡Hola! ¿Cómo te llamas?'"
    answer: "Hello! What's your name?"

  - type: "translate_line_en_to_es"
    dialog_line: 1  # Juan's response
    prompt: "Translate to Spanish: 'My name is Juan. Nice to meet you.'"
    answer: "Me llamo Juan. Mucho gusto."

  - type: "translate_line_es_to_en"
    dialog_line: 2
    prompt: "Translate to English: 'Mucho gusto, Juan. Yo soy María.'"
    answer: "Nice to meet you, Juan. I am María."

  - type: "translate_variation"
    base_dialog_line: 0
    prompt: "Translate to English: '¡Hola! Yo soy Pedro.'"
    answer: "Hello! I am Pedro."

# Content sections for lesson explanation
content_sections:
  - title: "Greetings in Spanish"
    content: |
      Spanish greetings vary by time of day:
      - **Hola** - Hello (universal)
      - **Buenos días** - Good morning
      - **Buenas tardes** - Good afternoon
      - **Buenas noches** - Good evening/night

  - title: "Introducing Yourself with SER"
    content: |
      To introduce yourself, use the verb **ser**:
      - **Yo soy** [name] - I am [name]
      - **Me llamo** [name] - My name is [name] (literally "I call myself")
```

---

## Content Authoring Workflow

### Phase 1: YAML Authoring (Current)
1. Author creates grammar concept YAML files
2. Author writes lesson YAML with dialog and exercises
3. Seeding script uses lookup-or-create pattern:
   - Check if grammar concept exists by `name` → create if missing
   - Check if vocabulary exists by `{spanish, english}` → create if missing
   - Create lesson and relationships

### Phase 2: CRUD UI (Post-Launch)
1. Build admin interface for content management
2. Support in-app editing of lessons, dialogs, exercises
3. Preview and testing tools

### Phase 3: Postgres Direct (Long-term)
1. Migrate authoring to direct DB manipulation
2. Deprecate YAML files (or use for backup/export only)
3. Version control via DB migrations

---

## Exercise Type Taxonomy

### Implemented for Demo (v1)
- ✅ `translate_line_es_to_en`: Spanish → English line translation
- ✅ `translate_line_en_to_es`: English → Spanish line translation
- ✅ `translate_variation`: LLM-generated variation translation

### Scaffolded for Future (v2+)
- 🚧 `fill_blank_translation`: Fill missing word in translation
- 🚧 `complete_exchange`: Provide appropriate dialog response
- 🚧 `match_translations`: Match lines to translations
- 🚧 `reorder_dialog`: Unscramble dialog into correct order
- 🚧 `short_answer`: Free-form translation (graded by LLM)

### Advanced (v3+)
- 🔮 `contextual_translation`: Idiomatic translation requiring context
- 🔮 `voice_response`: Spoken dialog practice
- 🔮 `listening_comprehension`: Audio-based exercises

---

## LLM Integration Points

### Content Generation
- **Dialog Variations**: Generate alternative versions of core dialog
- **Exercise Variations**: Create similar exercises with different vocab
- **Vocabulary Extraction**: Auto-extract vocab from dialog text
- **Difficulty Adjustment**: Generate easier/harder variants

### Future Enhancements
- **Domain-Specific Model**: Train small model for content generation
- **Automated Grading**: LLM evaluates free-form translations
- **Adaptive Content**: Generate personalized exercises based on user mistakes

---

## Vocabulary Reuse Strategy

### Current Approach (v1)
- Lessons introduce new vocabulary
- No explicit tracking of "active" vs "new"
- Simple for demo, optimize later

### Future Optimization (v2+)
- **Bloom Filter**: Efficient tracking of user's active vocabulary
- **Spaced Repetition**: SM-2 algorithm for review scheduling
- **Contextual Reuse**: Reintroduce previous vocab in new contexts

**Design Decision**: Keep v1 simple (word-for-word translations), add sophistication in later epics.

---

## Migration Considerations

### YAML → Postgres Transition
- Natural keys (`name`, `{spanish, english}`) enable smooth lookup
- YAML structure mirrors DB schema closely
- Seeding scripts already implement lookup-or-create logic
- Minimal changes needed to support direct DB authoring

### Backward Compatibility
- Keep YAML as export format even after Postgres migration
- Use for backups, version control, content portability

---

## Open Questions for Future Epics

1. **Grammar Concept Versioning**: How do we handle updates to grammar explanations?
2. **Lesson Variants**: Should we support multiple dialogs per lesson (for variety)?
3. **User-Generated Content**: Can advanced users contribute dialogs/exercises?
4. **Localization**: How do we support multiple target languages (beyond Spanish)?

---

## Implementation Checklist

- [ ] Create `grammar_concepts` table migration
- [ ] Create `lesson_vocabulary` and `lesson_grammar_concepts` junction tables
- [ ] Design grammar YAML schema and sample files
- [ ] Update lesson YAML schema for dialog-first structure
- [ ] Implement lookup-or-create seeding logic
- [ ] Create 3 sample lessons (Saludos, Familia, Números)
- [ ] Test full seeding flow with new structure
- [ ] Document exercise type scaffolds for future implementation

---

**Next Steps**: Create grammar concept YAMLs and lesson YAMLs following this architecture.
