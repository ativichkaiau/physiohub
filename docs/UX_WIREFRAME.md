# PhysioHub TR-VII — UX Wireframes & Direction

Audience: medical students. 8 systems, ~65 interactive physiology diagrams,
classified into **5 widget archetypes** composed from **6 shared primitives**.
Every diagram is its own page; the system page is a hub of diagram cards;
the hub home is a hub of system cards. All interactive state is URL-encoded
so any view is shareable.

> **Replaces** the prior atlas-style wireframe (click-structure → detail).
> The hub-home grid and the theme-token contract survive; the per-system SVG +
> structure detail panel is out of scope under this direction. See §11.

---

## 0. The 6 shared primitives (foundation)

Every archetype is composed from these. No archetype introduces a primitive
of its own. New primitives require a written justification before merging.

| #  | Primitive    | What it is                                                                                  |
|----|--------------|---------------------------------------------------------------------------------------------|
| P1 | **ScrubBar** | Horizontal draggable position cursor with play/pause + speed. Drives a time-like parameter. |
| P2 | **Slider**   | Single-axis labeled parameter slider with min/max/default tick + current value chip.        |
| P3 | **Plot**     | Cartesian chart canvas. Renders one or more traces, supports cursor and annotation pins.    |
| P4 | **NodeGraph**| Directed graph: nodes (chambers, glands, mechanism states) + edges (arrows / pulses).       |
| P5 | **Annotation**| Pinned label anchored to a point/region of P3, P4, or any SVG. Shows name + optional value. |
| P6 | **Toggle**   | Boolean switch or chip-style on/off. Used for trace visibility, overlay toggles, break-loop.|

Existing CSS tokens (W08 / BiochemMet / Williams Rothmans family) drive
appearance: `--signal`, `--signal-soft`, `--surface`, `--surface-2`,
`--border`, `--border-bright`, `--good`, `--warn`, `--bad`. SVG-specific
tokens (`--svg-stroke`, `--svg-highlight`, `--svg-active`) carry from the
prior contract; they now belong to P3 / P4 / P5.

---

## 1. Hub home

8 system cards in a responsive grid. No change from prior spec, with updated
teaser framing ("5+ diagrams" replaces "one SVG"; CV may expand to 15).

```
┌────────────────────────────────────────────────────────────────────┐
│ [P] PhysioHub · Toro Rosso VII                          [☀ Day]    │
├────────────────────────────────────────────────────────────────────┤
│  8 SYSTEMS · ~65 DIAGRAMS                                          │
│  Build a working model of the body. Each diagram is a widget       │
│  you can scrub, perturb, or step through.                          │
│                                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ LIVE     │ │ SOON     │ │ SOON     │ │ SOON     │               │
│  │ Cardio   │ │ Resp     │ │ Nervous  │ │ MSK      │               │
│  │ 6 diag.  │ │ 5 diag.  │ │ 7 diag.  │ │ 4 diag.  │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ SOON     │ │ SOON     │ │ SOON     │ │ SOON     │               │
│  │ Digest   │ │ Endo     │ │ Renal    │ │ Repro    │               │
│  │ 5 diag.  │ │ 6 diag.  │ │ 4 diag.  │ │ 3 diag.  │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
└────────────────────────────────────────────────────────────────────┘
```

**Mobile (320 px):** 2 columns, identical cards, vertical scroll.
`grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))`.

**Card anatomy:** state tag (LIVE / SOON, color via `--signal` / `--warn`),
system name (18 px semibold), diagram count + one-line teaser. No
thumbnails in Phase 1.

---

## 2. System page (Cardiovascular as example)

A grid of diagram cards. Each card links to that diagram's page.

