import type { CurvePoint } from "@/components/widgets/primitives";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function parseNumber(value: string | null, fallback: number, min: number, max: number) {
  if (value === null) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clamp(parsed, min, max);
}

export function parseBoolean(value: string | null, fallback = false) {
  if (value === null) {
    return fallback;
  }
  return value === "1" || value === "true";
}

export function makeRange(start: number, end: number, step: number) {
  const values: number[] = [];
  for (let value = start; value <= end + step / 2; value += step) {
    values.push(Number(value.toFixed(6)));
  }
  return values;
}

export function lineSeries(points: Array<[number, number]>): CurvePoint[] {
  return points.map(([x, y]) => ({ x, y }));
}

export function interpolate(data: CurvePoint[], x: number) {
  const first = data[0];
  const last = data[data.length - 1];
  if (x <= first.x) return first.y;
  if (x >= last.x) return last.y;
  for (let index = 1; index < data.length; index += 1) {
    const current = data[index];
    const previous = data[index - 1];
    if (x <= current.x) {
      const ratio = (x - previous.x) / (current.x - previous.x);
      return previous.y + ratio * (current.y - previous.y);
    }
  }
  return last.y;
}
