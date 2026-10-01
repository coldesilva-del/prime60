# Prime 60 — Deployment Runbook (Railway)

The app runs as one Railway service built from the GitHub repository. Supabase stays on supabase.com. Every push to `main` deploys.

## First deployment

1. **Repository.** Push this folder to the private GitHub repository `prime60` (`main` branch).
2. **Railway service.** In Railway, New Project, Deploy from GitHub repo, choose `prime60`. Railway detects Next.js and uses `npm run build` and `npm start`. Node version is read from `package.json` `engines` (set to 22 or newer).
3. **Variables.** In the service, Variables, add exactly these:

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://yrvhyvenovctbzhqftre.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from Supabase API Keys |
   | `NEXT_PUBLIC_APP_URL` | `https://prime60.colindesilva.com` |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase API Keys (secret). Paste it yourself; never share it in chat |
   | `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`, `MAILCHIMP_AUDIENCE_ID` | when Mailchimp is set up |
   | `SKOOL_INVITE_URL` | when the Skool community exists |
   | `NODE_ENV` | `production` |

   `PORT` is injected by Railway and `next start` reads it automatically.
4. **Domain.** Service, Settings, Networking, Custom Domain: `prime60.colindesilva.com`. Railway shows a CNAME target. Add that CNAME at your DNS provider. Railway issues the TLS certificate automatically once DNS resolves.
5. **Supabase auth URLs.** Set the Site URL and Redirect URLs as in `docs/08-setup.md` section 5, otherwise verification links will not return to the app.
6. **Database.** From a machine linked to the project: `npm run db:push`.
7. **Smoke test.** Open the domain, sign up with a test email, verify, complete onboarding, do a morning and evening check-in, confirm the score appears. Then delete the test account from More, Account.
8. **Supabase plan.** Upgrade the project to Pro before announcing to the audience: daily backups, no pausing after inactivity.

## Every later deployment

Push to `main`. Railway builds and swaps the service. If a migration is included, run `npm run db:push` before or immediately after the push; migrations are additive so either order is safe for the app.

## Rollback

Railway, Deployments, pick the previous successful deployment, Redeploy. Database migrations are not rolled back; write a new migration to reverse a change if needed.

## Health checks and logs

Railway, Observability shows build and runtime logs. The app has no third-party error service in V1. Watch for `Could not load profile` and auth callback redirects to `/sign-in?error=link`, which indicate URL configuration problems in Supabase.

## Costs at launch

Railway Hobby or Pro depending on the account, a few dollars a month for this service. Supabase Pro US$25 a month. Resend free tier covers thousands of auth emails. Mailchimp depends on the audience size.
