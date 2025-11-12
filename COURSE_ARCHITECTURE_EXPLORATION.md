# Course Architecture Exploration - Phase 2 Planning

**Date:** November 11, 2025  
**Status:** Architecture Analysis Complete  
**Related Issues:** Issue #48 (Lesson Publish System), Phase 2 (Course Publishing)

## Overview

This document summarizes findings from exploring the course management system architecture in preparation for implementing a course publishing system (Phase 2). The analysis identifies the current state, gaps, and proposes solutions modeled after the lesson publishing system implemented in Phase 1.

---

## Current State Summary

### What Exists

#### 1. Database Foundation
- **Courses table**: Stores course metadata (title, description, language, difficulty_level)
- **lesson_course_ordering**: Junction table maintaining lesson order within courses
- **Lessons table**: Already has publishing infrastructure (published_at, published_by, version)

#### 2. API Layer
- 8 course management endpoints (CRUD + lesson management)
- Service layer pattern in `/lib/services/course.ts`
- Proper separation of concerns

#### 3. UI Components
- **MyCoursesDashboard**: Lists author's courses in grid layout
- **CourseDetailView**: Full course editing with drag-to-reorder lessons
- **Modals**: Create, edit, and lesson selection workflows
- **Visual Design**: Consistent sepia theme with responsive layout

#### 4. Publishing Reference Pattern
- Lesson publishing system provides proven pattern
- Validation framework already exists (lesson-publish-validator.ts)
- Preview and publish flow established

### Critical Gaps for Phase 2

#### 1. Database Schema
- **Missing publishing fields**: published_at, published_by, version, status
- **Missing indexes**: For filtering published courses efficiently
- **Missing RLS policies**: No author-only editing, no published/draft distinction

#### 2. Authorization & Security
- **RLS Policies incomplete**: Courses table lacks:
  - Author-only editing policy
  - Learner-only published course visibility
  - Unpublished course protection
- **No status field**: Cannot distinguish draft vs published courses

#### 3. Publishing Logic
- **No validation system**: Need course-publish-validator.ts
- **No preview endpoint**: Need `/api/courses/[id]/preview`
- **No publish endpoint**: Need `/api/courses/[id]/publish`
- **No unpublish endpoint**: Need DELETE `/api/courses/[id]/publish`

#### 4. UI Components
- **No publish modal**: Missing CoursePublishModal with validation feedback
- **No preview modal**: Missing CoursePreviewModal for full course preview
- **No status indicators**: UI doesn't show draft/published state

---

## Key Architectural Insights

### 1. Relationship Model

```
Author → Creates → Courses (many)
                      ├─ Has metadata (title, desc, language, difficulty)
                      ├─ Contains Lessons (many, via ordering table)
                      └─ Can be published (public visibility)

Lesson → Standalone entity
         ├─ Can be published independently
         ├─ Added to courses after creation
         └─ Status: draft | published | archived
```

**Important:** Lessons are created first, then added to courses. A lesson can exist without a course.

### 2. Publishing Dependency Chain

**Constraint discovered:** To publish a course, ALL lessons in that course must be published first.

This creates a dependency ordering:
1. Author creates lessons
2. Author publishes lessons (individually)
3. Author creates course and adds published lessons
4. Author publishes course (validation checks all lessons are published)

### 3. Component Reusability Patterns

The lesson preview system has directly reusable patterns:
- Modal structure and styling
- Validation error display
- Content rendering (markdown, exercises, dialogs)
- Toast notification feedback

### 4. Service Layer Consistency

CourseService follows same patterns as other services:
- Static methods for database operations
- Promise-based async/await
- Error handling via try/catch
- Type-safe interfaces

---

## Proposed Phase 2 Implementation

### Phase 2A: Database & Security (Foundation)

```sql
-- 1. Add publishing fields to courses table
ALTER TABLE public.courses
ADD COLUMN published_at TIMESTAMPTZ,
ADD COLUMN published_by UUID,
ADD COLUMN version INTEGER DEFAULT 1,
ADD COLUMN status TEXT DEFAULT 'draft';

-- 2. Create performance indexes
CREATE INDEX idx_courses_published_at ON courses(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_courses_author_id ON courses(created_by);

-- 3. Add RLS policies
-- Authors can view all their courses
-- Learners can view only published courses
-- Editing locked for published courses
```

### Phase 2B: Backend Services (Validation & API)

```typescript
// 1. Create course-publish-validator.ts
// Validate:
// - Course metadata completeness
// - At least 1 lesson
// - All lessons are published
// - Lesson ordering is valid
// - All required content exists

// 2. Extend CourseService
CourseService.publishCourse(id)
CourseService.unpublishCourse(id)
CourseService.validateCourse(id)

// 3. Create API endpoints
POST /api/courses/[id]/preview
POST /api/courses/[id]/publish
DELETE /api/courses/[id]/publish
```

### Phase 2C: Frontend UI (User Experience)

