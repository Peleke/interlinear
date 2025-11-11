'use client'

/**
 * ContentGenerationButton
 *
 * Triggers AI content generation workflow for lesson authoring
 * Shows progress and opens review modal when complete
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { VocabularyReviewModal } from './VocabularyReviewModal'
import { toast } from 'sonner'
import type { VocabularyItem } from '@/lib/content-generation/tools/extract-vocabulary'

interface ContentGenerationButtonProps {
  lessonId: string
  readingText: string
  targetLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  language?: 'es' | 'la'
  onComplete?: () => void
  disabled?: boolean
}

export function ContentGenerationButton({
  lessonId,
  readingText,
  targetLevel,
  language = 'es',
  onComplete,
  disabled = false,
}: ContentGenerationButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [showReviewModal, setShowReviewModal] = useState(false)

  const handleGenerate = async () => {
    if (!readingText || readingText.trim().length === 0) {
      toast.error('Please add reading text first')
      return
    }

    try {
      setIsGenerating(true)
      toast.info('Generating vocabulary...')

      // Call workflow API
      const response = await fetch('/api/workflows/content-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          readingText,
          targetLevel,
          language,
          maxVocabularyItems: 20,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Generation failed')
      }

      const result = await response.json()

      if (result.status === 'completed' && result.vocabulary.length > 0) {
        setVocabulary(result.vocabulary)
        setShowReviewModal(true)
        toast.success(
          `Generated ${result.vocabulary.length} vocabulary items in ${(result.metadata.executionTime / 1000).toFixed(1)}s`
        )
      } else if (result.status === 'failed') {
        throw new Error('Vocabulary extraction failed')
      } else {
        toast.warning('No vocabulary items extracted')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate content'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApproveAll = async (approved: VocabularyItem[]) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/vocabulary/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vocabulary: approved,
          language,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save vocabulary')
      }

      const result = await response.json()
      toast.success(`Saved ${result.count} vocabulary items to lesson`)

      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Approval error:', error)
      throw error // Re-throw to let modal handle it
    }
  }

  const handleRegenerate = async () => {
    // Close modal and regenerate
    setShowReviewModal(false)
    await handleGenerate()
  }

  return (
    <>
      <Button
        onClick={handleGenerate}
        disabled={disabled || isGenerating}
        size="default"
        variant="outline"
        className="px-4 py-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Vocabulary
          </>
        )}
      </Button>

      <VocabularyReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        vocabulary={vocabulary}
        lessonId={lessonId}
        onApproveAll={handleApproveAll}
        onRegenerate={handleRegenerate}
      />
    </>
  )
}
