'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
        <div>
          <h1 className="text-3xl font-serif text-center text-sepia-900">
            Reset Password
          </h1>
          <p className="mt-2 text-center text-sm text-sepia-600">
            Enter your email to receive a password reset link
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="text-green-700 text-sm bg-green-50 p-4 rounded-md border border-green-200" role="alert">
              <p className="font-semibold mb-1">Check your email</p>
              <p className="text-xs">
                We&apos;ve sent a password reset link to <strong>{email}</strong>.
                Click the link in the email to reset your password.
              </p>
            </div>
            <Link
              href="/login"
              className="block text-center text-sm text-sepia-800 hover:underline font-medium"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-center text-sm text-sepia-600">
              Remember your password?{' '}
              <Link href="/login" className="text-sepia-800 hover:underline font-medium">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
