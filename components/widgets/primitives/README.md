# PhysioHub Widget Primitives

The six primitives below are the complete Phase 1 interactive vocabulary. A new primitive should only be added with written justification in the diagram PR.

## Slider

Numeric parameter slider with label, min/max/default tick text, ARIA value text, and Shift+Arrow large steps.

```tsx
<Slider
  label="Afterload"
  value={80}
  min={40}
  max={120}
  step={1}
  unit="mmHg"
  defaultValue={80}
  onChange={setAfterload}
/>
```

Props: `label`, `value`, `min`, `max`, `step?`, `unit?`, `defaultValue?`, `description?`, `onChange`.

## ScrubBar

Timeline scrubber for cycles, mechanism steps, and replayable sequences. Supports Home/End and optional play/speed controls.

```tsx
<ScrubBar
  label="Cycle time"
  value={time}
  duration={0.8}
  step={0.01}
  playing={playing}
  speed={speed}
  onChange={setTime}
  onPlayingChange={setPlaying}
  onSpeedChange={setSpeed}
/>
```

Props: `label`, `value`, `duration`, `step?`, `playing?`, `speed?`, `onChange`, `onPlayingChange?`, `onSpeedChange?`.

## PerturbationToggle

Boolean on/off switch for perturbations, overlays, visibility, and feedback breaks.

```tsx
<PerturbationToggle
  label="Show baseline overlay"
  checked={showBaseline}
  onChange={setShowBaseline}
/>
```

Props: `label`, `checked`, `description?`, `onChange`.

## Curve

SVG curve renderer for one or more data series plus optional reference overlays, cursor line, and annotations.

```tsx
<Curve
  title="O2-Hb dissociation curve"
  xDomain={[0, 100]}
  yDomain={[0, 100]}
  xLabel="PO2"
  yLabel="SaO2"
  series={[{ id: "current", label: "Current", data }]}
  referenceSeries={[{ id: "normal", label: "Normal", data: normal, dashed: true }]}
  cursorX={p50}
/>
```

Props: `title`, `xDomain`, `yDomain`, `xLabel?`, `yLabel?`, `series`, `referenceSeries?`, `annotations?`, `cursorX?`, `height?`.

## AnimatedAxis

Framer Motion powered SVG axis primitive for axis transitions. It respects `prefers-reduced-motion`.

```tsx
<svg viewBox="0 0 400 220">
  <AnimatedAxis
    orientation="x"
    start={{ x: 40, y: 180 }}
    end={{ x: 360, y: 180 }}
    label="Volume"
  />
</svg>
```

Props: `orientation`, `start`, `end`, `ticks?`, `label?`.

## FeedbackLoopNode

Node and edge primitives for endocrine, renal, metabolic, and reflex loop diagrams.

```tsx
<svg viewBox="0 0 640 420">
  <FeedbackLoopEdge
    id="acth-edge"
    from={{ x: 320, y: 110 }}
    to={{ x: 320, y: 190 }}
    label="ACTH"
    labelPosition={{ x: 370, y: 150 }}
  />
  <FeedbackLoopEdge
    id="cortisol-feedback"
    from={{ x: 217, y: 350 }}
    to={{ x: 217, y: 80 }}
    via={[{ x: 110, y: 350 }, { x: 110, y: 80 }]}
    inhibitory
    label="feedback"
  />
  <FeedbackLoopNode id="pituitary" label="Anterior pituitary" value="ACTH 20 pg/mL" x={320} y={220} />
</svg>
```

Props:

- `FeedbackLoopNode`: `id`, `label`, `value?`, `x`, `y`, `active?`
- `FeedbackLoopEdge`: `id`, `from`, `to`, `label?`, `inhibitory?`, `active?`, `via?`, `labelPosition?`
