# Story 1.1: Project Initialization & Setup

## Story
**As a** developer
**I want to** initialize a Next.js 15 project with TypeScript and required dependencies
**So that** I have the foundation to build the Interlinear application

## Priority
**P0 - Day 1, Hour 1**

## Acceptance Criteria
- [ ] Next.js 15 project created with TypeScript
- [ ] Dependencies installed: `@supabase/ssr`, `@supabase/supabase-js`, `tailwindcss`
- [ ] ESLint and TypeScript configured
- [ ] `.env.local.example` file created with required variables
- [ ] Git repository initialized with `.gitignore`
- [ ] Project runs with `npm run dev` successfully
- [ ] Tailwind CSS configured and working

## Technical Details

### Required Dependencies
```json
{
  "dependencies": {
    "next": "^15.1.8",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.47.10"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.2",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.16.0",
    "eslint-config-next": "^15.1.8"
  }
}
```

### Environment Variables Template
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Merriam-Webster API
MERRIAM_WEBSTER_API_KEY=your-api-key

# ElevenLabs API
ELEVENLABS_API_KEY=your-api-key
```

### Tasks
1. Run `npx create-next-app@latest interlinear --typescript --tailwind --app`
2. Install Supabase dependencies: `npm install @supabase/ssr @supabase/supabase-js`
3. Configure `tsconfig.json` with strict mode
4. Create `.env.local.example`
5. Initialize Git: `git init && git add . && git commit -m "Initial commit"`
6. Test dev server: `npm run dev`

## Architecture References
- `/docs/architecture/tech-stack.md` - Technology choices
- `/docs/architecture/unified-project-structure.md` - Directory structure
- `/docs/architecture/coding-standards.md` - Code style rules

## Definition of Done
- [ ] Project builds without errors
- [ ] TypeScript strict mode enabled
- [ ] Tailwind configured with Next.js
- [ ] Environment variables documented
- [ ] Initial commit pushed to Git
