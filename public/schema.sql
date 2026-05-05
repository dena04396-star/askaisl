-- Askaisl – Supabase schema
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/_/sql

-- ──────────────────────────────────────────────────────────────────
-- interviews
-- ──────────────────────────────────────────────────────────────────
create table if not exists interviews (
  id          uuid primary key default gen_random_uuid(),
  language    text not null default 'en',
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────
-- messages
-- ──────────────────────────────────────────────────────────────────
create table if not exists messages (
  id            uuid primary key default gen_random_uuid(),
  interview_id  uuid references interviews(id) on delete cascade,
  role          text not null check (role in ('user', 'assistant', 'system')),
  content       text not null,
  created_at    timestamptz not null default now()
);

create index if not exists messages_interview_id_idx on messages (interview_id);

-- ──────────────────────────────────────────────────────────────────
-- transcripts  (full serialised conversation per session)
-- ──────────────────────────────────────────────────────────────────
create table if not exists transcripts (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  messages    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists transcripts_session_id_idx on transcripts (session_id);

-- ──────────────────────────────────────────────────────────────────
-- summaries
-- ──────────────────────────────────────────────────────────────────
create table if not exists summaries (
  id            uuid primary key default gen_random_uuid(),
  session_id    text not null,
  raw           text not null,
  score         smallint,
  created_at    timestamptz not null default now()
);

create index if not exists summaries_session_id_idx on summaries (session_id);
