export type FeedbackGuideNode = {
  label: string;
  value?: string;
  active?: boolean;
};

type FeedbackLoopGuideProps = {
  nodes: [FeedbackGuideNode, FeedbackGuideNode, FeedbackGuideNode];
  feedbackActive: boolean;
  feedbackLabel?: string;
};

const roleItems = [
  { title: "1 Sense", verb: "detects the change" },
  { title: "2 Integrate", verb: "compares against the set point" },
  { title: "3 Respond", verb: "changes the effector" }
] as const;

export function FeedbackLoopGuide({ nodes, feedbackActive, feedbackLabel = "Negative feedback" }: FeedbackLoopGuideProps) {
  const items = roleItems.map((item, index) => ({
    ...item,
    label: nodes[index].label,
    value: nodes[index].value,
    active: nodes[index].active
  }));

  return (
    <div className="mb-4 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3" aria-label="How to read this feedback loop">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="ph-section-label">Read the loop</h2>
        <span className="text-xs font-medium text-ph-muted">Follow 1 → 2 → 3, then the output brakes upstream drive.</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.title}
            className={
              item.active
                ? "rounded-ph border border-[color-mix(in_srgb,var(--ph-accent),transparent_48%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_90%)] p-3"
                : "rounded-ph border border-[var(--ph-border)] bg-ph-surface p-3"
            }
          >
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ph-muted">{item.title}</p>
            <p className="mt-1 text-sm font-bold leading-tight text-ph-text">{item.label}</p>
            <p className="mt-1 text-xs text-ph-muted">{item.verb}</p>
            {item.value ? <p className="mt-2 text-xs font-bold tabular-nums text-ph-accent">{item.value}</p> : null}
          </div>
        ))}
        <div
          className={
            feedbackActive
              ? "rounded-ph border border-[color-mix(in_srgb,var(--ph-danger),transparent_48%)] bg-[color-mix(in_srgb,var(--ph-danger),transparent_91%)] p-3"
              : "rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_89%)] p-3"
          }
        >
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ph-muted">4 Brake</p>
          <p className="mt-1 text-sm font-bold leading-tight text-ph-text">{feedbackLabel}</p>
          <p className="mt-1 text-xs text-ph-muted">
            {feedbackActive ? "output inhibits upstream drive" : "brake is disabled; loop runs open"}
          </p>
          <p className="mt-2 text-xs font-bold tabular-nums" style={{ color: feedbackActive ? "var(--ph-danger)" : "var(--ph-warn)" }}>
            {feedbackActive ? "Feedback on" : "Feedback off"}
          </p>
        </div>
      </div>
    </div>
  );
}
