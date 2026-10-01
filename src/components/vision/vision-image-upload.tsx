"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { recordVisionImageAction, removeVisionImageAction } from "@/lib/vision/actions";
import { VISION_BUCKET } from "@/lib/vision/queries";
import {
  VISION_IMAGE_MAX_BYTES,
  VISION_IMAGE_TYPES,
  visionImagePath,
  type VisionSection,
} from "@/lib/vision/schemas";

interface VisionImageUploadProps {
  userId: string;
  section: VisionSection;
  currentUrl: string | null;
}

/**
 * Uploads straight from the browser to the private `vision` bucket at
 * {user_id}/{section}.{ext}, then records the row through a server action.
 * JPEG, PNG or WebP, 5 MB at most.
 */
export function VisionImageUpload({ userId, section, currentUrl }: VisionImageUploadProps) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  async function upload(file: File) {
    const ext = VISION_IMAGE_TYPES[file.type];
    if (!ext) return setError("Use a JPEG, PNG or WebP image.");
    if (file.size > VISION_IMAGE_MAX_BYTES) return setError("Keep the image under 5 MB.");
    setError(undefined);
    setBusy(true);
    try {
      const path = visionImagePath(userId, section, ext);
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(VISION_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (uploadError) return setError("The upload did not finish. Try again.");
      const result = await recordVisionImageAction({ section, storagePath: path });
      if (result.error) return setError(result.error);
      router.refresh();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove() {
    setError(undefined);
    startTransition(async () => {
      const result = await removeVisionImageAction({ section });
      if (result.error) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <div
            role="img"
            aria-label="Current image"
            className="size-14 shrink-0 rounded-[10px] bg-surface-raised bg-cover bg-center"
            style={{ backgroundImage: `url(${currentUrl})` }}
          />
        ) : null}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy || pending}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading" : currentUrl ? "Replace image" : "Add an image"}
        </Button>
        {currentUrl ? (
          <Button type="button" variant="ghost" size="sm" disabled={busy || pending} onClick={remove}>
            Remove
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-ink-faint">Optional. JPEG, PNG or WebP, under 5 MB. Shown dimmed under your words.</p>
      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
