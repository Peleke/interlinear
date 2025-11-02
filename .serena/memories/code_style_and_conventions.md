# Code Style and Conventions

## Critical Fullstack Rules
1. **Type Sharing:** Always define types in `packages/shared` and import from there
2. **API Calls:** Never make direct HTTP calls - use the service layer
3. **Environment Variables:** Access only through config objects, never `process.env` directly
4. **Error Handling:** All API routes must use the standard error handler
5. **State Updates:** Never mutate state directly - use proper state management patterns
6. **Test-Driven:** Write test BEFORE implementing feature (BDD/TDD integrated)
7. **File Co-location:** Keep tests, styles, and related files next to their components

## Naming Conventions

### Frontend
- **Components:** PascalCase (e.g., `UserProfile.tsx`)
- **Hooks:** camelCase with 'use' prefix (e.g., `useAuth.ts`)
- **Files:** Match component name exactly

### Backend
- **API Routes:** kebab-case (e.g., `/api/v1/user-profile`)
- **Database Tables:** snake_case (e.g., `user_profiles`)

## TypeScript Standards
- **Strict Mode:** Always enabled
- **Type Imports:** Use `import type` for type-only imports
- **Interfaces vs Types:** Prefer interfaces for public APIs
- **No `any`:** Explicitly type everything

## Component Structure
```typescript
// 1. Imports (types first)
import type { FC } from 'react'
import { useState } from 'react'

// 2. Type definitions
interface Props {
  // ...
}

// 3. Component
export const Component: FC<Props> = ({ props }) => {
  // hooks first
  const [state, setState] = useState()
  
  // event handlers
  const handleClick = () => {}
  
  // render
  return <div>...</div>
}
```

## File Organization
- Tests next to source files: `Component.test.tsx`
- Styles co-located when component-specific
- Shared types in `packages/shared/types`
