# Prime 60 launch checklist

Twenty checks Colin asked for on 7 October 2026, what was found, what was changed, and how to re-run each check. Items marked **Colin** need something only he can do.

| # | Check | Status | Notes |
| --- | --- | --- | --- |
| 1 | Mobile responsive | Pass | Every public page checked at 375 px with no horizontal scroll. Playwright runs the suite on an iPhone 13 profile. |
| 2 | Clear CTAs | Pass | One primary action per public page ("Claim founding place N of 100"), repeated at the end of long pages. Scorecard added as a softer entry point. |
| 3 | SEO setup | Done | Added `robots.txt` (signed-in areas disallowed), `sitemap.xml` (public pages only), canonical URLs via `metadataBase`, per-page titles and descriptions. |
| 4 | Meta tags | Done | Open Graph and Twitter card tags on every page, a generated 1200×630 preview image (`/opengraph-image`), locale `en_AU`, apple-touch-icon. |
| 5 | Fast loading | Pass, with notes | Lighthouse before changes: desktop 98, mobile 81 (measured from the US; the server is in Singapore). Founding count is now cached for 30 s to cut server response time. See the Lighthouse table below for after. |
| 6 | Image optimisation | Pass | The only images are the app icons and the optional vision photo (served through `next/image`). The install guide's screenshots are not yet supplied; the figures hide themselves until the files exist in `public/images/install/`. **Colin**: six phone screenshots if wanted. |
| 7 | Alt text | Pass | Every `<img>`/`<Image>` has alt text; decorative icons are `aria-hidden`. |
| 8 | Broken links | Pass | `node scripts/check-links.mjs <url>` crawls every public page and asset: 13 URLs, 0 broken. |
| 9 | 404 page | Done | Unknown addresses used to redirect to sign-in. Now they return a real 404 with a branded page and a way back. Signed-in areas still redirect. |
| 10 | Favicon | Pass | `favicon.ico`, 192/512 PWA icons, maskable icon and apple-touch-icon all return 200 and are declared in metadata and the manifest. |
| 11 | Form validation | Pass | Zod schemas on every form, server-side, with field-level errors (e2e "sign-up validates before submitting"). |
| 12 | Error states | Done | Added a branded error boundary (`app/error.tsx`) with Try again, and a 404 page. Existing: offline page, form errors, empty states. A separate task is open for a stale session on a deleted account. |
| 13 | Accessibility | Pass | New `e2e/a11y.spec.ts` runs axe (WCAG 2.1 A and AA) on nine public pages in light and dark mode, on Chromium, WebKit and Firefox: 0 violations. Fixed: inline links now underlined, not colour-only. |
| 14 | Colour contrast | Fixed | Measured every text token on every surface. `ink-faint` was 2.4:1 (light) and 3.6:1 (dark); `brass` was 2.5:1 on light. Tokens changed to 4.5:1 or better: ink-faint #646C76 / #8C97A3, brass #866C3B (light). Design doc updated. |
| 15 | Analytics | Done | First-party, cookieless page-view counts for the public pages (path, day, referring site; no IP, device or identifier), shown under More → Admin. The privacy policy says exactly this. No third-party script, so the "no trackers" promise holds. |
| 16 | Privacy policy | Updated | Analytics paragraph added, dated 7 October 2026. **Colin**: lawyer review before launch. |
| 17 | Secure APIs | Pass | Service role key server-only; RLS on every table with an isolation test (`npm run db:rls-test`); page-view counter is a security-definer function the browser cannot call; HSTS header added to the existing nosniff, frame-deny, referrer and permissions headers. |
| 18 | Core Web Vitals | See table | CLS 0 on both profiles. LCP 2.3 s mobile from the US. See below. |
| 19 | Browser testing | Pass | Public and accessibility suites pass on Chromium (phone and desktop), WebKit (iPhone 13) and Firefox (desktop). Signed-in journey suite runs on Chromium with a test account. |
| 20 | Final QA | Pass | Typecheck, lint, 123 unit tests, e2e, link crawl, and a live smoke test after deploy. |

## Lighthouse (live site, measured from a US runner)

| Profile | When | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile | before | 81 | 96 | 100 | 91 | 2.3 s | 0 | 390 ms |
| Desktop | before | 98 | 96 | 100 | 91 | 0.7 s | 0 | 10 ms |
| Mobile | after | 81 | 100 | 100 | 100 | 2.2 s | 0 | 410 ms |
| Desktop | after | 87 | 100 | 100 | 100 | 1.2 s | 0 | 40 ms |

Accessibility, best practices and SEO are now 100 on both profiles. Performance is held back by one thing: time to first byte of 1 to 2 seconds for every request, including static files such as the favicon that never touch the application. Measured from Brisbane and from a US runner alike, so it is the network path through Railway's edge to the Singapore region, not the code. Worth testing before launch: moving the Railway service to US West (where the edge appears to terminate) and comparing, or enabling the Cloudflare proxy (orange cloud) on the DNS record. The in-app pages are unaffected once loaded because navigation is client-side.

Below-threshold audits before: colour contrast (fixed), robots.txt missing (fixed), server response time (cached), speed index on mobile (fonts and JS; acceptable for a text page). Users in Australia will see better numbers than a US runner does.

## Competitor review

Five sites reviewed on 7 October 2026 for what they do well on their public page, and what was taken from each.

| Site | What they do well | Taken for Prime 60 |
| --- | --- | --- |
| Fabulous (thefabulous.co) | A "science behind it" section, an interactive "choose your answer" entry point, FAQ | "Built on how habits actually change" section; the one-minute scorecard as a soft entry point |
| Habitify (habitify.me) | A sample day laid out hour by hour; feature grid tied to outcomes; real app screenshots | "What a day looks like" timeline. Screenshots deferred until Colin has real data to show |
| Streaks (streaksapp.com) | Extreme simplicity, one idea per screen, flexibility ("set the days so you don't break your streak") | Kept the page to one idea per section; "Designed for real life" list |
| Caliber (caliberstrong.com) | Three-step "how it works" with icons; member stories in the first person; one measurable claim | Three-step layout already present; member stories reserved for beta users (no invented testimonials) |
| Future (future.co) | Price and refund terms directly under the CTA; "designed for real life"; a one-minute quiz; a consistency statistic | Cost and risk reversal under every CTA; "Designed for real life" section; the scorecard quiz |

Not adopted on purpose: app-store badges and ratings (no native app), leaderboards and challenges (against the product's non-judgmental stance), invented testimonials and statistics (none exist yet), cookie banners (no tracking cookies to consent to).

## How to re-run the checks

```bash
npm run typecheck && npm run lint && npm test
npm run build && npm start -- -p 3100
node scripts/check-links.mjs http://localhost:3100
E2E_BASE_URL=http://localhost:3100 npx playwright test e2e/public.spec.ts e2e/a11y.spec.ts
npx lighthouse https://prime60.colindesilva.com/ --form-factor=mobile --screenEmulation.mobile --view
```
