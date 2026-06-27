import { Fragment } from "react";

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

export function FeedbackLoopGuide({
  nodes,
  feedbackActive,
  summary,
  feedbackKind = "inhibit",
  feedbackStepTitle,
  feedbackStatusActive = "Feedback on",
  feedbackStatusInactive = "Feedback off"
}: FeedbackLoopGuideProps) {
  const isPositiveReturn = feedbackKind === "stimulate";
  const resolvedSummary =
    summary ??
    (isPositiveReturn
      ? "Sense → integrate → respond, then the output reinforces upstream drive."
      : "Sense → integrate → respond, then the output brakes upstream drive.");
  const resolvedFeedbackWord = (feedbackStepTitle ?? (isPositiveReturn ? "4 Reinforce" : "4 Brake")).replace(/^\d+\s*/, "");
  const feedbackTone = feedbackActive ? (isPositiveReturn ? "var(--ph-ok)" : "var(--ph-danger)") : "var(--ph-warn)";
  const feedbackStatus = feedbackActive ? feedbackStatusActive : feedbackStatusInactive;

  return (
    <div className="mb-4 ph-clay-well px-3 py-2.5" aria-label="How to read this feedback loop">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 text-sm">
        {nodes.map((node, index) => (
          <Fragment key={`${node.label}-${index}`}>
            {index > 0 ? <span aria-hidden className="text-ph-muted">→</span> : null}
            <span className="inline-flex items-center gap-1.5">
              <span
                className={
                  node.active
                    ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ph-accent)] text-[11px] font-black text-white"
                    : "inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--ph-border)] bg-ph-surface text-[11px] font-black text-ph-muted"
                }
              >
                {index + 1}
              </span>
              <span className="font-semibold text-ph-text">{node.label}</span>
            </span>
          </Fragment>
        ))}
        <span aria-hidden className="text-ph-muted">→</span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-flex h-5 items-center justify-center rounded-full px-2 text-[11px] font-black text-white"
            style={{ background: feedbackTone }}
          >
            4 {resolvedFeedbackWord}
          </span>
          <span className="text-xs font-bold" style={{ color: feedbackTone }}>
            {feedbackStatus}
          </span>
        </span>
      </div>
      <p className="mt-2 text-xs text-ph-muted">{resolvedSummary}</p>
    </div>
  );
}
