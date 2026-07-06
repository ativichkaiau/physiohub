# PhysioHub — Worklog & Handoff

_Last updated: 2026-07-05 · branch `main` @ `1d10727` (clean, pushed)_

---

## 1. What this is

**PhysioHub** (brand: **VESTRIPPN3.0**, PhysioHub is the product/extension name) is an
interactive physiology-diagram web app for medical students. Every diagram is a **live model**:
move a slider / flip a toggle / scrub a timeline and the curves recompute instantly. All widget
state is encoded in the URL, so any configuration is shareable by link with no backend.

- **Repo:** https://github.com/ativichkaiau/physiohub · branch `main`
- **Scale:** 95 interactive widgets across 8 body systems → **108 static pages** (SSG)
- **No backend / no auth / nothing to install.** Pure static Next.js.

### Systems & archetypes
- **8 systems:** cardiovascular (`cv`), respiratory (`resp`), neuro (`nerv`), musculoskeletal
  (`msk`), GI (`gi`), endocrine (`endo`), renal (`renal`), reproductive (`repro`).
- **5 widget archetypes:** `scrubbable-timeline`, `perturbable-curve`, `feedback-loop`,
  `click-to-mechanism`, `multi-variable-interaction`.

---

## 2. Stack & how to run

- **Next.js 14.2** (App Router, SSG) · **React 18.3** · **TypeScript** · **Tailwind CSS 3.4**
- Node **20.x** (dev on v20.20.2)

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # must end with "✓ Generating static pages (108/108)"
npm run lint       # next lint — keep at 0 warnings
npm run typecheck  # tsc --noEmit
```

**Verification gate before any commit:** `tsc --noEmit` clean → `next lint` 0 warnings →
`next build` produces 108/108 pages. Every substantive change in the log below passed all three.

---

## 3. Architecture map (where things live)

| Concern | Location |
|---|---|
| Diagram registry (source of truth: ids, titles, teasers, archetypes, concept text, refs, status) | `data/physiohub_diagrams.json` |
| Registry loader + Zod validation + helpers (`getSystems`, `getDiagramPath`, `archetypeMeta`, `getSystemEmoji`) | `lib/registry.ts` |
| Routing | `app/page.tsx` (home), `app/[system]/page.tsx` (system catalog), `app/[system]/[diagram]/page.tsx` (diagram) |
| App shell (header/footer, theme bootstrap, background blobs) | `app/layout.tsx` |
| **All theme tokens + design system + motifs** | `app/globals.css` |
| Widget dispatch (id → component) | `components/WidgetLoader.tsx` |
| Shared config-driven widgets | `components/widgets/common/{CurveLabWidget,TimelineLabWidget,FeedbackLabWidget}.tsx` |
| Shared widget helpers | `components/widgets/common/{StepWalker,FeedbackLoopGuide,FeedbackDynamicsTrack,Highlighted}.tsx` |
| Chart/primitives | `components/widgets/primitives.tsx` (`Curve`, `Slider`, `ScrubBar`, `PerturbationToggle`, `FeedbackLoopNode/Edge`) |
| Per-system/per-diagram widgets | `components/widgets/<system>/<slug>.tsx` (95 files) |
| Placeholder for not-yet-built diagrams | `components/widgets/PendingWidget.tsx` |
| Diagram chrome | `components/{DiagramHeader,ArchetypeBadge,ShareStateIndicator,ReportError,PhysiologyIntro,SystemSignal}.tsx` |

### Two kinds of widget
1. **Config-driven** — a small file exports a config object into `CurveLabWidget` /
   `TimelineLabWidget` / `FeedbackLabWidget`. The physiology lives in a pure function
   (e.g. `gfrAt(map, nsaid, acei)`). This is where most quantitative models are, and where
   accuracy fixes were made.
2. **Custom** — a full component (`useState` + bespoke SVG + `Curve`). URL-syncs its own state
   via a debounced `router.replace`. Higher error density historically (bespoke constants).

### Theming — the key lever
Everything reads CSS custom properties named `--ph-*` (surfaces, `--ph-accent`, `--ph-curve-1..7`,
`--ph-axis`, status, `--ph-radius`, clay shadows) defined in `app/globals.css` under `:root`
(light) and `:root[data-theme="dark"]`. **You can retheme the entire app by editing tokens —
no component logic changes.** Per-system accent overrides live in
`.ph-system-theme[data-system="cv"]{…}` etc. Theme is persisted in `localStorage['physiohub-theme']`
and applied pre-hydration by an inline script in `layout.tsx` (avoids FOUC).

---

## 4. Current design state — "Vital Signs" (bioelectric monitor)

The app is skinned as a **live ICU/patient monitor** (chosen from 4 mockup directions).
- **Dark = the native monitor:** near-OLED black (`--ph-bg: #04070c`), electric-cyan accent
  (`#22d3ee`), glowing phosphor traces (green/amber/magenta/sky curve tokens).
