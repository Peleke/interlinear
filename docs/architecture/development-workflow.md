# Development Workflow

## Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/interlinear.git
cd interlinear

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Start Supabase local
cd apps/web
supabase start

# 5. Generate TypeScript types
npm run db:types

# 6. Start development server
npm run dev
```

## Development Commands

```bash
npm run dev              # Next.js dev server
npm run test             # Run all tests
npm run test:watch       # Watch mode (TDD)
npm run type-check       # TypeScript
npm run lint             # ESLint
npm run db:start         # Start Supabase
npm run db:types         # Generate types
npm run test:e2e         # Playwright
npm run build            # Production build
```

## BDD/TDD Development Workflow

**Red → Green → Refactor Cycle**

1. **Write failing test (RED)**
2. **Implement minimum code (GREEN)**
3. **Refactor (REFACTOR)**

Tests are written **alongside** features, not after.

---