```
┌────────────────────────────────────────────────────────────────────┐
│ [P] PhysioHub › Cardiovascular              [← All systems] [☀]    │
├────────────────────────────────────────────────────────────────────┤
│  CARDIOVASCULAR · 6 DIAGRAMS                                       │
│                                                                    │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐          │
│  │ ⏱ TIMELINE    │ │ ⇄ CURVE       │ │ ⇄ MULTI-VAR    │          │
│  │ Wiggers Cycle  │ │ Frank–Starling │ │ PV Loop        │          │
│  │ Scrub one full │ │ Slide preload  │ │ Drag preload,  │          │
│  │ cardiac cycle  │ │ to watch SV    │ │ afterload,     │          │
│  │ to trace P, V, │ │ rise then      │ │ contractility  │          │
│  │ and ECG.       │ │ plateau.       │ │ to reshape it. │          │
│  └────────────────┘ └────────────────┘ └────────────────┘          │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐          │
│  │ ⇄ CURVE       │ │ ⏷ FEEDBACK    │ │ ⇄ MULTI-VAR    │          │
│  │ Length-Tension │ │ Baroreflex     │ │ Cardiac Output │          │
│  │ …              │ │ …              │ │ vs Venous Ret  │          │
│  └────────────────┘ └────────────────┘ └────────────────┘          │
└────────────────────────────────────────────────────────────────────┘
```

Card anatomy: **archetype glyph + tag** (one of the five), diagram title,
1–2 sentence teaser. The archetype tag is the same chip that appears in
the diagram-page header — students learn the family before they enter.

Mobile (320 px): 1 column, cards stack vertically.

### 2.1 System page — Renal (KUB)

```
┌────────────────────────────────────────────────────────────────────┐
│ [P] PhysioHub › Renal (KUB)                 [← All systems] [☀]    │
├────────────────────────────────────────────────────────────────────┤
│  RENAL · KIDNEYS · URETERS · BLADDER · 4 DIAGRAMS                  │
│                                                                    │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐          │
│  │ ▶ MECHANISM   │ │ ⏷ FEEDBACK    │ │ ⇄ CURVE        │          │
│  │ Nephron        │ │ RAAS           │ │ GFR Auto-      │          │
│  │ Handling       │ │ Step through   │ │ regulation     │          │
│  │ Walk a solute  │ │ low-volume     │ │ Slide arterial │          │
│  │ from glomerulus│ │ activation,    │ │ pressure to    │          │
│  │ through PCT,   │ │ Na⁺ + H₂O      │ │ see myogenic + │          │
│  │ loop, DCT, CD. │ │ retention.     │ │ TGF hold GFR.  │          │
│  └────────────────┘ └────────────────┘ └────────────────┘          │
│  ┌────────────────┐                                                │
│  │ ⊞ MULTI-VAR    │                                                │
│  │ Acid–Base      │                                                │
│  │ (Davenport)    │                                                │
│  │ Drag PaCO₂ and │                                                │
│  │ [HCO₃⁻] to     │                                                │
│  │ trace the four │                                                │
│  │ disturbances.  │                                                │
│  └────────────────┘                                                │
└────────────────────────────────────────────────────────────────────┘
```

**Archetype mix:** 1 Mechanism · 1 Feedback · 1 Curve · 1 Multi-var.
Four of the five archetype families exercised in a single system —
healthy spread, no Phase-1-only diagrams left over.

**Cross-system links** (rendered in Reference panels):
- *Nephron Handling* → Endo · ADH axis; CV · Mean arterial pressure
- *RAAS* → CV · Baroreflex; Endo · Aldosterone
- *Acid–Base* → Resp · CO₂ transport; GI · Vomiting/diarrhea cases

### 2.2 System page — Musculoskeletal

