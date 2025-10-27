# Story 1.3: Auth Provider & Context

## Story
**As a** developer
**I want to** create an AuthProvider component with React Context
**So that** auth state is globally accessible throughout the app

## Priority
**P0 - Day 1, Hour 3**

## Acceptance Criteria
- [x] AuthProvider component created
- [x] Auth context provides user, session, signIn, signUp, signOut methods
- [x] Session state syncs with Supabase auth changes
- [x] Loading state handled during auth checks
- [x] TypeScript types defined for auth context

## Technical Details

### Implementation (`components/providers/AuthProvider.tsx`)
```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    session,
    loading,
    signIn: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    signUp: async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### Tasks
1. Create `components/providers/AuthProvider.tsx`
2. Implement AuthContext with user/session state
3. Add auth methods (signIn, signUp, signOut)
4. Handle loading state
5. Wrap app with AuthProvider in root layout
6. Create `useAuth` custom hook
7. Add TypeScript types

## Architecture References
- `/docs/architecture/components.md` - AuthProvider spec
- `/docs/architecture/frontend-architecture.md` - Context patterns
- `/docs/architecture/coding-standards.md` - React patterns

## Definition of Done
- [x] AuthProvider renders without errors
- [x] Auth state updates on login/logout
- [x] useAuth hook accessible in components
- [x] Loading state prevents flickering
- [x] TypeScript fully typed

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (20250929)

### Tasks Completed
- [x] Created components/providers/AuthProvider.tsx with full implementation
- [x] Implemented AuthContext with user/session state management
- [x] Added signIn, signUp, signOut methods
- [x] Integrated Supabase auth state change listener
- [x] Handled loading state to prevent UI flicker
- [x] Created useAuth custom hook with error handling
- [x] Wrapped app with AuthProvider in root layout
- [x] Added complete TypeScript typing for AuthContextType

### File List
- `components/providers/AuthProvider.tsx` - Auth context provider with hooks
- `app/layout.tsx` - Updated to wrap app with AuthProvider

### Implementation Details
**AuthContext provides:**
- `user: User | null` - Current authenticated user
- `session: Session | null` - Current session object
- `loading: boolean` - Prevents showing wrong UI before auth check
- `signIn(email, password)` - Sign in with Supabase
- `signUp(email, password)` - Create new account
- `signOut()` - Sign out current user

**Auth State Management:**
- Initial session loaded on mount via `getSession()`
- Real-time updates via `onAuthStateChange` listener
- Subscription cleanup on unmount
- Loading state managed throughout lifecycle

**useAuth Hook:**
- Type-safe access to auth context
- Throws error if used outside AuthProvider
- Accessible in any component via `const { user, signIn } = useAuth()`

### Completion Notes
- Build successful with AuthProvider integrated
- No TypeScript errors
- Ready for Login/Signup page implementation (Stories 1.4, 1.5)
- Auth state globally accessible throughout app

### Change Log
- 2025-10-25: Auth Provider and Context implemented

### Status
**Ready for Review**
