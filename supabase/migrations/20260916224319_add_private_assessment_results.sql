create table public.user_assessment_results (
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_key text not null check (assessment_key ~ '^[a-z0-9][a-z0-9_-]{0,99}$'),
  title text not null,
  results jsonb not null default '{}'::jsonb,
  received_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, assessment_key)
);

alter table public.user_assessment_results enable row level security;

revoke all on table public.user_assessment_results from anon, authenticated;
grant select on table public.user_assessment_results to authenticated;

create policy "Members can view their assessment results"
on public.user_assessment_results for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.app_members
    where app_members.user_id = (select auth.uid())
  )
);
