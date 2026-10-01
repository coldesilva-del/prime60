"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Repeat, Flame, Lightbulb, Users, HeartPulse, ChevronRight } from "lucide-react";
import { cn } from "cn";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Group } from "@/components/layout/section";
import { loadPatternSheet } from "@/lib/patterns/actions";
import { loadCourageSheet } from "@/lib/courage/actions";
import type { PatternView } from "@/lib/patterns/schemas";
import type { CourageRepTypeRow } from "@/lib/supabase/types";
import { PatternLog } from "./pattern-log";
import { CourageLog } from "./courage-log";
import { IdeaPark } from "./idea-park";

export type ActionSheetMode = "menu" | "pattern" | "courage" | "idea";

export interface ActionSheetProps {
  /** Route prefixes where the floating button appears. */
  showOn?: string[];
  /** Route prefixes where it is hidden even if matched above (full-screen flows). */
  hideOn?: string[];
  className?: string;
}

const DEFAULT_SHOW = ["/today", "/progress", "/plan"];
const DEFAULT_HIDE = ["/today/stuck", "/today/morning", "/today/evening", "/today/review"];

function isMode(value: string | null): value is Exclude<ActionSheetMode, "menu"> {
  return value === "pattern" || value === "courage" || value === "idea";
}

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Floating quick-actions button and bottom sheet. Mount once in the (app)
 * layout. Opens straight to a log when the URL carries ?log=pattern,
 * ?log=courage or ?log=idea, then clears the param.
 */
export default function ActionSheet(props: ActionSheetProps) {
  return (
    <Suspense fallback={null}>
      <ActionSheetInner {...props} />
    </Suspense>
  );
}

type SheetData = {
  patterns: PatternView[] | null;
  loggedLine: string;
  types: CourageRepTypeRow[] | null;
  courageLine: string;
};

const EMPTY_DATA: SheetData = { patterns: null, loggedLine: "", types: null, courageLine: "" };

