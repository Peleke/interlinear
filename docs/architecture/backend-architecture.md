# Backend Architecture

## Service Architecture

**Approach:** Next.js API Routes (serverless functions)

The backend consists of lightweight API Routes that proxy external services and coordinate with Supabase. No traditional Express/Fastify server needed.

### Function Organization

```
apps/web/src/app/api/v1/
├── dictionary/lookup/
│   ├── route.ts              # Dictionary proxy endpoint
│   └── route.test.ts
└── tts/speak/
    ├── route.ts              # TTS proxy endpoint
    └── route.test.ts
```

## Authentication and Authorization

- **Middleware for auth** - Supabase middleware handles session refresh + redirects globally
- **Service layer pattern** - VocabularyService abstracts Supabase queries
- **Error normalization** - All API errors return consistent format
- **RLS at database** - Security enforced by PostgreSQL policies

---
