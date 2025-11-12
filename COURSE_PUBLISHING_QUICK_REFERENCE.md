# Course Publishing - Quick Reference Guide

## Files to Create (Phase 2)

### 1. Database Migration
**File:** `/supabase/migrations/20251113_add_course_publishing.sql`
```sql
-- Add publishing fields to courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_courses_published_at 
  ON public.courses(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_author_id ON public.courses(created_by);

-- Add RLS policies (see full migration file for details)
```

### 2. Validation Service
**File:** `/lib/validation/course-publish-validator.ts`
```typescript
interface CourseForValidation {
  id: string
  title: string
  description: string
  language: string
  difficulty_level: string
  created_by: string
  lessons: LessonOrderingEntry[]
}

interface ValidationReport {
  summary: {
    canPublish: boolean
    errors: string[]
    warnings: string[]
  }
  details: {
    metadata: ValidationStatus
    structure: ValidationStatus
    content: ValidationStatus
  }
}

export function validateCourseForPublish(course: CourseForValidation): ValidationReport {
  // Implementation similar to lesson validator
}
```

### 3. Service Layer Extension
**File:** `/lib/services/course.ts` - Add these methods:
```typescript
class CourseService {
  static async publishCourse(id: string): Promise<Course>
  static async unpublishCourse(id: string): Promise<Course>
  static async validateCourse(id: string): Promise<ValidationReport>
}
```

### 4. API Endpoints

**File:** `/app/api/courses/[id]/preview/route.ts`
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Returns full course with all lessons, exercises, grammar
  // Author-only access
}
```

**File:** `/app/api/courses/[id]/publish/route.ts`
```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Validates and publishes course
  // Updates published_at, published_by, version
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Unpublishes course
  // Resets published_at to null
}
```

### 5. UI Components

**File:** `/components/author/CoursePublishModal.tsx`
```typescript
interface CoursePublishModal {
  courseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onPublished: (course: Course) => void
}
// Shows validation status, lesson list, publish button
```

**File:** `/components/author/CoursePreviewModal.tsx`
```typescript
interface CoursePreviewModal {
  courseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}
// Full course preview with all content
```

## Files to Modify (Phase 2)

### 1. Course Detail View
**File:** `/components/author/CourseDetailView.tsx`
- Add publish button (if unpublished)
- Add unpublish button (if published)
- Add preview button
- Show "Published" badge
- Disable editing if published

### 2. Course Card
**File:** `/components/author/CourseCard.tsx`
- Show published status badge
- Show publication date
- Show version number

## Reference Implementations (Phase 1)

### Database Pattern
- `/supabase/migrations/20251112_add_published_lesson_fields.sql`

### Validation Pattern
- `/lib/validation/lesson-publish-validator.ts` (150+ lines)
- Validation structure: metadata, content, relationships

### API Pattern
- `/app/api/lessons/[lessonId]/publish/route.ts` (230+ lines)
- Pattern: Authorization → Validation → Database update → Response

### Modal Pattern
- `/components/author/LessonPreviewModal.tsx` (180+ lines)
- Pattern: Fetch data → Render content → Handle close

### Service Pattern
- `/lib/services/course.ts` (260+ lines)
- Static methods using Supabase client

---

## Validation Rules

Course can be published if:
1. **Metadata:**
   - Title is present and non-empty
   - Description is present and non-empty
   - Language is set
   - Difficulty level is set

2. **Structure:**
   - At least 1 lesson in course
   - All lessons have valid display_order
   - No gaps in ordering sequence

3. **Lessons:**
   - ALL lessons are published (published_at IS NOT NULL)
   - Each lesson has required content:
     - Title and overview
     - At least 1 exercise
     - Vocabulary items (if applicable)
     - Grammar concepts (if applicable)

4. **Data Integrity:**
   - No orphaned references
   - All foreign keys valid

---

## RLS Policies to Add

```sql
-- Authors can view all their courses
CREATE POLICY "Authors can view all their courses" ON public.courses
  FOR SELECT
  USING (created_by = auth.uid());

-- Learners can view only published courses
CREATE POLICY "Learners can view published courses" ON public.courses
  FOR SELECT
  USING (published_at IS NOT NULL AND created_by != auth.uid());

-- Authors can edit only unpublished courses
CREATE POLICY "Authors can edit their own unpublished courses" ON public.courses
  FOR UPDATE
  USING (created_by = auth.uid() AND published_at IS NULL)
  WITH CHECK (created_by = auth.uid() AND published_at IS NULL);

-- Authors can delete only unpublished courses
CREATE POLICY "Authors can delete their own unpublished courses" ON public.courses
  FOR DELETE
  USING (created_by = auth.uid() AND published_at IS NULL);

-- Authors can insert courses
CREATE POLICY "Authors can insert courses" ON public.courses
  FOR INSERT
  WITH CHECK (created_by = auth.uid());
```

---

## Key Constraints

1. **Cannot edit published course**: Editing requires unpublishing first
2. **Cannot reorder published course**: Lesson order is locked on publish
3. **Cannot publish incomplete course**: At least 1 lesson required
4. **All lessons must be published**: Cannot publish course with draft lessons
5. **Version increments**: Each publish increments version number

---

## Implementation Checklist

- [ ] Database migration (schema + RLS)
- [ ] course-publish-validator.ts
- [ ] CourseService.publishCourse()
- [ ] CourseService.unpublishCourse()
- [ ] /api/courses/[id]/preview/route.ts
- [ ] /api/courses/[id]/publish/route.ts
- [ ] CoursePublishModal.tsx
- [ ] CoursePreviewModal.tsx
- [ ] Update CourseDetailView.tsx
- [ ] Update CourseCard.tsx
- [ ] Unit tests for validator
- [ ] Integration tests for API
- [ ] E2E tests for workflow

---

## Related Code Sizes (Estimation)

| Component | Lines | Complexity |
|-----------|-------|-----------|
| Migration | 60-80 | Low |
| Validator | 150-200 | Medium |
| Service methods | 50-80 | Medium |
| API endpoints | 300-400 | Medium-High |
| Modals | 400-500 | High |
| Updates | 50-100 | Low |
| Tests | 400-600 | High |

**Total implementation: ~1800-2500 lines**

---

## Testing Strategy

1. **Unit Tests**: Validator logic with various course states
2. **Integration Tests**: API endpoints with RLS policies
3. **E2E Tests**: Complete publish/unpublish workflow
4. **Edge Cases**: Empty courses, unpublished lessons, reordering

---

## Performance Targets

- Preview endpoint: < 500ms (fetches all course data)
- Publish operation: < 500ms (validate + update)
- List published courses: < 1000ms (pagination)

---

## Security Checklist

- [ ] RLS policies prevent learner editing
- [ ] RLS policies prevent viewing unpublished courses
- [ ] Authorization checks in API endpoints
- [ ] Validation prevents invalid states
- [ ] Unpublished course data not exposed in queries

