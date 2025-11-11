'use client'

/**
 * VocabularyReviewModal
 *
 * Modal for reviewing and approving generated vocabulary
 * Features: bulk actions, individual editing, regenerate all, checkpoint
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VocabularyReviewCard } from './VocabularyReviewCard'
import { CheckCircle2, XCircle, RotateCcw, Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { VocabularyItem } from '@/lib/content-generation/tools/extract-vocabulary'

interface VocabularyReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vocabulary: VocabularyItem[]
  lessonId: string
  onApproveAll: (approved: VocabularyItem[]) => Promise<void>
  onRegenerate?: () => Promise<void>
  onCheckpoint?: () => Promise<void>
}

export function VocabularyReviewModal({
  open,
  onOpenChange,
  vocabulary: initialVocabulary,
  lessonId,
  onApproveAll,
  onRegenerate,
  onCheckpoint,
}: VocabularyReviewModalProps) {
  const [vocabulary, setVocabulary] = useState(initialVocabulary)
  const [approvedWords, setApprovedWords] = useState<Set<string>>(new Set())
  const [rejectedWords, setRejectedWords] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Update vocabulary when prop changes
  useState(() => {
    setVocabulary(initialVocabulary)
  })

  const handleApprove = useCallback((item: VocabularyItem) => {
    setApprovedWords((prev) => new Set(prev).add(item.word))
    setRejectedWords((prev) => {
      const next = new Set(prev)
      next.delete(item.word)
      return next
    })
  }, [])

  const handleReject = useCallback((word: string) => {
    setRejectedWords((prev) => new Set(prev).add(word))
    setApprovedWords((prev) => {
      const next = new Set(prev)
      next.delete(word)
      return next
    })
  }, [])

  const handleUpdate = useCallback((updatedItem: VocabularyItem) => {
    setVocabulary((prev) =>
      prev.map((item) =>
        item.word === updatedItem.word ? updatedItem : item
      )
    )
    toast.success('Vocabulary item updated')
  }, [])

  const handleRegenerateItem = useCallback(async (word: string) => {
    // TODO: Implement single item regeneration
    toast.info(`Regenerating "${word}"...`)
  }, [])

  const handleRegenerateAll = useCallback(async () => {
    if (!onRegenerate) return

    try {
      setIsRegenerating(true)
      await onRegenerate()
      toast.success('Vocabulary regenerated successfully')
    } catch (error) {
      console.error('Regenerate failed:', error)
      toast.error('Failed to regenerate vocabulary')
    } finally {
      setIsRegenerating(false)
    }
  }, [onRegenerate])

  const handleApproveAll = useCallback(async () => {
    const approvedItems = vocabulary.filter((item) =>
      approvedWords.has(item.word)
    )

    if (approvedItems.length === 0) {
      toast.error('Please approve at least one vocabulary item')
      return
    }

    try {
      setIsSubmitting(true)
      await onApproveAll(approvedItems)
      toast.success(`Approved ${approvedItems.length} vocabulary items`)
      onOpenChange(false)
    } catch (error) {
      console.error('Approval failed:', error)
      toast.error('Failed to save vocabulary')
    } finally {
      setIsSubmitting(false)
    }
  }, [vocabulary, approvedWords, onApproveAll, onOpenChange])

  const handleQuickApproveAll = useCallback(() => {
    const allWords = new Set(vocabulary.map((item) => item.word))
    setApprovedWords(allWords)
    setRejectedWords(new Set())
    toast.success('All items approved')
  }, [vocabulary])

  const handleCheckpoint = useCallback(async () => {
    if (!onCheckpoint) return

    try {
      await onCheckpoint()
      toast.success('Progress saved')
      onOpenChange(false)
    } catch (error) {
      console.error('Checkpoint failed:', error)
      toast.error('Failed to save progress')
    }
  }, [onCheckpoint, onOpenChange])

  const approvedCount = approvedWords.size
  const rejectedCount = rejectedWords.size
  const pendingCount = vocabulary.length - approvedCount - rejectedCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Vocabulary</DialogTitle>
          <DialogDescription>
            Review and edit the extracted vocabulary items. Approve items to add
            them to your lesson.
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="flex gap-4 py-3 border-y">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">
              Approved: {approvedCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium">
              Rejected: {rejectedCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium">
              Pending: {pendingCount}
            </span>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleQuickApproveAll}
            disabled={isSubmitting || isRegenerating}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Approve All
          </Button>
          {onRegenerate && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerateAll}
              disabled={isSubmitting || isRegenerating}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {isRegenerating ? 'Regenerating...' : 'Regenerate All'}
            </Button>
          )}
          {onCheckpoint && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckpoint}
              disabled={isSubmitting || isRegenerating}
            >
              <Save className="h-4 w-4 mr-1" />
              Save & Exit
            </Button>
          )}
        </div>

        {/* Vocabulary Cards */}
        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {vocabulary.map((item) => (
            <VocabularyReviewCard
              key={item.word}
              item={item}
              onApprove={handleApprove}
              onReject={handleReject}
              onUpdate={handleUpdate}
              onRegenerate={handleRegenerateItem}
              isApproved={approvedWords.has(item.word)}
              isRejected={rejectedWords.has(item.word)}
              disabled={isSubmitting || isRegenerating}
            />
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApproveAll}
            disabled={isSubmitting || approvedCount === 0}
          >
            {isSubmitting ? 'Saving...' : `Approve ${approvedCount} Items`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
