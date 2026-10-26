-- Workbook reminder infrastructure. No reminders are enabled by this script.
-- The authenticated Edge endpoint must check membership. Existing membership
-- grants are intentionally restricted, so grant only the column it needs.
grant select (user_id) on public.app_members to service_role;
-- Specific reminder text uses approved lesson titles and completion IDs only.
grant select (id, title, content_type, framework, sort_order, approved, active) on public.content_items to service_role;
grant select (user_id, content_id) on public.user_content_completions to service_role;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Server-only configuration. Private keys never go to browsers or source control.
create table public.workbook_push_config (
  id boolean primary key default true check (id),
  public_key text not null,
  private_key text not null,
  cron_secret text not null
);
create table public.workbook_push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_members(user_id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  timezone text not null,
  schedules jsonb not null,
  updated_at timestamptz not null default now(),
  last_test_at timestamptz
);
create index workbook_push_devices_user_idx on public.workbook_push_devices(user_id);
create table public.workbook_push_deliveries (
  device_id uuid not null references public.workbook_push_devices(id) on delete cascade,
  kind text not null check (kind in ('cbt', 'self-love')),
  local_date date not null,
  status text not null check (status in ('pending', 'sent', 'failed')),
  attempts integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (device_id, kind, local_date)
);
alter table public.workbook_push_config enable row level security;
alter table public.workbook_push_devices enable row level security;
alter table public.workbook_push_deliveries enable row level security;
revoke all on public.workbook_push_config, public.workbook_push_devices, public.workbook_push_deliveries from public, anon, authenticated;
grant all on public.workbook_push_config, public.workbook_push_devices, public.workbook_push_deliveries to service_role;

-- Invoker-only, service-only RPC makes the delivery claim atomic across workers.
create function public.claim_workbook_push(p_device uuid, p_kind text, p_date date)
returns boolean language sql security invoker set search_path = '' as $$
  with claim as (
    insert into public.workbook_push_deliveries(device_id, kind, local_date, status)
    values (p_device, p_kind, p_date, 'pending')
    on conflict (device_id, kind, local_date) do update
      set status='pending', attempts=workbook_push_deliveries.attempts+1, updated_at=now()
      where workbook_push_deliveries.attempts < 3
        and (workbook_push_deliveries.status='failed'
          or (workbook_push_deliveries.status='pending' and workbook_push_deliveries.updated_at < now()-interval '2 minutes'))
    returning 1
  ) select exists(select 1 from claim);
$$;
revoke all on function public.claim_workbook_push(uuid,text,date) from public, anon, authenticated;
grant execute on function public.claim_workbook_push(uuid,text,date) to service_role;

select cron.schedule('teddy-workbook-reminders', '* * * * *', $job$
  select net.http_post(
    url := 'https://oxsvnebnyepcfxzwqbne.supabase.co/functions/v1/workbook-reminders',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-reminder-secret',(select cron_secret from public.workbook_push_config where id)),
    body := '{"action":"dispatch"}'::jsonb,
    timeout_milliseconds := 30000
  ) where exists (select 1 from public.workbook_push_devices);
  delete from public.workbook_push_deliveries where local_date < current_date - 30;
$job$);
