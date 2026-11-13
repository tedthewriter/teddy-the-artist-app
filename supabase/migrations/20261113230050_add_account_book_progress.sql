-- Applied as the add_account_book_progress hosted migration.
create table public.user_book_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null check (book_id in (
    'disney-characters', 'pixar', 'disney-lectures-one', 'disney-lectures-two',
    'small-acrylic', 'more-small-acrylic', 'watercolor'
  )),
  item_id integer not null check (item_id between 1 and 10000),
  completed boolean not null,
  primary key (user_id, book_id, item_id)
);

alter table public.user_book_progress enable row level security;
revoke all on public.user_book_progress from public, anon, authenticated;
grant select, insert, update on public.user_book_progress to authenticated;

create policy "Members can read their book progress"
on public.user_book_progress for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where user_id = (select auth.uid()))
);
create policy "Members can add their book progress"
on public.user_book_progress for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where user_id = (select auth.uid()))
);
create policy "Members can change their book progress"
on public.user_book_progress for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where user_id = (select auth.uid()))
)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.app_members where user_id = (select auth.uid()))
);
-- Keep completed=false rows: they prevent legacy imports resurrecting cleared marks.
