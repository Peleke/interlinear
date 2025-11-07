# EPIC-01: Database Foundation

**Priority**: P0
**Estimated Points**: 13
**Dependencies**: None
**Status**: 📋 Planned

---

## Epic Goal

Establish database schema foundations for lesson authoring and multi-language support.

**Success Criteria**:
- ✅ All migrations applied successfully
- ✅ RLS policies enforce author permissions
- ✅ Language support (es|is) functional
- ✅ Draft/published status workflow works

---

## User Stories

### Story 1.1: Lesson Status & Authorship Schema (5 pts)

**As a** content author
**I want** lesson draft/publish status tracking
**So that** I can work on lessons privately before publishing

**Acceptance Criteria**:
- ✅ `lessons` table has `status` column (draft|published|archived)
- ✅ `lessons` table has `author_id` column (FK to auth.users)
- ✅ `lessons.overview` is nullable (draft-first approach)
- ✅ Indexes on `status` and `author_id` for performance
- ✅ `updated_at` trigger updates timestamp on changes

**Technical Tasks**:
```sql
-- File: supabase/migrations/YYYYMMDD_lesson_authoring_foundation.sql
- [ ] Add status column with CHECK constraint
- [ ] Add author_id column with FK
- [ ] Make overview nullable
- [ ] Create indexes (status, author_id)
- [ ] Add updated_at trigger
```

**Tests**:
- [ ] Draft lesson can be created with minimal data
- [ ] Status transitions work (draft → published → archived)
- [ ] Author_id correctly references auth.users

---

### Story 1.2: Multi-Language Support Schema (3 pts)

**As a** content author
**I want** to specify lesson language (Spanish or Icelandic)
**So that** I can build courses in different languages

**Acceptance Criteria**:
- ✅ `lessons` table has `language` column (es|is)
- ✅ Default language is 'es' for existing lessons
- ✅ Index on `language` for filtering
- ✅ Can filter lessons by language in queries

**Technical Tasks**:
```sql
- [ ] Add language column with CHECK constraint
- [ ] Set default to 'es'
- [ ] Create index on language
- [ ] Backfill existing lessons to 'es'
```

**Tests**:
- [ ] Can create Spanish lesson (language='es')
- [ ] Can create Icelandic lesson (language='is')
- [ ] Invalid language rejected ('fr')

---

### Story 1.3: Author Permission RLS Policies (3 pts)

**As a** content author
**I want** to control who can see/edit my draft lessons
**So that** my unpublished work stays private

**Acceptance Criteria**:
- ✅ Authors can view their own drafts
- ✅ All authenticated users can view published lessons
- ✅ Authors can create new lessons (author_id = self)
- ✅ Authors can update ONLY their own lessons
- ✅ Authors can delete ONLY their own draft lessons (not published)

**Technical Tasks**:
```sql
-- File: supabase/migrations/YYYYMMDD_lesson_authoring_rls.sql
- [ ] SELECT policy: author OR status='published'
- [ ] INSERT policy: author_id = auth.uid()
- [ ] UPDATE policy: author_id = auth.uid()
- [ ] DELETE policy: author_id = auth.uid() AND status='draft'
```

**Tests**:
- [ ] Author A cannot see Author B's drafts
- [ ] All users can see published lessons
- [ ] Author cannot delete own published lesson
- [ ] Author can delete own draft lesson

---

### Story 1.4: Component Table RLS Updates (2 pts)

**As a** system
**I want** component tables (dialogs, vocab, exercises) to respect lesson permissions
**So that** draft components aren't visible to non-authors

**Acceptance Criteria**:
- ✅ Dialogs inherit lesson permissions
- ✅ Vocabulary items inherit lesson permissions
- ✅ Exercises inherit lesson permissions
- ✅ Grammar concepts inherit lesson permissions

**Technical Tasks**:
```sql
- [ ] Update lesson_dialogs RLS (join with lessons.author_id)
- [ ] Update lesson_vocabulary RLS (join with lessons.author_id)
- [ ] Update exercises RLS (join with lessons.author_id)
- [ ] Update lesson_grammar_concepts RLS (join with lessons.author_id)
```

**Tests**:
- [ ] Non-author cannot see draft lesson's dialogs
- [ ] Published lesson's components visible to all

---

### Story 1.5: Migration Testing & Validation (0 pts - included in above)

**As a** developer
**I want** migrations tested in local environment
**So that** production deployment is safe

**Acceptance Criteria**:
- ✅ All migrations run without errors locally
- ✅ Rollback scripts tested and working
- ✅ Data integrity maintained (no data loss)
- ✅ Performance acceptable (indexes improve query speed)

**Technical Tasks**:
- [ ] Run migrations on local Supabase
- [ ] Verify schema changes with `\d lessons`
- [ ] Test RLS policies with multiple test users
- [ ] Benchmark query performance (before/after indexes)
- [ ] Create rollback migration if needed

**Tests**:
- [ ] Fresh database: migrations apply cleanly
- [ ] Existing database: backfill works correctly
- [ ] Rollback: can revert to previous schema

---

## Definition of Done

- [ ] All migrations applied to local Supabase
- [ ] RLS policies tested with multiple user accounts
- [ ] Performance benchmarks show <100ms query times
- [ ] Documentation updated (schema diagram, RLS rules)
- [ ] Code review approved
- [ ] Ready for EPIC-02 (vocabulary integration)

---

## Related Documentation

- [Implementation Spec: Phase 1 - Database & API](../../claudedocs/lesson_authoring_implementation_spec.md#phase-1-database--api-backend)
- [Vocabulary Integration Spec](../../claudedocs/vocabulary_integration_spec.md)
