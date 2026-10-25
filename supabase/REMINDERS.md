# Workbook reminders

The existing GitHub Pages app now uses standard Web Push and the `workbook-reminders` Supabase Edge Function. No migration to Sites is involved.

## Phone setup

1. On iPhone, open the app in Safari and choose Share → Add to Home Screen. Keep “Open as Web App” on if shown.
2. Open that Home Screen icon and sign in.
3. Home → To do → Workbook reminders.
4. Enable the desired workbook, select its time and days, and save. Allow notifications when prompted.
5. Send a test for each workbook. Check the Lock Screen/Notification Center and tap through to the next unfinished item.

Settings are per account/device, not enabled automatically. The time zone is detected on first setup and stored as an IANA zone, so daylight saving is automatic. Update the zone after travel if desired. The default suggested times (10 AM and 3 PM) are inactive until explicitly saved/enabled.

## Runtime

- `public/manifest.webmanifest` and `public/sw.js` provide installation metadata and notification handling. The worker does not cache private data or provide offline access.
- `src/components/WorkbookReminders.jsx` manages opt-in, days, time, time zone, tests, and disabling.
- Notification links survive sign-in and use saved completion data to open the next unfinished lesson (or the workbook library when complete).
- `supabase/reminders.sql` is the source of the deployed schema and cron job. It is not an automatically rerunnable seed. Keys are provisioned separately and are never committed.
- A minute-based `pg_cron`/`pg_net` job calls the Edge Function with a server-only random scheduler credential. It makes no HTTP call when no devices are registered.
- Three server-only tables have RLS enabled and **no browser grants or browser policies**, intentionally. All reads/writes occur after Edge-side token validation and a current membership check. `service_role` is the only API role allowed to access them. The advisor's informational “RLS enabled no policy” notices for these tables are expected, not a missing public policy.
- `workbook_push_config` holds the signing keys and scheduler credential; this table must not be exported into client assets, exposed through public functions, or logged. The app receives only the public signing key. Rotating the signing key requires device re-subscription.
- The function handles its own authentication (`verify_jwt=false`): users are checked via `auth.getUser`, plus `app_members`; dispatch requests require a separate constant-time-checked scheduler secret. A publishable/anon API key alone is not authorization.
- Push endpoints are restricted to known HTTPS push-provider hosts. Redirects are forbidden, payloads are size-limited, tests are rate-limited per device, and logs do not contain endpoints, subscriptions, tokens, or reflections.
- A unique delivery record prevents routine duplicates per device, workbook, local date. Failed delivery attempts retry at most three times within five minutes; no late backlog is generated. A worker crash immediately after acceptance can produce a retry; stable notification tags replace the earlier visible notification. Expired subscriptions are removed.
- Push TTL is five minutes. Delivery timing is best effort, dependent on network, browser, push provider, Focus, and OS settings. These are wellness nudges, not medically critical alerts.
- Turning both off removes the subscription from the server and browser. Sign-out first disables this device’s reminders; if that fails, sign-out shows an error instead of silently leaving reminders on a shared phone.
- Routine delivery records are removed after 30 days. Device data cascades away when membership/account is removed.

## Verification

`node --test tests/reminders.test.js` covers schedules, disabled reminders, weekdays, daylight saving, midnight/date conversion, input validation, endpoint allowlisting, notification display, and click routing. `npm run build` verifies the React bundle.

Deployment smoke checks verify unauthenticated requests return 401, unauthorized dispatch returns 401, the scheduler returns 200, and browser roles cannot read/write server-only tables. Actual iPhone delivery and authenticated enable/save must be verified on the user's phone using the test buttons. No real-user notifications are sent during deployment.
