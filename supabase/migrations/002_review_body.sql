-- Migration 002 — Blog-style review bodies + per-axis notes
-- Run this in the Supabase SQL Editor on an existing database.
-- Idempotent: safe to run more than once.

alter table reviews add column if not exists body           jsonb;
alter table reviews add column if not exists chicken_note   text;
alter table reviews add column if not exists sauce_note     text;
alter table reviews add column if not exists integrity_note text;
alter table reviews add column if not exists balance_note   text;
alter table reviews add column if not exists value_note     text;
