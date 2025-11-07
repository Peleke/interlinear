# EPIC-02: Vocabulary Integration (Option B: Linked Vocabulary)

**Priority**: P0
**Estimated Points**: 21
**Dependencies**: EPIC-01 (Database Foundation)
**Status**: 📋 Planned

---

## Epic Goal

Implement linked vocabulary system connecting lesson content to user learning with multi-language support.

**Success Criteria**:
- ✅ Lesson vocab items support language (es|is)
- ✅ User vocab tracks source lessons
- ✅ Autocomplete shows vocab reuse ("Used in 5 lessons")
- ✅ Usage counter auto-increments when vocab linked to lessons
- ✅ Migration path to Option C (Master Vocabulary) preserved

---

## User Stories

### Story 2.1: Lesson Vocabulary Language Support (3 pts)

**As a** content author
**I want** to create vocabulary items in different languages
**So that** I can build Spanish and Icelandic courses

**Acceptance Criteria**:
- ✅ `lesson_vocabulary_items` table has `language` column (es|is)
- ✅ `usage_count` column tracks how many lessons use this word
- ✅ `created_by_user_id` tracks who created the vocab item
- ✅ Unique constraint includes language (spanish, english, language)
- ✅ Index on `language` for filtering

**Technical Tasks**:
```sql
-- File: supabase/migrations/YYYYMMDD_vocabulary_integration.sql
- [ ] ADD COLUMN language TEXT CHECK (language IN ('es', 'is'))
- [ ] ADD COLUMN usage_count INTEGER DEFAULT 0
- [ ] ADD COLUMN created_by_user_id UUID REFERENCES auth.users
- [ ] DROP old UNIQUE constraint (spanish, english)
- [ ] ADD new UNIQUE constraint (spanish, english, language)
- [ ] CREATE INDEX ON language
```

**Tests**:
- [ ] Can create Spanish vocab (language='es')
- [ ] Can create Icelandic vocab (language='is')
- [ ] Duplicate (spanish, english, language) rejected
- [ ] Can have same word in different languages

---

### Story 2.2: User Vocabulary Lesson Tracking (3 pts)

**As a** learner
**I want** to know which lesson introduced each vocabulary word
**So that** I can review words from specific lessons

**Acceptance Criteria**:
- ✅ `vocabulary` table has `language` column (es|is)
- ✅ `source_lesson_id` tracks which lesson introduced the word
- ✅ `lesson_vocabulary_id` links to lesson vocab item
- ✅ `learned_from_lesson` flag indicates auto-population vs manual click
- ✅ Unique constraint updated to (user_id, word, language)

**Technical Tasks**:
```sql
- [ ] ADD COLUMN language TEXT DEFAULT 'es'
- [ ] ADD COLUMN source_lesson_id TEXT REFERENCES lessons(id)
- [ ] ADD COLUMN lesson_vocabulary_id UUID REFERENCES lesson_vocabulary_items(id)
- [ ] ADD COLUMN learned_from_lesson BOOLEAN DEFAULT false
- [ ] DROP old UNIQUE constraint (user_id, word)
- [ ] ADD new UNIQUE constraint (user_id, word, language)
- [ ] CREATE indexes on new columns
```

**Tests**:
- [ ] User can have same word in different languages
- [ ] Source lesson correctly tracked
- [ ] Learned_from_lesson flag works

---

### Story 2.3: Usage Count Trigger (2 pts)

**As a** system
**I want** to auto-increment `usage_count` when vocab is linked to lessons
**So that** authors see which words are most reused

**Acceptance Criteria**:
- ✅ INSERT into `lesson_vocabulary` → increment `usage_count`
- ✅ DELETE from `lesson_vocabulary` → decrement `usage_count`
- ✅ Trigger handles concurrent operations safely

**Technical Tasks**:
```sql
- [ ] CREATE FUNCTION update_vocab_usage_count()
- [ ] CREATE TRIGGER on lesson_vocabulary (INSERT/DELETE)
- [ ] Test concurrent insertions
- [ ] Test usage_count accuracy
```

**Tests**:
- [ ] Link vocab to lesson → usage_count increments
- [ ] Unlink vocab from lesson → usage_count decrements
- [ ] Multiple links from same lesson → count correct

---

### Story 2.4: Vocabulary Autocomplete API (5 pts)

**As a** content author
**I want** to search existing vocabulary with reuse indicators
**So that** I can reuse words instead of creating duplicates

