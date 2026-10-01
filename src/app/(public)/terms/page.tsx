// Draft for legal review before launch.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of use" };

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

export default function TermsPage() {
  return (
    <article className="space-y-5">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-ink">Terms of use</h1>
        <p className="text-sm text-ink-soft">Effective 1 October 2026</p>
      </div>

      <P>
        These terms are an agreement between you and Colin de Silva, the operator of Prime 60, based in
        Queensland, Australia. By creating an account you accept them. If you do not agree, do not use the
        service.
      </P>

      <H2>What Prime 60 is</H2>
      <P>
        Prime 60 is a self-improvement tool. It helps you describe who you intend to be, record what you do
        each day, and see whether the two line up. It is a ledger and a set of prompts. It is not a coach, a
        clinician or an adviser.
      </P>

      <H2>Not medical, psychological or financial advice</H2>
      <P>
        Nothing in Prime 60 is medical, psychological, dietary, fitness or financial advice. The scores,
        trends, pattern library, example statements and any other content are general information about a
        way of working, not advice for your situation. Before changing your training, diet, medication,
        mental health care, finances or anything else that affects your health or livelihood, consult a
        qualified professional. You are responsible for those decisions and for seeking professional help
        when you need it. If you are in crisis, contact emergency services or a crisis line such as Lifeline
        on 13 11 14 in Australia.
      </P>

      <H2>Your account</H2>
      <Ul
        items={[
          "You must be 18 or older.",
          "Keep your password private. You are responsible for what happens under your account.",
          "Give accurate account information and keep your email address current so we can reach you.",
          "One person per account. Do not share an account or use someone else's.",
        ]}
      />

      <H2>Founding members and plans</H2>
      <P>
        The first 100 accounts to verify their email become founding members. Founding members keep free
        access to Prime 60 for life, meaning for as long as the service operates, with no subscription fee.
        Founding status is tied to the account and cannot be transferred or restored after deletion.
      </P>
      <P>
        Accounts after the first 100 are on early access. Early access is free for now. We may later ask early
        access and new members to subscribe. If we do, we will give at least 30 days notice by email and in
        the app, you will be able to export your data before deciding, and nothing already entered will be
        lost by choosing not to subscribe.
      </P>

      <H2>Your content</H2>
      <P>
        Everything you enter stays yours. You give us only the limited licence needed to store it, show it
        back to you and compute your scores. We do not use it for anything else. See the{" "}
        <Link href="/privacy" className="text-harbour underline-offset-4 hover:underline">
          privacy policy
        </Link>{" "}
        for how it is protected.
      </P>

      <H2>Acceptable use</H2>
      <P>You agree not to:</P>
      <Ul
        items={[
          "Try to access another person's account or data, or to get around the security of the service.",
          "Probe, scan, overload or interfere with the service or its providers.",
          "Copy, scrape, resell or redistribute the service or its content, including the pattern library and other methodology content, beyond your own personal use.",
          "Upload anything unlawful, or any image you do not have the right to use.",
          "Use the service for anyone under 18, or on behalf of a client without their knowledge.",
        ]}
      />

      <H2>Our content</H2>
      <P>
        The Prime 60 name, design, methodology content and software belong to Colin de Silva. You may use
        them inside the service for your own personal development. That is all the licence you need, and
        all that is granted.
      </P>

      <H2>Availability and changes</H2>
      <P>
        We aim to keep Prime 60 available, but it is a small service run by one person. It may be down for
        maintenance or because of a provider outage. We may add, change or remove features. If we ever decide
        to close the service we will give at least 60 days notice so you can export your data.
      </P>

      <H2>Ending your account</H2>
      <P>
        You can delete your account at any time from Account. Everything you own is removed as described in
        the privacy policy. We may suspend or close an account that breaks these terms, after telling you why
        unless the law prevents it. If we close your account for a reason other than a breach, we will give
        you a chance to export your data first.
      </P>

      <H2>Australian Consumer Law</H2>
      <P>
        Our services come with guarantees that cannot be excluded under the Australian Consumer Law. Nothing
        in these terms excludes, restricts or modifies any right or remedy you have under that law or any
        other law that cannot be excluded by agreement.
      </P>

      <H2>Limitation of liability</H2>
      <P>
        To the extent permitted by law, and subject to the paragraph above, Prime 60 is provided as is. We
        are not liable for loss or damage arising from your use of the service, from decisions you make based
        on its content or scores, from loss of data where you have not kept an export, or from outages or
        faults in the providers we rely on. Where liability cannot be excluded but can be limited, our
        liability is limited, at our option, to supplying the service again or paying the cost of having it
        supplied again, and in any case to the amount you paid for the service in the twelve months before
        the claim.
      </P>

      <H2>Changes to these terms</H2>
      <P>
        We may update these terms. For a change that affects your rights we will give notice by email or in
        the app at least 14 days before it takes effect. Continuing to use the service after that date means
        you accept the new terms. If you do not, delete your account before then.
      </P>

      <H2>Governing law</H2>
      <P>
        These terms are governed by the laws of Queensland, Australia. Any dispute will be heard in the courts
        of Queensland, and you and we submit to their jurisdiction. If part of these terms is found invalid,
        the rest still applies.
      </P>

      <H2>Contact</H2>
      <P>
        Colin de Silva, Queensland, Australia.{" "}
        <a href="mailto:privacy@colindesilva.com" className="text-harbour underline-offset-4 hover:underline">
          privacy@colindesilva.com
        </a>
        .
      </P>
    </article>
  );
}