```
┌────────────────────────────────────────────────────────────────────┐
│ [P] PhysioHub › Musculoskeletal             [← All systems] [☀]    │
├────────────────────────────────────────────────────────────────────┤
│  MUSCULOSKELETAL · 4 DIAGRAMS                                      │
│                                                                    │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐          │
│  │ ▶ MECHANISM   │ │ ⇄ CURVE       │ │ ⇄ CURVE        │          │
│  │ Cross-bridge   │ │ Length–Tension │ │ Force–Velocity │          │
│  │ Cycle          │ │ Slide          │ │ Drag the load  │          │
│  │ Walk the 5     │ │ sarcomere      │ │ to trade       │          │
│  │ steps of       │ │ length to map  │ │ shortening     │          │
│  │ ATP → power    │ │ active +       │ │ velocity for   │          │
│  │ stroke.        │ │ passive force. │ │ tension.       │          │
│  └────────────────┘ └────────────────┘ └────────────────┘          │
│  ┌────────────────┐                                                │
│  │ ⏱ TIMELINE    │                                                │
│  │ Motor-Unit     │                                                │
│  │ Recruitment    │                                                │
│  │ Scrub          │                                                │
│  │ increasing     │                                                │
│  │ effort and     │                                                │
│  │ watch size     │                                                │
│  │ principle run. │                                                │
│  └────────────────┘                                                │
└────────────────────────────────────────────────────────────────────┘
```

**Archetype mix:** 1 Mechanism · 2 Curve · 1 Timeline. Length–Tension
and Force–Velocity are intentionally both Perturbable Curves — they
share the same primitive scaffold (P3 Plot + P2 Sliders + P5 p-max
annotation) and learning one transfers cleanly to the other.

**Cross-system links** (rendered in Reference panels):
- *Cross-bridge Cycle* → Nerv · NMJ transmission; Endo · Thyroid hormone on muscle
- *Length–Tension* → CV · Frank–Starling (same primitive, same lesson on cardiac muscle)
- *Motor-Unit Recruitment* → Nerv · Spinal motor neurons; Nerv · UMN vs LMN

> **Phase-1 build note.** CV, Renal, and MSK collectively exercise all
> five archetypes and all six primitives. Picking these three as the
> first three live systems (instead of, say, three Curve-heavy systems)
> stress-tests the primitive set before the catalog grows to 65.

---

## 3. Diagram page — shared chrome

Every diagram page, regardless of archetype, has the same 7 chrome regions:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                   │
│ [P] PhysioHub › CV › Wiggers Cycle           [⏱ SCRUBBABLE TIMELINE]    │
│                                              [← Back] [⇪ Share] [☀]      │
├──────────────────────────────────────────────────────────────────────────┤
│ CONCEPT  One full cardiac cycle. Scrub the timeline to align pressure,   │
│          volume, and ECG events. Watch the dicrotic notch on the aorta   │
│          trace as the aortic valve closes.                               │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐ ┌────────────────────────┐ │
│ │                                           │ │ CONTROLS               │ │
│ │                                           │ │ (archetype-specific)   │ │
│ │  MAIN INTERACTIVE AREA                    │ │                        │ │
│ │  (archetype-specific)                     │ │                        │ │
│ │                                           │ │                        │ │
│ │                                           │ ├────────────────────────┤ │
│ │                                           │ │ REFERENCES             │ │
│ │                                           │ │ • Costanzo 7e, 124–128 │ │
│ │                                           │ │ • Boron 3e, 510–516    │ │
│ │                                           │ │ • Hall 14e, 110–117    │ │
│ │                                           │ │                        │ │
│ └───────────────────────────────────────────┘ └────────────────────────┘ │
│                                                                          │
│ FOOTER  Report an error in this diagram → errata@physiohub.med           │
└──────────────────────────────────────────────────────────────────────────┘
```

**Regions and their purpose:**

| Region    | Width   | Always present | Purpose                                                    |
|-----------|---------|----------------|------------------------------------------------------------|
| Header    | full    | yes            | Breadcrumb, title, archetype tag chip, Back/Share/theme    |
| Concept   | full    | yes            | 1–3 sentences. **What you're seeing · what to manipulate · what to observe.** |
| Main      | 1fr     | yes            | The interactive widget (archetype-specific)                |
| Control   | 320 px  | yes            | Sliders / scrub / toggles for this diagram                 |
| Reference | 320 px  | yes            | Textbook citations with page numbers                       |
| Footer    | full    | yes            | Mailto error report link                                   |
| Share chip| in head | yes            | "URL synced" indicator — live URL updates as user interacts|

### Header detail

```
┌──────────────────────────────────────────────────────────────────────┐
│ [P] PhysioHub                                                        │
│  Cardiovascular › Wiggers Cycle              [⏱ Scrubbable Timeline] │
│                                              [← Back] [⇪ Share] [☀]  │
└──────────────────────────────────────────────────────────────────────┘
```

The archetype tag uses a glyph + label per family:
`⏱ Scrubbable Timeline · ⇄ Perturbable Curve · ⏷ Feedback Loop · ▶ Click-to-Mechanism · ⊞ Multi-variable Interaction`.

### Mobile (320 px) chrome

Every diagram collapses to a single column. The control panel slides **below**
the main area (never an overlay — student must see the widget while
adjusting it).

```
┌────────────────────┐
│ HEADER             │
│ [P] CV › Wiggers   │
│ [⏱ TIMELINE]      │
├────────────────────┤
│ CONCEPT (text)     │
├────────────────────┤
│ MAIN (widget)      │
│                    │
│                    │
├────────────────────┤
│ CONTROLS           │
│                    │
├────────────────────┤
│ REFERENCES         │
├────────────────────┤
│ FOOTER (mailto)    │
└────────────────────┘
```

---

## 4. Archetype 1 — Scrubbable Timeline

**Worked example:** Wiggers diagram.
**Other instances:** Menstrual cycle (endo), Action potential (nerv).

**Primitives:** P3 Plot (stacked traces) · P1 ScrubBar · P5 Annotation
(phase labels) · P6 Toggle (trace visibility).

### Wireframe — initial state

```
MAIN
              Aortic Pressure ─╮
        120 ┤             ╭────╯╲                                  
        100 ┤            │       ╲___                              
         80 ┤───────────╯           ╲___________                   
         60 ┤            ╮  LV pressure                            
         40 ┤            │                                         
         20 ┤            │                                         
          0 ┤────────────╯                                         
            │ LV Volume (mL)                                       
        130 ┤ ╲                                                    
         70 ┤  ╲___           ╭──                                  
            │                                                      
            │ ECG                                                  
            │     P     QRS    T                                   
            │ ────╮──────│──╮──────                                
            │     │      │  │                                      
            └─────┴──────┴──┴────────────────────                  
              [a] [c]  [v]  Diastole                              
               ↑ cursor at t=0

