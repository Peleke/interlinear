# Story 1.6: Protected Routes & Middleware

## Story
**As a** developer
**I want to** protect `/reader` and `/vocabulary` routes
**So that** only authenticated users can access them

## Priority
**P0 - Day 1, Hour 4**

## Acceptance Criteria
- [ ] Middleware checks auth on protected routes
- [ ] Unauthenticated users redirect to `/login`
- [ ] Auth state persists on reload
- [ ] Logout button clears session

## Technical Details
Create `middleware.ts` using Supabase middleware pattern. Add logout button to reader layout.

## Architecture References
- `/docs/architecture/backend-architecture.md` - Middleware
- `/docs/prd/user-stories.md` - US-103

## Definition of Done
- [ ] Protected routes require auth
- [ ] Redirects work correctly
- [ ] Session persists
- [ ] Logout functional
