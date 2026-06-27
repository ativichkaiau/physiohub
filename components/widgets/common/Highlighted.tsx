import { Fragment } from "react";

/**
 * Renders reading-guide text with the key terms emphasized. The guides already
 * encode emphasis as ALL-CAPS tokens (contrast words like RIGHT / OUT / NOT and
 * entities/acronyms like ATP / FSH / CO2), so we just detect those tokens and
 * style them: directional / polarity words in the warm accent, everything else
 * in the brand accent. Plain prose is left untouched.
 */

// Polarity / direction words get the warm accent so the contrasts pop.
const DIRECTION = new Set([
  "UP", "DOWN", "RIGHT", "LEFT", "IN", "OUT", "ON", "OFF", "HIGH", "LOW",
  "MORE", "LESS", "NOT", "OPENS", "CLOSES", "OPEN", "CLOSE", "RISES", "FALLS",
  "RISE", "FALL", "LOUDER", "FASTER", "SLOWER", "INTO", "OUTWARD", "INWARD"
]);

// Capture ALL-CAPS runs (2+ letters, optional trailing digits) or letter+digits (P50, T4, S2).
const SPLIT = /([A-Z][A-Z]+[0-9]*|[A-Z][0-9]+)/g;
const IS_TOKEN = /^(?:[A-Z][A-Z]+[0-9]*|[A-Z][0-9]+)$/;

export function Highlighted({ text }: { text: string }) {
  return (
    <>
      {text.split(SPLIT).map((part, i) => {
        if (!IS_TOKEN.test(part)) return <Fragment key={i}>{part}</Fragment>;
        return (
          <strong key={i} className={DIRECTION.has(part) ? "ph-hl ph-hl-dir" : "ph-hl"}>
            {part}
          </strong>
        );
      })}
    </>
  );
}
