-- Drew's Caesar Wraps — Supabase SQL Migration
-- Paste this entire file into the Supabase SQL Editor and run it.

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists locations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text not null,
  city        text not null,
  lat         double precision,
  lng         double precision,
  is_chain    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists wraps (
  id          uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  name        text not null,
  price       numeric,
  photo_url   text,
  created_at  timestamptz not null default now()
);

create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  wrap_id     uuid not null references wraps(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  chicken     numeric not null check (chicken >= 0 and chicken <= 10),
  sauce       numeric not null check (sauce >= 0 and sauce <= 10),
  integrity   numeric not null check (integrity >= 0 and integrity <= 10),
  balance     numeric not null check (balance >= 0 and balance <= 10),
  value       numeric not null check (value >= 0 and value <= 10),
  composite   numeric not null generated always as (
    round((chicken * 0.30 + sauce * 0.30 + integrity * 0.15 + balance * 0.15 + value * 0.10) * 10, 1)
  ) stored,
  notes          text,          -- plain-text fallback / legacy notes
  body           jsonb,         -- blog-style ordered blocks: heading | text | image
  chicken_note   text,
  sauce_note     text,
  integrity_note text,
  balance_note   text,
  value_note     text,
  created_at  timestamptz not null default now()
);

create table if not exists review_photos (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references reviews(id) on delete cascade,
  photo_url   text not null,
  "order"     integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  wrap_id     uuid not null references wraps(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- WRAP SCORES VIEW
-- ============================================================

create or replace view wrap_scores as
select
  w.id,
  w.name,
  w.location_id,
  l.name          as location_name,
  l.city          as location_city,
  w.price,
  w.photo_url,
  round(avg(r.composite)::numeric, 1)     as avg_composite,
  count(r.id)::integer                    as review_count,
  round(avg(r.chicken)::numeric, 1)       as avg_chicken,
  round(avg(r.sauce)::numeric, 1)         as avg_sauce,
  round(avg(r.integrity)::numeric, 1)     as avg_integrity,
  round(avg(r.balance)::numeric, 1)       as avg_balance,
  round(avg(r.value)::numeric, 1)         as avg_value,
  case
    when avg(r.composite) >= 90   then 'Drew Approved'
    when avg(r.composite) >= 75   then 'Solid'
    when avg(r.composite) >= 50   then 'Mid'
    when avg(r.composite) is null then null
    else 'Wall of Shame'
  end                                     as tier,
  w.created_at
from wraps w
join locations l on l.id = w.location_id
left join reviews r on r.wrap_id = w.id
group by w.id, w.name, w.location_id, l.name, l.city, w.price, w.photo_url, w.created_at;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table locations    enable row level security;
alter table wraps        enable row level security;
alter table reviews      enable row level security;
alter table review_photos enable row level security;
alter table comments     enable row level security;

-- locations: anyone reads, authenticated inserts
create policy "locations_select" on locations for select using (true);
create policy "locations_insert" on locations for insert with check (auth.role() = 'authenticated');

-- wraps: anyone reads, authenticated inserts
create policy "wraps_select" on wraps for select using (true);
create policy "wraps_insert" on wraps for insert with check (auth.role() = 'authenticated');

-- reviews: anyone reads, authenticated inserts, own update/delete
create policy "reviews_select" on reviews for select using (true);
create policy "reviews_insert" on reviews for insert with check (auth.role() = 'authenticated');
create policy "reviews_update" on reviews for update using (auth.uid() = user_id);
create policy "reviews_delete" on reviews for delete using (auth.uid() = user_id);

-- review_photos: anyone reads, authenticated inserts, own delete
create policy "review_photos_select" on review_photos for select using (true);
create policy "review_photos_insert" on review_photos for insert with check (auth.role() = 'authenticated');
create policy "review_photos_delete" on review_photos for delete using (
  auth.uid() = (select user_id from reviews where id = review_photos.review_id)
);

-- comments: anyone reads, authenticated inserts, own delete
create policy "comments_select" on comments for select using (true);
create policy "comments_insert" on comments for insert with check (auth.role() = 'authenticated');
create policy "comments_delete" on comments for delete using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

-- Run these in the Supabase dashboard Storage section OR via SQL:
insert into storage.buckets (id, name, public)
values ('wrap-photos', 'wrap-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

-- Storage RLS: anyone can read, authenticated users can upload
create policy "wrap_photos_select" on storage.objects for select using (bucket_id = 'wrap-photos');
create policy "wrap_photos_insert" on storage.objects for insert with check (
  bucket_id = 'wrap-photos' and auth.role() = 'authenticated'
);

create policy "review_photos_storage_select" on storage.objects for select using (bucket_id = 'review-photos');
create policy "review_photos_storage_insert" on storage.objects for insert with check (
  bucket_id = 'review-photos' and auth.role() = 'authenticated'
);
create policy "review_photos_storage_delete" on storage.objects for delete using (
  bucket_id = 'review-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
