import type { Metadata } from "next";
import Link from "next/link";
import { getSnippets } from "@/lib/content";
import { todayIn } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { getNorthStars, getVisionImages, type VisionImage } from "@/lib/vision/queries";
import { SECTION_LABELS, VISION_DISPLAY_SECTIONS, type VisionSection } from "@/lib/vision/schemas";

export const metadata: Metadata = { title: "Vision" };

export default async function VisionPage() {
  const profile = await requireProfile();
  const db = await createClient();
  const [stars, images, snippets] = await Promise.all([
    getNorthStars(db, profile.user_id),
    getVisionImages(db, profile.user_id),
    getSnippets(["vision_quote", "vision_question"]),
  ]);
  const targetYear = profile.target_year ?? Number(todayIn(profile.timezone).slice(0, 4)) + 5;

  return (
    <article className="space-y-10">
      <header className="flex items-start justify-between gap-4">
        <h1 className="font-display text-3xl text-brass">Prime Self, {targetYear}</h1>
        <Link href="/vision/edit" className="inline-flex h-11 shrink-0 items-center text-sm font-medium text-harbour">
          Edit
        </Link>
      </header>

      {VISION_DISPLAY_SECTIONS.map((section) => (
        <VisionBlock key={section} section={section} body={stars[section]} image={images[section]} />
      ))}

      <MomentBlock body={stars.moment} image={images.moment} />

      <footer className="space-y-4">
        <p className="measure font-display text-lg italic text-ink">
          &ldquo;{snippets.vision_quote}&rdquo;
        </p>
        <p className="measure font-display text-lg text-ink-soft">{snippets.vision_question}</p>
        <Link href="/vision/edit" className="inline-flex h-11 items-center text-sm font-medium text-harbour">
          Edit
        </Link>
      </footer>
    </article>
  );
}

function VisionBlock({ section, body, image }: { section: VisionSection; body: string; image?: VisionImage }) {
  const label = SECTION_LABELS[section];
  if (!body.trim()) {
    return (
      <section className="space-y-1">
        <h2 className="text-sm font-medium text-ink-soft">{label}</h2>
        <Link href="/vision/edit" className="inline-flex h-11 items-center text-base text-ink-faint hover:text-ink-soft">
          Add this
        </Link>
      </section>
    );
  }
  if (image) {
    return (
      <section className="relative overflow-hidden rounded-[16px]">
        <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image.url})` }} />
        <div aria-hidden className="absolute inset-0 bg-[rgba(10,14,20,0.6)]" />
        <div className="relative space-y-2 px-5 py-7">
          <h2 className="text-sm font-medium text-[#E2DFD8]">{label}</h2>
          <p className="measure whitespace-pre-line font-display text-lg text-[#F6F5F1]">{body}</p>
        </div>
      </section>
    );
  }
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-ink-soft">{label}</h2>
      <p className="measure whitespace-pre-line font-display text-lg text-ink">{body}</p>
    </section>
  );
}

function MomentBlock({ body, image }: { body: string; image?: VisionImage }) {
  const label = SECTION_LABELS.moment;
  const hasBody = body.trim().length > 0;
  return (
    <section className="relative overflow-hidden rounded-[16px]">
      {image ? (
        <>
          <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image.url})` }} />
          <div aria-hidden className="absolute inset-0 bg-[rgba(10,14,20,0.6)]" />
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-harbour-soft to-paper" />
      )}
      <div className="relative space-y-3 px-5 py-10">
        <h2 className={image ? "text-sm font-medium text-[#E2DFD8]" : "text-sm font-medium text-ink-soft"}>{label}</h2>
        {hasBody ? (
          <p className={`measure whitespace-pre-line font-display text-xl ${image ? "text-[#F6F5F1]" : "text-ink"}`}>{body}</p>
        ) : (
          <Link
            href="/vision/edit"
            className={`inline-flex h-11 items-center font-display text-lg ${image ? "text-[#E2DFD8]" : "text-ink-faint hover:text-ink-soft"}`}
          >
            Add this
          </Link>
        )}
      </div>
    </section>
  );
}
