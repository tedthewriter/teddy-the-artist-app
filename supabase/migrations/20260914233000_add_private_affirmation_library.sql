alter table public.content_items
  add column if not exists affirmation_number smallint,
  add column if not exists asset_path text;

alter table public.content_items
  drop constraint if exists content_items_affirmation_number_check;

alter table public.content_items
  add constraint content_items_affirmation_number_check
  check (affirmation_number is null or affirmation_number between 1 and 107);

create unique index if not exists content_items_affirmation_number_unique
  on public.content_items (affirmation_number)
  where affirmation_number is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('affirmation-pins', 'affirmation-pins', false, 8388608, array['image/png'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members can view affirmation pins" on storage.objects;
create policy "Members can view affirmation pins"
on storage.objects for select
to authenticated
using (
  bucket_id = 'affirmation-pins'
  and exists (
    select 1 from public.app_members
    where app_members.user_id = auth.uid()
  )
);

drop policy if exists "Members can upload affirmation pins" on storage.objects;
create policy "Members can upload affirmation pins"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'affirmation-pins'
  and exists (
    select 1 from public.app_members
    where app_members.user_id = auth.uid()
  )
);

drop policy if exists "Members can update affirmation pins" on storage.objects;
create policy "Members can update affirmation pins"
on storage.objects for update
to authenticated
using (
  bucket_id = 'affirmation-pins'
  and exists (
    select 1 from public.app_members
    where app_members.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'affirmation-pins'
  and exists (
    select 1 from public.app_members
    where app_members.user_id = auth.uid()
  )
);
