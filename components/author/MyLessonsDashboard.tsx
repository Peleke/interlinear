'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Filter, SortAsc } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LessonCard } from './LessonCard'
import { NewLessonModal } from './NewLessonModal'
import { AuthorTabNav } from './AuthorTabNav'

type LessonStatus = 'draft' | 'published' | 'archived'
type FilterType = 'all' | LessonStatus
type SortType = 'recent' | 'alphabetical' | 'course'

interface Lesson {
  id: string
  title: string
  status: LessonStatus
  language: 'es' | 'is'
  course_id: string | null
  updated_at: string
  xp_value: number
  sequence_order: number
  course?: {
    id: string
    title: string
  } | null
  dialogs: Array<{ count: number }>
  vocabulary: Array<{ count: number }>
  grammar: Array<{ count: number }>
  exercises: Array<{ count: number }>
  readings: Array<{ count: number }>
}

interface Props {
  lessons: Lesson[]
  userId: string
}

export function MyLessonsDashboard({ lessons: initialLessons, userId }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('recent')
  const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState(false)

  // Filter lessons
  const filteredLessons = initialLessons.filter((lesson) => {
    if (filter === 'all') return true
    return lesson.status === filter
  })

  // Sort lessons
  const sortedLessons = [...filteredLessons].sort((a, b) => {
    switch (sort) {
      case 'recent':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      case 'alphabetical':
        return a.title.localeCompare(b.title)
      case 'course':
        const aCourse = a.course?.title || ''
        const bCourse = b.course?.title || ''
        return aCourse.localeCompare(bCourse)
      default:
        return 0
    }
  })

  // Calculate component counts
  const getLessonCounts = (lesson: Lesson) => ({
    dialogs: lesson.dialogs[0]?.count || 0,
    vocabulary: lesson.vocabulary[0]?.count || 0,
    grammar: lesson.grammar[0]?.count || 0,
    exercises: lesson.exercises[0]?.count || 0,
    readings: lesson.readings[0]?.count || 0,
  })

  return (
    <div className="max-w-7xl mx-auto">
      {/* Tab Navigation */}
      <AuthorTabNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-sepia-900">My Lessons</h1>
          <p className="text-sepia-600 mt-1">
            Create and manage your lesson content
          </p>
        </div>
        <Button
          onClick={() => setIsNewLessonModalOpen(true)}
          size="lg"
          className="bg-sepia-700 hover:bg-sepia-800 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Lesson
        </Button>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2 flex-1">
          <Filter className="h-4 w-4 text-sepia-500" />
          <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
            <SelectTrigger className="w-[180px] bg-white border-sepia-300">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lessons</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-sepia-500" />
          <Select value={sort} onValueChange={(value) => setSort(value as SortType)}>
            <SelectTrigger className="w-[180px] bg-white border-sepia-300">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="course">By Course</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lessons Grid */}
      {sortedLessons.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-sepia-300 rounded-lg bg-white">
          <p className="text-sepia-600 mb-4">
            {filter === 'all'
              ? 'No lessons yet. Create your first lesson!'
              : `No ${filter} lessons found.`}
          </p>
          {filter === 'all' && (
            <Button
              onClick={() => setIsNewLessonModalOpen(true)}
              className="bg-sepia-700 hover:bg-sepia-800 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Lesson
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              counts={getLessonCounts(lesson)}
              onEdit={() => router.push(`/author/lessons/${lesson.id}/edit`)}
            />
          ))}
        </div>
      )}

      {/* New Lesson Modal */}
      <NewLessonModal
        open={isNewLessonModalOpen}
        onOpenChange={setIsNewLessonModalOpen}
        userId={userId}
      />
    </div>
  )
}
