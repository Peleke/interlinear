'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showVerificationReminder, setShowVerificationReminder] = useState(false)
  const [showPasswordResetSuccess, setShowPasswordResetSuccess] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if redirected from signup or password reset
  useEffect(() => {
    if (searchParams.get('verified') === 'pending') {
      setShowVerificationReminder(true)
    }
    if (searchParams.get('password') === 'reset') {
      setShowPasswordResetSuccess(true)
    }
  }, [searchParams])

  // Suppress hydration warnings from browser extensions (e.g., LastPass)
  if (typeof window !== 'undefined') {
    // Client-side only
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      router.push('/home')
    } catch (err: any) {
      setError(err.message || 'Failed to log in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
        <div>
          <h1 className="text-3xl font-serif text-center text-sepia-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-center text-sm text-sepia-600">
            Sign in to continue reading
          </p>
        </div>

        {showVerificationReminder && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-700" role="alert">
            <p className="font-semibold mb-1">Check your email</p>
            <p className="text-xs">Please verify your email address before logging in. Check your inbox for the verification link.</p>
          </div>
        )}

        {showPasswordResetSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-700" role="alert">
            <p className="font-semibold mb-1">Password updated successfully</p>
            <p className="text-xs">You can now log in with your new password.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-sepia-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-sepia-300 rounded-md shadow-sm focus:outline-none focus:ring-sepia-500 focus:border-sepia-500"
              aria-required="true"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-sepia-700">
                Password
              </label>
              <Link href="/reset-password" className="text-xs text-sepia-600 hover:text-sepia-800 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            disabled={loading}
            className="w-full py-2 px-4 bg-sepia-700 text-white rounded-md hover:bg-sepia-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-sepia-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-sepia-800 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
