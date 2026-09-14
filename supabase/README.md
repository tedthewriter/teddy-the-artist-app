# Supabase database

The schema migration is kept here so the application's security model is reviewable.

The approved therapy content itself is intentionally stored only in the private Supabase project. It is not committed to this public repository.

Access uses two layers:

1. Supabase email/password authentication.
2. An explicit row in `app_members` for each permitted account.

All exposed tables use Row Level Security. The app does not track completion, scores, or streaks.

