'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface WordOfDay {
  id: string
  date: string
  language: string
  word: string
  pronunciation?: string
  partOfSpeech: string
  definitions: string[]
  staticContent: string
}

interface ExampleSentence {
  [key: string]: string // spanish/latin, english, context
}

export default function WordOfDayPage() {
  const [wordData, setWordData] = useState<WordOfDay | null>(null)
  const [sentences, setSentences] = useState<ExampleSentence[]>([])
  const [loading, setLoading] = useState(true)
  const [sentencesLoading, setSentencesLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<'spanish' | 'latin'>('spanish')
  const router = useRouter()
  const supabase = createClient()

  // Smart back navigation - intelligent context-aware routing
  const handleBackNavigation = () => {
    // Check referrer to understand where user came from
    const referrer = document.referrer
    const referrerUrl = referrer ? new URL(referrer) : null
    const referrerPath = referrerUrl?.pathname

    // If came from landing page (/), external site, or direct access -> go to dashboard
    if (!referrer || !referrerUrl || referrerPath === '/' || referrerUrl.origin !== window.location.origin) {
      router.push('/dashboard')
      return
    }

    // If came from a valid internal route -> smart back navigation
    const validRoutes = ['/dashboard', '/profile', '/vocabulary', '/login', '/settings']
    if (validRoutes.some(route => referrerPath?.startsWith(route))) {
      router.back()
    } else {
      // Unknown route or push notification -> default to dashboard
      router.push('/dashboard')
    }
  }

  useEffect(() => {
    loadWordOfDay()
  }, [])

  // Reload when language changes
  useEffect(() => {
    if (user !== null) { // Only reload after initial load
      loadWordOfDay(selectedLanguage)
    }
  }, [selectedLanguage])

  const loadWordOfDay = async (language?: 'spanish' | 'latin') => {
    try {
      setLoading(true)
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      let response;
      const targetLanguage = language || selectedLanguage

      if (user && !language) {
        // Fetch personalized word based on user preferences (initial load only)
        response = await fetch('/api/word-of-day', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })
      } else {
        // Fetch specific language or default to Spanish
        response = await fetch(`/api/word-of-day?language=${targetLanguage}`)
      }

      if (!response.ok) {
        const errorData = await response.json()

        if (response.status === 404) {
          console.log('No word available, showing fallback message')
          setWordData(null)
          return
        }

        throw new Error(errorData.message || 'Failed to fetch word')
      }

      const data = await response.json()
      setWordData(data.data)

      // Update selected language based on received data
      if (data.data && !language) {
        setSelectedLanguage(data.data.language as 'spanish' | 'latin')
      }

      // Load some initial example sentences
      if (data.data) {
        loadFreshSentences(data.data, 2) // Start with 2 sentences
      }

    } catch (error) {
      console.error('Error loading Word of Day:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFreshSentences = async (word: WordOfDay, count = 3) => {
    setSentencesLoading(true)
    try {
      const response = await fetch('/api/word-of-day/fresh-sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word.word,
          language: word.language,
          definitions: word.definitions,
          count
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSentences(data.sentences || [])
      } else {
        console.error('Failed to load fresh sentences')
        setSentences([])
      }
    } catch (error) {
      console.error('Error loading fresh sentences:', error)
      setSentences([])
    } finally {
      setSentencesLoading(false)
    }
  }

  const handleRefreshSentences = () => {
    if (wordData) {
      loadFreshSentences(wordData, 3)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sepia-700" />
      </div>
    )
  }

  if (!wordData) {
    return (
      <div className="min-h-screen bg-parchment">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <button
              onClick={handleBackNavigation}
              className="text-sepia-700 hover:text-sepia-900 transition-colors inline-flex items-center gap-2 mb-4"
            >
              <span>←</span> Back
            </button>
            <h1 className="text-4xl font-serif text-sepia-900 mb-2">Word of the Day</h1>
          </div>

          <div className="bg-white rounded-lg border border-sepia-200 shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-serif text-sepia-900 mb-4">No Word Available</h2>
            <p className="text-sepia-600 mb-6">
              There's no Word of the Day available yet. Check back later or help us generate one!
            </p>

            {user && (
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/profile')}
                  className="px-6 py-2 bg-sepia-700 text-white rounded-md hover:bg-sepia-800 transition-colors"
                >
                  Update Language Preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const isSpanish = wordData.language === 'spanish'
  const isLatin = wordData.language === 'latin'

  return (
    <div className="min-h-screen bg-parchment">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackNavigation}
            className="text-sepia-700 hover:text-sepia-900 transition-colors inline-flex items-center gap-2 mb-4"
          >
            <span>←</span> Back
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-serif text-sepia-900">
              {isSpanish && '🇪🇸 Palabra del Día'}
              {isLatin && '🏛️ Verbum Diei'}
            </h1>
            <span className="text-sm text-sepia-600 bg-sepia-50 px-3 py-1 rounded-full">
              {new Date(wordData.date).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex bg-white rounded-lg border border-sepia-200 shadow-sm p-1">
            <button
              onClick={() => setSelectedLanguage('spanish')}
              disabled={loading}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                selectedLanguage === 'spanish'
                  ? 'bg-sepia-700 text-white shadow-sm'
                  : 'text-sepia-700 hover:bg-sepia-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              🇪🇸 Español
            </button>
            <button
              onClick={() => setSelectedLanguage('latin')}
              disabled={loading}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                selectedLanguage === 'latin'
                  ? 'bg-sepia-700 text-white shadow-sm'
                  : 'text-sepia-700 hover:bg-sepia-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              🏛️ Latina
            </button>
          </div>
        </div>

        {/* Main Word Display */}
        <div className="bg-white rounded-lg border border-sepia-200 shadow-sm p-8 mb-6">
          {/* Word Header */}
          <div className="text-center mb-8">
            <h2 className="text-5xl font-serif text-sepia-900 mb-2">{wordData.word}</h2>

            {wordData.pronunciation && (
              <div className="text-lg text-sepia-600 mb-2">
                /{wordData.pronunciation}/
              </div>
            )}

            <span className="inline-block px-3 py-1 bg-sepia-100 text-sepia-700 rounded-full text-sm font-medium">
              {wordData.partOfSpeech}
            </span>
          </div>

          {/* Definitions */}
          <div className="mb-8">
            <h3 className="text-xl font-serif text-sepia-900 mb-4">
              {isSpanish && '📖 Definiciones'}
              {isLatin && '📖 Definitiones'}
            </h3>
            <div className="space-y-2">
              {wordData.definitions.map((definition, index) => (
                <div key={index} className="flex gap-3">
                  <span className="text-sepia-500 font-medium">{index + 1}.</span>
                  <span className="text-sepia-800">{definition}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Example Sentences */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif text-sepia-900">
                {isSpanish && '🎭 Ejemplos'}
                {isLatin && '🎭 Exempla'}
              </h3>
              <button
                onClick={handleRefreshSentences}
                disabled={sentencesLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {sentencesLoading ? '🔄 Generating...' : '🎲 New Examples'}
              </button>
            </div>

            {sentencesLoading ? (
              <div className="text-center py-8 text-sepia-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sepia-700 mx-auto mb-2" />
                Generating fresh examples...
              </div>
            ) : sentences.length > 0 ? (
              <div className="space-y-4">
                {sentences.map((sentence, index) => (
                  <div key={index} className="bg-sepia-50 rounded-lg p-4">
                    <p className="text-sepia-900 font-medium mb-1">
                      {isSpanish && sentence.spanish}
                      {isLatin && sentence.latin}
                    </p>
                    <p className="text-sepia-600 italic text-sm mb-1">
                      {sentence.english}
                    </p>
                    {sentence.context && (
                      <p className="text-sepia-500 text-xs">
                        {sentence.context}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sepia-600">
                Click "New Examples" to generate sentences using this word!
              </div>
            )}
          </div>

          {/* Static Content (Etymology, Usage) */}
          <div className="border-t border-sepia-200 pt-6">
            <div
              className="prose prose-sepia max-w-none"
              dangerouslySetInnerHTML={{ __html: wordData.staticContent || '' }}
            />
          </div>
        </div>

        {/* User Preferences Link */}
        {user && (
          <div className="text-center">
            <a
              href="/profile"
              className="text-sepia-700 hover:text-sepia-900 transition-colors"
            >
              ⚙️ Change language preferences
            </a>
          </div>
        )}
      </div>
    </div>
  )
}