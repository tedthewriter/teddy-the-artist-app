create table public.app_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  display_name text,
  created_at timestamptz not null default now()
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  framework text not null,
  content_type text not null,
  title text not null,
  short_description text not null,
  body jsonb not null default '{}'::jsonb,
  reflection_prompt text,
  faith_reflection text,
  source_title text,
  source_note text,
  estimated_minutes smallint check (estimated_minutes is null or estimated_minutes between 1 and 180),
  energy_level text check (energy_level is null or energy_level in ('low', 'medium', 'high')),
  approved boolean not null default false,
  available_on_demand boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_cbt_week smallint not null default 1 check (current_cbt_week between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  plan_items jsonb not null default '[]'::jsonb,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create table public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

alter table public.app_members enable row level security;
alter table public.content_items enable row level security;
alter table public.user_preferences enable row level security;
alter table public.daily_plans enable row level security;
alter table public.user_favorites enable row level security;

revoke all on table public.app_members from anon, authenticated;
revoke all on table public.content_items from anon, authenticated;
revoke all on table public.user_preferences from anon, authenticated;
revoke all on table public.daily_plans from anon, authenticated;
revoke all on table public.user_favorites from anon, authenticated;

grant select on table public.app_members to authenticated;
grant select on table public.content_items to authenticated;
grant select, insert, update, delete on table public.user_preferences to authenticated;
grant select, insert, update, delete on table public.daily_plans to authenticated;
grant select, insert, delete on table public.user_favorites to authenticated;

create policy "Members can view their own membership"
on public.app_members for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Members can view approved content"
on public.content_items for select
to authenticated
using (
  approved and active
  and exists (
    select 1 from public.app_members
    where app_members.user_id = (select auth.uid())
  )
);

create policy "Members can view their preferences"
on public.user_preferences for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create policy "Members can create their preferences"
on public.user_preferences for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create policy "Members can update their preferences"
on public.user_preferences for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create policy "Members can view their daily plans"
on public.daily_plans for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create policy "Members can create their daily plans"
on public.daily_plans for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create policy "Members can update their daily plans"
on public.daily_plans for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create policy "Members can delete their daily plans"
on public.daily_plans for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create policy "Members can view their favorites"
on public.user_favorites for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create policy "Members can add their favorites"
on public.user_favorites for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create policy "Members can remove their favorites"
on public.user_favorites for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where app_members.user_id = (select auth.uid()))
);

create index content_items_library_order_idx
on public.content_items (category, framework, content_type, sort_order)
where approved and active;

create index daily_plans_user_date_idx
on public.daily_plans (user_id, plan_date);