function ActionSheetInner({ showOn = DEFAULT_SHOW, hideOn = DEFAULT_HIDE, className }: ActionSheetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sheet, setSheet] = useState<{ open: boolean; mode: ActionSheetMode }>({ open: false, mode: "menu" });
  const [seenParam, setSeenParam] = useState<string | null>(null);
  const [data, setData] = useState<SheetData>(EMPTY_DATA);

  // Open from the URL. State is adjusted during render (React's documented
  // pattern) so no effect needs to call setState.
  const param = searchParams.get("log");
  const paramMode = isMode(param) ? param : null;
  if (paramMode && paramMode !== seenParam) {
    setSeenParam(paramMode);
    setSheet({ open: true, mode: paramMode });
  }
  if (!paramMode && seenParam !== null) {
    setSeenParam(null);
  }

  // Clear the param once consumed so a refresh does not reopen the sheet.
  useEffect(() => {
    if (!paramMode) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("log");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [paramMode, pathname, router, searchParams]);

  // Fetch sheet data when the sheet opens so the second tap is instant.
  useEffect(() => {
    if (!sheet.open) return;
    let live = true;
    Promise.all([loadPatternSheet(), loadCourageSheet()])
      .then(([p, c]) => {
        if (!live) return;
        setData({ patterns: p.patterns, loggedLine: p.loggedLine, types: c.types, courageLine: c.courageLine });
      })
      .catch(() => {
        if (live) setData((d) => ({ ...d, patterns: d.patterns ?? [], types: d.types ?? [] }));
      });
    return () => {
      live = false;
    };
  }, [sheet.open]);

  const visible = matches(pathname, showOn) && !matches(pathname, hideOn);

  function close() {
    setSheet({ open: false, mode: "menu" });
  }

  function onOpenChange(open: boolean) {
    if (open) setSheet((s) => ({ ...s, open: true }));
    else close();
  }

  const titles: Record<ActionSheetMode, string> = {
    menu: "Quick actions",
    pattern: "Log a pattern",
    courage: "Courage Rep",
    idea: "Park an idea",
  };

  return (
    <>
      {visible ? (
        <button
          type="button"
          aria-label="Quick actions"
          onClick={() => setSheet({ open: true, mode: "menu" })}
          className={cn(
            "fixed right-5 z-40 inline-flex size-14 items-center justify-center rounded-full bg-harbour text-primary-foreground shadow-[var(--shadow-sheet)] transition-transform duration-150 outline-none select-none hover:bg-harbour/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96]",
            "bottom-[calc(env(safe-area-inset-bottom)+72px)]",
            className,
          )}
        >
          <Plus className="size-6" strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}

      <Sheet open={sheet.open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="mx-auto max-h-[88dvh] w-full max-w-[520px] gap-0 overflow-y-auto rounded-t-[16px] border-t-0 bg-surface px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-2 shadow-[var(--shadow-sheet)]"
        >
          <div aria-hidden className="mx-auto mb-3 h-1 w-9 rounded-full bg-hairline" />
          <div className="mb-4 flex items-center justify-between gap-3">
            <SheetTitle className="font-sans text-lg font-semibold text-ink">{titles[sheet.mode]}</SheetTitle>
            {sheet.mode !== "menu" ? (
              <button
                type="button"
                onClick={() => setSheet({ open: true, mode: "menu" })}
                className="h-11 px-2 text-sm text-ink-soft hover:text-ink"
              >
                All actions
              </button>
            ) : null}
          </div>

          {sheet.mode === "menu" ? (
            <Menu onPick={(mode) => setSheet({ open: true, mode })} onNavigate={close} />
          ) : null}
          {sheet.mode === "pattern" ? (
            <PatternLog patterns={data.patterns} loggedLine={data.loggedLine} onClose={close} />
          ) : null}
          {sheet.mode === "courage" ? (
            <CourageLog types={data.types} courageLine={data.courageLine} onClose={close} />
          ) : null}
          {sheet.mode === "idea" ? <IdeaPark onClose={close} /> : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

const rowClass =
  "flex h-14 w-full items-center gap-3 px-4 text-left text-base text-ink transition-colors hover:bg-surface-raised";

function Menu({
  onPick,
  onNavigate,
}: {
  onPick: (mode: Exclude<ActionSheetMode, "menu">) => void;
  onNavigate: () => void;
}) {
  return (
    <Group className="bg-paper">
      <button type="button" className={rowClass} onClick={() => onPick("pattern")}>
        <Repeat className="size-5 text-ink-soft" strokeWidth={1.5} aria-hidden />
        <span className="flex-1">Log a pattern</span>
        <ChevronRight className="size-4 text-ink-faint" strokeWidth={1.75} aria-hidden />
      </button>
      <button type="button" className={rowClass} onClick={() => onPick("courage")}>
        <Flame className="size-5 text-ink-soft" strokeWidth={1.5} aria-hidden />
        <span className="flex-1">Courage Rep</span>
        <ChevronRight className="size-4 text-ink-faint" strokeWidth={1.75} aria-hidden />
      </button>
      <button type="button" className={rowClass} onClick={() => onPick("idea")}>
        <Lightbulb className="size-5 text-ink-soft" strokeWidth={1.5} aria-hidden />
        <span className="flex-1">Park an idea</span>
        <ChevronRight className="size-4 text-ink-faint" strokeWidth={1.75} aria-hidden />
      </button>
      <Link href="/more/people" className={rowClass} onClick={onNavigate}>
        <Users className="size-5 text-ink-soft" strokeWidth={1.5} aria-hidden />
        <span className="flex-1">Connected with someone</span>
        <ChevronRight className="size-4 text-ink-faint" strokeWidth={1.75} aria-hidden />
      </Link>
      <Link href="/progress/health/log" className={rowClass} onClick={onNavigate}>
        <HeartPulse className="size-5 text-ink-soft" strokeWidth={1.5} aria-hidden />
        <span className="flex-1">Health note</span>
        <ChevronRight className="size-4 text-ink-faint" strokeWidth={1.75} aria-hidden />
      </Link>
    </Group>
  );
}