CONTROLS                              REFERENCES
━━●━━━━━━━━━━━━━━━━━━━━ 0.00 / 0.80s  • Costanzo 7e, 124–128
[▶] [⏸] speed [1×ⓥ]                  • Boron 3e, 510–516
                                      • Hall 14e, 110–117
Traces
☑ Aortic pressure
☑ LV pressure
☑ LA pressure
☑ LV volume
☑ ECG
```

### State: mid-scrub (cursor at t = 0.18 s, isovolumic contraction)

```
MAIN
        ... cursor jumps to t=0.18 s ...
        Vertical line at t=0.18 across all traces.
        Phase label updates to:
            ┌───────────────────────────┐
            │ ISOVOLUMIC CONTRACTION    │
            │ All valves closed.        │
            │ LV pressure rising.       │
            │ Volume constant @ 130 mL. │
            └───────────────────────────┘
        Annotation chips on each trace show value-at-cursor:
            Ao P: 80 mmHg
            LV P: 75 mmHg
            LV V: 130 mL

CONTROLS
━━━━━━━━●━━━━━━━━━━━ 0.18 / 0.80s   (mid-drag — cursor follows pointer)
[⏸] paused
```

### State: edge — scrubbed to t = 0 or t = 0.80

`[▶]` becomes `[↻ restart]` when at end. No phase chip when scrubber is
*between* phases (boundary moment). Prev/next phase buttons disable at endpoints.

### State: mobile

ScrubBar and play/pause sit immediately below the stacked plot — within
thumb reach. Trace toggles fold under a "Traces (5) ▼" disclosure.

---

## 5. Archetype 2 — Perturbable Curve

**Worked example:** Oxygen–hemoglobin dissociation.
**Other instances:** Frank–Starling, Length–tension.

**Primitives:** P3 Plot (1 curve + dimmed baseline overlay) · P2 Slider (× 2–4)
· P5 Annotation (p50, reference markers) · P6 Toggle (baseline overlay).

### Wireframe — initial state

```
MAIN
        SaO2 (%)
        100 ┤             ╭──── current
             │           ╱
         80 ┤          ╱
             │         │
         60 ┤        ◯ p50 = 26.8 mmHg
             │      ╱
         40 ┤     ╱
             │   ╱
         20 ┤  ╱
             │ ╱
          0 └──────────────────────── PO2 (mmHg)
            0    20   40   60   80  100

