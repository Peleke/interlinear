# Story 1.3: Auth Provider & Context

## Story
**As a** developer
**I want to** create an AuthProvider component with React Context
**So that** auth state is globally accessible throughout the app

## Priority
**P0 - Day 1, Hour 3**

## Acceptance Criteria
- [ ] AuthProvider component created
- [ ] Auth context provides user, session, signIn, signUp, signOut methods
- [ ] Session state syncs with Supabase auth changes
- [ ] Loading state handled during auth checks
- [ ] TypeScript types defined for auth context

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
- [ ] AuthProvider renders without errors
- [ ] Auth state updates on login/logout
- [ ] useAuth hook accessible in components
- [ ] Loading state prevents flickering
- [ ] TypeScript fully typed
