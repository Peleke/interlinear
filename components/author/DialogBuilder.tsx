'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, Trash2, GripVertical, Save, CheckCircle2 } from 'lucide-react'

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
  language: 'es' | 'is'
}

export function DialogBuilder({ lessonId, language }: Props) {
  const [dialogs, setDialogs] = useState<Dialog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
    const newDialog: Dialog = {
      id: `temp-${Date.now()}`,
      context: '',
      setting: null,
      exchanges: [],
    }
    setDialogs([...dialogs, newDialog])
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

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dialog Builder</h3>
          <p className="text-sm text-muted-foreground">
            Create conversation exchanges for this lesson
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addDialog} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Dialog
          </Button>
          <Button onClick={saveDialogs} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>

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
                  <CardTitle className="text-base">
                    Dialog {dialogIdx + 1}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteDialog(dialog.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
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
                  <Label>Setting (Optional)</Label>
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
                    <Label>Conversation Exchanges</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addExchange(dialog.id)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Exchange
                    </Button>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
