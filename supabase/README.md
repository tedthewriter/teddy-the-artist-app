# Supabase database

The schema migration is kept here so the application's security model is reviewable.

The approved therapy content itself is intentionally stored only in the private Supabase project. It is not committed to this public repository.

Access uses two layers:

1. Supabase email/password authentication.
2. An explicit row in `app_members` for each permitted account.

All exposed tables use Row Level Security. Members’ saved workbook responses and book checklists are private to their account.


## Book checklist progress

`migrations/20261113230050_add_account_book_progress.sql` records the hosted `add_account_book_progress` migration.
All seven art book checklists save individual checked/unchecked items in
`user_book_progress`, restricted to the signed-in member's own rows. Explicit
unchecked rows prevent an older device's one-time import from restoring a mark
that was cleared elsewhere. Each browser imports existing local book progress
when the app opens online. Local caches and queued changes support offline use;
opening the app or reconnecting retries them. Open book pages refresh account
progress every ten seconds and when brought back into view.
