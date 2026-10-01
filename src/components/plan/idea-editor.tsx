"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateIdeaAction } from "@/lib/ideas/actions";
import type { IdeaRow } from "@/lib/supabase/types";

/** Title and note, editable in place. */
export function IdeaEditor({ idea }: { idea: IdeaRow }) {
  const [title, setTitle] = useState(idea.title);
  const [note, setNote] = useState(idea.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = title !== idea.title || note !== (idea.note ?? "");

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateIdeaAction({ id: idea.id, title, note });
      if (res.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="idea-title">Idea</Label>
        <Input id="idea-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="idea-note">Note</Label>
        <Textarea
          id="idea-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          className="min-h-20"
          placeholder="Anything worth remembering about it"
        />
      </div>
      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
      {saved && !dirty ? (
        <p className="text-sm text-ink-soft" role="status">
          Saved.
        </p>
      ) : null}
      {dirty ? (
        <Button type="submit" variant="secondary" disabled={pending || !title.trim()}>
          {pending ? "Saving" : "Save"}
        </Button>
      ) : null}
    </form>
  );
}
