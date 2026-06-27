"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const steps = [
  {
    eyebrow: "01 — Perfuse",
    title: "Prime the systems map",
    body: "Pick any live system — cardiovascular, respiratory, renal, endocrine, neuro, and more. Each opens a bench of interactive widgets instead of static figures."
  },
  {
    eyebrow: "02 — Clamp",
    title: "Move one variable",
    body: "Drag a slider and the whole mechanism answers in real time — raise preload, drop a pH, widen an ion gradient, or stretch a sarcomere."
  },
  {
    eyebrow: "03 — Compensate",
    title: "Close the feedback loop",
    body: "Toggle a reflex on or off and watch the controlled variable drift from — or snap back to — its set point, the way the body actually compensates."
  },
  {
    eyebrow: "04 — Titrate",
    title: "Push drugs through the model",
    body: "Pharmacology rides on the physiology: add agonists and antagonists to a dose–response curve, map diuretics onto the nephron, or compare adrenergic and cholinergic receptors."
  },
  {
    eyebrow: "05 — Handoff",
    title: "Share the exact state",
    body: "Every control writes to the URL. Copy the link to reopen the identical state — built for teaching, revision notes, and sending a tricky case to a classmate."
  }
] as const;

type PhysiologyIntroProps = {
  autoOpen?: boolean;
  showLauncher?: boolean;
  launcherClassName?: string;
};

