import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { VisionEditForm } from "@/components/vision/vision-edit-form";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { getNorthStars, getVisionImages } from "@/lib/vision/queries";

export const metadata: Metadata = { title: "Edit vision" };

export default async function VisionEditPage() {
  const profile = await requireProfile();
  const db = await createClient();
  const [stars, images] = await Promise.all([
    getNorthStars(db, profile.user_id),
    getVisionImages(db, profile.user_id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        display
        title="Your North Star"
        backHref="/vision"
        description="Write it in the present tense, as the man you are at the target year. Leave anything blank for now and return to it."
      />
      <VisionEditForm userId={profile.user_id} stars={stars} images={images} />
    </div>
  );
}
