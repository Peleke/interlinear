# Codebase Structure

## Root Directory
```
interlinear/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles + Tailwind
├── components/            # React components (to be created)
├── lib/                   # Utilities and helpers (to be created)
├── packages/
│   └── shared/           # Shared types (to be created)
├── docs/                 # Documentation
│   ├── prd/             # Product requirements (sharded)
│   ├── architecture/    # Technical architecture (sharded)
│   └── stories/         # Epic and story files
├── .bmad-core/          # BMAD framework configuration
├── .claude/             # Claude Code slash commands
├── next.config.ts       # Next.js configuration
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.ts   # Tailwind configuration
├── postcss.config.mjs   # PostCSS configuration
├── package.json         # Dependencies
└── .env.local.example   # Environment template
```

## App Router Structure (Next.js 15)
- **app/**: Main application code
  - Routes defined by folder structure
  - Each route can have `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
  - API routes in `app/api/`

## Future Structure (as built)
```
app/
├── (auth)/              # Authentication pages
│   ├── login/
│   └── signup/
├── (protected)/         # Protected routes
│   ├── reader/
│   └── vocabulary/
├── api/
│   └── v1/
│       ├── dictionary/
│       └── tts/
└── layout.tsx
```

## Component Organization
- Co-locate tests with components
- Co-locate styles when component-specific
- Atomic design pattern (atoms, molecules, organisms)

## Type Organization
- Shared types in `packages/shared/types`
- Component-specific types in component files
- API types separate from UI types
