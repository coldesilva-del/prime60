"use client";

import { useActionState } from "react";
import { FormError } from "@/components/forms/field";
import { Hairline } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VisionImageUpload } from "@/components/vision/vision-image-upload";
import type { ActionState } from "@/lib/auth/schemas";
import { saveNorthStarsAction } from "@/lib/vision/actions";
import type { NorthStars, VisionImages } from "@/lib/vision/queries";
import { SECTION_HINTS, SECTION_LABELS, VISION_SECTIONS } from "@/lib/vision/schemas";

interface VisionEditFormProps {
  userId: string;
  stars: NorthStars;
  images: VisionImages;
}

export function VisionEditForm({ userId, stars, images }: VisionEditFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveNorthStarsAction, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-8">
      <FormError message={state.error} />
      {VISION_SECTIONS.map((section, i) => (
        <div key={section} className="space-y-4">
          {i > 0 ? <Hairline /> : null}
          <div className="space-y-2">
            <Label htmlFor={`ns-${section}`} className="text-base">
              {SECTION_LABELS[section]}
            </Label>
            <p className="text-sm text-ink-soft">{SECTION_HINTS[section]}</p>
            <Textarea
              id={`ns-${section}`}
              name={section}
              defaultValue={stars[section]}
              maxLength={4000}
              className="font-display text-lg leading-relaxed"
              aria-invalid={errors[section] ? true : undefined}
            />
            {errors[section] ? (
              <p className="text-sm text-ember" role="alert">
                {errors[section]}
              </p>
            ) : null}
          </div>
          <VisionImageUpload userId={userId} section={section} currentUrl={images[section]?.url ?? null} />
        </div>
      ))}
      <Button type="submit" size="full" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </Button>
    </form>
  );
}
