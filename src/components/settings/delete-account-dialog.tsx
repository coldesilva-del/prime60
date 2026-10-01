"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FormError } from "@/components/forms/field";
import { deleteAccountAction } from "@/lib/account/actions";
import type { ActionState } from "@/lib/auth/schemas";

const initial: ActionState = {};

/**
 * Delete account. The only place ember is used as a primary action.
 * The user types DELETE before the server action runs.
 */
export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, formAction, pending] = useActionState(deleteAccountAction, initial);
  const fe = state.fieldErrors ?? {};
  const ready = typed.trim() === "DELETE";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="full" />}>Delete account</DialogTrigger>
      <DialogContent className="rounded-[24px] bg-surface p-6 text-ink">
        <DialogHeader>
          <DialogTitle className="font-sans text-xl font-semibold text-ink">Delete your account</DialogTitle>
          <DialogDescription className="text-base text-ink-soft">
            This removes your account and everything in it: your North Star, identity statements,
            non-negotiables, daily check-ins and scores, health measurements, patterns, Courage Reps,
            ideas, projects, people and interactions, reviews and cycles. Backups clear within 30 days.
            Founding membership cannot be restored.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-ink-soft">
          Want a copy first? Use Export my data before you continue.
        </p>
        <form action={formAction} className="space-y-4" noValidate>
          <FormError message={state.error} />
          <Field
            label="Type DELETE to confirm"
            name="confirmation"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            error={fe.confirmation}
          />
          <div className="flex flex-col gap-2">
            <Button type="submit" variant="destructive" size="full" disabled={!ready || pending}>
              {pending ? "Deleting" : "Delete everything"}
            </Button>
            <Button type="button" variant="secondary" size="full" onClick={() => setOpen(false)} disabled={pending}>
              Keep my account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
