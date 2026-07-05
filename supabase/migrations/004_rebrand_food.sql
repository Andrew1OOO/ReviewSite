-- Migration 004 — Rebrand to universal food review app
-- Run this in the Supabase SQL Editor.
-- Idempotent: safe to run more than once.

-- ── 0. Drop the view that depends on reviews.composite FIRST ─────────────────
-- Must happen before any column is dropped or renamed on reviews/wraps.
drop view if exists wrap_scores;
drop view if exists dish_scores;

-- ── 1. Rename axis columns on reviews ────────────────────────────────────────
-- chicken → taste, sauce → freshness, integrity → texture, balance → presentation
-- value stays as value (weight changes from 10% → 20%)

alter table reviews rename column chicken     to taste;
alter table reviews rename column sauce       to freshness;
alter table reviews rename column integrity   to texture;
alter table reviews rename column balance     to presentation;
-- value column name stays the same

alter table reviews rename column chicken_note     to taste_note;
alter table reviews rename column sauce_note       to freshness_note;
alter table reviews rename column integrity_note   to texture_note;
alter table reviews rename column balance_note     to presentation_note;
-- value_note column name stays the same

-- ── 2. Re-create the composite generated column with new weights ──────────────
-- Old: chicken*0.30 + sauce*0.30 + integrity*0.15 + balance*0.15 + value*0.10
-- New: taste*0.30   + freshness*0.20 + texture*0.15 + presentation*0.15 + value*0.20
-- (all weights × 10 to get 0–100 scale)

alter table reviews drop column composite;
alter table reviews add column composite numeric not null generated always as (
  round((taste * 0.30 + freshness * 0.20 + texture * 0.15 + presentation * 0.15 + value * 0.20) * 10, 1)
) stored;

-- ── 3. Add check constraints back ─────────────────────────────────────────────
alter table reviews add constraint taste_range        check (taste        >= 0 and taste        <= 10);
alter table reviews add constraint freshness_range    check (freshness    >= 0 and freshness    <= 10);
alter table reviews add constraint texture_range      check (texture      >= 0 and texture      <= 10);
alter table reviews add constraint presentation_range check (presentation >= 0 and presentation <= 10);

-- ── 4. Rename wraps table → dishes ───────────────────────────────────────────
-- (keep "wraps" as an alias view so old FK references still compile if needed)
alter table wraps rename to dishes;

-- Update FK on reviews
alter table reviews  drop constraint reviews_wrap_id_fkey;
alter table reviews  add  constraint reviews_dish_id_fkey
  foreign key (wrap_id) references dishes(id) on delete cascade;

-- Update FK on review_photos
alter table review_photos drop constraint review_photos_review_id_fkey;
alter table review_photos add  constraint review_photos_review_id_fkey
  foreign key (review_id) references reviews(id) on delete cascade;

-- Rename wrap_id column on reviews to dish_id
alter table reviews       rename column wrap_id to dish_id;

-- Rename wrap_id column on comments to dish_id
alter table comments drop constraint comments_wrap_id_fkey;
alter table comments rename column wrap_id to dish_id;
alter table comments add constraint comments_dish_id_fkey
  foreign key (dish_id) references dishes(id) on delete cascade;

-- Rename photo_url column on dishes (was wraps) — stays the same, no change needed

-- ── 5. Recreate view as dish_scores ──────────────────────────────────────────
create or replace view dish_scores as
select
  d.id,
  d.name,
  d.location_id,
  l.name          as location_name,
  l.city          as location_city,
  d.price,
  d.photo_url,
  round(avg(r.composite)::numeric, 1)        as avg_composite,
  count(r.id)::integer                       as review_count,
  round(avg(r.taste)::numeric, 1)            as avg_taste,
  round(avg(r.freshness)::numeric, 1)        as avg_freshness,
  round(avg(r.texture)::numeric, 1)          as avg_texture,
  round(avg(r.presentation)::numeric, 1)     as avg_presentation,
  round(avg(r.value)::numeric, 1)            as avg_value,
  case
    when avg(r.composite) >= 90   then 'Must Try'
    when avg(r.composite) >= 75   then 'Solid'
    when avg(r.composite) >= 50   then 'Mid'
    when avg(r.composite) is null then null
    else 'Skip It'
  end                                        as tier,
  d.created_at
from dishes d
join locations l on l.id = d.location_id
left join reviews r on r.dish_id = d.id
group by d.id, d.name, d.location_id, l.name, l.city, d.price, d.photo_url, d.created_at;

-- ── 6. Update RLS policies for renamed table ─────────────────────────────────
drop policy if exists "wraps_select" on dishes;
drop policy if exists "wraps_insert" on dishes;
create policy "dishes_select" on dishes for select using (true);
create policy "dishes_insert" on dishes for insert with check (auth.role() = 'authenticated');

-- ── 7. Update storage policy FK reference (storage keeps bucket names) ────────
-- No change needed — storage buckets are named 'wrap-photos' and 'review-photos',
-- those are just string names and don't reference the table.

-- ── 8. Update the reviews_update / delete policies (they reference user_id, no change) ──
-- Already correct — no action needed.
