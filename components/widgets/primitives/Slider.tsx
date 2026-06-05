"use client";

import { useId } from "react";

export type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
  description?: string;
  onChange: (value: number) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatValue(value: number, step = 1) {
  if (step < 1) {
    const decimals = Math.min(4, String(step).split(".")[1]?.length ?? 1);
    return value.toFixed(decimals);
  }
  return String(Math.round(value));
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  defaultValue,
  description,
  onChange
}: SliderProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const displayValue = `${formatValue(value, step)}${unit ? ` ${unit}` : ""}`;
  const defaultLabel =
    typeof defaultValue === "number" ? `${formatValue(defaultValue, step)}${unit ? ` ${unit}` : ""}` : undefined;

  function handleKeyboard(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!event.shiftKey) {
      return;
    }

    const largeStep = step * 10;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(clamp(value - largeStep, min, max));
    }
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(clamp(value + largeStep, min, max));
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ph-text">
          {label}
        </label>
        <span aria-live="polite" className="rounded-ph bg-ph-surface2 px-2 py-1 text-xs text-ph-muted">
          {displayValue}
        </span>
      </div>
      <input
        id={id}
        className="focus-ring h-8 w-full accent-[var(--ph-accent)]"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-describedby={description ? descriptionId : undefined}
        aria-valuetext={displayValue}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        onKeyDown={handleKeyboard}
      />
      <div className="flex justify-between text-xs text-ph-muted">
        <span>
          {formatValue(min, step)}
          {unit ? ` ${unit}` : ""}
        </span>
        {defaultLabel ? <span>default {defaultLabel}</span> : <span />}
        <span>
          {formatValue(max, step)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      {description ? (
        <p id={descriptionId} className="text-xs text-ph-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
