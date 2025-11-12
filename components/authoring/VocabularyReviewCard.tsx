'use client'

/**
 * VocabularyReviewCard
 *
 * Individual vocabulary item card for review interface
 * Features: inline editing, approve/reject, regenerate
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, X, Edit2, RotateCcw, Save } from 'lucide-react'
import type { VocabularyItem } from '@/lib/content-generation/tools/extract-vocabulary'

interface VocabularyReviewCardProps {
  item: VocabularyItem
  onApprove: (item: VocabularyItem) => void
  onReject: (word: string) => void
  onUpdate: (item: VocabularyItem) => void
  onRegenerate?: (word: string) => void
  isApproved?: boolean
  isRejected?: boolean
  disabled?: boolean
}

export function VocabularyReviewCard({
  item,
  onApprove,
  onReject,
  onUpdate,
  onRegenerate,
  isApproved = false,
  isRejected = false,
  disabled = false,
}: VocabularyReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedItem, setEditedItem] = useState(item)

  const handleSave = () => {
    onUpdate(editedItem)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedItem(item)
    setIsEditing(false)
  }

  const cardBgClass = isApproved
    ? 'bg-green-50 border-green-300'
    : isRejected
    ? 'bg-red-50 border-red-300'
    : 'bg-white'

  return (
    <div
      className={`border rounded-lg p-4 space-y-3 transition-colors ${cardBgClass}`}
    >
      {/* Header: Word + Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editedItem.word}
              onChange={(e) =>
                setEditedItem({ ...editedItem, word: e.target.value })
              }
              placeholder="Spanish word"
              className="font-semibold text-lg"
              disabled={disabled}
            />
          ) : (
            <h3 className="text-lg font-semibold text-sepia-900 truncate">
              {item.word}
            </h3>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 flex-shrink-0">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={disabled}
                title="Save changes"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={disabled}
                title="Cancel editing"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {!isApproved && !isRejected && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    disabled={disabled}
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {onRegenerate && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRegenerate(item.word)}
                      disabled={disabled}
                      title="Regenerate"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
              {!isRejected && (
                <Button
                  size="sm"
                  variant={isApproved ? 'default' : 'ghost'}
                  onClick={() => onApprove(item)}
                  disabled={disabled}
                  className={isApproved ? 'bg-green-600 hover:bg-green-700' : ''}
                  title="Approve"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {!isApproved && (
                <Button
                  size="sm"
                  variant={isRejected ? 'destructive' : 'ghost'}
                  onClick={() => onReject(item.word)}
                  disabled={disabled}
                  title="Reject"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Translation */}
      <div>
        <label className="text-xs text-sepia-600 font-medium">
          English Translation
        </label>
        {isEditing ? (
          <Input
            value={editedItem.english_translation}
            onChange={(e) =>
              setEditedItem({
                ...editedItem,
                english_translation: e.target.value,
              })
            }
            placeholder="English translation"
            disabled={disabled}
          />
        ) : (
          <p className="text-sepia-800">{item.english_translation}</p>
        )}
      </div>

      {/* Part of Speech + Difficulty */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-sepia-600 font-medium">
            Part of Speech
          </label>
          {isEditing ? (
            <Select
              value={editedItem.part_of_speech}
              onValueChange={(value) =>
                setEditedItem({
                  ...editedItem,
                  part_of_speech: value as VocabularyItem['part_of_speech'],
                })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="noun">Noun</SelectItem>
                <SelectItem value="verb">Verb</SelectItem>
                <SelectItem value="adjective">Adjective</SelectItem>
                <SelectItem value="adverb">Adverb</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-sepia-700 capitalize">
              {item.part_of_speech}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs text-sepia-600 font-medium">
            Difficulty
          </label>
          {isEditing ? (
            <Select
              value={editedItem.difficulty_level}
              onValueChange={(value) =>
                setEditedItem({
                  ...editedItem,
                  difficulty_level: value as VocabularyItem['difficulty_level'],
                })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
                <SelectItem value="C2">C2</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-sepia-700">{item.difficulty_level}</p>
          )}
        </div>
      </div>

      {/* Example Sentence */}
      {item.example_sentence && (
        <div>
          <label className="text-xs text-sepia-600 font-medium">
            Example Sentence
          </label>
          {isEditing ? (
            <Textarea
              value={editedItem.example_sentence}
              onChange={(e) =>
                setEditedItem({
                  ...editedItem,
                  example_sentence: e.target.value,
                })
              }
              placeholder="Example sentence from reading"
              rows={2}
              disabled={disabled}
            />
          ) : (
            <p className="text-sm text-sepia-700 italic">
              &ldquo;{item.example_sentence}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="flex gap-4 text-xs text-sepia-500">
        <span>Frequency: {item.frequency}x</span>
        {item.appears_in_reading && (
          <span className="text-green-600">✓ In reading</span>
        )}
      </div>
    </div>
  )
}
