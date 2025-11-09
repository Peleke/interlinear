'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  Book,
  MessageSquare,
  BookOpen,
  GraduationCap,
  Target,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
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

type LessonStatus = 'draft' | 'published' | 'archived'

interface Lesson {
  id: string
  title: string
  status: LessonStatus
  language: 'es' | 'is'
  course_id: string | null
  updated_at: string
  xp_value: number
  course?: {
    id: string
    title: string
  } | null
}

interface ComponentCounts {
  dialogs: number
  vocabulary: number
  grammar: number
  exercises: number
  readings: number
}

interface Props {
  lesson: Lesson
  counts: ComponentCounts
  onEdit: () => void
}

const statusConfig: Record<
  LessonStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  published: { label: 'Published', variant: 'default' },
  archived: { label: 'Archived', variant: 'outline' },
}

export function LessonCard({ lesson, counts, onEdit }: Props) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete lesson')
      }

      // Refresh the page to update the list
      router.refresh()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      // TODO: Show error toast
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleArchive = async () => {
    try {
      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })

      if (!response.ok) {
        throw new Error('Failed to archive lesson')
      }

      router.refresh()
    } catch (error) {
      console.error('Error archiving lesson:', error)
      // TODO: Show error toast
    }
  }

  const totalComponents =
    counts.dialogs + counts.vocabulary + counts.grammar + counts.exercises + counts.readings

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{lesson.title}</h3>
              {lesson.course && (
                <p className="text-sm text-muted-foreground truncate">
                  {lesson.course.title}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {lesson.status !== 'archived' && (
                  <DropdownMenuItem onClick={handleArchive}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                  disabled={lesson.status === 'published'}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant={statusConfig[lesson.status].variant}>
              {statusConfig[lesson.status].label}
            </Badge>
            <Badge variant="outline">{lesson.language.toUpperCase()}</Badge>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {/* Component Counts */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>
                {counts.dialogs} {counts.dialogs === 1 ? 'dialog' : 'dialogs'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Book className="h-4 w-4 text-muted-foreground" />
              <span>{counts.vocabulary} vocab</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span>{counts.grammar} grammar</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>{counts.exercises} exercises</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{counts.readings} readings</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs">
                {totalComponents} total {totalComponents === 1 ? 'component' : 'components'}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t">
          <div className="flex justify-between items-center w-full text-sm text-muted-foreground">
            <span>{lesson.xp_value} XP</span>
            <span>Updated {formatDistanceToNow(new Date(lesson.updated_at), { addSuffix: true })}</span>
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{lesson.title}"? This action cannot be undone.
              {lesson.status === 'published' && (
                <span className="block mt-2 text-destructive font-medium">
                  Published lessons cannot be deleted. Archive it first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={lesson.status === 'published' || isDeleting}
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
