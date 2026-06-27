"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

/**
 * Micturition (voiding) reflex.
 *   Bladder filling stretches the detrusor → afferents via pelvic nerve
 *     (S2-S4) → pontine micturition centre (PMC) → parasympathetic
 *     output: detrusor contraction + relaxation of internal sphincter.
 *   Voluntary control: descending tracts from frontal cortex hold the
 *     EXTERNAL urethral sphincter (somatic, pudendal nerve) closed until
 *     a socially appropriate moment.
 *
 * Lesions:
 *   - Above pons (stroke, dementia): loss of voluntary inhibition →
 *     uninhibited / urge incontinence. PMC reflex still works.
 *   - Sacral cord (S2-S4) lesion: AREFLEXIC bladder, overflow incontinence.
 *     Catheterise.
 *   - Above sacrum but below pons (spinal cord injury): after spinal shock,
 *     REFLEX neurogenic bladder. Detrusor-sphincter dyssynergia — bladder
 *     contracts against closed sphincter → high pressure → upper-tract damage.
 */
const config: FeedbackLabConfig = {
  diagramId: "renal/micturition-reflex",
  readingGuide:
    "Bladder volume is the trigger. Filling stretches the wall, afferents reach the pons, and parasympathetic detrusor contraction fires WITH external sphincter relaxation = coordinated voiding. Below threshold the system stores (sphincter tight). Follow the switch from storage to voiding, which a cord lesion can uncouple.",
  loop: {
    guideSteps: [
      { title: "1 Fill/stretch", verb: "detrusor stretch afferents rise with volume" },
      { title: "2 Coordinate", verb: "sacral cord and PMC coordinate voiding reflex" },
      { title: "3 Void/store", verb: "detrusor and sphincters execute storage or voiding" }
    ],
    guideSummary: "Bladder filling drives a sacral-pontine reflex that cortical control can gate until voiding is appropriate.",
    feedbackStepTitle: "4 Gate",
    nodeRoles: ["Pelvic afferent", "PMC/S2-S4", "Outlet"],
    forwardHeader: "PELVIC AFFERENT → PMC",
    feedbackHeader: "CORTICAL/SPINAL GATE",
    forwardLabels: ["pelvic nerve", "parasymp/pudendal"],
    feedbackLabel: "continence gate",
    feedbackGuideTitle: "Cortical continence gate",
    feedbackVerbActive: "descending control coordinates storage versus voiding",
    feedbackVerbInactive: "descending gate is released or the cord pathway is disconnected",
    feedbackStatusActive: "Gate linked",
    feedbackStatusInactive: "Gate released",
    feedbackOffLabel: "gate released",
    legendForward: "pelvic afferents trigger voiding circuitry",
    legendFeedback: "descending gate controls continence"
  },
  controls: [
    { key: "volume", label: "Bladder volume", min: 0, max: 800, step: 5, defaultValue: 250, unit: "mL" },
    { key: "voluntary", label: "Voluntary cortical inhibition", min: 0, max: 200, step: 1, defaultValue: 100, unit: "%" },
    { key: "detrusorTone", label: "Detrusor (parasympathetic) tone", min: 0, max: 200, step: 1, defaultValue: 100, unit: "%" }
  ],
  toggles: [{ key: "cordIntact", label: "Spinal cord above sacrum intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    // Afferent firing — quiet < 150 mL, urgent > 400.
    const afferent = clamp((values.volume - 100) * 0.32, 0, 240);
    const reflexUrgency = toggles.cordIntact && afferent > 40 ? afferent : 0;
    // External sphincter held tight by cortical descending control.
    const externalSphincter = clamp((values.voluntary / 100) * 100, 0, 100);
    // Detrusor contraction = reflex urgency × parasympathetic tone, modulated
    // by cortical inhibition (the cortex holds the reflex down until release).
    const detrusorContraction = clamp(
      reflexUrgency * (values.detrusorTone / 100) * (1 - clamp(values.voluntary / 200, 0, 0.85)),
      0,
      240
    );
    // Intravesical pressure: low during accommodation, rises sharply when reflex fires.
    const pressure = clamp(5 + Math.pow(values.volume / 200, 2) * 6 + detrusorContraction * 0.18, 5, 90);
    const voiding = detrusorContraction > 80 && externalSphincter < 40;

    const phenotype = (() => {
      if (!toggles.cordIntact && values.volume > 350) return "Overflow incontinence — areflexic (atonic) bladder, residual > 200 mL";
      if (toggles.cordIntact && values.voluntary < 30 && values.detrusorTone > 100) return "Detrusor-sphincter dyssynergia — high-pressure voiding, upper-tract risk";
      if (values.voluntary < 30 && values.volume > 300) return "Uninhibited bladder — urge incontinence (above-pontine lesion)";
      if (voiding) return "Active voiding — coordinated detrusor + sphincter relaxation";
      if (values.volume > 500 && values.voluntary > 80) return "Strong voluntary suppression at high volume — discomfort, urgency";
      if (values.volume < 150) return "Accommodation phase — receptive relaxation, low pressure";
      return "Continent storage";
    })();

    return {
      state: phenotype,
      body: "The bladder works as a low-pressure reservoir until volume threshold (~300–400 mL in adults) triggers the pelvic-nerve afferent surge. The pontine micturition centre coordinates synchronous detrusor contraction + sphincter relaxation. Voluntary cortical control overrides the reflex until socially appropriate. Lose the pons-to-cortex pathway → urge incontinence. Lose the spinal cord above sacrum → reflex bladder + dyssynergia. Lose the sacral arc → areflexic bladder + overflow.",
      warning:
        pressure > 40
          ? "Edge state: bladder pressure > 40 cm H₂O — vesicoureteral reflux risk → hydronephrosis, eventual renal scarring."
          : values.volume > 700
            ? "Edge state: > 700 mL — bladder over-distension, detrusor stretch injury, decreased contractility."
            : !toggles.cordIntact && values.volume > 400
              ? "Edge state: severe retention with cord lesion — catheterise to prevent renal injury."
              : undefined,
      nodes: [
        { label: "Stretch receptors (detrusor)", value: `Firing ${afferent.toFixed(0)}`, active: afferent > 40 },
        { label: "Pontine micturition centre", value: toggles.cordIntact ? "linked" : "disconnected", active: reflexUrgency > 30 },
        { label: "Detrusor + sphincters", value: voiding ? "VOIDING" : `P ${pressure.toFixed(0)} cm H₂O`, active: detrusorContraction > 50 }
      ],
      readouts: [
        { label: "Volume", value: `${values.volume.toFixed(0)} mL` },
        { label: "Pressure", value: `${pressure.toFixed(0)} cm H₂O` },
        { label: "Detrusor", value: `${detrusorContraction.toFixed(0)}` },
        { label: "Ext. sphinct.", value: `${externalSphincter.toFixed(0)}%` },
        { label: "Afferent", value: afferent.toFixed(0) },
        { label: "Voiding", value: voiding ? "yes" : "no" }
      ],
      feedbackActive: toggles.cordIntact && values.voluntary > 20,
      forwardActive: afferent > 40 || values.volume > 300
    };
  }
};

export default function MicturitionReflexWidget() {
  return <FeedbackLabWidget config={config} />;
}
