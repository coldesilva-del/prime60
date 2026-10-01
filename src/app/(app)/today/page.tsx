import type { Metadata } from "next";
import { requireProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const profile = await requireProfile();
  const today = new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: profile.timezone,
  }).format(new Date());

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-soft">{today}</p>
      <h1 className="font-display text-xl text-ink">
        Good morning{profile.first_name ? `, ${profile.first_name}` : ""}.
      </h1>
      <p className="text-base text-ink-soft">Today is being built.</p>
    </div>
  );
}
