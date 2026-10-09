/**
 * 2D linear-transform geometry helpers for Matrix Mode.
 *
 * All functions are pure and work in *world* coordinates; rendering code
 * converts to screen pixels through the shared CoordinateSystem.
 */

import type { Matrix2, Vec2 } from './types';
import type { BoundingBox } from '../../types';
import { matrixInverse2, multiplyMatrixVector } from './Matrix2';

/** A straight segment in world coordinates. */
export interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * How a transformed grid line relates to the source grid.
 * `axisX` / `axisY` are the images of the source x- and y-axes.
 */
export type GridLineKind = 'minor' | 'major' | 'axisX' | 'axisY';

export interface GridLineSegment extends LineSegment {
  kind: GridLineKind;
}

export interface TransformedGrid {
  segments: GridLineSegment[];
  /** Source lines whose direction collapses to a single point (singular maps). */
  collapsedPoints: Vec2[];
}

interface LineFamily {
  /** Image direction of the family; zero vector means every line collapses. */
  direction: Vec2;
  /** Map a source parameter u to a point on the source line. */
  sourcePoint: (u: number) => Vec2;
  /** Kind of the u = 0 line (the transformed axis). */
  axisKind: GridLineKind;
}

/** Smallest source region considered, in world units. */
const SOURCE_EXTENT_MIN = 128;
/** Soft cap on minor lines per direction before the grid is thinned out. */
const MAX_MINOR_LINES_PER_AXIS = 200;
/** Hard iteration guard so pathological inputs can never hang the UI. */
const MAX_ITERATIONS = 2000;

/** Transform a world point (or free vector) by a 2×2 matrix. */
export function transformPoint(matrix: Matrix2, point: Vec2): Vec2 {
  return multiplyMatrixVector(matrix, point);
}

/**
 * Clip the infinite line through `point` with `direction` to `rect`.
 * Returns the visible segment, or null when the line misses the rect.
 */
export function clipInfiniteLineToRect(
  point: Vec2,
  direction: Vec2,
  rect: BoundingBox
): LineSegment | null {
  const dx = direction.x;
  const dy = direction.y;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  if (Math.abs(dx) < 1e-12 && Math.abs(dy) < 1e-12) return null;

  let tMin = -Infinity;
  let tMax = Infinity;

  if (Math.abs(dx) < 1e-12) {
    if (point.x < rect.minX || point.x > rect.maxX) return null;
  } else {
    const t1 = (rect.minX - point.x) / dx;
    const t2 = (rect.maxX - point.x) / dx;
    tMin = Math.max(tMin, Math.min(t1, t2));
    tMax = Math.min(tMax, Math.max(t1, t2));
  }

  if (Math.abs(dy) < 1e-12) {
    if (point.y < rect.minY || point.y > rect.maxY) return null;
  } else {
    const t1 = (rect.minY - point.y) / dy;
    const t2 = (rect.maxY - point.y) / dy;
    tMin = Math.max(tMin, Math.min(t1, t2));
    tMax = Math.min(tMax, Math.max(t1, t2));
  }

  if (!(tMin <= tMax)) return null;

  return {
    x1: point.x + tMin * dx,
    y1: point.y + tMin * dy,
    x2: point.x + tMax * dx,
    y2: point.y + tMax * dy
  };
}

const round4 = (v: number): number => Math.round(v * 1e4) / 1e4;

