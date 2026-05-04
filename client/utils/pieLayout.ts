/**
 * Pure geometry utilities for the pie-chart navigation menu.
 * No React or native imports — plain TypeScript math only.
 */

export const PIE_MIN_OUTER_RADIUS = 85;   // pt — minimum outer radius
export const PIE_MAX_OUTER_RADIUS = 160;  // pt — cap so it doesn't overflow the screen
export const PIE_INNER_RADIUS = 50;       // pt — donut hole (gap from FAB)
export const PIE_PARENT_OUTER_RADIUS = 48;
export const PIE_PARENT_INNER_RADIUS = 34;
export const PIE_EXPAND_DURATION = 320;
export const PIE_COLLAPSE_DURATION = 260;
export const LABEL_RADIUS_RATIO = 0.50;   // label at 50% between inner and outer
export const ICON_RADIUS_RATIO = 0.30;    // icon at 30% between inner and outer (closer to centre)
export const SEGMENT_GAP_DEG = 1.5;
export const AVG_GLYPH_WIDTH_RATIO = 0.55; // avg glyph width ≈ fontSize × this
export const LABEL_PADDING_PT = 8;         // extra padding on each side of label
export const LABEL_FONT_OFFSET = 10;      // pt — compensate for baseline shift on reversed arcs

export interface ArcDescriptor {
  segmentPath: string;
  midAngleDeg: number;
  labelArcPath: string;
  labelPathId: string;
  labelArcHalfLength: number;
  /** True if this segment is in the bottom half (90°–270°) — arc is reversed */
  isBottomHalf: boolean;
  iconX: number;
  iconY: number;
  iconRotation: number;
}

/** Convert degrees (0=top, clockwise) to standard math radians */
function toRad(deg: number): number {
  return ((deg - 90) * Math.PI) / 180;
}

/** Polar to Cartesian, origin at (cx, cy) */
function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = toRad(deg);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function annularSectorPath(
  cx: number, cy: number, innerR: number, outerR: number,
  startDeg: number, endDeg: number,
): string {
  const largeArc = (endDeg - startDeg) > 180 ? 1 : 0;
  const os = polar(cx, cy, outerR, startDeg);
  const oe = polar(cx, cy, outerR, endDeg);
  const is_ = polar(cx, cy, innerR, startDeg);
  const ie = polar(cx, cy, innerR, endDeg);
  return [
    `M ${os.x} ${os.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${is_.x} ${is_.y}`,
    'Z',
  ].join(' ');
}

function buildLabelArcPath(
  cx: number, cy: number, r: number,
  startDeg: number, endDeg: number, midAngleDeg: number,
): string {
  const largeArc = (endDeg - startDeg) > 180 ? 1 : 0;
  const isBottomHalf = midAngleDeg > 90 && midAngleDeg < 270;
  if (isBottomHalf) {
    const from = polar(cx, cy, r, endDeg);
    const to = polar(cx, cy, r, startDeg);
    return `M ${from.x} ${from.y} A ${r} ${r} 0 ${largeArc} 0 ${to.x} ${to.y}`;
  } else {
    const from = polar(cx, cy, r, startDeg);
    const to = polar(cx, cy, r, endDeg);
    return `M ${from.x} ${from.y} A ${r} ${r} 0 ${largeArc} 1 ${to.x} ${to.y}`;
  }
}

/**
 * Compute the minimum outer radius so that every label fits within its
 * segment's arc at the label radius.
 *
 * For N segments, each segment spans (360/N - gap) degrees.
 * The arc length at the label radius must be ≥ the label's pixel width + padding.
 * Label radius = innerR + (outerR - innerR) × LABEL_RADIUS_RATIO.
 *
 * We solve for outerR:
 *   labelR = innerR + (outerR - innerR) × ratio
 *   arcLength = labelR × segmentSpanRad
 *   arcLength ≥ labelWidth + 2 × padding
 *
 * Rearranging:
 *   labelR ≥ (labelWidth + 2 × padding) / segmentSpanRad
 *   innerR + (outerR - innerR) × ratio ≥ requiredLabelR
 *   outerR ≥ innerR + (requiredLabelR - innerR) / ratio
 */
