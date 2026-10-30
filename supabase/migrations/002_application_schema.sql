-- Application data used by the chat, analytics, and failure logging routes.
-- Run this after 001_auth_provider_keys.sql with the Supabase Postgres DATABASE_URL.

create table if not exists public.sessions (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_active timestamptz not null default now(),
  cancelled boolean not null default false
);

alter table public.sessions add column if not exists user_id uuid references auth.users(id) on delete set null;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.inference_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  provider text not null,
  model text not null,
  latency_ms integer not null default 0,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  status text not null default 'success',
  input_preview text not null default '',
  output_preview text not null default '',
  error text,
  created_at timestamptz not null default now()
);

alter table public.inference_logs add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.inference_logs add column if not exists error text;

create table if not exists public.failed_logs (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null default '{}'::jsonb,
  error text not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_last_active_idx on public.sessions (user_id, last_active desc);
create index if not exists messages_session_created_idx on public.messages (session_id, created_at);
create index if not exists inference_logs_user_created_idx on public.inference_logs (user_id, created_at desc);

alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.inference_logs enable row level security;
alter table public.failed_logs enable row level security;

drop policy if exists "Users can read their own sessions" on public.sessions;
create policy "Users can read their own sessions" on public.sessions for select using (auth.uid() = user_id);

drop policy if exists "Users can read their own messages" on public.messages;
create policy "Users can read their own messages" on public.messages for select using (exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid()));

drop policy if exists "Users can read their own inference logs" on public.inference_logs;
create policy "Users can read their own inference logs" on public.inference_logs for select using (auth.uid() = user_id);
