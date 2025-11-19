'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, Wand2 } from 'lucide-react'
import { GenerateOverviewModal } from './GenerateOverviewModal'
import { BatchGenerateOverviewModal } from './BatchGenerateOverviewModal'

interface Course {
  id: string
  title: string
}

interface MetadataValues {
  title: string
  language: 'es' | 'la'
  overview: string
  readings_overview: string
  exercises_overview: string
  dialogs_overview: string
  grammar_overview: string
  course_id: string | null
  xp_value: number
  sequence_order: number
}

interface Props {
  values: MetadataValues
  onChange: (values: Partial<MetadataValues>) => void
  lessonId: string
}

export function MetadataPanel({ values, onChange, lessonId }: Props) {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateModalType, setGenerateModalType] = useState<'general' | 'readings' | 'exercises' | 'dialogs' | 'grammar'>('general')
  const [currentOverview, setCurrentOverview] = useState('')
  const [showBatchModal, setShowBatchModal] = useState(false)

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data) => {
        setCourses(data?.courses || [])
        setIsLoadingCourses(false)
      })
      .catch((err) => {
        console.error('Failed to fetch courses:', err)
        setIsLoadingCourses(false)
      })
  }, [])

  const handleGenerateOverview = (
    type: 'general' | 'readings' | 'exercises' | 'dialogs' | 'grammar',
    current: string
  ) => {
    setGenerateModalType(type)
    setCurrentOverview(current)
    setShowGenerateModal(true)
  }

  const handleOverviewGenerated = (generatedOverview: string) => {
    switch (generateModalType) {
      case 'general':
        onChange({ overview: generatedOverview })
        break
      case 'readings':
        onChange({ readings_overview: generatedOverview })
        break
      case 'exercises':
        onChange({ exercises_overview: generatedOverview })
        break
      case 'dialogs':
        onChange({ dialogs_overview: generatedOverview })
        break
      case 'grammar':
        onChange({ grammar_overview: generatedOverview })
        break
    }
  }

  const handleBatchOverviewsGenerated = (overviews: Record<string, string>) => {
    const updates: Partial<MetadataValues> = {}

    if (overviews.general) updates.overview = overviews.general
    if (overviews.readings) updates.readings_overview = overviews.readings
    if (overviews.exercises) updates.exercises_overview = overviews.exercises
    if (overviews.dialogs) updates.dialogs_overview = overviews.dialogs
    if (overviews.grammar) updates.grammar_overview = overviews.grammar

    onChange(updates)
  }

  // Define overview options for batch generation
  const overviewOptions = [
    {
      type: 'general' as const,
      label: 'General Lesson Overview',
      description: 'Overall lesson introduction and structure',
      icon: '📖',
      current: values.overview,
      enabled: true
    },
    {
      type: 'readings' as const,
      label: 'Interactive Readings Overview',
      description: 'Description of reading activities and benefits',
      icon: '📚',
      current: values.readings_overview,
      enabled: true
    },
    {
      type: 'exercises' as const,
      label: 'Exercises Overview',
      description: 'Information about practice exercises',
      icon: '✏️',
      current: values.exercises_overview,
      enabled: true
    },
    {
      type: 'dialogs' as const,
      label: 'Dialogs Overview',
      description: 'Overview of conversation practice',
      icon: '💬',
      current: values.dialogs_overview,
      enabled: true
    },
    {
      type: 'grammar' as const,
      label: 'Grammar Concepts Overview',
      description: 'Grammar section introduction',
      icon: '📝',
      current: values.grammar_overview,
      enabled: true
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Lesson Metadata</h2>
        <p className="text-muted-foreground">
          Basic information about your lesson
        </p>
      </div>

      <div className="space-y-4 max-w-2xl">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={values.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g., At the Restaurant"
          />
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select
            value={values.language}
            onValueChange={(value: 'es' | 'la') => onChange({ language: value })}
          >
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Spanish (ES)</SelectItem>
              <SelectItem value="la">Latin (LA)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Course */}
        <div className="space-y-2">
          <Label htmlFor="course">Course (Optional)</Label>
          <Select
            value={values.course_id || 'none'}
            onValueChange={(value) =>
              onChange({ course_id: value === 'none' ? null : value })
            }
            disabled={isLoadingCourses}
          >
            <SelectTrigger id="course">
              <SelectValue
                placeholder={
                  isLoadingCourses ? 'Loading courses...' : 'No course'
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No course</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sequence Order */}
        <div className="space-y-2">
          <Label htmlFor="sequence_order">Sequence Order</Label>
          <Input
            id="sequence_order"
            type="number"
            min={0}
            value={values.sequence_order}
            onChange={(e) =>
              onChange({ sequence_order: parseInt(e.target.value) || 0 })
            }
          />
          <p className="text-xs text-muted-foreground">
            Display order within the course (0 = first)
          </p>
        </div>

        {/* Section Overviews */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Lesson & Section Overviews</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add descriptions for the lesson and individual sections (all support Markdown)
            </p>
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBatchModal(true)}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Batch Generate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateOverview('general', values.overview)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Overview
              </Button>
            </div>
          </div>

          {/* General Lesson Overview */}
          <div className="space-y-2">
            <Label htmlFor="overview">
              📖 General Lesson Overview
              <span className="text-sm text-muted-foreground ml-2">
                (Markdown supported)
              </span>
            </Label>
            <Textarea
              id="overview"
              value={values.overview}
              onChange={(e) => onChange({ overview: e.target.value })}
              placeholder="Describe what students will learn in this lesson..."
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This overview appears at the top of the lesson. Use **bold**, *italic*, and `code` for formatting
            </p>
          </div>

          {/* Readings Overview */}
          <div className="space-y-2">
            <Label htmlFor="readings_overview">
              📚 Interactive Readings Overview
              <span className="text-sm text-muted-foreground ml-2">
                (Optional, Markdown supported)
              </span>
            </Label>
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGenerateOverview('readings', values.readings_overview)}
                className="h-6 w-6 p-0"
                title="Generate readings overview"
              >
                <Sparkles className="h-3 w-3" />
              </Button>
              <span className="text-xs text-muted-foreground">Click to generate with AI</span>
            </div>
            <Textarea
              id="readings_overview"
              value={values.readings_overview}
              onChange={(e) => onChange({ readings_overview: e.target.value })}
              placeholder="e.g., Practice reading comprehension with these interactive texts..."
              rows={3}
              className="font-mono text-sm"
            />
          </div>

          {/* Exercises Overview */}
          <div className="space-y-2">
            <Label htmlFor="exercises_overview">
              ✏️ Exercises Overview
              <span className="text-sm text-muted-foreground ml-2">
                (Optional, Markdown supported)
              </span>
            </Label>
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGenerateOverview('exercises', values.exercises_overview)}
                className="h-6 w-6 p-0"
                title="Generate exercises overview"
              >
                <Sparkles className="h-3 w-3" />
              </Button>
              <span className="text-xs text-muted-foreground">Click to generate with AI</span>
            </div>
            <Textarea
              id="exercises_overview"
              value={values.exercises_overview}
              onChange={(e) => onChange({ exercises_overview: e.target.value })}
              placeholder="e.g., Test your understanding with these practice exercises..."
              rows={3}
              className="font-mono text-sm"
            />
          </div>

          {/* Dialogs Overview */}
          <div className="space-y-2">
            <Label htmlFor="dialogs_overview">
              💬 Dialogs Overview
              <span className="text-sm text-muted-foreground ml-2">
                (Optional, Markdown supported)
              </span>
            </Label>
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGenerateOverview('dialogs', values.dialogs_overview)}
                className="h-6 w-6 p-0"
                title="Generate dialogs overview"
              >
                <Sparkles className="h-3 w-3" />
              </Button>
              <span className="text-xs text-muted-foreground">Click to generate with AI</span>
            </div>
            <Textarea
              id="dialogs_overview"
              value={values.dialogs_overview}
              onChange={(e) => onChange({ dialogs_overview: e.target.value })}
              placeholder="e.g., Practice real-world conversations with these interactive dialogs..."
              rows={3}
              className="font-mono text-sm"
            />
          </div>

          {/* Grammar Overview */}
          <div className="space-y-2">
            <Label htmlFor="grammar_overview">
              📝 Grammar Concepts Overview
              <span className="text-sm text-muted-foreground ml-2">
                (Optional, Markdown supported)
              </span>
            </Label>
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGenerateOverview('grammar', values.grammar_overview)}
                className="h-6 w-6 p-0"
                title="Generate grammar overview"
              >
                <Sparkles className="h-3 w-3" />
              </Button>
              <span className="text-xs text-muted-foreground">Click to generate with AI</span>
            </div>
            <Textarea
              id="grammar_overview"
              value={values.grammar_overview}
              onChange={(e) => onChange({ grammar_overview: e.target.value })}
              placeholder="e.g., Learn essential grammar patterns with detailed explanations and examples..."
              rows={3}
              className="font-mono text-sm"
            />
          </div>
        </div>

        {/* Game HQ */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Game HQ</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Gaming and reward settings for this lesson
            </p>
          </div>

          {/* XP Value */}
          <div className="space-y-2">
            <Label htmlFor="xp_value">XP Value</Label>
            <Input
              id="xp_value"
              type="number"
              min={0}
              step={5}
              value={values.xp_value}
              onChange={(e) =>
                onChange({ xp_value: parseInt(e.target.value) || 0 })
              }
            />
            <p className="text-xs text-muted-foreground">
              XP awarded to learners who complete this lesson
            </p>
          </div>
        </div>
      </div>

      {/* Generate Overview Modal */}
      <GenerateOverviewModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
        lessonId={lessonId}
        currentOverview={currentOverview}
        overviewType={generateModalType}
        onOverviewGenerated={handleOverviewGenerated}
      />

      {/* Batch Generate Modal */}
      <BatchGenerateOverviewModal
        open={showBatchModal}
        onOpenChange={setShowBatchModal}
        lessonId={lessonId}
        overviewOptions={overviewOptions}
        onOverviewsGenerated={handleBatchOverviewsGenerated}
      />
    </div>
  )
}