export function computeOuterRadius(
  labels: string[],
  fontSize: number,
  innerR: number = PIE_INNER_RADIUS,
): number {
  const count = labels.length;
  if (count === 0) return PIE_MIN_OUTER_RADIUS;

  const sliceDeg = 360 / count;
  const gap = Math.min(SEGMENT_GAP_DEG, sliceDeg * 0.1);
  const segmentSpanRad = (sliceDeg - gap) * (Math.PI / 180);

  let maxRequiredLabelR = 0;
  for (const label of labels) {
    const labelWidth = label.length * fontSize * AVG_GLYPH_WIDTH_RATIO;
    const requiredLabelR = (labelWidth + 2 * LABEL_PADDING_PT) / segmentSpanRad;
    if (requiredLabelR > maxRequiredLabelR) {
      maxRequiredLabelR = requiredLabelR;
    }
  }

  // Solve for outerR from: labelR = innerR + (outerR - innerR) × ratio
  // outerR = innerR + (requiredLabelR - innerR) / ratio
  const outerR = innerR + (maxRequiredLabelR - innerR) / LABEL_RADIUS_RATIO;

  return Math.min(PIE_MAX_OUTER_RADIUS, Math.max(PIE_MIN_OUTER_RADIUS, Math.ceil(outerR)));
}

/**
 * Compute arc descriptors for N equal segments.
 */
export function computeSegments(
  count: number,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
): ArcDescriptor[] {
  if (count === 0) return [];

  const sliceDeg = 360 / count;
  const gap = Math.min(SEGMENT_GAP_DEG, sliceDeg * 0.1);
  const labelR = innerR + (outerR - innerR) * LABEL_RADIUS_RATIO;
  const iconR = innerR + (outerR - innerR) * ICON_RADIUS_RATIO;

  return Array.from({ length: count }, (_, i) => {
    const startDeg = sliceDeg * i + gap / 2;
    const endDeg = sliceDeg * (i + 1) - gap / 2;
    const midAngleDeg = (startDeg + endDeg) / 2;
    const spanDeg = endDeg - startDeg;
    const isBottomHalf = midAngleDeg > 90 && midAngleDeg < 270;

    // Label radius: on bottom-half reversed arcs, the text baseline sits on
    // the outer side of the curve (closer to centre visually). Bump the radius
    // outward by ~fontSize to compensate so labels appear at the same visual
    // position as top-half labels.
    const effectiveLabelR = isBottomHalf ? labelR + LABEL_FONT_OFFSET : labelR;
    const arcLength = effectiveLabelR * (spanDeg * Math.PI / 180);

    // Icon position: always at iconR (closer to centre)
    const iconPos = polar(cx, cy, iconR, midAngleDeg);

    // Icon rotation: top of icon points outward (away from centre).
    // Top half (0°–90°, 270°–360°): midAngleDeg works — icon top faces outward.
    // Bottom half (90°–270°): add 180° so the icon flips right-side up.
    const iconRotation = isBottomHalf ? midAngleDeg + 180 : midAngleDeg;

    return {
      segmentPath: annularSectorPath(cx, cy, innerR, outerR, startDeg, endDeg),
      midAngleDeg,
      labelArcPath: buildLabelArcPath(cx, cy, effectiveLabelR, startDeg, endDeg, midAngleDeg),
      labelPathId: `lbl-${i}`,
      labelArcHalfLength: arcLength / 2,
      isBottomHalf,
      iconX: iconPos.x,
      iconY: iconPos.y,
      iconRotation,
    };
  });
}

/**
 * Compute arc descriptors for the collapsed parent ring.
 */
export function computeParentSegments(
  count: number,
  cx: number,
  cy: number,
): ArcDescriptor[] {
  return computeSegments(count, cx, cy, PIE_PARENT_INNER_RADIUS, PIE_PARENT_OUTER_RADIUS);
}
