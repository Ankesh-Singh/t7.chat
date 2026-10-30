-- Allow authenticated users to persist their own chat and telemetry rows when
-- the server is using the request JWT with the Supabase anon key.

drop policy if exists "Users can insert their own sessions" on public.sessions;
create policy "Users can insert their own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own sessions" on public.sessions;
create policy "Users can update their own sessions"
  on public.sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert their own messages" on public.messages;
create policy "Users can insert their own messages"
  on public.messages for insert
  with check (exists (
    select 1 from public.sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));

drop policy if exists "Users can insert their own inference logs" on public.inference_logs;
create policy "Users can insert their own inference logs"
  on public.inference_logs for insert
  with check (auth.uid() = user_id);
