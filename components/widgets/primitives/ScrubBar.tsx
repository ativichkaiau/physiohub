"use client";

import { useId } from "react";

export type ScrubBarProps = {
  label: string;
  value: number;
  duration: number;
  step?: number;
  playing?: boolean;
  speed?: number;
  onChange: (value: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onSpeedChange?: (speed: number) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatSeconds(value: number) {
  return `${value.toFixed(2)} s`;
}

export function ScrubBar({
  label,
  value,
  duration,
  step = 0.01,
  playing = false,
  speed = 1,
  onChange,
  onPlayingChange,
  onSpeedChange
}: ScrubBarProps) {
  const id = useId();
  const valueLabel = `${formatSeconds(value)} of ${formatSeconds(duration)}`;

  function handleKeyboard(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Home") {
      event.preventDefault();
      onChange(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      onChange(duration);
    }
    if (event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowDown")) {
      event.preventDefault();
      onChange(clamp(value - step * 10, 0, duration));
    }
    if (event.shiftKey && (event.key === "ArrowRight" || event.key === "ArrowUp")) {
      event.preventDefault();
      onChange(clamp(value + step * 10, 0, duration));
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ph-text">
          {label}
        </label>
        <span aria-live="polite" className="rounded-ph bg-ph-surface2 px-2 py-1 text-xs text-ph-muted">
          {valueLabel}
        </span>
      </div>
      <input
        id={id}
        className="focus-ring h-8 w-full accent-[var(--ph-accent)]"
        type="range"
        min={0}
        max={duration}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={valueLabel}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        onKeyDown={handleKeyboard}
      />
      <div className="flex flex-wrap items-center gap-2">
        {onPlayingChange ? (
          <button
            type="button"
            className="focus-ring rounded-ph border border-[var(--ph-border)] bg-ph-surface2 px-3 py-2 text-sm hover:border-[var(--ph-border-strong)]"
            onClick={() => onPlayingChange(!playing)}
            aria-pressed={playing}
          >
            {playing ? "Pause" : value >= duration ? "Restart" : "Play"}
          </button>
        ) : null}
        {onSpeedChange ? (
          <label className="flex items-center gap-2 text-sm text-ph-muted">
            Speed
            <select
              className="focus-ring rounded-ph border border-[var(--ph-border)] bg-ph-surface px-2 py-2 text-ph-text"
              value={speed}
              onChange={(event) => onSpeedChange(Number(event.currentTarget.value))}
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
            </select>
          </label>
        ) : null}
      </div>
    </div>
  );
}
