"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteObjectiveAction } from "@/lib/cycles/actions";

export function DeleteObjectiveButton({ objectiveId }: { objectiveId: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button type="button" variant="ghost" className="text-ember" onClick={() => setOpen(true)}>
        Remove objective
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[24px]" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-sans text-lg">Remove this objective?</DialogTitle>
            <DialogDescription className="text-base text-ink-soft">
              It leaves the cycle for good. Stopping it keeps the record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-transparent">
            <DialogClose render={<Button variant="secondary" />}>Keep it</DialogClose>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => startTransition(() => deleteObjectiveAction(objectiveId))}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