**Acceptance Criteria**:
- ✅ `GET /api/lessons/vocabulary/search?q=ser&language=es`
- ✅ Returns suggestions ranked by `usage_count` (most popular first)
- ✅ Each suggestion shows "Used in N lessons" badge
- ✅ Filters by language
- ✅ Returns max 10 results

**Technical Tasks**:
```typescript
// File: app/api/lessons/vocabulary/search/route.ts
- [ ] Implement GET handler
- [ ] Query lesson_vocabulary_items with ILIKE search
- [ ] Filter by language parameter
- [ ] Order by usage_count DESC
- [ ] Format response with badges
```

**Response Format**:
```json
{
  "suggestions": [
    {
      "id": "uuid",
      "spanish": "ser",
      "english": "to be",
      "language": "es",
      "usage_count": 8,
      "reusable": true,
      "badge": "Used in 8 lessons"
    }
  ]
}
```

**Tests**:
- [ ] Search returns matching vocab
- [ ] Results ranked by usage_count
- [ ] Language filter works (es vs is)
- [ ] Handles empty query
- [ ] Performance <100ms for 1000+ vocab items

---

### Story 2.5: VocabularyService Language Support (3 pts)

**As a** developer
**I want** VocabularyService to handle multi-language vocab
**So that** the codebase consistently supports Spanish/Icelandic

**Acceptance Criteria**:
- ✅ `saveWord()` accepts `language` parameter (default 'es')
- ✅ `getByLanguage(language)` filters vocab by language
- ✅ `getByLesson(lessonId)` returns lesson-specific vocab
- ✅ Backward compatible (existing calls default to Spanish)

**Technical Tasks**:
```typescript
// File: lib/vocabulary.ts
- [ ] Update saveWord() signature (add language param)
- [ ] Implement getByLanguage(language: 'es' | 'is')
- [ ] Implement getByLesson(lessonId: string)
- [ ] Update unique constraint checks to include language
- [ ] Add TypeScript types for language enum
```

**Tests**:
- [ ] Save Spanish word (language='es')
- [ ] Save Icelandic word (language='is')
- [ ] Get vocabulary filtered by language
- [ ] Get vocabulary from specific lesson

---

### Story 2.6: Migration & Backfill (5 pts)

**As a** developer
**I want** existing vocabulary data migrated safely
**So that** no data is lost during schema changes

**Acceptance Criteria**:
- ✅ All existing `lesson_vocabulary_items` backfilled to language='es'
- ✅ All existing `vocabulary` entries backfilled to language='es'
- ✅ Unique constraints updated without data loss
- ✅ Indexes created for query performance
- ✅ Rollback migration tested

**Technical Tasks**:
```sql
- [ ] Backfill lesson_vocabulary_items SET language='es'
- [ ] Backfill vocabulary SET language='es'
- [ ] Update constraints (DROP old, ADD new)
- [ ] Create performance indexes
- [ ] Test on production-sized dataset (simulate 1000+ vocab items)
```

**Tests**:
- [ ] Fresh database: migration applies cleanly
- [ ] Existing database: backfill works without errors
- [ ] No duplicate constraint violations after migration
- [ ] Query performance maintained or improved
- [ ] Rollback successful

---

## Definition of Done

- [ ] All migrations applied to local Supabase
- [ ] Usage count trigger tested with concurrent operations
- [ ] Autocomplete API returns results in <100ms
- [ ] VocabularyService tests pass (100% coverage)
- [ ] Documentation updated (API specs, schema diagram)
- [ ] Code review approved
- [ ] Ready for EPIC-03 (Lesson CRUD API)

---

## Analytics Queries (Bonus)

These queries will be useful for future analytics features:

```sql
-- Most reused vocabulary
SELECT spanish, english, usage_count, language
FROM lesson_vocabulary_items
WHERE language = 'es'
ORDER BY usage_count DESC
LIMIT 20;

-- Lesson vocabulary coverage
SELECT
  l.title,
  COUNT(DISTINCT v.user_id) as users_learned,
  COUNT(DISTINCT v.word) as unique_words
FROM lessons l
JOIN vocabulary v ON v.source_lesson_id = l.id
WHERE v.learned_from_lesson = true
GROUP BY l.id
ORDER BY users_learned DESC;

-- User vocab by language
SELECT language, COUNT(*) as word_count
FROM vocabulary
WHERE user_id = :user_id
GROUP BY language;
```

---

## Related Documentation

- [Vocabulary Integration Spec](../../claudedocs/vocabulary_integration_spec.md)
- [Implementation Spec: Vocabulary Manager](../../claudedocs/lesson_authoring_implementation_spec.md#vocabularymanager)
