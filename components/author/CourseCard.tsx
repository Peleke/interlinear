'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  GraduationCap,
  MoreVertical,
  Edit,
  Trash2,
  Globe2,
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  difficulty_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  created_at: string
  lesson_count?: number
}

interface Props {
  course: Course
  onView: () => void
}

const languageLabels: Record<string, string> = {
  es: '🇪🇸 Spanish',
  is: '🇮🇸 Icelandic',
}

export function CourseCard({ course, onView }: Props) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete course')
      }

      // Refresh the page to update the list
      router.refresh()
    } catch (error) {
      console.error('Error deleting course:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Card
        className="hover:shadow-lg transition-shadow cursor-pointer bg-white border-sepia-200"
        onClick={onView}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate text-sepia-900">
                {course.title}
              </h3>
              <p className="text-sm text-sepia-600 truncate line-clamp-2 mt-1">
                {course.description}
              </p>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onView}>
                    <Edit className="mr-2 h-4 w-4" />
                    View & Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-sepia-50">
              {course.difficulty_level}
            </Badge>
            <Badge variant="outline" className="bg-sepia-50">
              <Globe2 className="mr-1 h-3 w-3" />
              {languageLabels[course.language] || course.language}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="flex items-center gap-2 text-sm text-sepia-700">
            <GraduationCap className="h-4 w-4 text-sepia-500" />
            <span>
              {course.lesson_count || 0} {course.lesson_count === 1 ? 'lesson' : 'lessons'}
            </span>
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t border-sepia-200">
          <div className="flex justify-between items-center w-full text-sm">
            <span className="text-sepia-600">
              Created {formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}
            </span>
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{course.title}&rdquo;? This action cannot be undone.
              Lessons in this course will become standalone lessons.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
