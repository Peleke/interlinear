# EPIC-03: Lesson CRUD API

**Priority**: P0
**Estimated Points**: 21
**Dependencies**: EPIC-01, EPIC-02
**Status**: 📋 Planned

---

## Epic Goal

Build complete RESTful API for lesson authoring with component management.

**Success Criteria**:
- ✅ Full CRUD for lessons (Create, Read, Update, Delete)
- ✅ Component management (dialogs, vocab, grammar, exercises, readings)
- ✅ Author ownership verification
- ✅ Draft/publish workflow
- ✅ All endpoints tested (>90% coverage)

---

## User Stories

### Story 3.1: Create Draft Lesson (3 pts)
**Endpoint**: `POST /api/lessons`

**Acceptance Criteria**:
- ✅ Creates lesson with minimal data (title + author_id)
- ✅ Status defaults to 'draft'
- ✅ Returns lesson ID
- ✅ Validates author is authenticated

### Story 3.2: Get Lesson with Components (3 pts)
**Endpoint**: `GET /api/lessons/:id`

**Acceptance Criteria**:
- ✅ Returns lesson + all components (dialogs, vocab, exercises, etc.)
- ✅ Respects RLS (author sees drafts, everyone sees published)
- ✅ Includes component counts
- ✅ Handles non-existent lesson (404)

### Story 3.3: Update Lesson Metadata (2 pts)
**Endpoint**: `PATCH /api/lessons/:id`

**Acceptance Criteria**:
- ✅ Update title, overview, xp_value, sequence_order, language
- ✅ Only author can update
- ✅ Cannot change author_id
- ✅ Validates ownership

### Story 3.4: Delete Draft Lesson (2 pts)
**Endpoint**: `DELETE /api/lessons/:id`

**Acceptance Criteria**:
- ✅ Only drafts can be deleted
- ✅ Only author can delete
- ✅ Cascades to components (dialogs, vocab links, exercises)
- ✅ Published lessons cannot be deleted (409 error)

### Story 3.5: List User's Lessons (3 pts)
**Endpoint**: `GET /api/lessons?status=draft&author_id=me`

**Acceptance Criteria**:
- ✅ Filter by status (draft|published|archived)
- ✅ Filter by author (`me` = current user)
- ✅ Sort by updated_at, title, sequence_order
- ✅ Pagination support

### Story 3.6: Dialog Management (2 pts)
**Endpoints**:
- `POST /api/lessons/:id/dialogs`
- `PATCH /api/lessons/:id/dialogs/:dialogId`
- `DELETE /api/lessons/:id/dialogs/:dialogId`

**Acceptance Criteria**:
- ✅ Create dialog with exchanges
- ✅ Update dialog context/setting
- ✅ Update exchanges (add, remove, reorder)
- ✅ Delete dialog cascades to exchanges

### Story 3.7: Vocabulary Management (3 pts)
**Endpoints**:
- `POST /api/lessons/:id/vocabulary`
- `DELETE /api/lessons/:id/vocabulary/:itemId`

**Acceptance Criteria**:
- ✅ Add vocab (reuse existing OR create new)
- ✅ Link to lesson_vocabulary junction
- ✅ Auto-increment usage_count (trigger)
- ✅ Remove vocab (unlink, decrement usage_count)

### Story 3.8: Grammar/Exercise/Reading Management (3 pts)
**Endpoints**:
- `POST/DELETE /api/lessons/:id/grammar`
- `POST/PATCH/DELETE /api/lessons/:id/exercises`
- `POST/DELETE /api/lessons/:id/readings`

**Acceptance Criteria**:
- ✅ Link/unlink grammar concepts
- ✅ Create/update/delete exercises
- ✅ Link/unlink readings
- ✅ All respect author ownership

---

## Definition of Done

- [ ] All 8 endpoint groups implemented
- [ ] Integration tests (>90% coverage)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Error handling standardized (4xx, 5xx)
- [ ] Code review approved
- [ ] Ready for EPIC-04 (Authoring UI)
