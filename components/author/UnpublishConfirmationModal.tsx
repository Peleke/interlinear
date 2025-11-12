'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface UnpublishConfirmationModalProps {
  lessonId: string
  lessonTitle: string
  isOpen: boolean
  onClose: () => void
  onUnpublishSuccess: () => void
}

export default function UnpublishConfirmationModal({
  lessonId,
  lessonTitle,
  isOpen,
  onClose,
  onUnpublishSuccess
}: UnpublishConfirmationModalProps) {
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleUnpublish = async () => {
    setIsUnpublishing(true)
    setError(null)

    try {
      const response = await fetch(`/api/lessons/${lessonId}/publish`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unpublish lesson')
      }

      // Success!
      toast.success('Lesson unpublished successfully', {
        description: 'The lesson is no longer visible to learners.',
        duration: 4000
      })

      // Refresh data and close modal
      router.refresh()
      onUnpublishSuccess()
      onClose()

    } catch (error) {
      console.error('Unpublish error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to unpublish lesson'
      setError(errorMessage)
      toast.error(`Unpublish failed: ${errorMessage}`)
    } finally {
      setIsUnpublishing(false)
    }
  }

  const handleClose = () => {
    if (!isUnpublishing) {
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-red-500" />
            Unpublish Lesson
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to unpublish "{lessonTitle}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex p-4 rounded-lg border border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <strong>This action will:</strong>
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Remove the lesson from learner course views</li>
                <li>Make the lesson inaccessible to students</li>
                <li>Allow you to edit the lesson again</li>
              </ul>
            </div>
          </div>

          {error && (
            <div className="flex p-4 rounded-lg border border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUnpublishing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnpublish}
              disabled={isUnpublishing}
            >
              {isUnpublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unpublishing...
                </>
              ) : (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Unpublish Lesson
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}