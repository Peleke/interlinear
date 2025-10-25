# Frontend Architecture

## Component Architecture

### Component Organization

```
apps/web/src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (Server Component)
│   ├── page.tsx                 # Landing page → redirect
│   ├── globals.css              # Tailwind + design system
│   ├── (auth)/                  # Route group (auth pages)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/                   # Route group (authenticated)
│   │   ├── layout.tsx           # App layout with AuthProvider
│   │   └── reader/page.tsx
│   └── api/v1/                  # API Routes
│       ├── dictionary/lookup/route.ts
│       └── tts/speak/route.ts
├── components/                  # React components
│   ├── providers/
│   ├── reader/
│   └── ui/
├── lib/                         # Utilities and services
│   ├── supabase/
│   └── services/
└── hooks/                       # Custom React hooks
```

## State Management Architecture

- **Context API for global state** - Auth, vocabulary cache
- **Local component state** - UI state (selected word, sidebar open/closed)
- **Server state via RSC** - Initial data fetching in Server Components
- **Optimistic updates** - Update UI immediately, sync to DB async

## Routing Architecture

```
/                    → Redirect to /login or /reader
/login               → LoginPage
/signup              → SignupPage
/reader              → ReaderPage (protected)
/api/v1/dictionary/lookup → Dictionary proxy
/api/v1/tts/speak    → TTS proxy
```

## Design System Integration (Tailwind)

```css
/* apps/web/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@theme {
  /* Colors - Warm manuscript theme */
  --color-parchment: #F9F6F0;
  --color-ink: #1A1614;
  --color-gold: #D4A574;
  --color-sepia: #8B7355;
  --color-crimson: #A4443E;

  /* Typography */
  --font-reading: 'Merriweather', Georgia, serif;
  --font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---
