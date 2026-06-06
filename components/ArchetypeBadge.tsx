import { archetypeMeta, type Archetype } from "@/lib/registry";

export function ArchetypeBadge({
  archetype,
  compact = false
}: {
  archetype: Archetype;
  compact?: boolean;
}) {
  const meta = archetypeMeta[archetype];

  return (
    <span className="inline-flex items-center gap-1.5 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 px-2.5 py-1 text-xs font-semibold text-ph-muted">
      <span aria-hidden="true" className="text-base leading-none">
        {meta.emoji}
      </span>
      <span
        aria-hidden="true"
        className="grid h-5 w-5 place-items-center rounded-[6px] bg-[color-mix(in_srgb,var(--ph-accent),transparent_82%)] text-[10px] font-bold text-ph-accent"
      >
        {meta.glyph}
      </span>
      <span>{compact ? meta.shortLabel : meta.label}</span>
    </span>
  );
}
