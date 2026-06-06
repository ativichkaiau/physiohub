export type FeedbackGuideNode = {
  label: string;
  value?: string;
  active?: boolean;
};

export type FeedbackGuideStep = {
  title: string;
  verb: string;
};

export type FeedbackGuideReturnKind = "inhibit" | "stimulate";

type FeedbackLoopGuideProps = {
  nodes: [FeedbackGuideNode, FeedbackGuideNode, FeedbackGuideNode];
  feedbackActive: boolean;
  steps?: [FeedbackGuideStep, FeedbackGuideStep, FeedbackGuideStep];
  summary?: string;
  feedbackKind?: FeedbackGuideReturnKind;
  feedbackStepTitle?: string;
  feedbackTitle?: string;
  feedbackVerbActive?: string;
  feedbackVerbInactive?: string;
  feedbackStatusActive?: string;
  feedbackStatusInactive?: string;
};

const roleItems: [FeedbackGuideStep, FeedbackGuideStep, FeedbackGuideStep] = [
  { title: "1 Sense", verb: "detects the change" },
  { title: "2 Integrate", verb: "compares against the set point" },
  { title: "3 Respond", verb: "changes the effector" }
];

export function FeedbackLoopGuide({
  nodes,
  feedbackActive,
  steps = roleItems,
  summary,
  feedbackKind = "inhibit",
  feedbackStepTitle,
  feedbackTitle,
  feedbackVerbActive,
  feedbackVerbInactive,
  feedbackStatusActive = "Feedback on",
  feedbackStatusInactive = "Feedback off"
}: FeedbackLoopGuideProps) {
  const items = steps.map((item, index) => ({
    ...item,
    label: nodes[index].label,
    value: nodes[index].value,
    active: nodes[index].active
  }));
  const isPositiveReturn = feedbackKind === "stimulate";
  const resolvedSummary =
    summary ??
    (isPositiveReturn
      ? "Follow 1 → 2 → 3, then the output reinforces upstream drive."
      : "Follow 1 → 2 → 3, then the output suppresses upstream drive.");
  const resolvedFeedbackStepTitle = feedbackStepTitle ?? (isPositiveReturn ? "4 Reinforce" : "4 Brake");
  const resolvedFeedbackTitle = feedbackTitle ?? (isPositiveReturn ? "Positive feedback" : "Negative feedback");
  const resolvedFeedbackVerbActive =
    feedbackVerbActive ?? (isPositiveReturn ? "output reinforces upstream drive" : "output inhibits upstream drive");
  const resolvedFeedbackVerbInactive =
    feedbackVerbInactive ?? (isPositiveReturn ? "return arm is disabled; reinforcement stops" : "brake is disabled; loop runs open");
  const feedbackTone = feedbackActive ? (isPositiveReturn ? "var(--ph-ok)" : "var(--ph-danger)") : "var(--ph-warn)";

  return (
    <div className="mb-4 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3" aria-label="How to read this feedback loop">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="ph-section-label">Read the loop</h2>
        <span className="text-xs font-medium text-ph-muted">{resolvedSummary}</span>
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
          className="rounded-ph border p-3"
          style={{
            borderColor: `color-mix(in srgb, ${feedbackTone}, transparent ${feedbackActive ? "48%" : "45%"})`,
            background: `color-mix(in srgb, ${feedbackTone}, transparent ${feedbackActive ? "91%" : "89%"})`
          }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ph-muted">{resolvedFeedbackStepTitle}</p>
          <p className="mt-1 text-sm font-bold leading-tight text-ph-text">{resolvedFeedbackTitle}</p>
          <p className="mt-1 text-xs text-ph-muted">
            {feedbackActive ? resolvedFeedbackVerbActive : resolvedFeedbackVerbInactive}
          </p>
          <p className="mt-2 text-xs font-bold tabular-nums" style={{ color: feedbackTone }}>
            {feedbackActive ? feedbackStatusActive : feedbackStatusInactive}
          </p>
        </div>
      </div>
    </div>
  );
}
