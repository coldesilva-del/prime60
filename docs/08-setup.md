# Prime 60 — Developer Setup

For anyone setting up a local copy, including a future developer. Colin's own machine already has steps 1 to 3 done.

## 1. Prerequisites

- Node.js 22 or newer (24 is in use), npm 11
- Git
- A Supabase account with access to the Prime60 project (ref `yrvhyvenovctbzhqftre`, Sydney)
- No Docker needed. We do not run Supabase locally; migrations are applied to the cloud project.

## 2. Install

```bash
git clone https://github.com/<colin>/prime60.git
cd prime60
npm install
npx playwright install chromium   # only if you will run e2e tests or regenerate icons
```

## 3. Environment

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to find it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase, Project Settings, API | Safe in browser |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase, Project Settings, API Keys, publishable | Safe in browser |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally | Used in auth email links |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase, API Keys, secret | Server only. Needed for admin screen and account deletion |
| `MAILCHIMP_*` | Mailchimp account | Optional. Leave blank to store consent only |
| `SKOOL_INVITE_URL` | Skool | Optional |

Never commit `.env.local`. It is git-ignored.

## 4. Database

Migrations live in `supabase/migrations/` and are applied with the Supabase CLI.

```bash
npx supabase login                                   # once, opens a browser
npx supabase link --project-ref yrvhyvenovctbzhqftre # once, asks for the DB password
npm run db:push                                      # applies any unapplied migrations
```

After a schema change, regenerate the TypeScript types:

```bash
SUPABASE_PROJECT_REF=yrvhyvenovctbzhqftre npm run db:types
```

Rules: never edit a migration that has been applied; add a new file. Every table has Row Level Security. See `docs/04-data-model.md`.

## 5. Auth configuration in Supabase (one time)

In the Supabase dashboard, Authentication:

- URL configuration: Site URL `https://prime60.colindesilva.com`. Redirect URLs: `http://localhost:3000/**` and `https://prime60.colindesilva.com/**`.
- Email: enable "Confirm email". Set custom SMTP to Resend (host `smtp.resend.com`, port 465, user `resend`, password = Resend API key, sender `prime60@colindesilva.com`). Supabase's built-in sender is rate-limited to a few emails per hour and must not be used for real users.
- Email templates: the default templates work with the app's `/auth/callback` route. Optionally replace the confirm link with `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/welcome/1` to use the token-hash route.

These settings can also be pushed from `supabase/config.toml` with `npx supabase config push` once the project is linked.

## 6. Run

```bash
npm run dev
```

Open http://localhost:3000. Sign up with a real email you can read; verification is required.

## 7. Checks before committing

```bash
npm run typecheck
npm run lint
npm test
```

End-to-end tests (dev server must be running):

```bash
npm run test:e2e
```

## 8. Make Colin the admin

Admin is a flag on `profiles.is_admin`. After Colin's account exists, run this once in the Supabase SQL editor:

```sql
update public.profiles set is_admin = true
where user_id = (select id from auth.users where email = 'col.de.silva@gmail.com');
```

## 9. Where things are

See `docs/07-engineering-conventions.md` for the folder layout and data access rules.
