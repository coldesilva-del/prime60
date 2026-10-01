"use client";

import { useState, useTransition } from "react";
import { cn } from "cn";
import { setThemeAction } from "@/lib/account/actions";

export type Theme = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "prime60-theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Applies a theme to the document immediately and remembers it for first paint. */
export function applyTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the class toggle below still works for this visit.
  }
  const prefersDark = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

interface ThemePickerProps {
  /** The value saved on the profile. */
  value: Theme;
  className?: string;
}

/**
 * Three equal segments. Writes localStorage `prime60-theme`, toggles the
 * `dark` class on <html> at once, then saves `profiles.theme`.
 */
export function ThemePicker({ value, className }: ThemePickerProps) {
  const [theme, setTheme] = useState<Theme>(value);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function choose(next: Theme) {
    setTheme(next);
    setError(null);
    applyTheme(next);
    startTransition(async () => {
      const result = await setThemeAction(next);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div role="radiogroup" aria-label="Theme" className="flex gap-1 rounded-[12px] bg-surface-raised p-1">
        {OPTIONS.map((opt) => {
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(opt.value)}
              className={cn(
                "h-11 flex-1 rounded-[9px] text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-harbour focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                active ? "bg-surface text-ink" : "text-ink-soft hover:text-ink",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
