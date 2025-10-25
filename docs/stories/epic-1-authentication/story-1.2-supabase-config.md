# Story 1.2: Supabase Auth Configuration

## Story
**As a** developer
**I want to** configure Supabase client and run database migrations
**So that** the application can authenticate users and store data

## Priority
**P0 - Day 1, Hours 2-3**

## Acceptance Criteria
- [ ] Supabase project created
- [ ] Database schema migrated (users, vocabulary_entries tables)
- [ ] RLS policies configured
- [ ] Supabase client utility created
- [ ] Auth flow tested locally
- [ ] Environment variables set

## Technical Details

### Database Schema (from `/docs/architecture/database-schema.md`)
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (handled by Supabase Auth automatically)

-- Vocabulary entries table
create table public.vocabulary_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  word text not null,
  definition jsonb not null,
  language text not null default 'es',
  click_count integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.vocabulary_entries enable row level security;

create policy "Users can view own vocabulary"
  on public.vocabulary_entries
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own vocabulary"
  on public.vocabulary_entries
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own vocabulary"
  on public.vocabulary_entries
  for update to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own vocabulary"
  on public.vocabulary_entries
  for delete to authenticated
  using (auth.uid() = user_id);

-- Indexes for performance
create index vocabulary_entries_user_id_idx on public.vocabulary_entries(user_id);
create index vocabulary_entries_word_idx on public.vocabulary_entries(word);
```

### Supabase Client Utility
Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### Tasks
1. Create Supabase project at supabase.com
2. Run SQL migrations in Supabase dashboard
3. Copy project URL and anon key to `.env.local`
4. Create `lib/supabase/` directory
5. Implement client and server utilities
6. Test connection with simple query

## Architecture References
- `/docs/architecture/database-schema.md` - Complete schema
- `/docs/architecture/backend-architecture.md` - Supabase patterns
- `/docs/prd/database-schema.md` - PRD requirements

## Definition of Done
- [ ] Supabase project operational
- [ ] All tables created with RLS enabled
- [ ] Client utilities tested
- [ ] No TypeScript errors
- [ ] Environment variables working
