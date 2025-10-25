# Epic 1: Authentication & Onboarding

## Overview
Implement user authentication using Supabase Auth to enable account creation, login, session persistence, and protected routes.

## Goals
- Users can create accounts with email/password
- Users can log in and maintain sessions
- Protected routes require authentication
- Sessions persist across browser sessions

## User Stories
- US-101: User Registration
- US-102: User Login
- US-103: Session Persistence

## Technical Approach
- Supabase Auth with PKCE flow
- Next.js 15 App Router with middleware for route protection
- AuthProvider context for global auth state
- Server Components for initial auth check

## Priority
**P0 - Day 1 AM (Hours 1-4)**

## Dependencies
- Supabase project created
- Environment variables configured
- Database tables migrated

## Stories
1. [Story 1.1: Project Initialization & Setup](./story-1.1-project-setup.md)
2. [Story 1.2: Supabase Auth Configuration](./story-1.2-supabase-config.md)
3. [Story 1.3: Auth Provider & Context](./story-1.3-auth-provider.md)
4. [Story 1.4: Login Page](./story-1.4-login-page.md)
5. [Story 1.5: Signup Page](./story-1.5-signup-page.md)
6. [Story 1.6: Protected Routes](./story-1.6-protected-routes.md)

## Success Criteria
- [ ] User can sign up with valid email/password
- [ ] User can log in with credentials
- [ ] Session persists on page reload
- [ ] Protected routes redirect unauthenticated users
- [ ] Logout clears session