CONTROLS                              REFERENCES
pH      7.0 ━━━━●━━━━━ 7.6  (7.40)    • Costanzo 7e, 220–224
PaCO2    20 ━━●━━━━━━━ 80   (40)      • Boron 3e, 660–668
Temp     33 ━━━●━━━━━━ 41   (37)      • West 11e, 76–82
2,3-BPG 0.5 ━━●━━━━━━━ 2.5  (1.0)
                                      
[ ↻ Reset to normal ]                 
☐ Show baseline overlay               
```

### State: mid-slide (user dragging pH toward 7.20 — acidosis)

```
MAIN
        Current curve animates right (Bohr shift right).
        Baseline curve fades in dim if "show baseline" enabled.
        p50 chip updates live → p50 = 31.4 mmHg.
        
        A "compare" delta chip appears:
            ┌──────────────────────────┐
            │ Δp50 +4.6 mmHg vs normal │
            │ Right shift: ↓ affinity  │
            └──────────────────────────┘

CONTROLS
pH      7.0 ●━━━━━━━━━ 7.6  (7.20)   (live drag value)
... other sliders unchanged
☑ Show baseline overlay
```

### State: edge — pH pegged at 6.8 (non-physiological)

A warning chip floats above the slider:
```
pH      7.0 ●━━━━━━━━━ 7.6  (6.80) ⚠ Outside physiological range
```
Curve still draws but is shaded `--warn-soft` to mark the state.

### State: mobile

Chart full-width above. Sliders stack 1-per-row. The baseline-overlay
toggle sits at the top of the slider stack.

---

## 6. Archetype 3 — Feedback Loop

**Worked example:** HPA axis.
**Other instances:** HPT, RAAS, glucose homeostasis.

**Primitives:** P4 NodeGraph (the loop topology) · P2 Slider (perturbation
magnitude) · P6 Toggle (break a feedback arm) · P5 Annotation (current
value chips on each node).

### Wireframe — initial state (steady-state)

```
MAIN
                  ┌──────────────────────┐
                  │ HYPOTHALAMUS         │
                  │ CRH ─ 8 pg/mL        │
                  └────────────┬─────────┘
                       │       │ CRH ↓
                       │       ▼
              feedback │ ┌──────────────────────┐
              ◀────────┤ │ ANTERIOR PITUITARY   │
                  ↑    │ │ ACTH ─ 20 pg/mL      │
                  │    │ └────────────┬─────────┘
                  │    │       │ ACTH ↓
                  │    │       ▼
                  │    │ ┌──────────────────────┐
                  │    └─│ ADRENAL CORTEX       │
                  │      │ Cortisol ─ 12 μg/dL  │
                  │      └────────────┬─────────┘
                  │                   │
                  └───────── − ───────┘
                       (negative feedback)

CONTROLS                              REFERENCES
Perturbations                         • Costanzo 7e, 410–418
  [ Inject ACTH ]                     • Boron 3e, 1024–1030
  [ Induce stress (↑CRH) ]            • Greenspan 10e, ch.9
  [ Dexamethasone suppression ]
  
Magnitude  0% ━━━━━●━ 100%  (60%)
Speed      slow ●━━━━ fast  (1×)

Toggles
☐ Break negative feedback
☐ Show molecular species labels
```

### State: mid-perturbation (user clicked "Inject ACTH")

```
MAIN
   - ACTH node value pulses: 20 → 95 pg/mL over ~1 s
   - Animated pulse traverses ACTH → Adrenal edge
   - Cortisol value rises 12 → 24 μg/dL
   - Feedback pulse animates Cortisol → Hypothalamus
   - CRH dips: 8 → 3 pg/mL
   - Eventually returns toward steady state

