import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { GUIDE } from "./guide-content";

export const metadata: Metadata = { title: "Guide" };

export default function GuidePage() {
  return (
    <div className="space-y-10">
      <PageHeader title="Guide" backHref="/more" />

      <p className="font-display measure text-xl text-ink">
        How to use Prime 60, one step at a time. Find what you need in the list, tap it, and follow the
        numbers.
      </p>

      <nav aria-label="Guide contents" className="space-y-5">
        {GUIDE.map((part) => (
          <div key={part.title} className="space-y-2">
            <h2 className="text-sm font-medium text-ink-soft">{part.title}</h2>
            <ul className="divide-y divide-hairline overflow-hidden rounded-[16px] bg-surface">
              {part.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="flex min-h-12 items-center px-4 text-base text-ink">
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {GUIDE.map((part) => (
        <div key={part.title} className="space-y-10">
          {part.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-6 space-y-4">
              <h2 className="font-display text-2xl text-ink">{section.title}</h2>
              <p className="measure text-base text-ink">{section.intro}</p>
              <ol className="space-y-3">
                {section.steps.map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span
                      aria-hidden
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-harbour-soft text-sm font-medium text-harbour"
                    >
                      {i + 1}
                    </span>
                    <span className="measure pt-0.5 text-base text-ink">
                      <span className="sr-only">Step {i + 1}: </span>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
              {section.tip ? (
                <p className="measure border-l-2 border-hairline pl-4 text-base text-ink-soft">{section.tip}</p>
              ) : null}
            </section>
          ))}
        </div>
      ))}

      <p className="measure text-base text-ink-soft">
        Your entries are private to you. You can read how your data is kept in the{" "}
        <Link href="/privacy" className="text-harbour underline-offset-4 hover:underline">
          privacy policy
        </Link>
        . Pictures for adding Prime 60 to your phone are on the{" "}
        <Link href="/install" className="text-harbour underline-offset-4 hover:underline">
          install page
        </Link>
        .
      </p>
    </div>
  );
}
