'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

export const dynamic = 'force-dynamic'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword, user } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated (no valid reset token)
  useEffect(() => {
    if (!user) {
      setError('Invalid or expired password reset link. Please request a new one.')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await updatePassword(password)
      // Success - redirect to login
      router.push('/login?password=reset')
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
        <div>
          <h1 className="text-3xl font-serif text-center text-sepia-900">
            Set New Password
          </h1>
          <p className="mt-2 text-center text-sm text-sepia-600">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-sepia-700">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full px-3 py-2 border border-sepia-300 rounded-md shadow-sm focus:outline-none focus:ring-sepia-500 focus:border-sepia-500"
              aria-required="true"
              aria-describedby="password-requirements"
            />
            <p id="password-requirements" className="mt-1 text-xs text-sepia-600">
              Minimum 8 characters
            </p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-sepia-700">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full px-3 py-2 border border-sepia-300 rounded-md shadow-sm focus:outline-none focus:ring-sepia-500 focus:border-sepia-500"
              aria-required="true"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !user}
            className="w-full py-2 px-4 bg-sepia-700 text-white rounded-md hover:bg-sepia-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