export function PhysiologyIntro({ autoOpen = true, showLauncher = true, launcherClassName = "" }: PhysiologyIntroProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const current = steps[step];
  const isLastStep = step === steps.length - 1;

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    if (!autoOpen) return;
    // Auto-open only on a visitor's first load; persist so reloads (and
    // client-side navigation back to the home page) don't re-trigger it.
    // The "Run primer" launcher always reopens it on demand.
    let seen = false;
    try {
      seen = window.localStorage.getItem("ph-intro-seen") === "1";
    } catch {
      seen = false;
    }
    if (!seen) {
      setStep(0);
      setIsOpen(true);
      try {
        window.localStorage.setItem("ph-intro-seen", "1");
      } catch {
        // ignore (private mode / storage disabled)
      }
    }
  }, [autoOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, isOpen]);

  const visualLabel = useMemo(() => {
    if (step === 0) return "Systems online";
    if (step === 1) return "Variable clamped";
    if (step === 2) return "Loop closed";
    if (step === 3) return "Dose titrated";
    return "URL state copied";
  }, [step]);

  function open() {
    setStep(0);
    setIsOpen(true);
  }

  function begin() {
    close();
    window.requestAnimationFrame(() => {
      document.getElementById("systems")?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  return (
    <>
      {showLauncher ? (
        <button
          type="button"
          onClick={open}
          className={`focus-ring ph-intro-launch inline-flex items-center justify-center rounded-ph px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] no-underline transition ${launcherClassName}`}
        >
          Run primer
        </button>
      ) : null}

      {mounted && isOpen ? (
        <div className="ph-intro-overlay" role="presentation">
          <section
            className="ph-intro-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="physio-intro-title"
            aria-describedby="physio-intro-body"
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              className="focus-ring ph-intro-close"
              aria-label="Close physiology primer"
            >
              Close
            </button>
            <div className="text-center">
              <p className="ph-intro-kicker">TR-VII PhysioHub physiology bench</p>
              <h2 id="physio-intro-title" className="mt-3 text-3xl font-black leading-[0.96] tracking-tight sm:text-5xl">
                Organ Systems <span>Boot Sequence</span>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base font-semibold text-slate-300 sm:text-lg">
                Clamp variables, watch gradients shift, and reopen the same physiological state from the URL.
              </p>
            </div>

            <div className="ph-intro-visual mt-6" data-step={step}>
              <IntroVisual label={visualLabel} />
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-4">
                <p className="shrink-0 text-sm font-black uppercase tracking-[0.22em] text-[var(--intro-gold)]">
                  {current.eyebrow}
                </p>
                <span className="h-px flex-1 bg-[color-mix(in_srgb,var(--intro-gold),transparent_58%)]" />
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{current.title}</h3>
              <p id="physio-intro-body" className="mt-2 max-w-3xl text-base font-semibold leading-relaxed text-slate-300 sm:text-lg">
                {current.body}
              </p>
            </div>

            <div className="ph-intro-footer mt-6 border-t border-white/10 pt-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3" aria-label={`Step ${step + 1} of ${steps.length}`}>
                  {steps.map((item, index) => (
                    <button
                      key={item.eyebrow}
                      type="button"
                      onClick={() => setStep(index)}
                      className="focus-ring ph-intro-progress"
                      data-active={index === step}
                      aria-label={`Show ${item.title}`}
                    />
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={step === 0}
                    onClick={() => setStep((value) => Math.max(0, value - 1))}
                    className="focus-ring ph-intro-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => (isLastStep ? begin() : setStep((value) => Math.min(steps.length - 1, value + 1)))}
                    className="focus-ring ph-intro-primary"
                  >
                    {isLastStep ? "Begin" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function IntroVisual({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 820 330" role="img" aria-label="Physiology systems bench preview">
      <rect x="1" y="1" width="818" height="328" rx="28" fill="rgba(4, 13, 18, 0.86)" stroke="rgba(255,255,255,0.12)" />
      <path d="M1 82H819M1 164H819M1 246H819M164 1V329M328 1V329M492 1V329M656 1V329" stroke="rgba(255,255,255,0.075)" />

      <g className="ph-intro-map">
        <text x="86" y="72" className="ph-intro-svg-label">CV PRESSURE</text>
        <path d="M66 217C92 214 99 198 113 198C136 198 135 226 157 226C185 226 185 113 210 113C236 113 233 222 260 222C292 222 305 171 338 171C370 171 388 204 420 204" fill="none" stroke="var(--intro-aqua)" strokeLinecap="round" strokeWidth="9" />
        <path d="M322 94C374 58 424 86 421 133C416 185 359 201 320 164C278 124 281 107 322 94Z" fill="rgba(244,96,119,0.13)" stroke="var(--intro-red)" strokeWidth="4" />
      </g>

      <g className="ph-intro-clamp">
        <text x="506" y="72" className="ph-intro-svg-label">GAS / FILTRATE</text>
        <path d="M528 104C546 127 553 158 546 201M607 104C589 127 582 158 589 201" fill="none" stroke="rgba(239,246,255,0.78)" strokeLinecap="round" strokeWidth="8" />
        <circle cx="557" cy="170" r="27" fill="rgba(68,221,202,0.14)" stroke="var(--intro-aqua)" strokeWidth="4" />
        <circle cx="608" cy="183" r="23" fill="rgba(97,151,255,0.16)" stroke="var(--intro-blue)" strokeWidth="4" />
        <path d="M658 117C704 82 756 105 741 151C729 190 669 178 683 135C696 97 745 127 748 206" fill="none" stroke="var(--intro-gold)" strokeLinecap="round" strokeWidth="7" />
      </g>

      <g className="ph-intro-loop">
        <circle cx="206" cy="272" r="16" fill="var(--intro-gold)" />
        <circle cx="312" cy="272" r="16" fill="var(--intro-aqua)" />
        <circle cx="418" cy="272" r="16" fill="var(--intro-purple)" />
        <path d="M222 272H296M328 272H402M418 255C358 220 264 220 206 255" fill="none" stroke="rgba(239,246,255,0.72)" strokeLinecap="round" strokeWidth="5" />
        <path d="M201 237H174M174 237V263" fill="none" stroke="var(--intro-red)" strokeLinecap="round" strokeWidth="4" />
      </g>

      <g className="ph-intro-drug">
        <text x="446" y="240" className="ph-intro-svg-label">DRUG DOSE</text>
        {/* mini dose–response axes */}
        <path d="M446 300V250M446 300H536" fill="none" stroke="rgba(239,246,255,0.5)" strokeLinecap="round" strokeWidth="2.5" />
        {/* full agonist sigmoid */}
        <path d="M448 298C476 298 482 258 502 256C520 254 528 254 534 254" fill="none" stroke="var(--intro-aqua)" strokeLinecap="round" strokeWidth="4" />
        {/* competitive antagonist — right-shifted, dashed */}
        <path d="M448 299C492 299 500 276 520 268C528 265 531 264 534 263" fill="none" stroke="var(--intro-red)" strokeLinecap="round" strokeWidth="3" strokeDasharray="5 4" />
        <circle cx="503" cy="256" r="5.5" fill="var(--intro-gold)" />
      </g>

      <g className="ph-intro-share">
        <rect x="542" y="243" width="215" height="42" rx="21" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.14)" />
        <path d="M565 264H628M642 264H714" stroke="var(--intro-aqua)" strokeLinecap="round" strokeWidth="5" />
        <circle cx="730" cy="264" r="7" fill="var(--intro-gold)" />
        <text x="574" y="304" className="ph-intro-svg-label">{label}</text>
      </g>
    </svg>
  );
}
