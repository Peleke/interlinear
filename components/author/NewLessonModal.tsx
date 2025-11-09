'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, MessageSquare, GraduationCap, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

type Template = 'blank' | 'dialog' | 'grammar' | 'vocab'

const templates = [
  {
    id: 'blank' as Template,
    name: 'Blank Lesson',
    description: 'Start from scratch',
    icon: FileText,
  },
  {
    id: 'dialog' as Template,
    name: 'Dialog-Focused',
    description: 'Pre-configured for conversation practice',
    icon: MessageSquare,
  },
  {
    id: 'grammar' as Template,
    name: 'Grammar-Focused',
    description: 'Structured for grammar concepts',
    icon: GraduationCap,
  },
  {
    id: 'vocab' as Template,
    name: 'Vocabulary-Focused',
    description: 'Optimized for vocab building',
    icon: BookOpen,
  },
]

interface Course {
  id: string
  title: string
}

export function NewLessonModal({ open, onOpenChange, userId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'template' | 'details'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('blank')
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState<'es' | 'is'>('es')
  const [courseId, setCourseId] = useState<string>('')
  const [courses, setCourses] = useState<Course[]>([])
  const [isCreating, setIsCreating] = useState(false)

  // Fetch courses
  useEffect(() => {
    if (open) {
      fetch('/api/courses')
        .then((res) => res.json())
        .then((data) => setCourses(data?.courses || []))
        .catch((err) => console.error('Failed to fetch courses:', err))
    }
  }, [open])

  const handleCreate = async () => {
    if (!title.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          language,
          course_id: courseId || null,
          status: 'draft',
          template: selectedTemplate,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create lesson')
      }

      const lesson = await response.json()

      // Reset form
      setTitle('')
      setSelectedTemplate('blank')
      setCourseId('')
      setStep('template')
      onOpenChange(false)

      // Navigate to editor
      router.push(`/author/lessons/${lesson.id}/edit`)
    } catch (error) {
      console.error('Error creating lesson:', error)
      // TODO: Show error toast
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setStep('template')
      setTitle('')
      setSelectedTemplate('blank')
      setCourseId('')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'template' ? 'Choose Template' : 'Lesson Details'}
          </DialogTitle>
          <DialogDescription>
            {step === 'template'
              ? 'Select a template to get started with your lesson'
              : 'Provide basic information for your new lesson'}
          </DialogDescription>
        </DialogHeader>

        {step === 'template' ? (
          <div className="space-y-4 py-4">
            <RadioGroup
              value={selectedTemplate}
              onValueChange={(value) => setSelectedTemplate(value as Template)}
            >
              {templates.map((template) => {
                const Icon = template.icon
                return (
                  <label
                    key={template.id}
                    htmlFor={template.id}
                    className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  >
                    <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {template.description}
                        </div>
                      </div>
                    </div>
                  </label>
                )
              })}
            </RadioGroup>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setStep('details')}>Next</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., At the Restaurant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={(value) => setLanguage(value as 'es' | 'is')}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Spanish (ES)</SelectItem>
                  <SelectItem value="is">Icelandic (IS)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Course (Optional)</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger id="course">
                  <SelectValue placeholder="No course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No course</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('template')}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!title.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Lesson'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
