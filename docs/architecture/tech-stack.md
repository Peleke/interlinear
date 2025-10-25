# Tech Stack

This is the **DEFINITIVE** technology selection. All development uses these exact versions.

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| **Frontend Language** | TypeScript | 5.7.x | Type-safe React/Next.js development | PRD requires strict mode; catches errors at compile-time vs runtime |
| **Frontend Framework** | Next.js | 15.1.8 | App Router with RSC + API Routes | PRD-mandated; server components reduce bundle size, built-in API routing |
| **UI Component Library** | None (Custom) | N/A | Atomic React components | Custom design system (parchment theme) incompatible with MUI/shadcn defaults |
| **State Management** | React Context + Hooks | 19.x | Global auth/vocabulary state | Sufficient for MVP scope; avoid Redux complexity for 48-hour timeline |
| **Backend Language** | TypeScript | 5.7.x | API Routes + Supabase client | Shared types between frontend/backend via `packages/shared` |
| **Backend Framework** | Next.js API Routes | 15.1.8 | Proxy for external APIs | Built into Next.js; zero extra setup vs Express/Fastify |
| **API Style** | REST (Next.js Routes) | N/A | `/api/v1/dictionary`, `/api/v1/tts` endpoints | Simple request/response pattern; no GraphQL overhead needed |
| **Database** | PostgreSQL (Supabase) | 15.x | User auth + vocabulary storage | Supabase managed; RLS policies enforce security at DB layer |
| **Cache** | In-Memory (Map) | N/A | Dictionary/audio cache (server-side) | Demo scope; Redis overkill, localStorage sufficient for MVP |
| **File Storage** | N/A | N/A | No file uploads in PRD | Audio is streamed, not stored |
| **Authentication** | Supabase Auth (PKCE) | 2.47.x | Email/password login | BaaS eliminates custom auth; PKCE flow for SSR security |
| **Frontend Testing** | Vitest + RTL | Latest | Component unit tests (integrated with dev) | Faster than Jest; ESM-native, aligns with Next.js |
| **Backend Testing** | Vitest | Latest | API route tests (integrated with dev) | Same tooling as frontend for consistency |
| **E2E Testing** | Playwright | Latest | Critical path: paste → click → audio | PRD mentions Playwright; browser automation for TTS validation |
| **Build Tool** | npm | 10.x | Workspaces for monorepo | Zero config; already have npm with Node 20 |
| **Bundler** | Turbopack (via Next.js) | 15.1.8 | Dev server bundling | Next.js default; faster than Webpack |
| **IaC Tool** | OpenTofu | 1.8.x | Cloud Run + GCP infrastructure | PRD-mandated; Terraform-compatible, open-source |
| **CI/CD** | GitHub Actions | N/A | Build → Test → Deploy pipeline | Free for public repos; tight GitHub integration |
| **Monitoring** | Cloud Logging (GCP) | N/A | Error logs + request traces | Built into Cloud Run; no extra setup |
| **Logging** | Console + Cloud Logging | N/A | Structured logs (`console.log` → GCP) | Cloud Run auto-captures stdout |
| **CSS Framework** | Tailwind CSS | 3.4.x | Utility-first styling + custom theme | PRD design system (parchment, sepia, gold) via `tailwind.config` |

## Key Decisions

1. **No separate backend server** - Next.js API Routes handle Merriam-Webster/ElevenLabs proxying
2. **Supabase over custom DB** - Managed Postgres + Auth + RLS = 80% less backend code
3. **Vitest over Jest** - Faster, modern, better Next.js 15 compatibility
4. **Tailwind over CSS-in-JS** - PRD design system needs custom tokens; utility classes faster than styled-components
5. **Tests written WITH features** - BDD/TDD integrated into dev workflow (not post-delivery)

## External Dependencies

- **Merriam-Webster Spanish Dictionary API** - Word definitions (free tier: 1k requests/day)
- **ElevenLabs TTS API** - Spanish pronunciation (free tier: 10k characters/month)

## Shared Package (`packages/shared`)

```typescript
// Example: Shared types used by frontend + backend
export interface VocabularyEntry {
  id: string;
  user_id: string;
  word: string;
  definition: DefinitionResponse; // From Merriam-Webster
  language: 'es';
  click_count: number;
  created_at: string;
}

export interface DefinitionResponse {
  word: string;
  partOfSpeech: string;
  translations: string[];
  examples?: string[];
}
```

---
