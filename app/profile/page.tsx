'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VocabularyService } from '@/lib/vocabulary'
import type { VocabularyStats } from '@/types'
import { useRouter } from 'next/navigation'
import { NotificationSettings } from '@/components/pwa/NotificationSettings'

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<VocabularyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Load vocabulary stats (non-blocking - fail gracefully)
      try {
        const vocabStats = await VocabularyService.getStats()
        setStats(vocabStats)
      } catch (statsError) {
        console.error('Error loading vocabulary stats:', statsError)
        // Continue without stats - profile page will still work
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Smart back navigation based on referrer or browser history
  const handleBackNavigation = () => {
    // Check if we can go back in browser history
    if (window.history.length > 1) {
      router.back()
    } else {
      // Fallback to dashboard if no history (e.g., direct link)
      router.push('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sepia-700" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackNavigation}
            className="text-sepia-700 hover:text-sepia-900 transition-colors inline-flex items-center gap-2 mb-4"
          >
            <span>←</span> Back
          </button>
          <h1 className="text-4xl font-serif text-sepia-900 mb-2">Profile</h1>
          <p className="text-sepia-600">Your account and learning progress</p>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg border border-sepia-200 shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-serif text-sepia-900 mb-4">Account</h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-sepia-600">Email</label>
              <p className="text-sepia-900">{user.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-sepia-600">Member Since</label>
              <p className="text-sepia-900">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Vocabulary Stats */}
        {stats && (
          <div className="bg-white rounded-lg border border-sepia-200 shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-serif text-sepia-900 mb-4">Learning Progress</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-sepia-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-sepia-900">{stats.totalWords}</div>
                <div className="text-sm text-sepia-600 mt-1">Total Words Saved</div>
              </div>

              <div className="bg-sepia-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-sepia-900">{stats.recentWords}</div>
                <div className="text-sm text-sepia-600 mt-1">Added This Week</div>
              </div>
            </div>

            {stats.topWords.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-serif text-sepia-900 mb-3">Most Studied Words</h3>
                <div className="space-y-2">
                  {stats.topWords.slice(0, 5).map((item: { word: string; count: number }, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-sepia-100 last:border-0">
                      <span className="font-medium text-sepia-900">{item.word}</span>
                      <span className="text-sm text-sepia-600">{item.count}× clicked</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <a
                href="/vocabulary"
                className="inline-block px-4 py-2 bg-sepia-700 text-white rounded-md hover:bg-sepia-800 transition-colors"
              >
                View All Vocabulary →
              </a>
            </div>
          </div>
        )}

        {/* Push Notifications */}
        <NotificationSettings userId={user?.id} />

        {/* Actions */}
        <div className="bg-white rounded-lg border border-sepia-200 shadow-sm p-6">
          <h2 className="text-2xl font-serif text-sepia-900 mb-4">Actions</h2>

          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
