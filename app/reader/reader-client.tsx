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
      {/* Header with Profile Link */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif text-sepia-900">Interlinear Reader</h1>
        <a
          href="/profile"
          className="px-4 py-2 text-sepia-700 border border-sepia-700 rounded-md hover:bg-sepia-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </a>
      </div>

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
        <a
          href="/tutor"
          className="px-6 py-3 font-serif text-sepia-600 hover:text-sepia-800 transition-colors flex items-center gap-2"
        >
          Tutor
          <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
        </a>
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
