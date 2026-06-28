"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type StepWalkerStep = {
  id: string | number;
  shortName: string;
};

type StepWalkerProps = {
  steps: StepWalkerStep[];
  /** Currently selected step id. */
  value: string | number;
  onChange: (id: string | number) => void;
  /** Card heading. */
  label?: string;
  /** Sequential mechanism (default): shows "Step N / M", a progress bar and a
   * ▶ Walk autoplay control. Set false for a non-ordered catalog of options. */
  sequential?: boolean;
  /** Autoplay dwell per step (ms). */
  autoplayMs?: number;
};

/**
 * Shared step navigator for the click-to-mechanism diagrams. Adds keyboard
 * navigation (← → ↑ ↓ Home End), a progress indicator, prev/next, and an
 * autoplay "walk" — features the bespoke per-diagram sidebars all lacked.
 */
export function StepWalker({
  steps,
  value,
  onChange,
  label = "Walk the mechanism",
  sequential = true,
  autoplayMs = 2600
}: StepWalkerProps) {
  const count = steps.length;
  const index = Math.max(
    0,
    steps.findIndex((s) => s.id === value)
  );
  const atStart = index <= 0;
  const atEnd = index >= count - 1;
  const [playing, setPlaying] = useState(false);

  // Keep onChange current without making `go` change identity every render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const go = useCallback(
    (nextIndex: number) => {
      const clamped = Math.min(count - 1, Math.max(0, nextIndex));
      onChangeRef.current(steps[clamped].id);
    },
    [count, steps]
  );

  const select = useCallback(
    (nextIndex: number) => {
      setPlaying(false);
      go(nextIndex);
    },
    [go]
  );

  // Keyboard navigation — one step-walker per page.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      switch (event.key) {
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          select(index - 1);
          break;
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          select(index + 1);
          break;
        case "Home":
          event.preventDefault();
          select(0);
          break;
        case "End":
          event.preventDefault();
          select(count - 1);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, select]);

  // Autoplay (sequential only) — advance until the last step, then stop.
  useEffect(() => {
    if (!playing || !sequential) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => go(index + 1), autoplayMs);
    return () => window.clearTimeout(timer);
  }, [playing, sequential, atEnd, index, go, autoplayMs]);

  const progress = count > 1 ? (index / (count - 1)) * 100 : 0;
  const noun = sequential ? "Step" : "Option";

  return (
    <section className="ph-panel p-4" aria-label="Step selector">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="ph-section-label">{label}</h2>
        <span className="shrink-0 text-xs font-bold tabular-nums text-ph-muted">
          {noun} {index + 1} / {count}
        </span>
      </div>

      {sequential ? (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--ph-surface-2),transparent_20%)]">
          <div
            className="h-full rounded-full bg-[var(--ph-accent)] transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      <div role="listbox" aria-label={label} className="grid gap-1.5">
        {steps.map((step, i) => {
          const isCurrent = i === index;
          const isDone = sequential && i < index;
          return (
            <button
              key={step.id}
              type="button"
              role="option"
              aria-selected={isCurrent}
              onClick={() => {
                setPlaying(false);
                onChange(step.id);
              }}
              className={`focus-ring flex items-center gap-2.5 rounded-ph border px-3 py-2 text-left text-sm transition ${
                isCurrent
                  ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                  : "ph-clay-button text-ph-muted hover:text-ph-text"
              }`}
            >
              <span
                aria-hidden="true"
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black tabular-nums ${
                  isCurrent
                    ? "bg-[var(--ph-accent)] text-white"
                    : isDone
                      ? "bg-[color-mix(in_srgb,var(--ph-accent),transparent_55%)] text-white"
                      : "bg-[color-mix(in_srgb,var(--ph-surface-2),transparent_5%)] text-ph-muted-2"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span className="font-bold">{step.shortName}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => select(index - 1)}
          disabled={atStart}
          className="focus-ring ph-clay-button px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ph-muted hover:border-[var(--ph-border-strong)] hover:text-ph-text disabled:opacity-40"
        >
          ← Prev
        </button>

        {sequential ? (
          <button
            type="button"
            aria-pressed={playing}
            onClick={() => {
              if (atEnd) {
                go(0);
                setPlaying(true);
              } else {
                setPlaying((p) => !p);
              }
            }}
            className={`focus-ring rounded-ph px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] transition ${
              playing ? "bg-[var(--ph-accent)] text-white" : "ph-clay-button text-ph-muted hover:text-ph-text"
            }`}
          >
            {playing ? "❚❚ Pause" : "▶ Walk"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => select(index + 1)}
          disabled={atEnd}
          className="focus-ring ph-clay-button px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ph-muted hover:border-[var(--ph-border-strong)] hover:text-ph-text disabled:opacity-40"
        >
          Next →
        </button>
      </div>

      <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-ph-muted-2">
        ← → arrow keys to navigate
      </p>
    </section>
  );
}
