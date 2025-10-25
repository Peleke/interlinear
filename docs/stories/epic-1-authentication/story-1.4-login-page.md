# Story 1.4: Login Page

## Story
**As a** returning user
**I want to** see a login page where I can enter my credentials
**So that** I can access my saved vocabulary

## Priority
**P0 - Day 1, Hour 3-4**

## Acceptance Criteria
- [ ] Login page accessible at `/login`
- [ ] Form with email and password inputs
- [ ] Submit button triggers signIn
- [ ] Loading state during auth
- [ ] Error messages display for invalid credentials
- [ ] Link to signup page
- [ ] Redirects to `/reader` on successful login
- [ ] Accessible form labels and ARIA attributes

## Technical Details

### Implementation (`app/login/page.tsx`)
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      router.push('/reader')
    } catch (err: any) {
      setError(err.message || 'Failed to log in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-serif text-center text-sepia-900">
          Welcome Back
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-sepia-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-sepia-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-sepia-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-sepia-300 rounded-md"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-sepia-700 text-white rounded-md hover:bg-sepia-800 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-sepia-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-sepia-800 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### Tasks
1. Create `app/login/page.tsx`
2. Implement form with email/password inputs
3. Wire up useAuth signIn method
4. Add error handling and display
5. Add loading state
6. Style with Tailwind (parchment theme)
7. Add navigation to signup
8. Test login flow

## Architecture References
- `/docs/prd/user-stories.md` - US-102
- `/docs/prd/design-system.md` - Color palette
- `/docs/architecture/frontend-architecture.md` - Page structure
- `/docs/architecture/coding-standards.md` - Form patterns

## Definition of Done
- [ ] Login form submits correctly
- [ ] Errors display properly
- [ ] Successful login redirects to reader
- [ ] Accessible (keyboard nav, ARIA)
- [ ] Styled per design system
