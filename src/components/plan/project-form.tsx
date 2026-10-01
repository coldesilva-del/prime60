"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/forms/field";
import { changeProjectStatusAction, createProjectAction, updateProjectAction } from "@/lib/projects/actions";
import { PILLARS, type LimitPrompt } from "@/lib/projects/schemas";
import type { LimitChoice } from "@/lib/projects/active-limit";
import type { Pillar, ProjectRow } from "@/lib/supabase/types";
import { ActiveLimitDialog } from "./active-limit-dialog";

type ProjectFormProps = { mode: "new" } | { mode: "edit"; project: ProjectRow };

const chipClass =
  "inline-flex min-h-11 items-center rounded-[999px] border px-4 text-[15px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Fields per PRD 6.9. New projects can start active, which may open the limit dialog. */
export function ProjectForm(props: ProjectFormProps) {
  const router = useRouter();
  const project = props.mode === "edit" ? props.project : null;

  const [name, setName] = useState(project?.name ?? "");
  const [pillar, setPillar] = useState<Pillar>(project?.pillar ?? "purpose");
  const [definitionOfDone, setDefinitionOfDone] = useState(project?.definition_of_done ?? "");
  const [targetOn, setTargetOn] = useState(project?.target_on ?? "");
  const [nextAction, setNextAction] = useState(project?.next_action ?? "");
  const [notes, setNotes] = useState(project?.notes ?? "");
  const [startActive, setStartActive] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
  const [prompt, setPrompt] = useState<LimitPrompt | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const fields = {
    name,
    pillar,
    definition_of_done: definitionOfDone,
    target_on: targetOn,
    next_action: nextAction,
    notes,
  };

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setFieldErrors({});
    setSaved(false);
    startTransition(async () => {
      if (project) {
        const res = await updateProjectAction({ id: project.id, ...fields });
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        else if (res.error) setError(res.error);
        else setSaved(true);
        return;
      }
      const res = await createProjectAction({ ...fields, startActive });
      if ("limit" in res) {
        setPendingId(res.projectId);
        setPrompt(res.limit);
        return;
      }
      if ("ok" in res) {
        router.push(`/plan/projects/${res.projectId}`);
        return;
      }
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      if (res.error) setError(res.error);
    });
  }

  function choose(choice: LimitChoice) {
    if (pendingId === null) return;
    const id = pendingId;
    startTransition(async () => {
      const res = await changeProjectStatusAction({ id, toStatus: "active", choice });
      if ("error" in res) {
        setError(res.error);
        setPrompt(null);
        return;
      }
      if ("limit" in res) {
        setPrompt(res.limit);
        return;
      }
      setPrompt(null);
      router.push(`/plan/projects/${id}`);
    });
  }

  function cancelPrompt() {
    // The project exists as an idea. Take the user there rather than losing it.
    setPrompt(null);
    if (pendingId !== null) router.push(`/plan/projects/${pendingId}`);
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <FormError message={error} />
      {saved ? (
        <p className="text-sm text-ink-soft" role="status">
          Saved.
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="project-name">Name</Label>
        <Input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          autoComplete="off"
          aria-invalid={fieldErrors.name ? true : undefined}
          required
        />
        {fieldErrors.name ? (
          <p className="text-sm text-ember" role="alert">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium text-ink">Pillar</legend>
        <div role="radiogroup" aria-label="Pillar" className="flex flex-wrap gap-2">
          {PILLARS.map((p) => {
            const selected = pillar === p.value;
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPillar(p.value)}
                className={cn(
                  chipClass,
                  selected
                    ? "border-harbour bg-harbour text-primary-foreground"
                    : "border-hairline bg-surface text-ink hover:bg-surface-raised",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="project-done">Definition of done</Label>
        <Textarea
          id="project-done"
          value={definitionOfDone}
          onChange={(e) => setDefinitionOfDone(e.target.value)}
          maxLength={1000}
          className="min-h-20"
          placeholder="What does finished look like?"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="project-next">Next action</Label>
        <Input
          id="project-next"
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          maxLength={300}
          autoComplete="off"
          placeholder="The next physical step"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="project-target">Target date</Label>
        <Input id="project-target" type="date" value={targetOn} onChange={(e) => setTargetOn(e.target.value)} />
        {fieldErrors.target_on ? (
          <p className="text-sm text-ember" role="alert">
            {fieldErrors.target_on}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="project-notes">Notes</Label>
        <Textarea
          id="project-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={4000}
          className="min-h-20"
        />
      </div>

      {!project ? (
        <fieldset className="space-y-2">
          <legend className="block text-sm font-medium text-ink">Status</legend>
          <div role="radiogroup" aria-label="Starting status" className="flex gap-2">
            <button
              type="button"
              role="radio"
              aria-checked={startActive}
              onClick={() => setStartActive(true)}
              className={cn(
                chipClass,
                startActive
                  ? "border-harbour bg-harbour text-primary-foreground"
                  : "border-hairline bg-surface text-ink hover:bg-surface-raised",
              )}
            >
              Start active
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!startActive}
              onClick={() => setStartActive(false)}
              className={cn(
                chipClass,
                !startActive
                  ? "border-harbour bg-harbour text-primary-foreground"
                  : "border-hairline bg-surface text-ink hover:bg-surface-raised",
              )}
            >
              Save as idea
            </button>
          </div>
        </fieldset>
      ) : null}

      <Button type="submit" size="full" disabled={pending || !name.trim()}>
        {pending ? "Saving" : project ? "Save" : "Create project"}
      </Button>

      <ActiveLimitDialog prompt={prompt} pending={pending} onChoose={choose} onCancel={cancelPrompt} />
    </form>
  );
}
