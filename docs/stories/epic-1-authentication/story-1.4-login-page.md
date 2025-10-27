# Story 1.4: Login Page

## Story
**As a** returning user
**I want to** see a login page where I can enter my credentials
**So that** I can access my saved vocabulary

## Priority
**P0 - Day 1, Hour 3-4**

## Acceptance Criteria
- [x] Login page accessible at `/login`
- [x] Form with email and password inputs
- [x] Submit button triggers signIn
- [x] Loading state during auth
- [x] Error messages display for invalid credentials
- [x] Link to signup page
- [x] Redirects to `/reader` on successful login
- [x] Accessible form labels and ARIA attributes

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
- [x] Login form submits correctly
- [x] Errors display properly
- [x] Successful login redirects to reader
- [x] Accessible (keyboard nav, ARIA)
- [x] Styled per design system

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (20250929)

### Tasks Completed
- [x] Created app/login/page.tsx with complete form implementation
- [x] Integrated useAuth hook for signIn method
- [x] Added email/password inputs with proper types and autocomplete
- [x] Implemented loading state (button disabled during auth)
- [x] Added error handling with role="alert" and aria-live
- [x] Styled with parchment/sepia design system
- [x] Added accessibility attributes (labels, ARIA, autocomplete)
- [x] Added link to signup page
- [x] Configured redirect to /reader on success
- [x] Extended Tailwind config with design system colors

### File List
- `app/login/page.tsx` - Login page with form and auth integration
- `tailwind.config.ts` - Added parchment, sepia, gold, crimson colors + serif font

### Design System Implementation
**Colors added:**
- `parchment` (#F9F6F0) - Warm background
- `sepia` (50-900 scale) - UI elements
- `gold` (#D4A574) - Accents
- `crimson` (#A4443E) - Errors
- `ink` (#1A1614) - Text

**Typography:**
- `font-serif` - Merriweather for headings
- `font-sans` - Apple system fonts for UI

### Accessibility Features
- Proper form labels with `htmlFor`
- `autocomplete` attributes for browser autofill
- `aria-required` on inputs
- `role="alert"` and `aria-live="polite"` on error messages
- Keyboard navigation support
- Focus states with ring utilities
- Disabled state with visual feedback

### Completion Notes
- Build successful: /login route generated
- No TypeScript errors
- Ready for Story 1.5 (Signup page)
- Form connects to AuthProvider's signIn method

### Change Log
- 2025-10-25: Login page implemented with design system

### Status
**Ready for Review**