function segmentKey(s: LineSegment): string {
  const a = `${round4(s.x1)},${round4(s.y1)}`;
  const b = `${round4(s.x2)},${round4(s.y2)}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function pointKey(p: Vec2): string {
  return `${round4(p.x)},${round4(p.y)}`;
}

/**
 * Source region large enough that every grid line whose image could cross the
 * visible rect is considered. For invertible maps this is the preimage of the
 * visible rect (transformed-grid lines cover the view exactly); for singular
 * maps the visible rect padded generously is sufficient.
 */
function getSourceBounds(matrix: Matrix2, visible: BoundingBox): BoundingBox {
  const extent = Math.max(
    SOURCE_EXTENT_MIN,
    2 * Math.max(visible.maxX - visible.minX, visible.maxY - visible.minY)
  );
  const clamp = (v: number): number => Math.max(-extent, Math.min(extent, v));

  let box: BoundingBox;
  const inverse = matrixInverse2(matrix);
  if (inverse) {
    const corners: Vec2[] = [
      { x: visible.minX, y: visible.minY },
      { x: visible.minX, y: visible.maxY },
      { x: visible.maxX, y: visible.minY },
      { x: visible.maxX, y: visible.maxY }
    ];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const corner of corners) {
      const p = transformPoint(inverse, corner);
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const padX = (maxX - minX) * 0.12 + 1e-6;
    const padY = (maxY - minY) * 0.12 + 1e-6;
    box = { minX: minX - padX, maxX: maxX + padX, minY: minY - padY, maxY: maxY + padY };
  } else {
    const padX = (visible.maxX - visible.minX) * 0.5 + 1e-6;
    const padY = (visible.maxY - visible.minY) * 0.5 + 1e-6;
    box = {
      minX: visible.minX - padX,
      maxX: visible.maxX + padX,
      minY: visible.minY - padY,
      maxY: visible.maxY + padY
    };
  }

  return {
    minX: clamp(box.minX),
    maxX: clamp(box.maxX),
    minY: clamp(box.minY),
    maxY: clamp(box.maxY)
  };
}

/**
 * Build the transformed grid: for every source grid line (spaced exactly like
 * the original grid) transform two points on the line and clip the resulting
 * image line to the visible rect. Lines whose direction collapses under a
 * singular map are reported as collapsed points instead.
 */
export function buildTransformedGrid(
  matrix: Matrix2,
  visible: BoundingBox,
  spacing: { major: number; minor: number }
): TransformedGrid {
  const segments: GridLineSegment[] = [];
  const collapsedPoints: Vec2[] = [];
  const seenLines = new Set<string>();
  const seenPoints = new Set<string>();

  const minorBase = spacing.minor > 0 && Number.isFinite(spacing.minor) ? spacing.minor : 1;
  const majorBase = spacing.major > 0 && Number.isFinite(spacing.major) ? spacing.major : minorBase * 5;

  const source = getSourceBounds(matrix, visible);
  const span = Math.max(source.maxX - source.minX, source.maxY - source.minY);

  // Thin the grid (keeping major/minor alignment) before line counts explode.
  let factor = 1;
  const estimatedLines = span / minorBase;
  if (estimatedLines > MAX_MINOR_LINES_PER_AXIS) {
    factor = Math.ceil(estimatedLines / MAX_MINOR_LINES_PER_AXIS);
  }
  const minor = minorBase * factor;
  const major = majorBase * factor;

  // Vertical source lines x = u share the image direction A·(0, 1);
  // horizontal source lines y = u share A·(1, 0).
  const families: [LineFamily, { min: number; max: number }][] = [
    [
      {
        direction: { x: matrix[0][1], y: matrix[1][1] },
        sourcePoint: (u) => ({ x: u, y: 0 }),
        axisKind: 'axisY'
      },
      { min: source.minX, max: source.maxX }
    ],
    [
      {
        direction: { x: matrix[0][0], y: matrix[1][0] },
        sourcePoint: (u) => ({ x: 0, y: u }),
        axisKind: 'axisX'
      },
      { min: source.minY, max: source.maxY }
    ]
  ];

  const emit = (family: LineFamily, u: number): void => {
    const sourcePt = family.sourcePoint(u);
    const image = transformPoint(matrix, sourcePt);
    const directionCollapsed =
      Math.abs(family.direction.x) < 1e-12 && Math.abs(family.direction.y) < 1e-12;

    const isAxis = Math.abs(u) < 1e-9;
    const majorMultiple = u / major;
    const kind: GridLineKind = isAxis
      ? family.axisKind
      : Math.abs(majorMultiple - Math.round(majorMultiple)) < 1e-6
        ? 'major'
        : 'minor';

    if (directionCollapsed) {
      const key = pointKey(image);
      if (!seenPoints.has(key)) {
        seenPoints.add(key);
        collapsedPoints.push(image);
      }
      return;
    }

    const segment = clipInfiniteLineToRect(image, family.direction, visible);
    if (!segment) return;

    const key = segmentKey(segment);
    if (seenLines.has(key)) return;
    seenLines.add(key);
    segments.push({ ...segment, kind });
  };

  for (const [family, range] of families) {
    // Emit the axis line first so it wins the de-duplication on singular maps.
    if (range.min <= 0 && range.max >= 0) {
      emit(family, 0);
    }

    const first = Math.ceil(range.min / minor);
    const last = Math.floor(range.max / minor);
    for (let k = first; k <= last && k - first < MAX_ITERATIONS; k++) {
      const u = k * minor;
      if (Math.abs(u) < 1e-9) continue;
      emit(family, u);
    }
  }

  return { segments, collapsedPoints };
}
