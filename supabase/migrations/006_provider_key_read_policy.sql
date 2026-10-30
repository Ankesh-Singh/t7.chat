-- Allow an authenticated user to read only their own encrypted provider keys.
-- The server decrypts them before returning them to the same authenticated browser.

drop policy if exists "Users can read their own provider keys" on public.provider_keys;
create policy "Users can read their own provider keys"
  on public.provider_keys for select
  using (auth.uid() = user_id);
