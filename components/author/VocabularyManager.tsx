'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlusCircle, Trash2, Save, CheckCircle2, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import VocabularyAutocomplete from './VocabularyAutocomplete'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ReadingSelector } from './ReadingSelector'
import { Sparkles } from 'lucide-react'

interface VocabItem {
  id: string
  spanish: string
  english: string
  part_of_speech?: string | null
  difficulty_level?: string | null
  is_new: boolean
  mw_id?: string | null
  mw_data?: any
  mw_fetched_at?: string | null
  used_in_lessons?: string[]
  usage_count?: number
}

interface Props {
  lessonId: string
  language: 'es' | 'la'
}

const PARTS_OF_SPEECH = [
  { value: 'none', label: 'Not specified' },
  { value: 'noun', label: 'Noun' },
  { value: 'verb', label: 'Verb' },
  { value: 'adjective', label: 'Adjective' },
  { value: 'adverb', label: 'Adverb' },
  { value: 'pronoun', label: 'Pronoun' },
  { value: 'preposition', label: 'Preposition' },
  { value: 'conjunction', label: 'Conjunction' },
  { value: 'phrase', label: 'Phrase' },
]

const DIFFICULTY_LEVELS = [
  { value: 'none', label: 'Not specified' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export function VocabularyManager({ lessonId, language }: Props) {
  const [vocabulary, setVocabulary] = useState<VocabItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [cefrLevel, setCefrLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('A1')
  const [maxVocabItems, setMaxVocabItems] = useState(20)
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Load existing vocabulary
  useEffect(() => {
    loadVocabulary()
  }, [lessonId])

  const loadVocabulary = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/vocabulary`)
      const data = await response.json()
      setVocabulary(data.vocabulary || [])
    } catch (error) {
      console.error('Failed to load vocabulary:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async (selection: { readingIds?: string[], manualText?: string }) => {
    setIsGenerating(true)
    try {
      let sourceText = ''

      if (selection.manualText) {
        sourceText = selection.manualText
      } else if (selection.readingIds && selection.readingIds.length > 0) {
        // Fetch reading content(s)
        const response = await fetch(`/api/lessons/${lessonId}/readings`)
        if (!response.ok) throw new Error('Failed to fetch readings')

        const data = await response.json()
        const selectedReadings = data.readings.filter((r: any) =>
          selection.readingIds!.includes(r.id)
        )

        sourceText = selectedReadings.map((r: any) => r.content).join('\n\n')

        // Use first reading's difficulty level for CEFR mapping
        if (selectedReadings.length > 0) {
          const level = selectedReadings[0].difficulty_level || 'beginner'
          const cefrMap: Record<string, 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'> = {
            'beginner': 'A1',
            'elementary': 'A2',
            'intermediate': 'B1',
            'upper_intermediate': 'B2',
            'advanced': 'C1',
            'proficient': 'C2',
          }
          setCefrLevel((cefrMap[level] || 'A1') as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')
        }
      }

      if (!sourceText.trim()) {
        throw new Error('No source text available')
      }

      // Call vocabulary extraction API
      const generateResponse = await fetch('/api/workflows/content-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          readingText: sourceText,
          targetLevel: cefrLevel,
          language,
          maxVocabularyItems: maxVocabItems,
        }),
      })

      if (!generateResponse.ok) {
        throw new Error('Failed to generate vocabulary')
      }

      const result = await generateResponse.json()
      await loadVocabulary()
      setShowGenerateModal(false)

      setSaveMessage({
        type: 'success',
        text: 'Vocabulary generated successfully!',
      })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Vocabulary generation failed:', error)
      setSaveMessage({
        type: 'error',
        text: 'Failed to generate vocabulary. Please try again.',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const addVocabItem = () => {
    const newItem: VocabItem = {
      id: `temp-${Date.now()}`,
      spanish: '',
      english: '',
      part_of_speech: null,
      difficulty_level: null,
      is_new: true,
    }
    setVocabulary([...vocabulary, newItem])
  }

  const addFromAutocomplete = (item: any) => {
    // Add existing vocabulary item to lesson
    const newItem: VocabItem = {
      id: item.id,
      spanish: item.spanish,
      english: item.english,
      part_of_speech: item.part_of_speech,
      difficulty_level: item.difficulty_level,
      is_new: false, // Existing vocab defaults to "review"
      mw_id: item.mw_id,
      mw_data: item.mw_data,
      mw_fetched_at: item.mw_fetched_at,
    }
    setVocabulary([...vocabulary, newItem])
  }

  const updateVocabItem = (
    id: string,
    field: keyof VocabItem,
    value: string | boolean
  ) => {
    setVocabulary(
      vocabulary.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value }
        }
        return item
      })
    )

    // Auto-detect "is_new" when Spanish or English changes
    if (field === 'spanish' || field === 'english') {
      const item = vocabulary.find((v) => v.id === id)
      if (item) {
        debouncedCheckIfVocabIsNew(
          id,
          item.spanish,
          item.english,
          field,
          value as string
        )
      }
    }
  }

  // Debounced version of checkIfVocabIsNew (500ms delay)
  const debouncedCheckIfVocabIsNew = (
    id: string,
    currentSpanish: string,
    currentEnglish: string,
    changedField: 'spanish' | 'english',
    newValue: string
  ) => {
    // Clear existing timer for this item
    const existingTimer = debounceTimers.current.get(id)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new timer
    const timer = setTimeout(() => {
      checkIfVocabIsNew(id, currentSpanish, currentEnglish, changedField, newValue)
      debounceTimers.current.delete(id)
    }, 500)

    debounceTimers.current.set(id, timer)
  }

  // Check if vocabulary exists
  const checkIfVocabIsNew = async (
    id: string,
    currentSpanish: string,
    currentEnglish: string,
    changedField: 'spanish' | 'english',
    newValue: string
  ) => {
    const spanish = changedField === 'spanish' ? newValue : currentSpanish
    const english = changedField === 'english' ? newValue : currentEnglish

    // Both fields must be filled
    if (!spanish.trim() || !english.trim()) return

    try {
      // Check if this (spanish, english) pair exists
      const params = new URLSearchParams({
        q: spanish,
        language: 'es',
        limit: '5',
      })
      const response = await fetch(`/api/vocabulary/search?${params}`)
      if (!response.ok) return

      const data = await response.json()
      const exactMatch = data.items?.find(
        (item: any) =>
          item.spanish.toLowerCase() === spanish.toLowerCase() &&
          item.english.toLowerCase() === english.toLowerCase()
      )

      // Auto-set "is_new" based on whether vocab exists
      setVocabulary((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return { ...item, is_new: !exactMatch }
          }
          return item
        })
      )
    } catch (error) {
      console.error('Failed to check vocab existence:', error)
    }
  }

  const deleteVocabItem = (id: string) => {
    setVocabulary(vocabulary.filter((item) => item.id !== id))
  }

  const saveVocabulary = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    try {
      // Filter out empty items
      const validVocab = vocabulary.filter(
        (item) => item.spanish.trim() && item.english.trim()
      )

      const response = await fetch(`/api/lessons/${lessonId}/vocabulary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vocabulary: validVocab }),
      })

      if (!response.ok) {
        throw new Error('Failed to save vocabulary')
      }

      // Reload to get server IDs and MW data
      await loadVocabulary()

      setSaveMessage({
        type: 'success',
        text: 'Vocabulary saved successfully!',
      })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Failed to save vocabulary:', error)
      setSaveMessage({
        type: 'error',
        text: 'Failed to save vocabulary. Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="p-4 text-center">Loading vocabulary...</div>
  }

  return (
    <div className="space-y-6">
      {saveMessage && (
        <div
          className={`p-4 rounded-lg border flex items-center gap-2 ${
            saveMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {saveMessage.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
          <span>{saveMessage.text}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Vocabulary Manager</h3>
            <p className="text-sm text-muted-foreground">
              Add vocabulary words for this lesson (auto-fetches from Merriam-Webster)
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowGenerateModal(true)}
              variant="outline"
              size="default"
              className="px-4 py-2"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Vocabulary
            </Button>
            <Button onClick={addVocabItem} variant="outline" size="default" className="px-4 py-2">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Word
            </Button>
            <Button onClick={saveVocabulary} disabled={isSaving} size="default" className="px-4 py-2">
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        </div>

        {/* Autocomplete search */}
        <Card className="bg-blue-50/50">
          <CardContent className="p-4">
            <Label className="text-sm font-medium mb-2 block">
              Search & Reuse Existing Vocabulary
            </Label>
            <VocabularyAutocomplete
              onSelect={addFromAutocomplete}
              language={language}
              placeholder={
                language === 'es'
                  ? 'Search Spanish words...'
                  : language === 'la'
                  ? 'Search Latin words...'
                  : 'Search vocabulary...'
              }
            />
            <p className="text-xs text-muted-foreground mt-2">
              Reusing vocabulary with ⭐ saves API calls and keeps definitions consistent
            </p>
          </CardContent>
        </Card>
      </div>

      {vocabulary.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No vocabulary yet. Click "Add Word" to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {vocabulary.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {item.spanish || 'New Vocabulary Item'}
                      </CardTitle>
                      {item.is_new && (
                        <Badge variant="default" className="text-xs">
                          New
                        </Badge>
                      )}
                      {!item.is_new && item.usage_count && item.usage_count > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          Review
                        </Badge>
                      )}
                      {item.mw_data && (
                        <span className="text-xs text-green-600 font-normal">
                          ✓ MW
                        </span>
                      )}
                    </div>
                    {item.used_in_lessons && item.used_in_lessons.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Also in: {item.used_in_lessons.slice(0, 3).join(', ')}
                        {item.used_in_lessons.length > 3 && ` +${item.used_in_lessons.length - 3} more`}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteVocabItem(item.id)}
                    title="Remove from this lesson"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Spanish Word *</Label>
                    <Input
                      value={item.spanish}
                      onChange={(e) =>
                        updateVocabItem(item.id, 'spanish', e.target.value)
                      }
                      placeholder="e.g., hola"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>English Translation *</Label>
                    <Input
                      value={item.english}
                      onChange={(e) =>
                        updateVocabItem(item.id, 'english', e.target.value)
                      }
                      placeholder="e.g., hello"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Part of Speech</Label>
                    <Select
                      value={item.part_of_speech || 'none'}
                      onValueChange={(value) =>
                        updateVocabItem(
                          item.id,
                          'part_of_speech',
                          value === 'none' ? '' : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PARTS_OF_SPEECH.map((pos) => (
                          <SelectItem key={pos.value} value={pos.value}>
                            {pos.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <Select
                      value={item.difficulty_level || 'none'}
                      onValueChange={(value) =>
                        updateVocabItem(
                          item.id,
                          'difficulty_level',
                          value === 'none' ? '' : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>New in Lesson?</Label>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center h-10 px-3 border rounded-md">
                        <input
                          type="checkbox"
                          checked={item.is_new}
                          onChange={(e) =>
                            updateVocabItem(item.id, 'is_new', e.target.checked)
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">
                          {item.is_new ? 'New' : 'Review'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Auto-detected based on existing vocab
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generation Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Vocabulary with AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cefr-level">Target CEFR Level</Label>
                <Select value={cefrLevel} onValueChange={(v: any) => setCefrLevel(v)}>
                  <SelectTrigger id="cefr-level" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Beginner</SelectItem>
                    <SelectItem value="A2">A2 - Elementary</SelectItem>
                    <SelectItem value="B1">B1 - Intermediate</SelectItem>
                    <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                    <SelectItem value="C1">C1 - Advanced</SelectItem>
                    <SelectItem value="C2">C2 - Proficient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="max-vocab">Max Vocabulary Items (5-50)</Label>
                <Input
                  id="max-vocab"
                  type="number"
                  min={5}
                  max={50}
                  value={maxVocabItems}
                  onChange={(e) => setMaxVocabItems(parseInt(e.target.value) || 20)}
                  className="mt-2"
                />
              </div>
            </div>
            <ReadingSelector
              lessonId={lessonId}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              generateButtonText="Extract Vocabulary"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
