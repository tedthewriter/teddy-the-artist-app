create table public.user_responses (
  user_id uuid not null references auth.users(id) on delete cascade,
  context_type text not null check (context_type in ('content', 'daily_plan', 'activity')),
  context_id text not null check (char_length(context_id) between 1 and 160),
  response_key text not null check (response_key ~ '^[a-z0-9][a-z0-9_-]{0,99}$'),
  content_id uuid references public.content_items(id) on delete cascade,
  response_kind text not null check (response_kind in ('text', 'single_choice', 'multi_choice', 'scale')),
  prompt_snapshot text not null default '',
  response_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, context_type, context_id, response_key),
  check (
    (context_type = 'content' and content_id is not null and context_id = content_id::text)
    or (context_type <> 'content' and content_id is null)
  )
);

alter table public.user_responses enable row level security;

revoke all on table public.user_responses from anon, authenticated;
grant select, insert, update, delete on table public.user_responses to authenticated;

create policy "Members can view their responses"
on public.user_responses for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create policy "Members can create their responses"
on public.user_responses for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create policy "Members can update their responses"
on public.user_responses for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create policy "Members can delete their responses"
on public.user_responses for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create index user_responses_content_id_idx
on public.user_responses (content_id)
where content_id is not null;
