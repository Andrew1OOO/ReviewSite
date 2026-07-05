-- Migration 003 — multi-reviewer support + profiles
-- Run this in the Supabase SQL Editor.
-- Idempotent: safe to run more than once.

-- ── 1. Profiles table ────────────────────────────────────────────────────────
-- One row per auth user, holding a display name chosen at sign-up or later.
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Anonymous',
  created_at   timestamptz not null default now()
);

-- RLS: anyone can read profiles, users can only update their own row.
alter table profiles enable row level security;
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Back-fill profiles for any existing users who signed up before this migration.
insert into profiles (id, display_name)
select
  id,
  coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

-- ── 2. Remove the implicit one-review-per-user limit ─────────────────────────
-- The old code redirected to /edit if a review existed, preventing a second
-- review. There is no DB unique constraint to drop — just a code-level guard
-- that will be removed. Nothing to run here.

-- ── 3. Update review comment ─────────────────────────────────────────────────
comment on table reviews is 'Multiple reviews per user per wrap are allowed.';
