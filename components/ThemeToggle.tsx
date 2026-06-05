"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "physiohub-theme";

/**
 * Light/dark toggle. The actual theme switch happens inline in <head> (see
 * the bootstrap script in app/layout.tsx) to avoid a flash of wrong theme on
 * first paint. This component just keeps React in sync with what the
 * bootstrap script already set on <html data-theme>.
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

  const goingTo = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${goingTo} mode`}
      title={`Switch to ${goingTo} mode`}
      className="focus-ring inline-flex items-center gap-1.5 rounded-ph border border-[var(--ph-border)] bg-ph-surface px-3 py-2 text-sm font-medium text-ph-muted transition hover:border-[var(--ph-border-strong)] hover:text-ph-text"
    >
      <span aria-hidden="true" className="text-base leading-none">
        {mounted ? (theme === "dark" ? "☀" : "☾") : "☾"}
      </span>
      <span className="hidden sm:inline">{mounted ? (theme === "dark" ? "Day" : "Night") : "Night"}</span>
    </button>
  );
}