Time-series mini-chart appears below the graph:
        Cortisol over last 60s
        24 ┤      ╭─╮
        12 ┤─────╯  ╰────...
            0s        30s        60s
```

### State: edge — "Break negative feedback" toggle ON, then perturbation

Feedback edge greys out and is marked `× broken`. Cortisol rises and
**does not** return to baseline. A persistent warning chip pins to the
main area:
```
⚠ FEEDBACK BROKEN — pathological. Cortisol accumulating without restraint.
```

### State: mobile

NodeGraph compresses vertically — nodes stack with arrows running between
them top-to-bottom. The lateral feedback edge curves out around the right
margin. Controls sit below.

---

## 7. Archetype 4 — Click-to-Mechanism

**Worked example:** Cross-bridge cycle (5 steps).
**Other instances:** Nephron solute handling, Phototransduction cascade.

**Primitives:** P4 NodeGraph (used as step diagram, directional) · P1 ScrubBar
(step index 1..N) · P5 Annotation (molecular species labels) · P6 Toggle
(autoplay loop).

### Wireframe — initial state (step 1)

```
MAIN
   ┌──────────────────────────────────────────────┐
   │  STEP 1 — RESTING / ATTACHED                 │
   │                                              │
   │     ╔════════ MYOSIN HEAD ════════╗          │
   │     ║                              ║         │
   │     ╚═══════════╤══════════════════╝         │
   │                 │ (rigor bond)               │
   │     ─────────[ACTIN]──────────────           │
   │                                              │
   └──────────────────────────────────────────────┘

   Stepper:   ●─○─○─○─○      (step 1 of 5)
              1 2 3 4 5

CONTROLS                              REFERENCES
[◀ Prev] [Next ▶]                    • Costanzo 7e, 25–32
[▶ Autoplay]   speed [1×]            • Hall 14e, 76–88
                                      
Jump to step
[1 Attached][2 ATP binds][3 Hydrolysis]
[4 Cocked][5 Power stroke]

Toggles
☑ Show molecular species labels
☐ Loop autoplay
```

### State: mid — user clicked step 3 ("ATP hydrolyzed; head cocked")

```
MAIN
   ┌──────────────────────────────────────────────┐
   │  STEP 3 — ATP HYDROLYZED                     │
   │                                              │
   │       ╔══ MYOSIN HEAD ══╗ (cocked)           │
   │      ╱║   ADP + Pi      ║                    │
   │     ╱ ╚════════════════╝                    │
   │     × (detached)                            │
   │     ─────────[ACTIN]──────────────           │
   │                                              │
   └──────────────────────────────────────────────┘

   Stepper:   ○─○─●─○─○      (step 3 of 5)
              1 2 3 4 5

CONCEPT chip updates:
   "ATP has been hydrolyzed to ADP + Pi. The head is cocked and
    detached, ready to rebind actin one position along."
```

### State: edge — at last step (5), [Next ▶] disables; autoplay loops if enabled

```
   Stepper:   ○─○─○─○─●      (step 5 of 5)
   [◀ Prev] [Next ▶]  ← disabled, label changes to "↻ Restart"
