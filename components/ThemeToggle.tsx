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
  const currentIcon = mounted ? (theme === "dark" ? "🌙" : "☀️") : "☀️";
  const nextLabel = theme === "dark" ? "day" : "night";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${nextLabel} mode`}
      title={`Switch to ${nextLabel} mode`}
      className="focus-ring ph-theme-toggle ph-clay-button inline-flex items-center gap-2 rounded-full px-3.5 py-2"
    >
      <span aria-hidden="true" className="text-base leading-none">
        {currentIcon}
      </span>
      <span className="text-xs font-bold tracking-tight text-ph-text">{currentLabel}</span>
    </button>
  );
}
