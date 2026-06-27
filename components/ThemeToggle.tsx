"use client";

import { useEffect, useState, type MouseEvent } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "physiohub-theme";

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

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

  function applyTheme(next: Theme) {
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage unavailable (private mode, etc.) — toggle still works for this session. */
    }
  }

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as DocumentWithViewTransition;

    // applyTheme runs at most once; the safety net below guarantees it runs
    // even if a View Transition aborts (e.g. a backgrounded / offscreen tab).
    let applied = false;
    const apply = () => {
      if (applied) return;
      applied = true;
      applyTheme(next);
    };

    // Circular sunrise / sunset reveal that grows from the toggle button.
    if (!reduce && typeof doc.startViewTransition === "function") {
      const x = event.clientX || window.innerWidth - 40;
      const y = event.clientY || 32;
      const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      try {
        const transition = doc.startViewTransition(apply);
        transition.ready
          .then(() => {
            root.animate(
              { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
              { duration: 480, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
            );
          })
          .catch(() => {});
        // If the transition can't run, its callback may never fire — apply anyway.
        window.setTimeout(apply, 80);
        return;
      } catch {
        apply();
        return;
      }
    }

    // Fallback: a brief global colour crossfade.
    if (!reduce) {
      root.classList.add("ph-theme-anim");
      window.setTimeout(() => root.classList.remove("ph-theme-anim"), 480);
    }
    apply();
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
