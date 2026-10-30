-- Backfill observability fields for projects that already applied the original schema.
alter table public.inference_logs add column if not exists error text;

create index if not exists inference_logs_user_created_idx
  on public.inference_logs (user_id, created_at desc);
