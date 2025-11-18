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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2, Copy, Replace, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'

type OverviewType = 'general' | 'readings' | 'exercises' | 'dialogs' | 'grammar'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonId: string
  currentOverview: string
  overviewType: OverviewType
  onOverviewGenerated: (overview: string) => void
}

const overviewTypeOptions = [
  {
    value: 'general' as OverviewType,
    label: '📖 General Lesson Overview',
    description: 'Overall lesson introduction and structure'
  },
  {
    value: 'readings' as OverviewType,
    label: '📚 Interactive Readings Overview',
    description: 'Description of reading activities and benefits'
  },
  {
    value: 'exercises' as OverviewType,
    label: '✏️ Exercises Overview',
    description: 'Information about practice exercises'
  },
  {
    value: 'dialogs' as OverviewType,
    label: '💬 Dialogs Overview',
    description: 'Overview of conversation practice'
  },
  {
    value: 'grammar' as OverviewType,
    label: '📝 Grammar Concepts Overview',
    description: 'Grammar section introduction'
  }
]

export function GenerateOverviewModal({
  open,
  onOpenChange,
  lessonId,
  currentOverview,
  overviewType,
  onOverviewGenerated
}: Props) {
  const [selectedType, setSelectedType] = useState<OverviewType>(overviewType)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOverview, setGeneratedOverview] = useState('')
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError('')
    setGeneratedOverview('')

    try {
      const response = await fetch(`/api/lessons/${lessonId}/generate-overview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          overviewType: selectedType
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate overview')
      }

      const data = await response.json()
      setGeneratedOverview(data.overview)
    } catch (err) {
      console.error('Overview generation error:', err)
      setError('Failed to generate overview. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUse = (mode: 'replace' | 'append') => {
    const finalOverview = mode === 'replace'
      ? generatedOverview
      : currentOverview + (currentOverview ? '\n\n' : '') + generatedOverview

    onOverviewGenerated(finalOverview)
    onOpenChange(false)
    setGeneratedOverview('')
  }

  const handleClose = () => {
    onOpenChange(false)
    setGeneratedOverview('')
    setError('')
    setShowPreview(false)
  }

  const selectedOption = overviewTypeOptions.find(opt => opt.value === selectedType)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Generate Overview with AI
          </DialogTitle>
          <DialogDescription>
            Create engaging markdown overviews based on your lesson content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Type Selection */}
          <div className="space-y-2">
            <Label>Overview Type</Label>
            <Select
              value={selectedType}
              onValueChange={(value: OverviewType) => {
                setSelectedType(value)
                setGeneratedOverview('')
                setError('')
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {overviewTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOption && (
              <div className="text-sm text-muted-foreground">
                {selectedOption.description}
              </div>
            )}
          </div>

          {/* Current Overview Preview */}
          {currentOverview && (
            <div className="space-y-2">
              <Label>Current Overview</Label>
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <div className="font-mono text-muted-foreground mb-2">Current content:</div>
                <div className="line-clamp-4">
                  {currentOverview.substring(0, 200)}
                  {currentOverview.length > 200 && '...'}
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="lg"
              className="px-8"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate {selectedOption?.label.replace(/^[📖📚✏️💬📝]\s+/, '')}
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Generated Overview */}
          {generatedOverview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Generated Overview</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
                    {showPreview ? 'Edit' : 'Preview'}
                  </Button>
                  <Badge variant="secondary" className="text-xs">
                    AI Generated • Markdown Supported
                  </Badge>
                </div>
              </div>

              {showPreview ? (
                <div className="border rounded-md p-4 bg-muted/10 min-h-[200px]">
                  <div className="prose prose-sepia max-w-none text-sm">
                    <ReactMarkdown>{generatedOverview}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <Textarea
                  value={generatedOverview}
                  onChange={(e) => setGeneratedOverview(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Generated overview will appear here..."
                />
              )}

              <div className="flex gap-2 justify-between">
                <div className="text-xs text-muted-foreground">
                  {showPreview
                    ? 'Showing markdown preview. Click "Edit" to modify the content.'
                    : 'Raw markdown content. Click "Preview" to see how it will look.'
                  }
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleUse('append')}
                    size="sm"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Append to Current
                  </Button>
                  <Button
                    onClick={() => handleUse('replace')}
                    size="sm"
                  >
                    <Replace className="mr-2 h-4 w-4" />
                    Replace Current
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}