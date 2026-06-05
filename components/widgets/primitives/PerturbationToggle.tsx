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
      className="focus-ring flex w-full items-start justify-between gap-3 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 px-3 py-3 text-left transition hover:border-[var(--ph-border-strong)]"
      onClick={() => onChange(!checked)}
    >
      <span>
        <span className="block text-sm font-medium text-ph-text">{label}</span>
        {description ? <span className="mt-1 block text-xs text-ph-muted">{description}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full border border-[var(--ph-border-strong)] bg-ph-surface"
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-ph-muted transition-transform data-[checked=true]:translate-x-5 data-[checked=true]:bg-ph-accent"
          data-checked={checked}
        />
      </span>
    </button>
  );
}
