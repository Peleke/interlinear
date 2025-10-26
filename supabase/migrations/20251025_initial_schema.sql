-- Migration: Initial Schema
-- Created: 2025-10-25
-- Description: Create vocabulary_entries table with RLS policies

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table is automatically created by Supabase Auth
-- We only need to create the vocabulary_entries table

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

-- Enable Row Level Security
alter table public.vocabulary_entries enable row level security;

-- RLS Policies: Users can only access their own vocabulary
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
