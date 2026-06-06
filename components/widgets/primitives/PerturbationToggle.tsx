"use client";

export type PerturbationToggleProps = {
  label: string;
  checked: boolean;
  description?: string;
  onChange: (checked: boolean) => void;
};

export function PerturbationToggle({ label, checked, description, onChange }: PerturbationToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="focus-ring flex w-full items-start justify-between gap-3 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 px-3 py-2.5 text-left transition hover:border-[var(--ph-border-strong)] hover:bg-ph-surface3"
      onClick={() => onChange(!checked)}
    >
      <span>
        <span className="block text-sm font-semibold text-ph-text">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-ph-muted">{description}</span> : null}
      </span>
      <span aria-hidden="true" className="ph-toggle-track shrink-0 mt-0.5" data-checked={checked}>
        <span className="ph-toggle-knob" />
      </span>
    </button>
  );
}
