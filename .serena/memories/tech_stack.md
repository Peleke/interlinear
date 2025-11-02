# Technology Stack

## Frontend
- **Framework:** Next.js 15.1.8 (App Router)
- **Language:** TypeScript 5.7.x (strict mode)
- **UI Library:** Custom components (no MUI/shadcn)
- **Styling:** Tailwind CSS 3.4.x
- **State Management:** React Context + Hooks
- **React Version:** 19.0.0

## Backend
- **API Routes:** Next.js API Routes (built-in)
- **API Style:** REST
- **Database:** PostgreSQL 15.x (Supabase managed)
- **Authentication:** Supabase Auth (PKCE flow)
- **Caching:** In-memory Map (server-side)

## External APIs
- **Dictionary:** Merriam-Webster Spanish Dictionary API
- **Text-to-Speech:** ElevenLabs TTS API

## Testing
- **Unit Tests:** Vitest + React Testing Library
- **E2E Tests:** Playwright
- **Type Checking:** TypeScript strict mode

## Build & Deploy
- **Build Tool:** npm (workspaces)
- **Bundler:** Turbopack (via Next.js)
- **IaC:** OpenTofu 1.8.x
- **CI/CD:** GitHub Actions
- **Platform:** Google Cloud Run
- **Monitoring:** Cloud Logging (GCP)

## Development
- **Package Manager:** npm 10.x
- **Node Version:** 20.x
- **Linting:** ESLint 9.16.0
- **Formatting:** Next.js built-in
