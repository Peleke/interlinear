'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

interface AvailableLesson {
  id: string
  title: string
  status: string
}

interface Props {
  courseId: string
  availableLessons: AvailableLesson[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LessonSelectorModal({
  courseId,
  availableLessons,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const router = useRouter()
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const filteredLessons = availableLessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleLesson = (lessonId: string) => {
    setSelectedLessonIds((prev) =>
      prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId]
    )
  }

  const handleAddLessons = async () => {
    if (selectedLessonIds.length === 0) {
      toast.error('Please select at least one lesson')
      return
    }

    setIsAdding(true)

    try {
      // Add lessons sequentially to maintain order
      for (const lessonId of selectedLessonIds) {
        const response = await fetch(`/api/courses/${courseId}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: lessonId }),
        })

        if (!response.ok) {
          throw new Error(`Failed to add lesson ${lessonId}`)
        }
      }

      toast.success(`Added ${selectedLessonIds.length} lesson(s) to course`)
      setSelectedLessonIds([])
      setSearchQuery('')
      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error('Failed to add lessons:', error)
      toast.error('Failed to add lessons. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Lessons to Course</DialogTitle>
          <DialogDescription>
            Select lessons to add to this course
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sepia-500" />
          <Input
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lesson List */}
        <div className="flex-1 overflow-y-auto border border-sepia-200 rounded-md p-4 space-y-2 min-h-[200px] max-h-[400px]">
          {filteredLessons.length === 0 ? (
            <div className="text-center py-8 text-sepia-600">
              {availableLessons.length === 0
                ? 'No lessons available. All lessons are already in this course.'
                : 'No lessons match your search.'}
            </div>
          ) : (
            filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-start gap-3 p-3 hover:bg-sepia-50 rounded-md cursor-pointer"
                onClick={() => toggleLesson(lesson.id)}
              >
                <Checkbox
                  checked={selectedLessonIds.includes(lesson.id)}
                  onCheckedChange={() => toggleLesson(lesson.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sepia-900 truncate">
                      {lesson.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        lesson.status === 'published'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-sepia-50 text-sepia-700 border-sepia-200'
                      }
                    >
                      {lesson.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button onClick={handleAddLessons} disabled={isAdding || selectedLessonIds.length === 0}>
            {isAdding
              ? 'Adding...'
              : `Add ${selectedLessonIds.length} Lesson${selectedLessonIds.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