- **Light = daytime telemetry:** cool paper white, faint cyan graticule, deep-cyan accent
  (`#0891b2`), trace colours darkened to read on paper. Tuned independently — **not** an invert.
- **Signature motifs** (reusable classes in `globals.css`): `.ph-sweep` (cyan trace-cursor
  sweeping the header), `.ph-live-dot` (pulsing telemetry dot), `.ph-phosphor` (glow on brand
  `3.0` / accent glyphs), graticule grid + cyan/green/magenta phosphor blobs (`.ph-blob-1..6`).
- **Reduced-motion:** `@media (prefers-reduced-motion: reduce)` freezes the sweep, pulse, and
  blob drift.
- **Corner radius:** `--ph-radius: 13px` (rounds all rectangular surfaces uniformly).
- **Copy split:** the hero/branding chrome speaks monitor voice ("Live", "Monitor console",
  hero headline), but **the how-to / usage / instructional prose is deliberately plain**
  ("How to use", "Work the bench", "How to read ·", "Choose a system", "Report an error in
  this diagram") — reverted from monitor jargon after it obscured meaning. Keep that boundary:
  theme the branding, keep instructions plain.

---

## 5. Change log (recent → older)

Grouped by theme; commit hashes in `()`.

### Interaction / UX
- **Rounder corners** — `--ph-radius` 8px → 13px (`1d10727`).
- **Shared `StepWalker`** for the 11 sequential click-to-mechanism walk-throughs: keyboard nav
  (←/→/↑/↓/Home/End), progress bar, numbered/✓ rail, prev/next, ▶ autoplay
  (`2788ffb`, `components/widgets/common/StepWalker.tsx`).
- **Curve rendering:** smooth Catmull-Rom splines (`45b4d57`) with an opt-in `sharp` flag so
  genuinely spiky traces (ECG QRS, action-potential upstroke) stay needle-sharp (`ddadf15`).

### Visual theme
- **"Vital Signs" reskin** — full monitor theme, both modes, motifs, reduced-motion (`7dbfd00`).
- **Logo** matched to reference: green→cyan gradient `3.0`, `W11` tag, cyan halo on the V tile
  (`c2a01de`).
- **Restored plain how-to/usage copy** while keeping the visual theme (`ba64141`).
- Earlier: per-system card tints + richer blobs (`ec4591f`), then toned down (`ac57e51`);
  brighter pastel canvas era (`689b403`, `df0059e`); true-black dark mode + reference top bar
  (`2817504`); day/night toggle animation (`8399990`); background blobs (`0ad82a7`);
  claymorphism system across all widgets (`f95dc9d`, `179ff1c`); translucent clay cards
  (`11fe6ee`); VESTRIPPN3.0 branding (`ec51c8a`).

### Content / pedagogy
- **"How to read" reading guides** on every diagram, with key terms bolded + colour-highlighted
  via the `Highlighted` component (`2266239`, `8b806f7`, `4f01974`, `456ea0f`).
- Physiologic-range zones (green/amber/red bands) and named phase bands on curves
  (`f3e0ba5`, `55bb390`).
- Intro modal + pharmacology entry points + "How to use" section; intro shows once per browser
  (`7dbe4d0`, `21d4adb`).

### Physiological accuracy (multiple audits — verified against textbook + Guyton)
- CVS + respiratory (`0d73bc8`, `e268f18`); renal/endo/neuro/GI/MSK/repro (`f705a95`,
  `98ce357`, `2b0ce73`).
- Targeted fixes (`8c8514c`, `181e1f5`, `c340997`) — each verified in-browser:
  - `endo/calcium-homeostasis`: PTH read 155 pg/mL at normocalcaemia → **55** (floor/amplitude).
  - `gi/gastric-emptying`: default meal t½ 97 min (gastroparesis range) mislabeled normal → **59
    min**; liquid reference ~62 → **15 min**.
  - `cv/cardiac-output`: venous-resistance default 1.2 → **1.4** so the operating point lands on
    Guyton's canonical **CO 5 L/min / RAP 0 / MSFP 7**.
  - `endo/hpa-axis`: cortisol **rose** with dexamethasone (backwards) → removed the `+10` term so
    a normal axis now suppresses (21 → 14, ACTH → 4).
  - `resp/ventilation-control`: predicted PaCO₂ read ~29 at baseline → recalibrated to **~40**.
  - `renal/gfr-autoregulation`: fixed ACEi sign mismatch between `gfrAt` and its summary.

A deep "check-all" pass verified the remaining quantitative widgets against textbook values
(GHK RMP −71 mV, Hill O₂-Hb P50 26.8, Davenport acid-base 24× rule, Frank-Starling SV 67 mL,
PV-loop EF 61%, Gordon-Huxley-Julian length-tension, etc.) — all correct, left untouched.

---

## 6. Conventions

- **Commit trailer:** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Never touch widget logic during a reskin** — theme via tokens/CSS + copy only.
- **Accuracy work:** verify formulas at their default operating point against textbook physiology;
  fix only genuine errors; report what was checked-and-correct.
- **Preview quirks (headless):** screenshots can come back blank mid-scroll or after navigation,
  and View Transitions abort in the offscreen preview. Read rendered values via DOM
  `preview_eval` for reliable verification; tall-viewport top-of-page captures are the most stable.
- `.claude/launch.json` → server `physiohub` = `npm run dev` on port 3000 (autoPort falls back to
  a high port if 3000 is busy).

---

## 7. Known caveats / open items

- **Two surfaces still lightly themed, not fully normalized:** the `/docs` page and the internal
  step copy of the one-time intro modal (`PhysiologyIntro.tsx`) weren't swept for monitor voice.
  Low priority; no confusing chrome on the main flows.
- **Non-`reference` diagrams** render `PendingWidget` ("Template preview · In development"). Which
  diagrams are live vs pending is driven by `status` in `data/physiohub_diagrams.json`.
- **`docs/TR_Proposals_Tracker.md`** is untracked in the working tree (pre-existing; not part of
  this work).
- **Structural model limitations (by design, not bugs):** e.g. `endo/calcium-homeostasis` makes
  PTH a pure function of Ca, so it can't represent *inappropriate* PTH (primary
  hyperparathyroidism); `cv/capillary-starling` uses the classic filtration→absorption "switch
  point" teaching rather than the revised-Starling model. Both are intentional pedagogical choices.

---

## 8. Quick index — "where do I change X?"

- **A colour / the whole theme** → `app/globals.css` `--ph-*` tokens (light `:root`, dark
  `:root[data-theme="dark"]`).
- **A per-system accent** → `.ph-system-theme[data-system="…"]` blocks in `globals.css`.
- **Corner roundness** → `--ph-radius`.
- **A diagram's physiology** → its file in `components/widgets/<system>/<slug>.tsx` (config
  widgets: the pure model function; custom widgets: the constants/SVG).
- **A diagram's metadata / concept text / live-vs-pending status** → `data/physiohub_diagrams.json`.
- **Header / footer / brand / background** → `app/layout.tsx`.
- **Home hero, how-to section, catalog** → `app/page.tsx`.
- **The step-walker interaction** → `components/widgets/common/StepWalker.tsx`.
