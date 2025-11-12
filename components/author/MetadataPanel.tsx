'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Course {
  id: string
  title: string
}

interface MetadataValues {
  title: string
  language: 'es' | 'la'
  overview: string
  course_id: string | null
  xp_value: number
  sequence_order: number
}

interface Props {
  values: MetadataValues
  onChange: (values: Partial<MetadataValues>) => void
}

export function MetadataPanel({ values, onChange }: Props) {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)

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

        {/* Overview */}
        <div className="space-y-2">
          <Label htmlFor="overview">
            Overview
            <span className="text-sm text-muted-foreground ml-2">
              (Supports Markdown)
            </span>
          </Label>
          <Textarea
            id="overview"
            value={values.overview}
            onChange={(e) => onChange({ overview: e.target.value })}
            placeholder="Describe what students will learn in this lesson..."
            rows={6}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Tip: Use **bold**, *italic*, and `code` for formatting
          </p>
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
      </div>
    </div>
  )
}
