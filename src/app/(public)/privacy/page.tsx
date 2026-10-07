// Draft for legal review before launch.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy policy" };

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-4 text-lg font-semibold text-ink">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="measure text-base text-ink">{children}</p>;
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="measure list-disc space-y-1 pl-5 text-base text-ink">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <article className="space-y-5">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-ink">Privacy policy</h1>
        <p className="text-sm text-ink-soft">Effective 1 October 2026. Updated 7 October 2026.</p>
      </div>

      <P>
        Prime 60 is operated by Colin de Silva in Queensland, Australia. This policy explains what
        information Prime 60 collects, why, where it is kept, who can see it and what you can do about it.
        It is written to comply with the Privacy Act 1988 (Cth) and the Australian Privacy Principles.
      </P>
      <P>
        The short version: your entries are yours. They are stored in Australia, encrypted, visible only to
        you, never sold, and never used for advertising. You can export or delete everything from inside the
        app.
      </P>

      <H2>Who we are</H2>
      <P>
        Prime 60 is a sole-operator service. The operator is Colin de Silva, trading from Queensland,
        Australia. Questions and requests about privacy go to{" "}
        <a href="mailto:privacy@colindesilva.com" className="text-harbour underline-offset-4 hover:underline">
          privacy@colindesilva.com
        </a>
        .
      </P>

      <H2>What we collect</H2>
      <P>Account information:</P>
      <Ul
        items={[
          "Your email address, used to sign in and to send transactional email such as verification and password reset links.",
          "Your first name, used to address you inside the app.",
          "Your timezone, the year you are building toward and, if you choose to give it, your birth year.",
          "Account status such as whether your email is verified, your plan, and whether you have opted in to marketing email and when.",
        ]}
      />
      <P>Your own entries, which you create by using the service:</P>
      <Ul
        items={[
          "Daily check-ins: what you did, how you rated your energy, your scores and any closing line you write.",
          "Health measurements you choose to record, such as weight, body fat, sleep, steps and training notes, together with your targets.",
          "Notes about your relationships: the people you add, how often you intend to connect, and interactions you log.",
          "Reflections and goals: your North Star, identity statements, non-negotiables, patterns and replacement behaviours, Courage Reps, I'm Stuck sessions, ideas, projects, weekly reviews, 90-day cycles and any images you add to Vision.",
        ]}
      />
      <P>
        Technical information needed to run the service: a session cookie, and server logs that record
        errors and request timing. We do not collect your location, contacts or device identifiers.
      </P>

      <H2>Health information is sensitive information</H2>
      <P>
        Health measurements and notes about your wellbeing are sensitive information under the Privacy Act.
        Prime 60 collects them only with your consent, which you give by entering them, and only for the
        purpose of showing them back to you and computing your scores and trends. You can leave every health
        field blank, hide fields you do not use, or switch to the mode that records only whether you trained
        and checked in with a coach.
      </P>

      <H2>Why we collect it</H2>
      <Ul
        items={[
          "To provide the service: to sign you in, show your Today, compute your Prime Score and Trajectory, and keep your history.",
          "To communicate with you about your account, such as verification, password reset and important changes to the service.",
          "With your separate consent, to send occasional email from Colin about Prime 60.",
          "To keep the service secure and working, using error logs.",
        ]}
      />
      <P>
        We do not use your entries to build advertising profiles, to train models, or for any purpose you
        would not reasonably expect. We do not sell personal information.
      </P>

      <H2>Where it is stored</H2>
      <P>
        Your data is stored in a Supabase project hosted in the Sydney, Australia region, encrypted at rest and
        in transit. The application server runs on Railway. Backups are kept by Supabase for up to 30 days.
      </P>

      <H2>Who can access it</H2>
      <Ul
        items={[
          "You. Row level security in the database means your account can read and write only your own rows.",
          "The operator, only to help you when you ask for support and consent to it, or when the law requires it. The operator can see aggregate numbers such as how many members are active, and the email addresses and first names of members who have opted in to email.",
          "No one else. We do not share, rent or sell personal information.",
        ]}
      />

      <H2>Third parties we rely on</H2>
      <Ul
        items={[
          "Supabase, for database hosting and authentication. Your data is held in their Sydney region.",
          "Railway, which runs the application server. Your data passes through it while a page is served and is not stored there.",
          "Resend, which delivers transactional email such as verification and password reset links. It receives your email address and the content of those messages.",
          "Mailchimp, only if you opt in to marketing email. It receives your email address and first name, and a tag that identifies you as a Prime 60 member. Nothing else is sent. Withdrawing consent in the app removes the tag.",
        ]}
      />
      <P>
        Each of these providers may store data outside Australia for the limited purpose described. We
        choose providers with appropriate security practices and limit what they receive to what they need.
      </P>

      <H2>No advertising or analytics trackers</H2>
      <P>
        Prime 60 contains no advertising, no third-party analytics and no tracking pixels. We do not use
        Google Analytics, Meta pixels or similar tools. We keep our own count of how many times each public
        page (the front page, the letter, the scorecard and the sign-up page) is viewed each day, and which
        website the visitor came from. That count holds no cookie, IP address, device detail or anything else
        that could identify you.
      </P>

      <H2>Cookies</H2>
      <P>
        Prime 60 uses only the cookies needed to keep you signed in. Your theme preference is stored on your
        device. There are no marketing or tracking cookies.
      </P>

      <H2>How long we keep it</H2>
      <P>
        We keep your information for as long as you have an account. When you delete your account, every row
        you own is removed at once. Copies may persist in encrypted backups for up to 30 days, after which
        they are gone. Server logs are kept for a short period for troubleshooting and do not contain your
        entries.
      </P>

      <H2>Your rights</H2>
      <Ul
        items={[
          "Access and export: from Account you can download everything you have entered as one file, at any time.",
          "Correction: you can edit your profile and any entry in the app. If something cannot be changed in the app, email us and we will fix it.",
          "Deletion: from Account you can delete your account and all of its data by typing a confirmation. No email or waiting period is required.",
          "Marketing choice: you can opt in or out of email from Colin at any time from Account, and every marketing email has an unsubscribe link.",
          "Complaint: if you believe we have mishandled your information, email privacy@colindesilva.com and we will respond within 30 days. If you are not satisfied, you can complain to the Office of the Australian Information Commissioner at oaic.gov.au.",
        ]}
      />

      <H2>Security</H2>
      <P>
        Data is encrypted in transit and at rest. Every table is protected by row level security. Secrets are
        held in server environment variables and never sent to the browser. Access to the production
        database is limited to the operator. No system is perfectly secure, so if we become aware of a breach
        that is likely to cause serious harm we will notify you and the OAIC as the Notifiable Data Breaches
        scheme requires.
      </P>

      <H2>Children</H2>
      <P>
        Prime 60 is for adults. You must be 18 or older to create an account. If we learn that an account
        belongs to someone under 18 we will delete it.
      </P>

      <H2>Changes to this policy</H2>
      <P>
        If we change this policy in a way that matters we will tell you by email or inside the app before the
        change takes effect. The current version is always at this address.
      </P>

      <H2>Contact</H2>
      <P>
        Colin de Silva, Queensland, Australia.{" "}
        <a href="mailto:privacy@colindesilva.com" className="text-harbour underline-offset-4 hover:underline">
          privacy@colindesilva.com
        </a>
        . See also the{" "}
        <Link href="/terms" className="text-harbour underline-offset-4 hover:underline">
          terms of use
        </Link>
        .
      </P>
    </article>
  );
}
