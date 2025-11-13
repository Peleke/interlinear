'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog as UIDialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlusCircle, Trash2, GripVertical, Save, CheckCircle2, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { ReadingSelector } from './ReadingSelector'

interface DialogExchange {
  id: string
  sequence_order: number
  speaker: string
  spanish: string
  english: string
}

interface Dialog {
  id: string
  context: string
  setting: string | null
  exchanges: DialogExchange[]
}

interface Props {
  lessonId: string
  language: 'es' | 'la'
}

export function DialogBuilder({ lessonId, language }: Props) {
  const [dialogs, setDialogs] = useState<Dialog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // AI Generation state
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDialogs, setGeneratedDialogs] = useState<any[]>([])
  const [dialogCount, setDialogCount] = useState(2)
  const [turnsPerDialog, setTurnsPerDialog] = useState(6)
  const [complexity, setComplexity] = useState<'simple' | 'intermediate' | 'advanced'>('intermediate')
  const [savingDialogIndex, setSavingDialogIndex] = useState<number | null>(null)
  const [exchangesExpanded, setExchangesExpanded] = useState<Record<string, boolean>>({})
  const [dialogsCollapsed, setDialogsCollapsed] = useState<Record<string, boolean>>({})

  // Load existing dialogs
  useEffect(() => {
    loadDialogs()
  }, [lessonId])

  const loadDialogs = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/dialogs`)
      if (response.ok) {
        const data = await response.json()
        setDialogs(data.dialogs || [])
      }
    } catch (error) {
      console.error('Failed to load dialogs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addDialog = () => {
    const newDialogId = `temp-${Date.now()}`
    const newDialog: Dialog = {
      id: newDialogId,
      context: '',
      setting: null,
      exchanges: [],
    }
    setDialogs([...dialogs, newDialog])
    // Ensure new dialog starts expanded
    setDialogsCollapsed(prev => ({ ...prev, [newDialogId]: false }))
  }

  const deleteDialog = async (dialogId: string) => {
    if (!dialogId.startsWith('temp-')) {
      try {
        await fetch(`/api/lessons/${lessonId}/dialogs/${dialogId}`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('Failed to delete dialog:', error)
        return
      }
    }
    setDialogs(dialogs.filter((d) => d.id !== dialogId))
  }

  const updateDialog = (dialogId: string, updates: Partial<Dialog>) => {
    setDialogs(
      dialogs.map((d) => (d.id === dialogId ? { ...d, ...updates } : d))
    )
  }

  const addExchange = (dialogId: string) => {
    setDialogs(
      dialogs.map((d) => {
        if (d.id === dialogId) {
          const newExchange: DialogExchange = {
            id: `temp-exchange-${Date.now()}`,
            sequence_order: d.exchanges.length + 1,
            speaker: '',
            spanish: '',
            english: '',
          }
          return { ...d, exchanges: [...d.exchanges, newExchange] }
        }
        return d
      })
    )
  }

  const updateExchange = (
    dialogId: string,
    exchangeId: string,
    updates: Partial<DialogExchange>
  ) => {
    setDialogs(
      dialogs.map((d) => {
        if (d.id === dialogId) {
          return {
            ...d,
            exchanges: d.exchanges.map((ex) =>
              ex.id === exchangeId ? { ...ex, ...updates } : ex
            ),
          }
        }
        return d
      })
    )
  }

  const deleteExchange = (dialogId: string, exchangeId: string) => {
    setDialogs(
      dialogs.map((d) => {
        if (d.id === dialogId) {
          const filtered = d.exchanges.filter((ex) => ex.id !== exchangeId)
          // Resequence
          return {
            ...d,
            exchanges: filtered.map((ex, idx) => ({
              ...ex,
              sequence_order: idx + 1,
            })),
          }
        }
        return d
      })
    )
  }

  const saveDialogs = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    try {
      const response = await fetch(`/api/lessons/${lessonId}/dialogs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dialogs }),
      })

      if (!response.ok) {
        throw new Error('Failed to save dialogs')
      }

      // Reload to get server IDs
      await loadDialogs()

      setSaveMessage({ type: 'success', text: 'Dialogs saved successfully!' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Failed to save dialogs:', error)
      setSaveMessage({ type: 'error', text: 'Failed to save dialogs. Please try again.' })
    } finally {
      setIsSaving(false)
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
      }

      if (!sourceText.trim()) {
        throw new Error('No source text available')
      }

      const response = await fetch('/api/content-generation/dialogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: sourceText,
          dialogCount,
          turnsPerDialog,
          complexity,
          language,
          targetLevel: 'A1',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Generation failed')
      }

      const data = await response.json()
      setGeneratedDialogs(data.dialogs || [])
    } catch (error) {
      console.error('Dialog generation failed:', error)
      alert(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveGeneratedDialog = async (dialog: any, index: number) => {
    setSavingDialogIndex(index)
    try {
      const response = await fetch(`/api/lessons/${lessonId}/dialogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: dialog.context,
          setting: dialog.setting,
          turns: dialog.turns,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save dialog')
      }

      await loadDialogs()
      // Remove from generated list
      setGeneratedDialogs(prev => prev.filter(d => d !== dialog))

      if (generatedDialogs.length === 1) {
        // Last one, close modal
        setShowGenerateModal(false)
      }
    } catch (error) {
      console.error('Failed to save generated dialog:', error)
      alert(error instanceof Error ? error.message : 'Failed to save dialog')
    } finally {
      setSavingDialogIndex(null)
    }
  }

  const saveAllGeneratedDialogs = async () => {
    if (generatedDialogs.length === 0) return

    const confirmMsg = `Save all ${generatedDialogs.length} generated dialogs to this lesson?`
    if (!confirm(confirmMsg)) return

    try {
      setIsGenerating(true)

      for (let i = 0; i < generatedDialogs.length; i++) {
        const dialog = generatedDialogs[i]
        setSavingDialogIndex(i)

        const response = await fetch(`/api/lessons/${lessonId}/dialogs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: dialog.context,
            setting: dialog.setting,
            turns: dialog.turns,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to save dialog ${i + 1}`)
        }
      }

      await loadDialogs()
      setGeneratedDialogs([])
      setShowGenerateModal(false)
      setSaveMessage({ type: 'success', text: `Saved ${generatedDialogs.length} generated dialogs!` })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Failed to save dialogs:', error)
      alert(error instanceof Error ? error.message : 'Failed to save all dialogs')
    } finally {
      setIsGenerating(false)
      setSavingDialogIndex(null)
    }
  }

  if (isLoading) {
    return <div className="p-4 text-center">Loading dialogs...</div>
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

      <div>
        <h3 className="text-lg font-semibold">Dialog Builder</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create conversation exchanges for this lesson
        </p>
        <div className="flex gap-2">
          <Button onClick={() => setShowGenerateModal(true)} variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate
          </Button>
          <Button onClick={addDialog} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add
          </Button>
          <Button onClick={saveDialogs} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* AI Generation Modal */}
      <UIDialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Conversational Dialogs
            </DialogTitle>
          </DialogHeader>

          {generatedDialogs.length === 0 ? (
            <div className="space-y-4">
              <ReadingSelector
                lessonId={lessonId}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                generateButtonText={`Generate ${dialogCount} Dialog${dialogCount !== 1 ? 's' : ''}`}
              />

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <Label htmlFor="dialog-count">Number of Dialogs</Label>
                  <Input
                    id="dialog-count"
                    type="number"
                    min={1}
                    max={5}
                    value={dialogCount}
                    onChange={(e) => setDialogCount(parseInt(e.target.value) || 2)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="turns-per-dialog">Turns per Dialog</Label>
                  <Input
                    id="turns-per-dialog"
                    type="number"
                    min={4}
                    max={12}
                    value={turnsPerDialog}
                    onChange={(e) => setTurnsPerDialog(parseInt(e.target.value) || 6)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="complexity">Complexity</Label>
                  <select
                    id="complexity"
                    className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2"
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value as any)}
                  >
                    <option value="simple">Simple</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Review and save generated dialogs:
                </p>
                <Button
                  size="sm"
                  onClick={saveAllGeneratedDialogs}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving All...
                    </>
                  ) : (
                    `Save All ${generatedDialogs.length} Dialogs`
                  )}
                </Button>
              </div>

              {generatedDialogs.map((dialog, i) => (
                <Card key={i} className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {dialog.context}
                    </CardTitle>
                    {dialog.setting && (
                      <p className="text-sm text-muted-foreground">{dialog.setting}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {dialog.turns.map((turn: any, j: number) => (
                        <div key={j} className="border-l-2 border-blue-500 pl-3 py-1">
                          <p className="text-sm font-medium text-blue-600">{turn.speaker}</p>
                          <p className="text-sm">{turn.text}</p>
                          <p className="text-xs text-muted-foreground italic">{turn.translation}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveGeneratedDialog(dialog, i)}
                        disabled={savingDialogIndex === i}
                      >
                        {savingDialogIndex === i ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save to Lesson'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setGeneratedDialogs(prev => prev.filter(d => d !== dialog))}
                      >
                        Skip
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={() => {
                  setShowGenerateModal(false)
                  setGeneratedDialogs([])
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </UIDialog>

      {dialogs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No dialogs yet. Click &quot;Add Dialog&quot; to create your first
            conversation.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {dialogs.map((dialog, dialogIdx) => (
            <Card key={dialog.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDialogsCollapsed(prev => ({
                        ...prev,
                        [dialog.id]: !prev[dialog.id]
                      }))}
                      className="flex items-center gap-1 hover:bg-muted rounded p-1 transition-colors"
                    >
                      {dialogsCollapsed[dialog.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </button>
                    <CardTitle className="text-base">
                      Dialog {dialogIdx + 1}
                      {dialog.context && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          - {dialog.context}
                        </span>
                      )}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteDialog(dialog.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              {!dialogsCollapsed[dialog.id] && (
                <CardContent className="space-y-4">
                {/* Dialog Context */}
                <div className="space-y-2">
                  <Label>Context / Situation</Label>
                  <Input
                    placeholder="e.g., At a restaurant ordering food"
                    value={dialog.context}
                    onChange={(e) =>
                      updateDialog(dialog.id, { context: e.target.value })
                    }
                  />
                </div>

                {/* Dialog Setting */}
                <div className="space-y-2">
                  <Label>Overview (markdown supported)</Label>
                  <Input
                    placeholder="e.g., Evening, casual restaurant in Madrid"
                    value={dialog.setting || ''}
                    onChange={(e) =>
                      updateDialog(dialog.id, {
                        setting: e.target.value || null,
                      })
                    }
                  />
                </div>

                {/* Exchanges */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label>Conversation Exchanges</Label>
                      <button
                        onClick={() => setExchangesExpanded(prev => ({ ...prev, [dialog.id]: !prev[dialog.id] }))}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded transition-colors"
                      >
                        {exchangesExpanded[dialog.id] ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            <span>Collapse</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            <span>Expand ({dialog.exchanges.length})</span>
                          </>
                        )}
                      </button>
                    </div>
                    {exchangesExpanded[dialog.id] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addExchange(dialog.id)}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Exchange
                      </Button>
                    )}
                  </div>

                  {dialog.exchanges.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                      No exchanges yet. Add the first line of dialogue.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dialog.exchanges.map((exchange) => (
                        <Card key={exchange.id} className="bg-muted/50">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Speaker name"
                                  value={exchange.speaker}
                                  onChange={(e) =>
                                    updateExchange(dialog.id, exchange.id, {
                                      speaker: e.target.value,
                                    })
                                  }
                                  className="flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    deleteExchange(dialog.id, exchange.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">
                                    Spanish Text
                                  </Label>
                                  <Textarea
                                    placeholder="¿Qué desea ordenar?"
                                    value={exchange.spanish}
                                    onChange={(e) =>
                                      updateExchange(dialog.id, exchange.id, {
                                        spanish: e.target.value,
                                      })
                                    }
                                    rows={2}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">
                                    English Translation
                                  </Label>
                                  <Textarea
                                    placeholder="What would you like to order?"
                                    value={exchange.english}
                                    onChange={(e) =>
                                      updateExchange(dialog.id, exchange.id, {
                                        english: e.target.value,
                                      })
                                    }
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
