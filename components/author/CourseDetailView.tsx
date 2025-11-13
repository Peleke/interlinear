'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Trash2, GripVertical, Upload, Download, BookOpen, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LessonSelectorModal } from './LessonSelectorModal'
import { EditCourseModal } from './EditCourseModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Course {
  id: string
  title: string
  description: string
  language: string
  difficulty_level: string
  created_at: string
  published_at: string | null
  published_by: string | null
  version: number
}

interface LessonOrderingEntry {
  lesson_id: string
  display_order: number
  lesson: {
    id: string
    title: string
    status: 'draft' | 'published' | 'archived'
    overview: string
  }
}

interface AvailableLesson {
  id: string
  title: string
  status: string
}

interface Props {
  course: Course
  lessons: LessonOrderingEntry[]
  availableLessons: AvailableLesson[]
}

function SortableLesson({
  lesson,
  onRemove,
}: {
  lesson: LessonOrderingEntry
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lesson.lesson_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const statusColor = {
    draft: 'bg-sepia-100 text-sepia-700',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-700',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white border border-sepia-200 rounded-md hover:shadow-sm transition-shadow"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-sepia-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sepia-900 truncate">{lesson.lesson.title}</h4>
          <Badge className={statusColor[lesson.lesson.status]}>
            {lesson.lesson.status}
          </Badge>
        </div>
        <div className="text-sm text-sepia-600 line-clamp-2 mt-1 prose prose-sm max-w-none prose-p:my-0 prose-headings:my-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {lesson.lesson.overview}
          </ReactMarkdown>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Remove</span>
      </Button>
    </div>
  )
}

export function CourseDetailView({ course, lessons: initialLessons, availableLessons }: Props) {
  const router = useRouter()
  const [lessons, setLessons] = useState(initialLessons)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isLessonSelectorOpen, setIsLessonSelectorOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l.lesson_id === active.id)
      const newIndex = lessons.findIndex((l) => l.lesson_id === over.id)

      const reorderedLessons = arrayMove(lessons, oldIndex, newIndex)
      setLessons(reorderedLessons)

      // Update server
      try {
        const response = await fetch(`/api/courses/${course.id}/lessons/order`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lesson_ids: reorderedLessons.map((l) => l.lesson_id),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to reorder lessons')
        }

        toast.success('Lesson order updated')
      } catch (error) {
        console.error('Failed to reorder lessons:', error)
        toast.error('Failed to update lesson order')
        // Revert on error
        setLessons(lessons)
      }
    }
  }

  const handleRemoveLesson = async (lessonId: string) => {
    try {
      const response = await fetch(
        `/api/courses/${course.id}/lessons/${lessonId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to remove lesson')
      }

      toast.success('Lesson removed from course')
      router.refresh()
    } catch (error) {
      console.error('Failed to remove lesson:', error)
      toast.error('Failed to remove lesson')
    }
  }

  const handleDeleteCourse = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete course')
      }

      toast.success('Course deleted')
      router.push('/author/courses')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete course:', error)
      toast.error('Failed to delete course')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handlePublishCourse = async () => {
    setIsPublishing(true)
    try {
      const response = await fetch(`/api/courses/${course.id}/publish`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to publish course')
      }

      toast.success('Course published successfully')
      router.refresh()
    } catch (error) {
      console.error('Failed to publish course:', error)
      toast.error('Failed to publish course')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUnpublishCourse = async () => {
    setIsUnpublishing(true)
    try {
      const response = await fetch(`/api/courses/${course.id}/publish`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unpublish course')
      }

      toast.success('Course unpublished successfully')
      router.refresh()
    } catch (error) {
      console.error('Failed to unpublish course:', error)
      toast.error('Failed to unpublish course')
    } finally {
      setIsUnpublishing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Author Navigation */}
      <div className="mb-6 border border-sepia-200 rounded-lg bg-background px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/author/lessons"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-sepia-700 hover:text-sepia-900 hover:bg-sepia-50 rounded-md transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>Lessons</span>
          </Link>
          <span className="text-sepia-300">•</span>
          <Link
            href="/author/courses"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-sepia-700 hover:text-sepia-900 hover:bg-sepia-50 rounded-md transition-colors"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Courses</span>
          </Link>
        </div>
      </div>

      {/* Course Header */}
      <div className="bg-white rounded-lg p-6 border border-sepia-200 shadow-sm mb-6 relative">
        <div className="mb-4">
          <div className="mb-4">
            <h1 className="text-3xl font-serif font-bold text-sepia-900 mb-2">
              {course.title}
            </h1>
            <div className="text-sepia-600 prose prose-sepia max-w-none mb-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {course.description}
              </ReactMarkdown>
            </div>

            {/* Badges below description */}
            <div className="flex gap-2 mb-4 md:mb-0">
              <Badge variant="outline">{course.difficulty_level}</Badge>
              <Badge variant="outline">{course.language.toUpperCase()}</Badge>
              <Badge variant="outline">{lessons.length} lessons</Badge>
              {course.published_at && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  Published v{course.version}
                </Badge>
              )}
            </div>
          </div>

          {/* Desktop: buttons on the right, Mobile: buttons below badges */}
          <div className="flex gap-2 md:absolute md:top-6 md:right-6">
            {course.published_at ? (
              <Button
                variant="outline"
                onClick={handleUnpublishCourse}
                disabled={isUnpublishing}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <Download className="mr-2 h-4 w-4" />
                {isUnpublishing ? 'Unpublishing...' : 'Unpublish'}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handlePublishCourse}
                disabled={isPublishing}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isPublishing ? 'Publishing...' : 'Publish'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="border-sepia-300"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Lessons Section */}
      <div className="bg-white rounded-lg p-6 border border-sepia-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-sepia-900">
            Lessons
            {lessons.length > 0 && (
              <span className="text-sm text-sepia-600 ml-2 font-normal">
                (Drag to reorder)
              </span>
            )}
          </h2>
          <Button
            onClick={() => setIsLessonSelectorOpen(true)}
            className="bg-sepia-700 hover:bg-sepia-800 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Lessons
          </Button>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-sepia-200 rounded-lg">
            <p className="text-sepia-600 mb-4">No lessons in this course yet</p>
            <Button
              onClick={() => setIsLessonSelectorOpen(true)}
              className="bg-sepia-700 hover:bg-sepia-800 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Lesson
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={lessons.map((l) => l.lesson_id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {lessons.map((lesson) => (
                  <SortableLesson
                    key={lesson.lesson_id}
                    lesson={lesson}
                    onRemove={() => handleRemoveLesson(lesson.lesson_id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Modals */}
      <EditCourseModal
        course={course}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      <LessonSelectorModal
        courseId={course.id}
        availableLessons={availableLessons}
        open={isLessonSelectorOpen}
        onOpenChange={setIsLessonSelectorOpen}
        onSuccess={() => router.refresh()}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{course.title}&rdquo;? This action
              cannot be undone. Lessons in this course will become standalone lessons.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
