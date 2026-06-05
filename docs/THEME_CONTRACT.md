# PhysioHub TR-VII Theme Contract

All visual styling for the Next app resolves through CSS variables in `app/globals.css`. Williams Rothmans is the default livery. Light mode is automatic through `prefers-color-scheme`.

Required tokens:

| Token | Use |
| --- | --- |
| `--ph-bg` | Page background |
| `--ph-surface` | Primary panels and cards |
| `--ph-text` | Primary readable text |
| `--ph-accent` | Main Williams Rothmans signal cyan |
| `--ph-curve-1` | Primary curve |
| `--ph-curve-2` | Secondary curve |
| `--ph-curve-ref` | Reference and baseline overlays |
| `--ph-axis` | SVG axes and loop edges |
| `--ph-grid` | SVG gridlines and page grid texture |

Supplemental tokens are allowed only when they refine the same contract: `--ph-surface-2`, `--ph-surface-3`, `--ph-muted`, `--ph-accent-2`, `--ph-curve-3`, `--ph-curve-4`, `--ph-border`, `--ph-warn`, `--ph-danger`, `--ph-ok`, `--ph-radius`, and `--ph-shadow`.

Accessibility rules:

- Do not encode physiology meaning with red/green alone. Use text, labels, line styles, and the cyan/amber/violet/rose palette.
- Keep reduced motion intact. Components that animate must use CSS reduced-motion guards or Framer Motion `useReducedMotion`.
- Do not hard-code component colors. Use Tailwind classes mapped to `--ph-*` or direct CSS variable references.
