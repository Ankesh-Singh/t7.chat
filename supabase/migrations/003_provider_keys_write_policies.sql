-- Allow authenticated users to manage only their own encrypted provider keys.
-- Run after 001_auth_provider_keys.sql.

drop policy if exists "Users can insert their own provider keys" on public.provider_keys;
create policy "Users can insert their own provider keys"
  on public.provider_keys for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own provider keys" on public.provider_keys;
create policy "Users can update their own provider keys"
  on public.provider_keys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own provider keys" on public.provider_keys;
create policy "Users can delete their own provider keys"
  on public.provider_keys for delete
  using (auth.uid() = user_id);
