drop policy if exists "Members can mark eligible lessons done"
on public.user_content_completions;

create policy "Members can mark eligible lessons done"
on public.user_content_completions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.app_members
    where app_members.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.content_items
    where content_items.id = user_content_completions.content_id
      and content_items.approved
      and content_items.active
      and content_items.framework in (
        'cbt_7_weeks',
        'cbt_skill_library',
        'positive_intelligence'
      )
  )
);
