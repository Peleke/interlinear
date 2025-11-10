'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CourseCard } from './CourseCard'
import { NewCourseModal } from './NewCourseModal'
import { AuthorTabNav } from './AuthorTabNav'

interface Course {
  id: string
  title: string
  description: string
  language: string
  difficulty_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  created_by: string
  created_at: string
  lesson_count?: number
}

interface Props {
  courses: Course[]
  userId: string
}

export function MyCoursesDashboard({ courses: initialCourses, userId }: Props) {
  const router = useRouter()
  const [isNewCourseModalOpen, setIsNewCourseModalOpen] = useState(false)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Tab Navigation */}
      <AuthorTabNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-sepia-900">My Courses</h1>
          <p className="text-sepia-600 mt-1">
            Create and manage your course content
          </p>
        </div>
        <Button
          onClick={() => setIsNewCourseModalOpen(true)}
          size="lg"
          className="bg-sepia-700 hover:bg-sepia-800 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Button>
      </div>

      {/* Courses Grid */}
      {initialCourses.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-sepia-300 rounded-lg bg-white">
          <p className="text-sepia-600 mb-4">
            No courses yet. Create your first course!
          </p>
          <Button
            onClick={() => setIsNewCourseModalOpen(true)}
            className="bg-sepia-700 hover:bg-sepia-800 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onView={() => router.push(`/author/courses/${course.id}`)}
            />
          ))}
        </div>
      )}

      {/* New Course Modal */}
      <NewCourseModal
        open={isNewCourseModalOpen}
        onOpenChange={setIsNewCourseModalOpen}
        userId={userId}
      />
    </div>
  )
}