```

### State: mobile

Schematic full-width. Stepper pills wrap to 2 rows. Prev/Next sit beneath
the stepper as thumb-friendly buttons.

---

## 8. Archetype 5 — Multi-variable Interaction

**Worked example:** Pressure–Volume loop.
**Other instances:** V/Q matching, Calcium homeostasis.

**Primitives:** P3 Plot (one chart, multiple overlaid curves) · P2 Slider (× 3–5)
· P5 Annotation (corner labels, ESPVR/EDPVR labels) · P6 Toggle (show baseline,
ESPVR/EDPVR, time inset).

### Wireframe — initial state (normal PV loop)

```
MAIN
        Pressure (mmHg)
        120 ┤                ╭─────────╮
            │   ESPVR ╱     ╱    ↑     │
        100 ┤        ╱     ╱   ejection│
            │       ╱      │            │
         80 ┤      ╱       │            │  AV closes
            │     ╱        │            ╲ (top right)
         60 ┤    ╱         │     IVR    ╲
            │   ╱          │            ╲
         40 ┤  ╱           │             │
            │ ╱  ◯ MV op   │  IVC        │
         20 ┤╱──────────────╲─────────────│  
            │      filling    │            │
          0 └─────EDPVR───────┴───────────── Volume (mL)
            0       40    80   120    160

        Corner annotations:
        ◯ MV closes (bottom right of filling)
        ◯ AV opens  (top right, ejection start)
        ◯ AV closes (top left, IVR start)
        ◯ MV opens  (bottom left, filling start)

CONTROLS                              REFERENCES
Preload (EDV)    50  ━━━●━━━ 180   (120 mL)    • Costanzo 7e, 134–138
Afterload (DBP)  40  ━━●━━━━ 120   (80 mmHg)   • Boron 3e, 540–548
Contractility    0.5 ━━━●━━━ 2.0   (1.0)
Heart rate       40  ━━●━━━━ 180   (72 bpm)

Toggles
☑ Show baseline loop
☑ Show ESPVR / EDPVR
☐ Show P–t inset
```

### State: mid-slide — user increasing afterload

```
MAIN
   - Top of loop rises and right edge shifts left.
   - SV = EDV − ESV shrinks; chip updates: "SV ↓ from 70 to 52 mL"
   - Baseline loop ghosts in dim if "show baseline" enabled
   - ESPVR / EDPVR lines stay fixed

Live readout panel beside the plot:
   EDV   120 mL
   ESV    68 mL  (was 50)
   SV     52 mL
   EF     43 %
```

### State: edge — contractility slider at 0

```
   Loop collapses: ESV approaches EDV, SV → 0.
   A warning chip pins:
      ⚠ Zero contractility — ventricle not ejecting. Pathological.
   ESPVR line flattens.
```

### State: mobile

Plot full-width. Live readout sits *above* the sliders so the student sees
the numbers without scrolling past the controls. Sliders stack 1 per row.

---

## 9. Shareable state — URL contract

Every diagram URL fully describes the rendered state. The browser's address
bar is the share button.

```
/diagram/{system}/{slug}?{archetype-specific params}
```

| Archetype          | Example URL                                                            |
|--------------------|------------------------------------------------------------------------|
| Scrubbable Timeline| `/diagram/cv/wiggers?t=0.18&traces=ao,lv,la,vol,ecg&speed=1`           |
| Perturbable Curve  | `/diagram/resp/o2hb?ph=7.20&pco2=60&temp=39&bpg=1.5&overlay=1`         |
| Feedback Loop      | `/diagram/endo/hpa?perturb=acth&mag=60&break=0`                        |
| Click-to-Mechanism | `/diagram/msk/cross-bridge?step=3&autoplay=0`                          |
| Multi-var          | `/diagram/cv/pv?preload=120&afterload=110&contractility=1.0&hr=72`     |

**Implementation:** `history.replaceState` debounced 250 ms. **Display:** the
`[⇪ Share]` button in the header flashes briefly when the URL changes and
copies to clipboard on click. A small `URL synced` chip is the affordance.

---

## 10. Mailto error report

Footer line on every diagram page:

```
Report an error in this diagram → errata@physiohub.med
```

The href pre-fills subject and body with the current URL so reports
arrive with state context:

```
mailto:errata@physiohub.med
  ?subject=[Errata] cv/wiggers — Wiggers Cycle
  &body=URL: https://physiohub.med/diagram/cv/wiggers?t=0.18&...%0A%0ADescribe the error:%0A
