# Story 1.5: Signup Page

## Story
**As a** new user
**I want to** create an account with email and password
**So that** my vocabulary progress is saved

## Priority
**P0 - Day 1, Hour 4**

## Acceptance Criteria
- [ ] Signup page at `/signup`
- [ ] Email format validation
- [ ] Password strength validation (min 8 chars)
- [ ] Duplicate email error handling
- [ ] Success redirects to `/reader`
- [ ] Link to login page

## Technical Details
Similar to login page but uses `signUp` method. Form validates password length client-side before submission.

## Architecture References
- `/docs/prd/user-stories.md` - US-101
- `/docs/architecture/frontend-architecture.md`

## Definition of Done
- [ ] Signup form functional
- [ ] Validation works
- [ ] Errors display properly
- [ ] Redirects on success
