# Epic 6: Course Management & Lesson Organization

**Status**: 📋 Planned
**Priority**: P0 - Critical
**Estimated Effort**: 10-12 story points (~16 hours)
**Dependencies**: Epic 04 (Authoring UI Core), Epic 05 (Content Builders)

---

## Overview

Enable authors to create and manage courses as organizational containers for lessons, with flexible lesson-course associations from both lesson and course UIs. Courses serve as the primary navigation structure for learners and organizational framework for authors.

**Key Architectural Decisions**:
- ✅ Lessons can exist standalone (course_id nullable)
- ✅ Course deletion orphans lessons (SET NULL, not CASCADE)
- ✅ Lesson-course ordering via junction table (supports multi-course reuse)
- ✅ No separate course publish workflow (MVP scope reduction)

---

## User Stories

### 6.1: Database Schema for Courses & Lesson Ordering (2 pts)

**As a** developer
**I want** database tables for courses and lesson-course relationships
**So that** we can organize lessons into structured learning paths

**Acceptance Criteria**:
- [ ] `courses` table already exists (per user's schema) - verify structure
- [ ] `lesson_course_ordering` junction table created for many-to-many relationship
- [ ] `lessons.course_id` column verified (nullable FK with ON DELETE SET NULL)
- [ ] Indexes created: `courses.created_by`, `lesson_course_ordering.course_id`
- [ ] RLS policies configured for courses (user isolation)
- [ ] Migration tested on local Supabase instance
- [ ] Migration runs successfully without errors

**Technical Notes**:
```sql
-- Course table already exists per user schema
-- Verify: courses { id, title, description, language, difficulty_level, created_by }

-- NEW: Junction table for lesson ordering
CREATE TABLE public.lesson_course_ordering (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: lesson can only appear once per course
  UNIQUE(course_id, lesson_id),

  -- Unique constraint: no duplicate ordering within course
  UNIQUE(course_id, display_order)
);

-- Update lessons table if needed
ALTER TABLE public.lessons
  ALTER COLUMN course_id DROP NOT NULL; -- Make nullable if not already

-- Indexes for performance
CREATE INDEX idx_lesson_course_ordering_course ON lesson_course_ordering(course_id);
CREATE INDEX idx_lesson_course_ordering_lesson ON lesson_course_ordering(lesson_id);
CREATE INDEX idx_courses_created_by ON courses(created_by);

-- RLS for lesson_course_ordering
ALTER TABLE public.lesson_course_ordering ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lesson orderings for own courses"
  ON public.lesson_course_ordering
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lesson_course_ordering.course_id
      AND courses.created_by = auth.uid()
    )
  );

-- Similar INSERT/UPDATE/DELETE policies...
```

---

### 6.2: CourseService Implementation (2 pts)

**As a** developer
**I want** a service layer for course CRUD and lesson association
**So that** we abstract database access and maintain clean architecture

**Acceptance Criteria**:
- [ ] `CourseService` class created in `lib/services/course.ts`
- [ ] `createCourse()` method inserts new course
- [ ] `getCourses()` retrieves all user's courses (sorted by created_at DESC)
- [ ] `getCourse()` retrieves single course with lesson count
- [ ] `updateCourse()` updates course metadata
- [ ] `deleteCourse()` removes course (orphans lessons)
- [ ] `addLesson()` adds lesson to course with display_order
- [ ] `removeLesson()` removes lesson from course
- [ ] `reorderLessons()` updates display_order for multiple lessons
- [ ] `getLessonsForCourse()` retrieves ordered lesson list
- [ ] All methods use Supabase RLS for security
- [ ] Unit tests written for all methods

**Technical Notes**:
```typescript
export interface Course {
  id: string
  title: string
  description: string
  language: string
  difficulty_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  created_by: string
  created_at: string
  lesson_count?: number
}

export interface CourseWithLessons extends Course {
  lessons: LessonOrderingEntry[]
}

export interface LessonOrderingEntry {
  lesson_id: string
  display_order: number
  lesson: {
    id: string
    title: string
    status: 'draft' | 'published'
    overview: string
  }
}

export class CourseService {
  static async createCourse(data: CourseInsert): Promise<Course> { }
  static async getCourses(): Promise<Course[]> { }
  static async getCourse(id: string): Promise<CourseWithLessons> { }
  static async updateCourse(id: string, data: CourseUpdate): Promise<Course> { }
  static async deleteCourse(id: string): Promise<void> { }

  // Lesson association methods
  static async addLesson(courseId: string, lessonId: string, order?: number): Promise<void> { }
  static async removeLesson(courseId: string, lessonId: string): Promise<void> { }
  static async reorderLessons(courseId: string, lessonIds: string[]): Promise<void> { }
  static async getLessonsForCourse(courseId: string): Promise<LessonOrderingEntry[]> { }
}
```

---

### 6.3: Course API Routes (2 pts)

**As a** developer
**I want** REST API endpoints for course operations
**So that** frontend can interact with course data

**Acceptance Criteria**:
- [ ] `POST /api/courses` creates new course (returns course object)
- [ ] `GET /api/courses` lists all user's courses with lesson counts
- [ ] `GET /api/courses/[id]` retrieves course details with ordered lessons
- [ ] `PUT /api/courses/[id]` updates course metadata
- [ ] `DELETE /api/courses/[id]` removes course (orphans lessons)
- [ ] `POST /api/courses/[id]/lessons` adds lesson to course
- [ ] `DELETE /api/courses/[id]/lessons/[lessonId]` removes lesson from course
- [ ] `PUT /api/courses/[id]/lessons/order` reorders lessons (accepts array)
- [ ] All routes enforce authentication
- [ ] Error responses follow standard format
- [ ] API integration tests written

**Technical Notes**:
```typescript
// POST /api/courses
{
  "title": "Beginner Spanish",
  "description": "Learn Spanish from scratch",
  "language": "es",
  "difficulty_level": "A1"
}

// PUT /api/courses/[id]/lessons/order
{
  "lesson_ids": ["lesson-1", "lesson-3", "lesson-2"] // New order
}
```

---

### 6.4: Author Dashboard Navigation (1 pt)

**As an** author
**I want** access to authoring features from main navigation
**So that** I can quickly navigate between courses and lessons

**Acceptance Criteria**:
- [ ] "Authoring" link added to main navigation (visible to all authenticated users)
- [ ] Clicking "Authoring" navigates to `/authoring` dashboard
- [ ] Dashboard shows two sections: "My Courses" and "My Lessons"
- [ ] Active nav state indicates current section
- [ ] Responsive design (mobile + desktop)
- [ ] Quick stats: total courses, total lessons, published vs draft

**UI Mockup**:
```
+------------------------------------------+
| [Logo] Home | Learn | Authoring | Profile |
+------------------------------------------+

/authoring Dashboard:
+------------------------------------------+
| Author Dashboard                          |
| ---------------------------------------- |
| 📚 My Courses (5)    📝 My Lessons (23)  |
|    ↳ Published: 3       ↳ Published: 15  |
|    ↳ Draft: 2           ↳ Draft: 8       |
|                                          |
| [+ New Course]      [+ New Lesson]       |
+------------------------------------------+
```

---

### 6.5: Course List & Create UI (2 pts)

**As an** author
**I want to** view all my courses and create new courses
**So that** I can organize my lesson content

**Acceptance Criteria**:
- [ ] `/authoring/courses` page displays all user's courses
- [ ] Each course card shows: title, description, lesson count, difficulty, language
- [ ] Course cards show draft/published status (based on lesson statuses)
- [ ] Empty state when no courses exist ("Create your first course!")
- [ ] "+ New Course" button navigates to creation form
- [ ] `/authoring/courses/new` page with form (title, description, language, difficulty)
- [ ] Form validation: required fields (title, language), max lengths
- [ ] Success message on save, redirects to course detail
- [ ] Loading states while fetching/saving
- [ ] Responsive design (mobile + desktop)

**UI Mockup**:
```
/authoring/courses:
+------------------------------------------+
| My Courses                    [+ New Course] |
| ---------------------------------------- |
| ┌──────────────────────────────────────┐ |
| │ 📚 Beginner Spanish (A1)              │ |
| │ Learn Spanish from scratch            │ |
| │ 🇪🇸 Spanish • 12 lessons • 8 published│ |
| │ [View] [Edit] [Delete]                │ |
| └──────────────────────────────────────┘ |
| ┌──────────────────────────────────────┐ |
| │ 📚 Intermediate Spanish (B1)          │ |
| │ Build on fundamentals                 │ |
| │ 🇪🇸 Spanish • 8 lessons • 5 published │ |
| │ [View] [Edit] [Delete]                │ |
| └──────────────────────────────────────┘ |
+------------------------------------------+
```

---

### 6.6: Course Detail Page with Lesson Management (3 pts)

**As an** author
**I want to** view course details and manage associated lessons
**So that** I can organize lesson sequences effectively

**Acceptance Criteria**:
- [ ] `/authoring/courses/[id]` page shows full course details
- [ ] Course metadata displayed: title, description, language, difficulty
- [ ] "Edit Course" button opens inline edit form or modal
- [ ] Ordered lesson list displayed (draggable for reordering)
- [ ] Each lesson shows: title, status badge, overview excerpt
- [ ] "Add Lessons" button opens modal with lesson selector
- [ ] Lesson selector shows all user's lessons not in this course
- [ ] Lesson selector has search/filter (by title, status)
- [ ] Drag-and-drop reordering with visual feedback
- [ ] Remove lesson from course (with confirmation)
- [ ] "Delete Course" button with confirmation modal
- [ ] Empty state when no lessons ("Add your first lesson!")
- [ ] Real-time order updates (optimistic UI)

**UI Mockup**:
```
/authoring/courses/course-123:
+------------------------------------------+
| ← Back to Courses                         |
| ---------------------------------------- |
| 📚 Beginner Spanish (A1)                  |
| Learn Spanish from scratch                |
| 🇪🇸 Spanish • 12 lessons                  |
|                                          |
| [Edit Course] [Add Lessons] [Delete]     |
| ---------------------------------------- |
| Lessons (Drag to reorder):               |
| ┌──────────────────────────────────────┐ |
| │ ≡ 1. Greetings & Introductions        │ |
| │   ✅ Published • Basic phrases...      │ |
| │   [Remove]                            │ |
| ├──────────────────────────────────────┤ |
| │ ≡ 2. Numbers & Counting               │ |
| │   📝 Draft • Learn to count...        │ |
| │   [Remove]                            │ |
| └──────────────────────────────────────┘ |
+------------------------------------------+

Add Lessons Modal:
+------------------------------------------+
| Add Lessons to Course                     |
| [Search lessons...]                       |
| ---------------------------------------- |
| ☐ 3. Colors & Adjectives (Draft)         |
| ☐ 4. Asking Questions (Published)        |
| ☐ 5. Food & Restaurants (Published)      |
|                                          |
| [Cancel] [Add Selected (3)]              |
+------------------------------------------+
```

---

### 6.7: Lesson Form Course Selector (1 pt)

**As an** author
**I want to** select a course when creating/editing a lesson
**So that** lessons are immediately organized

**Acceptance Criteria**:
- [ ] Lesson create/edit form includes "Course" dropdown field
- [ ] Dropdown shows all user's courses (sorted by title)
- [ ] Dropdown includes "(None)" option for standalone lessons
- [ ] Selected course saved with lesson
- [ ] Form shows current course if lesson already assigned
- [ ] Changing course from lesson form updates `lessons.course_id`
- [ ] Does NOT update `lesson_course_ordering` (that's course UI only)
- [ ] Field is optional (lessons can exist without course)

**Technical Notes**:
- This is a simple `course_id` FK update, NOT junction table management
- Junction table (`lesson_course_ordering`) only managed from course detail UI
- This allows quick "primary course" assignment during lesson creation

---

## Technical Specification

### Database Schema

**Migration File**: `supabase/migrations/20250109_course_management.sql`

```sql
-- Courses table already exists per user schema
-- Verify structure matches expected:
-- CREATE TABLE public.courses (
--   id TEXT PRIMARY KEY,
--   title TEXT NOT NULL,
--   description TEXT,
--   language TEXT NOT NULL,
--   difficulty_level TEXT NOT NULL,
--   created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
-- );

-- Add created_at if missing
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Create junction table for lesson ordering
CREATE TABLE public.lesson_course_ordering (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(course_id, lesson_id),
  UNIQUE(course_id, display_order)
);

-- Update lessons.course_id to be nullable with SET NULL cascade
ALTER TABLE public.lessons
  ALTER COLUMN course_id DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS lessons_course_id_fkey,
  ADD CONSTRAINT lessons_course_id_fkey
    FOREIGN KEY (course_id)
    REFERENCES public.courses(id)
    ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_lesson_course_ordering_course ON lesson_course_ordering(course_id);
CREATE INDEX idx_lesson_course_ordering_lesson ON lesson_course_ordering(lesson_id);
CREATE INDEX idx_courses_created_by ON courses(created_by);
CREATE INDEX idx_courses_created_at ON courses(created_at DESC);

-- RLS for courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own courses"
  ON public.courses FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert own courses"
  ON public.courses FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own courses"
  ON public.courses FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own courses"
  ON public.courses FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- RLS for lesson_course_ordering
ALTER TABLE public.lesson_course_ordering ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lesson orderings for own courses"
  ON public.lesson_course_ordering FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lesson_course_ordering.course_id
      AND courses.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage lesson orderings for own courses"
  ON public.lesson_course_ordering FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lesson_course_ordering.course_id
      AND courses.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lesson_course_ordering.course_id
      AND courses.created_by = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE lesson_course_ordering IS 'Many-to-many relationship for lessons in courses with ordering';
COMMENT ON COLUMN lesson_course_ordering.display_order IS 'Position of lesson within course (1-indexed)';
```

---

### Services

**`lib/services/course.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'

export interface Course {
  id: string
  title: string
  description: string
  language: string
  difficulty_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  created_by: string
  created_at: string
  lesson_count?: number
}

export interface CourseInsert {
  id?: string
  title: string
  description?: string
  language: string
  difficulty_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
}

export interface CourseUpdate {
  title?: string
  description?: string
  language?: string
  difficulty_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
}

export interface LessonOrderingEntry {
  lesson_id: string
  display_order: number
  lesson: {
    id: string
    title: string
    status: 'draft' | 'published'
    overview: string
  }
}

export interface CourseWithLessons extends Course {
  lessons: LessonOrderingEntry[]
}

export class CourseService {
  /**
   * Create a new course
   */
  static async createCourse(data: CourseInsert): Promise<Course> {
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Unauthorized')

    const courseData = {
      id: data.id || `course-${Date.now()}`,
      title: data.title,
      description: data.description || '',
      language: data.language,
      difficulty_level: data.difficulty_level,
      created_by: user.user.id
    }

    const { data: course, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single()

    if (error) throw error
    return course
  }

  /**
   * Get all courses for current user with lesson counts
   */
  static async getCourses(): Promise<Course[]> {
    const supabase = createClient()

    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        lesson_count:lesson_course_ordering(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform count to number
    return courses.map(course => ({
      ...course,
      lesson_count: course.lesson_count[0]?.count || 0
    }))
  }

  /**
   * Get single course with ordered lessons
   */
  static async getCourse(id: string): Promise<CourseWithLessons> {
    const supabase = createClient()

    // Get course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()

    if (courseError) throw courseError

    // Get ordered lessons
    const { data: orderings, error: orderError } = await supabase
      .from('lesson_course_ordering')
      .select(`
        lesson_id,
        display_order,
        lesson:lessons(id, title, status, overview)
      `)
      .eq('course_id', id)
      .order('display_order', { ascending: true })

    if (orderError) throw orderError

    return {
      ...course,
      lessons: orderings as LessonOrderingEntry[]
    }
  }

  /**
   * Update course metadata
   */
  static async updateCourse(id: string, data: CourseUpdate): Promise<Course> {
    const supabase = createClient()

    const { data: course, error } = await supabase
      .from('courses')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return course
  }

  /**
   * Delete course (orphans lessons)
   */
  static async deleteCourse(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Add lesson to course
   */
  static async addLesson(
    courseId: string,
    lessonId: string,
    order?: number
  ): Promise<void> {
    const supabase = createClient()

    // Get max order if not provided
    if (order === undefined) {
      const { data: maxOrder } = await supabase
        .from('lesson_course_ordering')
        .select('display_order')
        .eq('course_id', courseId)
        .order('display_order', { ascending: false })
        .limit(1)
        .single()

      order = (maxOrder?.display_order || 0) + 1
    }

    const { error } = await supabase
      .from('lesson_course_ordering')
      .insert({
        course_id: courseId,
        lesson_id: lessonId,
        display_order: order
      })

    if (error) throw error
  }

  /**
   * Remove lesson from course
   */
  static async removeLesson(courseId: string, lessonId: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('lesson_course_ordering')
      .delete()
      .eq('course_id', courseId)
      .eq('lesson_id', lessonId)

    if (error) throw error
  }

  /**
   * Reorder lessons in course
   * @param lessonIds Array of lesson IDs in desired order
   */
  static async reorderLessons(courseId: string, lessonIds: string[]): Promise<void> {
    const supabase = createClient()

    // Update each lesson's display_order
    const updates = lessonIds.map((lessonId, index) => ({
      course_id: courseId,
      lesson_id: lessonId,
      display_order: index + 1
    }))

    // Use upsert to update display_order
    const { error } = await supabase
      .from('lesson_course_ordering')
      .upsert(updates, { onConflict: 'course_id,lesson_id' })

    if (error) throw error
  }
}
```

---

### API Routes

**`app/api/courses/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '@/lib/services/course'

export async function GET() {
  try {
    const courses = await CourseService.getCourses()
    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Failed to fetch courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, language, difficulty_level } = body

    if (!title || !language || !difficulty_level) {
      return NextResponse.json(
        { error: 'Title, language, and difficulty are required' },
        { status: 400 }
      )
    }

    const course = await CourseService.createCourse({
      title,
      description,
      language,
      difficulty_level
    })

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Failed to create course:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
```

**`app/api/courses/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '@/lib/services/course'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const course = await CourseService.getCourse(params.id)
    return NextResponse.json({ course })
  } catch (error) {
    console.error('Failed to fetch course:', error)
    return NextResponse.json(
      { error: 'Course not found' },
      { status: 404 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const course = await CourseService.updateCourse(params.id, body)
    return NextResponse.json({ course })
  } catch (error) {
    console.error('Failed to update course:', error)
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await CourseService.deleteCourse(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete course:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
```

**`app/api/courses/[id]/lessons/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '@/lib/services/course'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { lesson_id, display_order } = body

    if (!lesson_id) {
      return NextResponse.json(
        { error: 'lesson_id is required' },
        { status: 400 }
      )
    }

    await CourseService.addLesson(params.id, lesson_id, display_order)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to add lesson to course:', error)
    return NextResponse.json(
      { error: 'Failed to add lesson to course' },
      { status: 500 }
    )
  }
}
```

**`app/api/courses/[id]/lessons/[lessonId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '@/lib/services/course'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string, lessonId: string } }
) {
  try {
    await CourseService.removeLesson(params.id, params.lessonId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove lesson from course:', error)
    return NextResponse.json(
      { error: 'Failed to remove lesson from course' },
      { status: 500 }
    )
  }
}
```

**`app/api/courses/[id]/lessons/order/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '@/lib/services/course'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { lesson_ids } = body

    if (!Array.isArray(lesson_ids)) {
      return NextResponse.json(
        { error: 'lesson_ids must be an array' },
        { status: 400 }
      )
    }

    await CourseService.reorderLessons(params.id, lesson_ids)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder lessons:', error)
    return NextResponse.json(
      { error: 'Failed to reorder lessons' },
      { status: 500 }
    )
  }
}
```

---

## Components

**File Structure**:
```
components/authoring/
├── CourseCard.tsx               # Course preview card
├── CourseForm.tsx               # Create/edit course form
├── LessonSelector.tsx           # Modal for adding lessons to course
├── DraggableLessonList.tsx      # Drag-and-drop lesson ordering
└── AuthorDashboard.tsx          # Dashboard with stats

app/authoring/
├── page.tsx                     # Author dashboard
├── courses/
│   ├── page.tsx                 # Course list
│   ├── new/page.tsx            # Create course
│   └── [id]/page.tsx           # Course detail + lesson management
└── lessons/
    ├── page.tsx                 # Lesson list (existing)
    └── [id]/page.tsx           # Lesson editor (existing - add course dropdown)
```

---

## Dependencies

- **Requires**: Epic 04 (Authoring UI), Epic 05 (Content Builders - lessons exist)
- **Enables**: Epic 07 (LLM generation can suggest course organization)

---

## Testing Checklist

- [ ] Create course from form
- [ ] Verify course saved with correct created_by (RLS)
- [ ] View all courses in list
- [ ] View single course details
- [ ] Update course metadata
- [ ] Delete course → verify lessons orphaned (course_id → NULL)
- [ ] Add lesson to course from course detail
- [ ] Remove lesson from course
- [ ] Drag-and-drop reorder lessons
- [ ] Verify display_order updates correctly
- [ ] Add lesson to multiple courses (verify junction table)
- [ ] Delete lesson → verify cascade in junction table
- [ ] Select course from lesson form dropdown
- [ ] Test RLS (users can't see other users' courses)
- [ ] Test empty states (no courses, no lessons in course)

---

## Technical Risks & Mitigations

### Risk: Ordering Conflicts During Concurrent Edits
**Issue**: Two users reordering same course simultaneously → display_order conflicts
- **Impact**: Database unique constraint violations
- **Mitigation**: Optimistic locking, display_order gaps (1, 10, 20...), conflict resolution
- **MVP Approach**: Single-author assumption (defer multi-author for later epic)

### Risk: Lesson Removal Confusion
**Issue**: Removing lesson from course vs deleting lesson entirely
- **Impact**: User accidentally deletes lesson when intending to remove from course
- **Mitigation**: Clear UI labeling ("Remove from Course" vs "Delete Lesson"), confirmation modals
- **Testing**: Verify junction table delete vs lessons table delete

### Risk: Junction Table vs course_id Confusion
**Issue**: Lesson has both `lessons.course_id` and `lesson_course_ordering` entries
- **Impact**: Data inconsistency, unclear "primary course" semantics
- **Mitigation**: Clear documentation, consider deprecating `lessons.course_id` in future
- **MVP Approach**: `lessons.course_id` is nullable "suggested course", junction table is source of truth

---

## Success Metrics

**Epic Complete When**:
- Author can create courses with metadata
- Lessons can be added/removed/reordered in courses
- Lesson form has course dropdown (optional association)
- Course detail shows ordered lesson list
- All CRUD operations work for courses
- RLS properly enforces author isolation
- Drag-and-drop lesson ordering works smoothly
