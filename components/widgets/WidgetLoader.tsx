"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const widgetMap: Record<string, ComponentType> = {
  "cv/wiggers": dynamic(() => import("@/components/widgets/cv/wiggers"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/frank-starling": dynamic(() => import("@/components/widgets/cv/frank-starling"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/pv-loop": dynamic(() => import("@/components/widgets/cv/pv-loop"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/baroreflex": dynamic(() => import("@/components/widgets/cv/baroreflex"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/cardiac-output": dynamic(() => import("@/components/widgets/cv/cardiac-output"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/cardiac-action-potentials": dynamic(() => import("@/components/widgets/cv/cardiac-action-potentials"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/coronary-perfusion": dynamic(() => import("@/components/widgets/cv/coronary-perfusion"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/vascular-compliance": dynamic(() => import("@/components/widgets/cv/vascular-compliance"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/poiseuille-flow": dynamic(() => import("@/components/widgets/cv/poiseuille-flow"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/capillary-starling": dynamic(() => import("@/components/widgets/cv/capillary-starling"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/microcirculation-autoregulation": dynamic(
    () => import("@/components/widgets/cv/microcirculation-autoregulation"),
    {
      loading: () => <WidgetLoading />,
      ssr: false
    }
  ),
  "cv/ecg-intervals": dynamic(() => import("@/components/widgets/cv/ecg-intervals"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/valvular-lesions": dynamic(() => import("@/components/widgets/cv/valvular-lesions"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/shock-states": dynamic(() => import("@/components/widgets/cv/shock-states"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/fetal-circulation-transition": dynamic(
    () => import("@/components/widgets/cv/fetal-circulation-transition"),
    {
      loading: () => <WidgetLoading />,
      ssr: false
    }
  ),
  "cv/jvp-waveform": dynamic(() => import("@/components/widgets/cv/jvp-waveform"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/heart-sounds": dynamic(() => import("@/components/widgets/cv/heart-sounds"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/murmur-maneuvers": dynamic(() => import("@/components/widgets/cv/murmur-maneuvers"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/arrhythmia-mechanisms": dynamic(() => import("@/components/widgets/cv/arrhythmia-mechanisms"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/o2-hb": dynamic(() => import("@/components/widgets/resp/o2-hb"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/vq-matching": dynamic(() => import("@/components/widgets/resp/vq-matching"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/lung-volumes": dynamic(() => import("@/components/widgets/resp/lung-volumes"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/airway-resistance": dynamic(() => import("@/components/widgets/resp/airway-resistance"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/ventilation-control": dynamic(() => import("@/components/widgets/resp/ventilation-control"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/diffusion-limitation": dynamic(() => import("@/components/widgets/resp/diffusion-limitation"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/compliance-pressure-volume": dynamic(
    () => import("@/components/widgets/resp/compliance-pressure-volume"),
    {
      loading: () => <WidgetLoading />,
      ssr: false
    }
  ),
  "resp/dead-space-ventilation": dynamic(() => import("@/components/widgets/resp/dead-space-ventilation"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/oxygen-content": dynamic(() => import("@/components/widgets/resp/oxygen-content"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/respiratory-acid-base": dynamic(() => import("@/components/widgets/resp/respiratory-acid-base"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/flow-volume-loops": dynamic(() => import("@/components/widgets/resp/flow-volume-loops"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/co2-transport": dynamic(() => import("@/components/widgets/resp/co2-transport"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/aa-gradient-hypoxemia": dynamic(() => import("@/components/widgets/resp/aa-gradient-hypoxemia"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/west-zones": dynamic(() => import("@/components/widgets/resp/west-zones"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "nerv/action-potential": dynamic(() => import("@/components/widgets/nerv/action-potential"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "msk/cross-bridge": dynamic(() => import("@/components/widgets/msk/cross-bridge"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "msk/length-tension": dynamic(() => import("@/components/widgets/msk/length-tension"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "msk/excitation-contraction": dynamic(() => import("@/components/widgets/msk/excitation-contraction"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "msk/motor-unit-recruitment": dynamic(() => import("@/components/widgets/msk/motor-unit-recruitment"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "msk/bone-remodeling": dynamic(() => import("@/components/widgets/msk/bone-remodeling"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "msk/force-velocity": dynamic(() => import("@/components/widgets/msk/force-velocity"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "msk/twitch-summation": dynamic(() => import("@/components/widgets/msk/twitch-summation"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "msk/fiber-type-metabolism": dynamic(() => import("@/components/widgets/msk/fiber-type-metabolism"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "msk/muscle-spindle": dynamic(() => import("@/components/widgets/msk/muscle-spindle"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "msk/joint-lever-mechanics": dynamic(() => import("@/components/widgets/msk/joint-lever-mechanics"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "gi/gastric-acid": dynamic(() => import("@/components/widgets/gi/gastric-acid"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "endo/hpa-axis": dynamic(() => import("@/components/widgets/endo/hpa-axis"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "endo/glucose-homeostasis": dynamic(
    () => import("@/components/widgets/endo/glucose-homeostasis"),
    {
      loading: () => <WidgetLoading />,
      ssr: false
    }
  ),
  "endo/hpt-axis": dynamic(() => import("@/components/widgets/endo/hpt-axis"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "endo/leptin-ghrelin-appetite": dynamic(
    () => import("@/components/widgets/endo/leptin-ghrelin-appetite"),
    {
      loading: () => <WidgetLoading />,
      ssr: false
    }
  ),
  "endo/adrenal-medulla": dynamic(() => import("@/components/widgets/endo/adrenal-medulla"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "endo/hormone-dose-response": dynamic(
    () => import("@/components/widgets/endo/hormone-dose-response"),
    {
      loading: () => <WidgetLoading />,
      ssr: false
    }
  ),
  "nerv/reflex-arc": dynamic(() => import("@/components/widgets/nerv/reflex-arc"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "nerv/synaptic-transmission": dynamic(
    () => import("@/components/widgets/nerv/synaptic-transmission"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "nerv/phototransduction": dynamic(
    () => import("@/components/widgets/nerv/phototransduction"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "endo/thyroid-hormone-synthesis": dynamic(
    () => import("@/components/widgets/endo/thyroid-hormone-synthesis"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "endo/pituitary-hormone-map": dynamic(
    () => import("@/components/widgets/endo/pituitary-hormone-map"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "endo/calcium-homeostasis": dynamic(
    () => import("@/components/widgets/endo/calcium-homeostasis"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "endo/insulin-glucagon": dynamic(
    () => import("@/components/widgets/endo/insulin-glucagon"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "nerv/receptive-fields": dynamic(
    () => import("@/components/widgets/nerv/receptive-fields"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "nerv/resting-membrane-potential": dynamic(
    () => import("@/components/widgets/nerv/resting-membrane-potential"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "nerv/nerve-conduction-velocity": dynamic(
    () => import("@/components/widgets/nerv/nerve-conduction-velocity"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "nerv/pupillary-light-reflex": dynamic(
    () => import("@/components/widgets/nerv/pupillary-light-reflex"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "nerv/autonomic-nervous-system": dynamic(
    () => import("@/components/widgets/nerv/autonomic-nervous-system"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "nerv/pain-gate-control": dynamic(
    () => import("@/components/widgets/nerv/pain-gate-control"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "nerv/sleep-stages-eeg": dynamic(
    () => import("@/components/widgets/nerv/sleep-stages-eeg"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "nerv/cochlear-transduction": dynamic(
    () => import("@/components/widgets/nerv/cochlear-transduction"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "nerv/spinal-cord-tracts": dynamic(
    () => import("@/components/widgets/nerv/spinal-cord-tracts"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "gi/bile-flow": dynamic(() => import("@/components/widgets/gi/bile-flow"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "gi/vomiting-reflex": dynamic(() => import("@/components/widgets/gi/vomiting-reflex"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "renal/micturition-reflex": dynamic(
    () => import("@/components/widgets/renal/micturition-reflex"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "renal/gfr-autoregulation": dynamic(
    () => import("@/components/widgets/renal/gfr-autoregulation"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "renal/bladder-pressure-volume": dynamic(
    () => import("@/components/widgets/renal/bladder-pressure-volume"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "renal/nephron-handling": dynamic(
    () => import("@/components/widgets/renal/nephron-handling"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "renal/diuretic-sites": dynamic(
    () => import("@/components/widgets/renal/diuretic-sites"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "gi/intestinal-absorption": dynamic(
    () => import("@/components/widgets/gi/intestinal-absorption"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "gi/fat-absorption-micelles": dynamic(
    () => import("@/components/widgets/gi/fat-absorption-micelles"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "gi/peristalsis": dynamic(() => import("@/components/widgets/gi/peristalsis"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "gi/swallowing-esophageal-motility": dynamic(
    () => import("@/components/widgets/gi/swallowing-esophageal-motility"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "gi/pancreatic-secretion": dynamic(
    () => import("@/components/widgets/gi/pancreatic-secretion"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "gi/gastric-emptying": dynamic(() => import("@/components/widgets/gi/gastric-emptying"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "gi/colon-water-electrolyte": dynamic(
    () => import("@/components/widgets/gi/colon-water-electrolyte"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "renal/ureteral-peristalsis": dynamic(
    () => import("@/components/widgets/renal/ureteral-peristalsis"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "renal/countercurrent": dynamic(() => import("@/components/widgets/renal/countercurrent"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "renal/acid-base": dynamic(() => import("@/components/widgets/renal/acid-base"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "renal/potassium-handling": dynamic(
    () => import("@/components/widgets/renal/potassium-handling"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "renal/raas": dynamic(() => import("@/components/widgets/renal/raas"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "repro/menstrual-cycle": dynamic(() => import("@/components/widgets/repro/menstrual-cycle"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "repro/spermatogenesis": dynamic(() => import("@/components/widgets/repro/spermatogenesis"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "repro/pregnancy-hormones": dynamic(() => import("@/components/widgets/repro/pregnancy-hormones"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "repro/lactation": dynamic(() => import("@/components/widgets/repro/lactation"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "repro/erection-ejaculation": dynamic(() => import("@/components/widgets/repro/erection-ejaculation"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "repro/hpg-axis": dynamic(() => import("@/components/widgets/repro/hpg-axis"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "repro/menopause-transition": dynamic(
    () => import("@/components/widgets/repro/menopause-transition"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "repro/sexual-differentiation": dynamic(
    () => import("@/components/widgets/repro/sexual-differentiation"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "repro/contraception-methods": dynamic(
    () => import("@/components/widgets/repro/contraception-methods"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "cv/laplace-wall-stress": dynamic(() => import("@/components/widgets/cv/laplace-wall-stress"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/hypoxic-pulmonary-vasoconstriction": dynamic(
    () => import("@/components/widgets/resp/hypoxic-pulmonary-vasoconstriction"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "nerv/strength-duration-curve": dynamic(
    () => import("@/components/widgets/nerv/strength-duration-curve"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "msk/bone-density-lifespan": dynamic(
    () => import("@/components/widgets/msk/bone-density-lifespan"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "gi/sodium-glucose-cotransport": dynamic(
    () => import("@/components/widgets/gi/sodium-glucose-cotransport"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "endo/cortisol-circadian-rhythm": dynamic(
    () => import("@/components/widgets/endo/cortisol-circadian-rhythm"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "renal/glucose-titration": dynamic(() => import("@/components/widgets/renal/glucose-titration"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "repro/gnrh-pulsatility": dynamic(() => import("@/components/widgets/repro/gnrh-pulsatility"), {
    loading: () => <WidgetLoading />,
    ssr: false
  })
};

const PendingWidget = dynamic(() => import("@/components/widgets/PendingWidget"), {
  loading: () => <WidgetLoading />,
  ssr: false
});

function WidgetLoading() {
  return (
    <section className="ph-widget-shell">
      <div className="ph-panel h-64 animate-pulse" />
    </section>
  );
}

export function WidgetLoader({ diagramId }: { diagramId: string }) {
  const Widget = widgetMap[diagramId] ?? PendingWidget;
  return <Widget />;
}
