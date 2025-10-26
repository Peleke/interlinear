'use client'

import { useState } from 'react'
import { TextInputPanel } from '@/components/reader/TextInputPanel'
import { TextRenderPanel } from '@/components/reader/TextRenderPanel'
import { VocabularyPanel } from '@/components/reader/VocabularyPanel'

type Mode = 'input' | 'render' | 'vocabulary'

export function ReaderClient() {
  const [mode, setMode] = useState<Mode>('input')
  const [text, setText] = useState('')

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Mode Switcher */}
      <div className="flex gap-2 mb-6 border-b border-sepia-300">
        <button
          onClick={() => setMode('input')}
          className={`px-6 py-3 font-serif transition-colors ${
            mode === 'input'
              ? 'border-b-2 border-sepia-700 text-sepia-900'
              : 'text-sepia-600 hover:text-sepia-800'
          }`}
        >
          Input Text
        </button>
        <button
          onClick={() => setMode('render')}
          disabled={!text}
          className={`px-6 py-3 font-serif transition-colors ${
            mode === 'render'
              ? 'border-b-2 border-sepia-700 text-sepia-900'
              : 'text-sepia-600 hover:text-sepia-800 disabled:opacity-50'
          }`}
        >
          Read
        </button>
        <button
          onClick={() => setMode('vocabulary')}
          className={`px-6 py-3 font-serif transition-colors ${
            mode === 'vocabulary'
              ? 'border-b-2 border-sepia-700 text-sepia-900'
              : 'text-sepia-600 hover:text-sepia-800'
          }`}
        >
          Vocabulary
        </button>
      </div>

      {/* Content Panel */}
      <div className="transition-opacity duration-200">
        {mode === 'input' && (
          <TextInputPanel
            text={text}
            onTextChange={setText}
            onRenderClick={() => setMode('render')}
          />
        )}
        {mode === 'render' && (
          <TextRenderPanel
            text={text}
            onEditClick={() => setMode('input')}
          />
        )}
        {mode === 'vocabulary' && <VocabularyPanel />}
      </div>
    </div>
  )
}
