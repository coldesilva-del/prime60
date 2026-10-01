"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { FormError } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addRoadmapItemAction,
  moveRoadmapItemAction,
  removeRoadmapItemAction,
  updateRoadmapItemAction,
} from "@/lib/cycles/roadmap-actions";
import type { RoadmapHorizon } from "@/lib/cycles/schemas";
import type { RoadmapItemRow } from "@/lib/supabase/types";

interface RoadmapRowProps {
  horizon: RoadmapHorizon;
  items: RoadmapItemRow[];
}

/** One horizon's lines, editable in place: add, edit, remove, move up or down. */
export function RoadmapRow({ horizon, items }: RoadmapRowProps) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{ id: number; body: string } | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function run(work: () => Promise<{ error?: string; fieldErrors?: Record<string, string> }>, then?: () => void) {
    setError(undefined);
    startTransition(async () => {
      const result = await work();
      if (result.error) return setError(result.error);
      if (result.fieldErrors) return setError(Object.values(result.fieldErrors)[0]);
      then?.();
    });
  }

  return (
    <div className="space-y-3">
      {items.length ? (
        <ul className="divide-y divide-hairline rounded-[16px] bg-surface">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-2 py-1 pl-4 pr-1">
              {editing?.id === item.id ? (
                <form
                  className="flex flex-1 items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(() => updateRoadmapItemAction({ id: item.id, body: editing.body }), () => setEditing(null));
                  }}
                >
                  <Input
                    aria-label="Edit line"
                    value={editing.body}
                    maxLength={300}
                    autoFocus
                    onChange={(e) => setEditing({ id: item.id, body: e.target.value })}
                    className="h-11"
                  />
                  <Button type="submit" size="sm" disabled={pending}>
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing({ id: item.id, body: item.body })}
                    className="min-h-11 flex-1 py-2 text-left text-base text-ink"
                    aria-label={`Edit: ${item.body}`}
                  >
                    {item.body}
                  </button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Move up"
                    disabled={pending || i === 0}
                    onClick={() => run(() => moveRoadmapItemAction({ id: item.id, direction: "up" }))}
                  >
                    <ArrowUp strokeWidth={1.5} />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Move down"
                    disabled={pending || i === items.length - 1}
                    onClick={() => run(() => moveRoadmapItemAction({ id: item.id, direction: "down" }))}
                  >
                    <ArrowDown strokeWidth={1.5} />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Remove"
                    disabled={pending}
                    onClick={() => run(() => removeRoadmapItemAction({ id: item.id }))}
                  >
                    <X strokeWidth={1.5} />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          run(() => addRoadmapItemAction({ horizon, body: draft }), () => setDraft(""));
        }}
      >
        <Input
          aria-label="Add a line"
          placeholder="Add a line"
          value={draft}
          maxLength={300}
          onChange={(e) => setDraft(e.target.value)}
          className="h-11"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={pending || !draft.trim()}>
          Add
        </Button>
      </form>
      <FormError message={error} />
    </div>
  );
}