```

No backend involved — meets the no-backend constraint while still giving
content reviewers a structured inbox.

---

## 11. Primitive reuse map (1 page)

|                    | A1 Timeline   | A2 Curve         | A3 Feedback        | A4 Mechanism    | A5 Multi-var       |
|--------------------|---------------|------------------|---------------------|-----------------|--------------------|
| **P1 ScrubBar**    | ✓ time cursor |                  | ✓ pulse position    | ✓ step index    |                    |
| **P2 Slider**      |               | ✓ params (×2–4)  | ✓ magnitude         |                 | ✓ params (×3–5)    |
| **P3 Plot**        | ✓ stacked traces | ✓ curve + baseline |                  |                 | ✓ loop + overlays  |
| **P4 NodeGraph**   |               |                  | ✓ loop topology     | ✓ step diagram  |                    |
| **P5 Annotation**  | ✓ phase labels| ✓ p50, Δ chips   | ✓ node values       | ✓ species labels| ✓ corners, ESPVR   |
| **P6 Toggle**      | ✓ trace vis   | ✓ baseline       | ✓ break feedback    | ✓ autoplay loop | ✓ overlays, inset  |

**Coverage check:** every primitive appears in ≥ 3 archetypes; every
archetype reuses ≥ 3 primitives. No archetype-bespoke primitives are
required for Phase 1.

**Build order (recommended):** P3 Plot → P2 Slider → P1 ScrubBar → P5
Annotation → P4 NodeGraph → P6 Toggle. P3 unblocks A1/A2/A5 (three of
five archetypes); P4 unblocks A3/A4 last.

---

## 12. Interaction notes (cross-cutting)

- **Keyboard parity.** Every drag/slide has a keyboard equivalent: ScrubBar
  responds to ←/→ (small step), Home/End (boundaries), Space (play/pause).
  Sliders respond to ←/→ (small) and Shift+←/→ (large). Toggles respond to
  Space/Enter.
- **Reduced motion.** Pulse animations on the feedback graph and the
  autoplay loop on the mechanism stepper respect `prefers-reduced-motion`
  and degrade to instant transitions. Curves and plots never animate
  decoratively — only on user input.
- **Loading & no-data fallbacks.** If a diagram's data file fails to load,
  the Concept panel renders an inline error with a retry button; the Main
  area shows the skeleton plot/graph in `--surface-3` until data arrives.
- **URL → state hydration.** On load, the URL params drive the initial
  control values. Invalid params clamp to defaults silently; an
  `?reset=1` flag forces full defaults.
- **Cross-diagram links.** The Reference panel may include a "See also"
  block linking to related diagrams (e.g. Wiggers → PV loop). These
  follow the standard URL contract; no special routing logic.
- **Concept-panel content shape.** Always three beats, in this order:
  *Looking at* → *Manipulate* → *Observe*. Authors must write to this
  rhythm so students learn what the interaction targets are without
  hunting.
- **Theme tokens.** All visual properties resolve through the existing
  Williams Rothmans / W08 token set. New tokens for Phase 2 only if a
  visual need cannot be expressed as a recombination of the current set.

---

## 13. 3-bullet UX rationale

1. **5 archetypes × 6 primitives is a deliberate ceiling, not a starting
   point.** Sixty-five diagrams across 8 systems would explode into 65 bespoke
   designs without taxonomy. By forcing every diagram into one of 5
   archetypes and one of 6 primitives, students learn *one* interaction
   model per archetype and apply it everywhere; authors get a budget,
   not a blank canvas. The cost is occasionally squeezing a diagram into
   a not-quite-perfect shape; the win is a shippable Phase 1 and a
   uniform mental model.

2. **URL is the share button.** Phase 1 has no backend, no accounts, no
   "save state" feature — but med students study in groups and need to
   pass interesting states to each other ("look at what happens to the
   loop when afterload pegs"). Encoding every control into the URL turns
   the address bar into a one-click share without infra, and turns the
   mailto error report into a state-grounded one (every report carries
   the URL that triggered it).

3. **Concept panel is structured prose, not free text.** The
   "Looking at / Manipulate / Observe" three-beat rhythm forces authors
   to declare the affordances explicitly. Students who skim the Concept
   panel still walk away with the question the widget is asking. This
   matters more than any single visual decision — without it, a perfectly
   styled curve is just decoration.
