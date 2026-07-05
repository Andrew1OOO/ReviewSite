-- Migration 005 — Custom rubrics + dynamic review scores
-- Run this in the Supabase SQL Editor AFTER migration 004.
-- Clean-slate migration: assumes no existing review data.

-- ── 1. Drop view + generated column that depend on reviews score columns ─────
drop view if exists dish_scores;
drop view if exists wrap_scores;

-- Drop the generated composite column before dropping the columns it depends on
alter table reviews drop column if exists composite;

-- ── 2. Add onboarding fields to profiles ─────────────────────────────────────
alter table profiles add column if not exists food_category    text;
alter table profiles add column if not exists onboarding_done  boolean not null default false;

-- ── 3. Rubric axes ────────────────────────────────────────────────────────────
-- Each user defines their own scoring axes for their food category.
create table if not exists rubric_axes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  description text,
  weight      numeric not null default 1,   -- relative weight, app normalises to sum=1
  position    integer not null default 0,   -- display order
  created_at  timestamptz not null default now()
);

alter table rubric_axes enable row level security;
create policy "rubric_axes_select" on rubric_axes for select using (true);
create policy "rubric_axes_insert" on rubric_axes for insert with check (auth.uid() = user_id);
create policy "rubric_axes_update" on rubric_axes for update using (auth.uid() = user_id);
create policy "rubric_axes_delete" on rubric_axes for delete using (auth.uid() = user_id);

-- ── 4. Drop old fixed score columns from reviews ──────────────────────────────
alter table reviews drop column if exists taste;
alter table reviews drop column if exists freshness;
alter table reviews drop column if exists texture;
alter table reviews drop column if exists presentation;
alter table reviews drop column if exists value;
alter table reviews drop column if exists composite;
alter table reviews drop column if exists taste_note;
alter table reviews drop column if exists freshness_note;
alter table reviews drop column if exists texture_note;
alter table reviews drop column if exists presentation_note;
alter table reviews drop column if exists value_note;
alter table reviews drop column if exists notes;
alter table reviews drop column if exists body;

-- ── 5. Add new columns to reviews ────────────────────────────────────────────
alter table reviews add column if not exists composite  numeric;   -- app-computed, stored on write
alter table reviews add column if not exists notes      text;      -- plain text fallback
alter table reviews add column if not exists body       jsonb;     -- blog-style blocks

-- ── 6. Review scores — one row per axis per review ───────────────────────────
create table if not exists review_scores (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references reviews(id) on delete cascade,
  axis_id     uuid not null references rubric_axes(id) on delete cascade,
  score       numeric not null check (score >= 0 and score <= 10),
  note        text,
  created_at  timestamptz not null default now(),
  unique (review_id, axis_id)
);

alter table review_scores enable row level security;
create policy "review_scores_select" on review_scores for select using (true);
create policy "review_scores_insert" on review_scores for insert with check (
  auth.uid() = (select user_id from reviews where id = review_scores.review_id)
);
create policy "review_scores_update" on review_scores for update using (
  auth.uid() = (select user_id from reviews where id = review_scores.review_id)
);
create policy "review_scores_delete" on review_scores for delete using (
  auth.uid() = (select user_id from reviews where id = review_scores.review_id)
);

-- ── 7. Recreate dish_scores view ──────────────────────────────────────────────
-- Groups by dish, averaged across all reviewers. Tier based on avg composite.
create or replace view dish_scores as
select
  d.id,
  d.name,
  d.location_id,
  l.name          as location_name,
  l.city          as location_city,
  d.price,
  d.photo_url,
  round(avg(r.composite)::numeric, 1)   as avg_composite,
  count(r.id)::integer                  as review_count,
  case
    when avg(r.composite) >= 90   then 'Must Try'
    when avg(r.composite) >= 75   then 'Solid'
    when avg(r.composite) >= 50   then 'Mid'
    when avg(r.composite) is null then null
    else 'Skip It'
  end                                   as tier,
  d.created_at
from dishes d
join locations l on l.id = d.location_id
left join reviews r on r.dish_id = d.id
group by d.id, d.name, d.location_id, l.name, l.city, d.price, d.photo_url, d.created_at;
