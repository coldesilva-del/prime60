"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RatingRow } from "@/components/ui/rating-row";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { logInteractionAction } from "@/lib/relationships/actions";
import { INTERACTION_KINDS, INTERACTION_LABEL } from "@/lib/relationships/drift";
import type { InteractionKind } from "@/lib/supabase/types";

interface InteractionLoggerProps {
  personId: number;
  name: string;
  isPartner: boolean;
}

/**
 * Six one-tap interaction buttons with an optional note. For a partner an
 * optional connection rating 1 to 10 travels with the interaction, or saves on its own.
 */
export function InteractionLogger({ personId, name, isPartner }: InteractionLoggerProps) {
  const [note, setNote] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [line, setLine] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();

  function log(kind: InteractionKind) {
    start(async () => {
      setError(undefined);
      const result = await logInteractionAction({
        personId,
        kind,
        note: note.trim() || null,
        connectionRating: isPartner ? rating : null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setNote("");
      setRating(null);
      setLine(`${INTERACTION_LABEL[kind]} with ${name} recorded.`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {INTERACTION_KINDS.map((kind) => (
          <Button key={kind} variant="secondary" size="lg" disabled={pending} onClick={() => log(kind)} className="h-14 whitespace-normal text-center">
            {INTERACTION_LABEL[kind]}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="interaction-note">Note (optional)</Label>
        <Textarea
          id="interaction-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          className="min-h-20"
          placeholder="What happened, if you want to keep it."
        />
      </div>

      {isPartner ? (
        <div className="space-y-3">
          <RatingRow name="connection_rating" label="Connection today" value={rating} onChange={setRating} />
          {rating !== null ? (
            <Button variant="outline" size="sm" disabled={pending} onClick={() => log("note")}>
              Save rating
            </Button>
          ) : (
            <p className="text-xs text-ink-faint">Optional. Saved with the next interaction you record.</p>
          )}
        </div>
      ) : null}

      {line ? (
        <p className="text-sm text-ink-soft" role="status">
          {line}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
