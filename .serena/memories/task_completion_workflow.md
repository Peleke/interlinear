# Task Completion Workflow

## Before Starting a Task
1. Read the story file completely
2. Check architectural references
3. Understand acceptance criteria
4. Plan implementation approach

## During Implementation
1. **Write tests first** (TDD/BDD integrated)
2. Implement feature to pass tests
3. Follow coding standards strictly
4. Use type sharing from `packages/shared`
5. Never access `process.env` directly - use config objects

## After Implementation
1. **Run type check:** `npm run type-check`
2. **Run linter:** `npm run lint`
3. **Run tests:** `npm test` (when tests exist)
4. **Build verification:** `npm run build`
5. **Manual testing:** `npm run dev` - verify in browser

## Story File Updates
**ONLY update these sections:**
- Acceptance Criteria checkboxes `[x]`
- Definition of Done checkboxes `[x]`
- Dev Agent Record section:
  - Agent Model Used
  - Tasks Completed (with checkboxes)
  - File List (all new/modified/deleted files)
  - Completion Notes
  - Change Log
  - Status

**DO NOT modify:**
- Story description
- Technical Details
- Architecture References
- Any other sections

## Git Workflow
1. Ensure all changes committed
2. Create meaningful commit messages
3. Never commit to main/master directly
4. Use feature branches

## Quality Gates
- All tests passing
- No TypeScript errors
- No linting errors
- Build succeeds
- Manual verification complete

## Story Status Transitions
- **Draft** → Ready for Development (when AC clarified)
- **In Progress** → Ready for Review (when all tasks complete)
- **Ready for Review** → Complete (after QA approval)
