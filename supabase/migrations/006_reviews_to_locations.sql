-- Migration 006 — Reviews belong to locations, not dishes
-- Reviews are now: who (user) tried what (their food_category) where (location).
-- The "dish" concept is dropped — it's implicit from the reviewer's profile.

-- ── 1. Drop views that depend on dishes ──────────────────────────────────────
drop view if exists dish_scores;
drop view if exists wrap_scores;

-- ── 2. Add location_id directly to reviews ───────────────────────────────────
alter table reviews add column if not exists location_id uuid references locations(id) on delete cascade;

-- ── 3. Migrate existing data: copy dish location_id → review location_id ─────
-- (safe no-op if dishes table is already empty)
update reviews r
set location_id = d.location_id
from dishes d
where r.dish_id = d.id
  and r.location_id is null;

-- ── 4. Drop dish_id from reviews ─────────────────────────────────────────────
alter table reviews drop column if exists dish_id;

-- ── 5. Drop dishes table (and its FK from comments) ──────────────────────────
-- Comments now belong to locations too
alter table comments drop column if exists dish_id;
alter table comments add column if not exists location_id uuid references locations(id) on delete cascade;

drop table if exists dishes cascade;

-- ── 6. Recreate location_scores view ─────────────────────────────────────────
-- Groups reviews by location. Each location can have many reviewers.
-- avg_composite averages across all reviews at that location.
create or replace view location_scores as
select
  l.id,
  l.name          as location_name,
  l.city          as location_city,
  l.address,
  l.is_chain,
  round(avg(r.composite)::numeric, 1)   as avg_composite,
  count(r.id)::integer                  as review_count,
  case
    when avg(r.composite) >= 90   then 'Must Try'
    when avg(r.composite) >= 75   then 'Solid'
    when avg(r.composite) >= 50   then 'Mid'
    when avg(r.composite) is null then null
    else 'Skip It'
  end                                   as tier,
  l.created_at
from locations l
left join reviews r on r.location_id = l.id
group by l.id, l.name, l.city, l.address, l.is_chain, l.created_at;

-- ── 7. RLS for review location_id ────────────────────────────────────────────
-- reviews policies already cover insert/update/delete by user_id — no change needed.

-- ── 8. RLS for comments location_id ─────────────────────────────────────────
drop policy if exists "comments_select" on comments;
drop policy if exists "comments_insert" on comments;
drop policy if exists "comments_delete" on comments;
create policy "comments_select" on comments for select using (true);
create policy "comments_insert" on comments for insert with check (auth.role() = 'authenticated');
create policy "comments_delete" on comments for delete using (auth.uid() = user_id);
