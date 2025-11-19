'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

type OverviewType = 'general' | 'readings' | 'exercises' | 'dialogs' | 'grammar'

interface OverviewOption {
  type: OverviewType
  label: string
  description: string
  icon: string
  current: string
  enabled: boolean
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonId: string
  overviewOptions: OverviewOption[]
  onOverviewsGenerated: (overviews: Record<OverviewType, string>) => void
}

interface GenerationStatus {
  type: OverviewType
  status: 'pending' | 'generating' | 'complete' | 'error'
  result?: string
  error?: string
}

export function BatchGenerateOverviewModal({
  open,
  onOpenChange,
  lessonId,
  overviewOptions,
  onOverviewsGenerated
}: Props) {
  const [selectedTypes, setSelectedTypes] = useState<Set<OverviewType>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<GenerationStatus[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  // Enable all available options by default
  const handleSelectAll = () => {
    const availableTypes = overviewOptions.filter(opt => opt.enabled).map(opt => opt.type)
    setSelectedTypes(new Set(availableTypes))
  }

  const handleSelectNone = () => {
    setSelectedTypes(new Set())
  }

  const handleTypeToggle = (type: OverviewType) => {
    const newSelection = new Set(selectedTypes)
    if (newSelection.has(type)) {
      newSelection.delete(type)
    } else {
      newSelection.add(type)
    }
    setSelectedTypes(newSelection)
  }

  const handleGenerate = async () => {
    if (selectedTypes.size === 0) return

    setIsGenerating(true)
    setCurrentStep(0)

    // Initialize generation status
    const statusArray = Array.from(selectedTypes).map(type => ({
      type,
      status: 'pending' as const
    }))
    setGenerationProgress(statusArray)

    const results: Record<OverviewType, string> = {} as Record<OverviewType, string>

    try {
      // Generate overviews sequentially to avoid rate limits
      for (let i = 0; i < statusArray.length; i++) {
        const { type } = statusArray[i]

        // Update status to generating
        setGenerationProgress(prev => prev.map(item =>
          item.type === type ? { ...item, status: 'generating' } : item
        ))
        setCurrentStep(i + 1)

        try {
          const response = await fetch(`/api/lessons/${lessonId}/generate-overview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ overviewType: type }),
          })

          if (!response.ok) {
            throw new Error(`Failed to generate ${type} overview`)
          }

          const data = await response.json()
          results[type] = data.overview

          // Update status to complete
          setGenerationProgress(prev => prev.map(item =>
            item.type === type ? { ...item, status: 'complete', result: data.overview } : item
          ))

        } catch (error) {
          console.error(`Error generating ${type} overview:`, error)
          // Update status to error
          setGenerationProgress(prev => prev.map(item =>
            item.type === type ? {
              ...item,
              status: 'error',
              error: error instanceof Error ? error.message : 'Generation failed'
            } : item
          ))
        }

        // Add small delay between generations
        if (i < statusArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      // Call onOverviewsGenerated with all successful results
      onOverviewsGenerated(results)

      // Auto-close after success if all succeeded
      const allSuccessful = generationProgress.every(item => item.status === 'complete')
      if (allSuccessful) {
        setTimeout(() => {
          onOpenChange(false)
          handleClose()
        }, 2000)
      }

    } catch (error) {
      console.error('Batch generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    if (!isGenerating) {
      onOpenChange(false)
      setSelectedTypes(new Set())
      setGenerationProgress([])
      setCurrentStep(0)
    }
  }

  const progressPercentage = generationProgress.length > 0
    ? (generationProgress.filter(item => item.status === 'complete' || item.status === 'error').length / generationProgress.length) * 100
    : 0

  const canGenerate = selectedTypes.size > 0 && !isGenerating

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Batch Generate Overviews
          </DialogTitle>
          <DialogDescription>
            Generate multiple lesson overviews at once using AI-powered content generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selection Controls */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={isGenerating}>
                Select All Available
              </Button>
              <Button variant="outline" size="sm" onClick={handleSelectNone} disabled={isGenerating}>
                Select None
              </Button>
            </div>
            <Badge variant="secondary">
              {selectedTypes.size} selected
            </Badge>
          </div>

          {/* Overview Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Select Overviews to Generate</Label>
            <div className="grid gap-3">
              {overviewOptions.map((option) => (
                <div key={option.type} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <Checkbox
                    id={option.type}
                    checked={selectedTypes.has(option.type)}
                    onCheckedChange={() => handleTypeToggle(option.type)}
                    disabled={!option.enabled || isGenerating}
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={option.type} className="flex items-center gap-2 font-medium cursor-pointer">
                      <span>{option.icon} {option.label}</span>
                      {!option.enabled && (
                        <Badge variant="outline" className="text-xs">
                          No Content
                        </Badge>
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                    {option.current && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        Current: {option.current.substring(0, 60)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generation Progress */}
          {isGenerating && generationProgress.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Step {currentStep} of {generationProgress.length}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Generation Status</Label>
                {generationProgress.map((item) => (
                  <div key={item.type} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    {item.status === 'pending' && <div className="w-4 h-4 border border-gray-300 rounded animate-pulse" />}
                    {item.status === 'generating' && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                    {item.status === 'complete' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}

                    <span className="text-sm">
                      {overviewOptions.find(opt => opt.type === item.type)?.icon} {' '}
                      {overviewOptions.find(opt => opt.type === item.type)?.label}
                    </span>

                    {item.error && (
                      <span className="text-xs text-red-600 ml-auto">{item.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Cancel'}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="min-w-[140px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate {selectedTypes.size} Overview{selectedTypes.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}