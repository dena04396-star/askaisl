-- Interview sessions table
-- Run this in your Supabase SQL editor or via the Supabase CLI

create table if not exists interview_sessions (
  id               uuid        primary key default gen_random_uuid(),
  token            text        unique not null,
  title            text        not null default 'Untitled Session',
  study_type       text        not null default 'behavioral',
  language         text        not null default 'en',
  product_category text        not null default '',
  created_by       uuid        references auth.users(id) on delete cascade,
  status           text        not null default 'active'
                               check (status in ('active', 'closed')),
  created_at       timestamptz default now()
);

-- Row-level security
alter table interview_sessions enable row level security;

-- Authenticated owners can read/write their own sessions
create policy "owners_all" on interview_sessions
  for all
  using  (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Anyone (including anonymous) can read a session by its token
-- (needed for the /session/[token] respondent page)
create policy "public_read" on interview_sessions
  for select
  using (true);
