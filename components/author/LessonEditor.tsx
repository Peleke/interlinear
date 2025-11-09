'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import {
  FileText,
  MessageSquare,
  Book,
  GraduationCap,
  Target,
  BookOpen,
  Save,
  Eye,
  Send,
  ChevronLeft,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MetadataPanel } from './MetadataPanel'

type TabId = 'metadata' | 'dialogs' | 'vocabulary' | 'grammar' | 'exercises' | 'readings'
type LessonStatus = 'draft' | 'published' | 'archived'

interface Lesson {
  id: string
  title: string
  status: LessonStatus
  language: 'es' | 'is'
  overview?: string
  course_id?: string | null
  xp_value: number
  sequence_order: number
  updated_at: string
  course?: {
    id: string
    title: string
  } | null
  dialogs?: any[]
  vocabulary?: any[]
  grammar?: any[]
  exercises?: any[]
  readings?: any[]
}

interface Props {
  lesson: Lesson
  userId: string
}

const tabs = [
  { id: 'metadata' as TabId, label: 'Metadata', icon: FileText },
  { id: 'dialogs' as TabId, label: 'Dialogs', icon: MessageSquare },
  { id: 'vocabulary' as TabId, label: 'Vocabulary', icon: Book },
  { id: 'grammar' as TabId, label: 'Grammar', icon: GraduationCap },
  { id: 'exercises' as TabId, label: 'Exercises', icon: Target },
  { id: 'readings' as TabId, label: 'Readings', icon: BookOpen },
]

const statusConfig: Record<
  LessonStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  published: { label: 'Published', variant: 'default' },
  archived: { label: 'Archived', variant: 'outline' },
}

export function LessonEditor({ lesson: initialLesson, userId }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('metadata')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [lesson, setLesson] = useState(initialLesson)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')

  // Auto-save with debouncing (500ms after last edit)
  const saveLesson = useCallback(async (updatedLesson: Lesson) => {
    setSaveStatus('saving')
    try {
      const response = await fetch(`/api/lessons/${updatedLesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updatedLesson.title,
          language: updatedLesson.language,
          overview: updatedLesson.overview,
          course_id: updatedLesson.course_id,
          xp_value: updatedLesson.xp_value,
          sequence_order: updatedLesson.sequence_order,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save lesson')
      }

      setSaveStatus('saved')
    } catch (error) {
      console.error('Error saving lesson:', error)
      setSaveStatus('unsaved')
      // TODO: Show error toast
    }
  }, [])

  const debouncedSave = useDebouncedCallback(saveLesson, 500)

  const updateLesson = useCallback(
    (updates: Partial<Lesson>) => {
      const updatedLesson = { ...lesson, ...updates }
      setLesson(updatedLesson)
      setSaveStatus('unsaved')
      debouncedSave(updatedLesson)
    },
    [lesson, debouncedSave]
  )

  const handleBack = () => {
    router.push('/author/lessons')
  }

  const handlePreview = () => {
    // TODO: Open preview modal
    console.log('Preview lesson:', lesson.id)
  }

  const handlePublish = async () => {
    // TODO: Implement publish workflow
    console.log('Publish lesson:', lesson.id)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold truncate max-w-[300px] sm:max-w-none">
                {lesson.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {lesson.course && <span>{lesson.course.title}</span>}
                <span>•</span>
                <span className="uppercase">{lesson.language}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={statusConfig[lesson.status].variant}>
              {statusConfig[lesson.status].label}
            </Badge>

            {saveStatus === 'saving' && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Save className="h-3 w-3 animate-pulse" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Save className="h-3 w-3" />
                Saved
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-sm text-amber-600 flex items-center gap-1">
                <Save className="h-3 w-3" />
                Unsaved changes
              </span>
            )}

            <div className="hidden sm:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              {lesson.status === 'draft' && (
                <Button size="sm" onClick={handlePublish}>
                  <Send className="mr-2 h-4 w-4" />
                  Publish
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={cn(
            'border-r bg-card transition-all duration-300',
            sidebarOpen ? 'w-64' : 'w-0 lg:w-16',
            'absolute lg:relative h-full z-10 lg:z-auto'
          )}
        >
          <nav className="p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    // Close sidebar on mobile after selection
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false)
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    'hover:bg-accent',
                    isActive && 'bg-accent text-accent-foreground font-medium'
                  )}
                >
                  <Icon className={cn('h-5 w-5', !sidebarOpen && 'lg:mx-auto')} />
                  <span className={cn(!sidebarOpen && 'lg:hidden')}>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'metadata' && (
              <MetadataPanel
                values={{
                  title: lesson.title,
                  language: lesson.language,
                  overview: lesson.overview || '',
                  course_id: lesson.course_id || null,
                  xp_value: lesson.xp_value,
                  sequence_order: lesson.sequence_order,
                }}
                onChange={updateLesson}
              />
            )}

            {activeTab === 'dialogs' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Dialogs</h2>
                <p className="text-muted-foreground">
                  {lesson.dialogs?.length || 0} dialogs
                </p>
              </div>
            )}

            {activeTab === 'vocabulary' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Vocabulary</h2>
                <p className="text-muted-foreground">
                  {lesson.vocabulary?.length || 0} vocabulary items
                </p>
              </div>
            )}

            {activeTab === 'grammar' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Grammar Concepts</h2>
                <p className="text-muted-foreground">
                  {lesson.grammar?.length || 0} grammar concepts
                </p>
              </div>
            )}

            {activeTab === 'exercises' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Exercises</h2>
                <p className="text-muted-foreground">
                  {lesson.exercises?.length || 0} exercises
                </p>
              </div>
            )}

            {activeTab === 'readings' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Readings</h2>
                <p className="text-muted-foreground">
                  {lesson.readings?.length || 0} readings
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-0 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
