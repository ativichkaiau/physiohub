"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "physiohub-theme";

/**
 * Theme pill in the cockpit's navigation. Two-line label (kicker + current
 * mode + glyph) matching the operator-deck aesthetic. The actual class
 * switch happens inline in <head> before hydration (see app/layout.tsx)
 * so there is no flash of wrong theme on first paint.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage unavailable (private mode, etc.) — toggle still works for this session. */
    }
  }

  const currentLabel = mounted ? (theme === "dark" ? "Night" : "Day") : "Day";
  const currentIcon = mounted ? (theme === "dark" ? "☾" : "☀") : "☀";
  const nextLabel = theme === "dark" ? "day" : "night";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${nextLabel} mode`}
      title={`Switch to ${nextLabel} mode`}
      className="focus-ring inline-flex items-center gap-2 rounded-full border border-[var(--ph-border)] bg-ph-surface px-3 py-1.5 text-left transition hover:border-[var(--ph-border-strong)]"
    >
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-ph-muted">Mode</span>
        <span className="text-xs font-bold tracking-tight text-ph-text">{currentLabel}</span>
      </span>
      <span
        aria-hidden="true"
        className="grid h-7 w-7 place-items-center rounded-full bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-sm text-ph-accent"
      >
        {currentIcon}
      </span>
    </button>
  );
}
