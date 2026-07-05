-- Migration: add avatar_url to profiles + avatar-photos storage bucket
-- Paste into Supabase SQL Editor and run.

-- 1. Column
alter table profiles
  add column if not exists avatar_url text;

-- 2. Storage bucket (public so <img> tags work without signed URLs)
insert into storage.buckets (id, name, public)
values ('avatar-photos', 'avatar-photos', true)
on conflict (id) do nothing;

-- 3. Storage RLS
--    Anyone can read avatars
create policy "avatar_photos_select"
  on storage.objects for select
  using (bucket_id = 'avatar-photos');

--    Authenticated users can upload, but only into their own folder
create policy "avatar_photos_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatar-photos'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

--    Users can replace/delete only their own avatar
create policy "avatar_photos_update"
  on storage.objects for update
  using (
    bucket_id = 'avatar-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatar_photos_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatar-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
