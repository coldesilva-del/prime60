"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parkIdeaAction } from "@/lib/ideas/actions";

interface IdeaParkProps {
  onClose: () => void;
}

/** One line and one tap. */
export function IdeaPark({ onClose }: IdeaParkProps) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="space-y-5">
        <p className="font-display text-lg text-ink">Parked. It will be here when you are ready.</p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/plan/ideas"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-[10px] bg-surface-raised px-5 text-[15px] font-medium text-ink hover:bg-hairline/70"
          >
            Open the lot
          </Link>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await parkIdeaAction({ title, note });
      if (res.error) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="idea-title">The idea, in one line</Label>
        <Input
          id="idea-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          autoFocus
          autoComplete="off"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="idea-note">Note (optional)</Label>
        <Input id="idea-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} autoComplete="off" />
      </div>
      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="full" disabled={pending || !title.trim()}>
        {pending ? "Parking" : "Park it"}
      </Button>
    </form>
  );
}