```tsx
// 1. CoursePublishModal
// - Shows publish readiness
// - Lists lessons with status
// - Displays validation errors
// - Publish button (disabled if invalid)

// 2. CoursePreviewModal
// - Renders entire course
// - Shows all lessons, exercises, grammar
// - Styled for preview context

// 3. Update CourseDetailView
// - Add "Preview" button
// - Add "Publish" button
// - Show "Published" badge
// - Show "Unpublish" button when published
```

---

## Critical Success Factors

### Must Have
1. **Data Integrity**: Publish operation is atomic (all-or-nothing)
2. **Authorization**: RLS policies prevent unauthorized access
3. **Validation**: Comprehensive checks prevent invalid states
4. **User Feedback**: Clear error messages guide authors
5. **Consistency**: Published courses cannot be edited/reordered

### Should Have
1. **Version Tracking**: History of publishes
2. **Performance**: Publish operation < 500ms
3. **UX Polish**: Smooth modal flows, clear status
4. **Error Recovery**: Clear unpublish path

### Nice to Have
1. **Bulk Operations**: Publish multiple courses
2. **Scheduled Publishing**: Publish at future time
3. **Publishing Analytics**: Track publishes/unpublishes
4. **Rollback**: Revert to previous versions

---

## File Locations & References

### To Extend (Core)
- `/lib/services/course.ts` - Add publish/unpublish methods
- `/app/api/courses/[id]/route.ts` - Add preview endpoint
- `/supabase/migrations/` - New migration for publishing fields

### To Create (New)
- `/lib/validation/course-publish-validator.ts` - Validation logic
- `/app/api/courses/[id]/preview/route.ts` - Preview endpoint
- `/app/api/courses/[id]/publish/route.ts` - Publish/unpublish endpoints
- `/components/author/CoursePublishModal.tsx` - Publish UI
- `/components/author/CoursePreviewModal.tsx` - Preview UI

### To Modify (Existing)
- `/components/author/CourseDetailView.tsx` - Add publish buttons
- `/components/author/CourseCard.tsx` - Show published status
- Migration for RLS policies on courses table

### Reference (From Phase 1)
- `/app/api/lessons/[lessonId]/publish/route.ts` - Publishing pattern
- `/lib/validation/lesson-publish-validator.ts` - Validation pattern
- `/components/author/LessonPreviewModal.tsx` - Modal pattern

---

## Implementation Sequence

### Week 1: Foundation
- [ ] Database migration (publishing fields + RLS)
- [ ] Create course-publish-validator.ts
- [ ] Unit tests for validator

### Week 2: Backend
- [ ] Extend CourseService (publish/unpublish)
- [ ] Create API endpoints (preview, publish, unpublish)
- [ ] Integration tests for API

### Week 3: Frontend
- [ ] CoursePublishModal component
- [ ] CoursePreviewModal component
- [ ] Update CourseDetailView with buttons
- [ ] Update CourseCard to show status

### Week 4: Polish & Testing
- [ ] E2E tests for complete workflow
- [ ] Performance testing
- [ ] Edge case handling
- [ ] Documentation

---

## Risk Assessment

### High Risk
- **RLS Policy Mistakes**: Could leak unpublished courses to learners
- **Validation Gaps**: Invalid courses could be published
- **Atomicity Issues**: Partial publishes leaving corrupted state

### Mitigation
- Comprehensive RLS policy testing
- Extensive validation rule testing
- Transaction-based publish operations

### Medium Risk
- **Performance**: Large courses might be slow to publish
- **UX Confusion**: Users might try to edit published courses

### Mitigation
- Performance profiling during development
- Clear UI indicators for locked state

---

## Key Decisions Made

1. **Follow Lesson Pattern**: Use lesson publishing as reference model
2. **Atomic Operations**: Publish is all-or-nothing via transactions
3. **Validation First**: Validate before any database changes
4. **RLS-Enforced**: Security via policies, not just API checks
5. **No Partial Publishes**: All lessons must be published before course publish
6. **Version Tracking**: Increment version on each republish

---

## Questions for Requirements Clarification

1. **Unpublish Behavior**: If a lesson is unpublished, should containing course auto-unpublish?
2. **Enrolled Users**: When course is unpublished, what happens to users already enrolled?
3. **Publishing Notifications**: Should learners be notified of new course publications?
4. **Archiving**: Is there a need for course archival separate from draft/published?
5. **Pricing**: Do courses have pricing that affects publication?

---

## Conclusion

The course architecture provides a solid foundation for implementing a publishing system. The lesson publishing system from Phase 1 offers a proven pattern that can be adapted for courses with additional complexity around lesson ordering and validation. The main gap is the absence of publishing fields in the database and corresponding RLS policies.

Phase 2 should follow this implementation sequence:
1. Database foundation (fields, indexes, RLS)
2. Validation & service layer
3. API endpoints
4. UI components
5. Testing & refinement

This approach maintains consistency with the existing codebase and leverages established patterns while addressing the unique requirements of course-level publishing.

