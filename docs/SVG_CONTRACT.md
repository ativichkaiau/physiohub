# PhysioHub SVG Contract

Every system SVG in `/assets/svg/{system}.svg` is consumed by `/js/main.js`. The JS
discovers structures by querying the SVG after it is inlined into the page, so the
tracing pipeline must hold this contract for the page to behave correctly.

If you change anything here, also update the loader in `js/main.js` and the
sample data in `data/physiohub.json`.

---

## 1. File layout

- One SVG per system. Filename matches the `system_id` slug: `cv.svg`, `resp.svg`,
  `nerv.svg`, `msk.svg`, `gi.svg`, `endo.svg`, `renal.svg`, `repro.svg`.
- Root `<svg>` element MUST declare `viewBox`. Do not set fixed `width` / `height`
  — the page sizes the SVG with CSS.
- Root `<svg>` MUST carry `xmlns="http://www.w3.org/2000/svg"` and
  `data-system="{system_id}"`.

## 2. Structure groups (the interactive contract)

Every clickable anatomical structure is a single `<g>` element with:

| Attribute            | Required | Value                                                |
| -------------------- | -------- | ---------------------------------------------------- |
| `id`                 | yes      | `{system_id}_{structure_id}` — snake_case, ASCII     |
| `data-system`        | yes      | `{system_id}` — duplicates root for cross-system use |
| `data-structure`     | yes      | `{structure_id}` — bare structure key                |
| `class`              | yes      | Must include `structure`                             |
| `tabindex`           | yes      | `0` — so the structure is keyboard-focusable         |
| `role`               | yes      | `button`                                             |
| `aria-label`         | yes      | Human-readable name, e.g. `"Aortic valve"`           |

Each group MUST contain, as its first child, a `<title>` element with the
human-readable structure name. Screen readers read this; the JS uses it as a
tooltip fallback when the data file has not loaded yet.

```xml
<g
  id="cv_aortic_valve"
  data-system="cv"
  data-structure="aortic_valve"
  class="structure"
  tabindex="0"
  role="button"
  aria-label="Aortic valve"
>
  <title>Aortic valve</title>
  <!-- one or more shape elements -->
  <path d="..." />
</g>
```

### Rules

- `structure_id` is unique within a system. The `{system}_{structure}` id is
  unique across the whole document — do not reuse a bare structure id between
  systems if both systems will be visible on the same page (currently they
  never are, but keep the discipline).
- A `<g class="structure">` MUST NOT contain another `<g class="structure">`.
  Nested interactive groups make hit-testing ambiguous.
- Decorative shapes (vessel outlines, gridlines, body silhouette) live OUTSIDE
  any `class="structure"` group. Wrap them in `<g class="decor">` so they can
  be styled and pointer-disabled in one place.

## 3. Styling — CSS variables only

Do not hard-code colors on shapes. Every stroke, fill, and accent must resolve
through one of these variables (defined in `css/main.css`):

| Variable           | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| `--svg-stroke`     | Default outline of every structure               |
| `--svg-fill`       | Default fill of every structure                  |
| `--svg-highlight`  | Hover / focus accent (stroke + glow)             |
| `--svg-active`     | Locked-open (clicked) state — strongest accent   |
| `--svg-decor`      | Decorative non-interactive lines / silhouettes   |
| `--svg-label`      | Optional in-SVG text labels                      |

Apply via inline attributes that reference the variable:

```xml
<path d="..." fill="var(--svg-fill)" stroke="var(--svg-stroke)" stroke-width="2" />
```

CSS in `main.css` overrides these on `:hover`, `:focus-visible`, and
`.is-active` states by re-targeting `.structure path`, `.structure ellipse`,
etc. — tracers do not need to add hover classes themselves.

## 4. Optional decorations

- `<text class="svg-label">` may appear inside or outside structure groups.
  Use `fill="var(--svg-label)"`. Hide on small viewports via the
  `.svg-label--hide-sm` class.
- A `<g class="decor">` may be used for the body silhouette / orientation aids.
  These are non-interactive (`pointer-events: none` is applied by CSS).

## 5. Cross-system links

The data file's `related` array entries are either:

- `"structure_id"` — same system; the page scrolls / focuses the matching `<g>`
  and locks the detail panel.
- `"system_id/structure_id"` — cross-system; the page navigates to
  `/systems/{system_id}.html#{system_id}_{structure_id}` and the destination
  page opens that structure's panel on load.

Tracers do not need to author these — they live in the data file — but the SVG
must use ids consistent with whatever the data file references.

## 6. Validation checklist (before merging a traced SVG)

1. Every `<g class="structure">` has `id`, `data-system`, `data-structure`,
   `tabindex="0"`, `role="button"`, `aria-label`, and a `<title>` first child.
2. Root `<svg>` has `viewBox`, `xmlns`, `data-system`.
3. No hard-coded `fill="#..."` or `stroke="#..."` on `.structure` shapes.
4. No nested `.structure` groups.
5. The id slug matches a key in `data/physiohub.json` under the same system.
6. Keyboard: `Tab` cycles through every structure; `Enter` opens its detail
   panel; `Esc` closes it. (The JS handles this — your job is just to make
   sure every `<g>` is reachable.)
