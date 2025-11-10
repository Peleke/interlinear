# EPIC-07: Learner Integration

**Priority**: P1
**Estimated Points**: 8
**Dependencies**: EPIC-06 (Publish Workflow)
**Status**: 📋 Planned

---

## Epic Goal

Integrate published lessons into learner experience with auto-vocab population.

**Success Criteria**:
- ✅ Published lessons visible in course view
- ✅ Lesson completion triggers vocab population
- ✅ User vocabulary tracks source lessons
- ✅ Learners cannot see draft lessons

---

## User Stories

### Story 7.1: Published Lesson Visibility (2 pts)

**Acceptance Criteria**:
- ✅ Published lessons appear in `/courses/:id` view
- ✅ Draft lessons NOT visible to non-authors
- ✅ Lesson cards show author name (if feature enabled)
- ✅ RLS policies enforced correctly

### Story 7.2: Lesson Completion API (3 pts)
**Endpoint**: `POST /api/lessons/:id/complete`

**Acceptance Criteria**:
- ✅ Mark lesson as completed (existing logic)
- ✅ Get all lesson vocabulary items
- ✅ Insert into user's `vocabulary` table:
  - `source_lesson_id` = lesson ID
  - `lesson_vocabulary_id` = vocab item ID
  - `learned_from_lesson` = true
  - `click_count` = 0 (will increment if user clicks in reader)
- ✅ Upsert logic (ignore if already exists)
- ✅ Returns vocab count added

**Response**:
```json
{
  "success": true,
  "lessonCompleted": true,
  "vocabularyAdded": 12
}
```

### Story 7.3: User Vocabulary Attribution (2 pts)

**Acceptance Criteria**:
- ✅ Vocabulary list shows source lesson
- ✅ "Learned from: Lesson 1.2 - Verb SER" badge
- ✅ Filter vocabulary by lesson
- ✅ Filter vocabulary by language

**UI Enhancement**:
```tsx
<VocabularyCard>
  <Word>ser</Word>
  <Translation>to be</Translation>
  <Badge>📚 From: Lesson 1.2</Badge>
  <Stats>Clicked 5 times</Stats>
</VocabularyCard>
```

### Story 7.4: Spaced Repetition Opportunity (1 pt)

**Acceptance Criteria**:
- ✅ Query: Get vocabulary from lessons completed >7 days ago
- ✅ Show reminder: "Review vocab from Lesson 1.2?"
- ✅ Link to vocabulary practice (future feature)

**Query**:
```sql
SELECT DISTINCT source_lesson_id, COUNT(*) as word_count
FROM vocabulary
WHERE user_id = :user_id
  AND learned_from_lesson = true
  AND created_at < NOW() - INTERVAL '7 days'
GROUP BY source_lesson_id;
```

---

## Definition of Done

- [ ] Lesson completion populates user vocabulary
- [ ] RLS policies tested (drafts invisible to non-authors)
- [ ] Vocabulary attribution UI implemented
- [ ] Integration tests pass (completion → vocab population)
- [ ] Code review approved
- [ ] End-to-end flow tested: Author → Publish → Learner → Complete → Vocab

---

## Future Enhancements (Out of Scope)

- Lesson ratings/reviews
- Collaborative authoring (multiple authors per lesson)
- Version history & rollback
- Lesson analytics (completion rates, time spent)
- Social features (share lessons with friends)
