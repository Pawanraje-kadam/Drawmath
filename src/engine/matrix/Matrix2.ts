/**
 * Pure 2×2 matrix algebra and deterministic descriptions.
 *
 * Every function here is side-effect free. Matrices are treated as immutable:
 * functions that "modify" a matrix always return a fresh copy.
 */

import type { Matrix2, MatrixValidation, Vec2 } from './types';
import { formatNum } from '../shapes/Shape';

/** Tolerance for treating a determinant as zero. */
export const MATRIX_EPSILON = 1e-9;

/** Tolerance for structural recognition (rotation, shear, projection, …). */
export const MATRIX_TOLERANCE = 1e-6;

/** The identity matrix. Copy before storing; never mutate. */
export const IDENTITY_MATRIX2: Matrix2 = [[1, 0], [0, 1]];

/** Return an independent copy of a matrix. */
export function cloneMatrix2(matrix: Matrix2): Matrix2 {
  return [
    [matrix[0][0], matrix[0][1]],
    [matrix[1][0], matrix[1][1]]
  ];
}

/**
 * Validate an unknown value as a 2×2 matrix of finite numbers.
 * Accepts NaN / Infinity checks so invalid input can never reach the renderer.
 */
export function validateMatrix2(matrix: unknown): MatrixValidation {
  if (!Array.isArray(matrix) || matrix.length !== 2) {
    return { valid: false, errors: ['Matrix must have exactly two rows.'], matrix: null };
  }
  const errors: string[] = [];
  const out: Matrix2 = [[0, 0], [0, 0]];
  const names = [['a', 'b'], ['c', 'd']];
  for (let r = 0; r < 2; r++) {
    const row: unknown = matrix[r];
    if (!Array.isArray(row) || row.length !== 2) {
      errors.push(`Row ${r + 1} must contain exactly two numbers.`);
      continue;
    }
    for (let c = 0; c < 2; c++) {
      const value: unknown = row[c];
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        errors.push(`Entry "${names[r][c]}" must be a finite number.`);
      } else {
        out[r][c] = value;
      }
    }
  }
  if (errors.length > 0) {
    return { valid: false, errors, matrix: null };
  }
  return { valid: true, errors: [], matrix: out };
}

/** Multiply a matrix by a column vector: returns A·v. */
export function multiplyMatrixVector(matrix: Matrix2, vector: Vec2): Vec2 {
  return {
    x: matrix[0][0] * vector.x + matrix[0][1] * vector.y,
    y: matrix[1][0] * vector.x + matrix[1][1] * vector.y
  };
}

/** Determinant of a 2×2 matrix: ad − bc. */
export function determinant2(matrix: Matrix2): number {
  return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
}

/** True when the transformation collapses the plane (det ≈ 0). */
export function isSingular(matrix: Matrix2, epsilon: number = MATRIX_EPSILON): boolean {
  return Math.abs(determinant2(matrix)) <= epsilon;
}

/**
 * Linear interpolation between two matrices.
 * t is clamped to [0, 1]; t = 0 returns `from`, t = 1 returns `to` exactly.
 */
export function interpolateMatrix2(from: Matrix2, to: Matrix2, t: number): Matrix2 {
  const clamped = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 1;
  if (clamped <= 0) return cloneMatrix2(from);
  if (clamped >= 1) return cloneMatrix2(to);
  const lerp = (a: number, b: number): number => a + (b - a) * clamped;
  return [
    [lerp(from[0][0], to[0][0]), lerp(from[0][1], to[0][1])],
    [lerp(from[1][0], to[1][0]), lerp(from[1][1], to[1][1])]
  ];
}

/** Inverse of a 2×2 matrix, or null when the matrix is singular. */
export function matrixInverse2(matrix: Matrix2): Matrix2 | null {
  const det = determinant2(matrix);
  if (Math.abs(det) <= MATRIX_EPSILON) return null;
  return [
    [matrix[1][1] / det, -matrix[0][1] / det],
    [-matrix[1][0] / det, matrix[0][0] / det]
  ];
}

/** Multiply two 2×2 matrices. */
export function multiplyMatrix2(a: Matrix2, b: Matrix2): Matrix2 {
  return [
    [
      a[0][0] * b[0][0] + a[0][1] * b[1][0],
      a[0][0] * b[0][1] + a[0][1] * b[1][1]
    ],
    [
      a[1][0] * b[0][0] + a[1][1] * b[1][0],
      a[1][0] * b[0][1] + a[1][1] * b[1][1]
    ]
  ];
}

/** True when every entry of `a` is within `tolerance` of `b`. */
export function matrixAlmostEqual(a: Matrix2, b: Matrix2, tolerance: number = MATRIX_TOLERANCE): boolean {
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      if (Math.abs(a[r][c] - b[r][c]) > tolerance) return false;
    }
  }
  return true;
}

/** True when the matrix is (numerically) the identity. */
export function isIdentityMatrix2(matrix: Matrix2, tolerance: number = MATRIX_TOLERANCE): boolean {
  return matrixAlmostEqual(matrix, IDENTITY_MATRIX2, tolerance);
}

/**
 * True when the columns form an orthonormal frame
 * (‖c₁‖ = ‖c₂‖ = 1 and c₁ ⊥ c₂) — i.e. an isometry (rotation or reflection).
 */
function isOrthonormalFrame(m: Matrix2, tolerance: number): boolean {
  const a = m[0][0];
  const b = m[1][0];
  const c = m[0][1];
  const d = m[1][1];
  return (
    Math.abs(a * a + b * b - 1) <= tolerance &&
    Math.abs(c * c + d * d - 1) <= tolerance &&
    Math.abs(a * c + b * d) <= tolerance
  );
}

/**
 * True only for genuine rotations: orthonormal columns and det > 0
 * (within numerical tolerance). Reflections are deliberately excluded.
 */
export function isRotationMatrix2(matrix: Matrix2, tolerance: number = MATRIX_TOLERANCE): boolean {
  return determinant2(matrix) > tolerance && isOrthonormalFrame(matrix, tolerance);
}

/**
 * True only for genuine reflections: orthonormal columns and det < 0
 * (within numerical tolerance).
 */
export function isReflectionMatrix2(matrix: Matrix2, tolerance: number = MATRIX_TOLERANCE): boolean {
  return determinant2(matrix) < -tolerance && isOrthonormalFrame(matrix, tolerance);
}

/** True when A² = A (an idempotent projection). */
export function isProjectionMatrix2(matrix: Matrix2, tolerance: number = MATRIX_TOLERANCE): boolean {
  return matrixAlmostEqual(multiplyMatrix2(matrix, matrix), matrix, tolerance);
}

function isZeroMatrix(matrix: Matrix2, tolerance: number): boolean {
  return matrixAlmostEqual(matrix, [[0, 0], [0, 0]], tolerance);
}

function isHorizontalShear(matrix: Matrix2, tolerance: number): boolean {
  return (
    Math.abs(matrix[0][0] - 1) <= tolerance &&
    Math.abs(matrix[1][1] - 1) <= tolerance &&
    Math.abs(matrix[1][0]) <= tolerance &&
    Math.abs(matrix[0][1]) > tolerance
  );
}

function isVerticalShear(matrix: Matrix2, tolerance: number): boolean {
  return (
    Math.abs(matrix[0][0] - 1) <= tolerance &&
    Math.abs(matrix[1][1] - 1) <= tolerance &&
    Math.abs(matrix[0][1]) <= tolerance &&
    Math.abs(matrix[1][0]) > tolerance
  );
}

function isDiagonal(matrix: Matrix2, tolerance: number): boolean {
  return Math.abs(matrix[0][1]) <= tolerance && Math.abs(matrix[1][0]) <= tolerance;
}

/** Degrees in [0, 360) with stable rounding. */
function degreesLabel(radians: number): string {
  let deg = (radians * 180) / Math.PI;
  deg = ((deg % 360) + 360) % 360;
  const rounded = Math.round(deg * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
}

/** First sentence(s): what the transformation *is* (never over-claims). */
function describeKind(matrix: Matrix2, tolerance: number): string {
  const det = determinant2(matrix);

  if (isIdentityMatrix2(matrix, tolerance)) {
    return 'Identity: every point and vector stays in place.';
  }

  if (Math.abs(det) <= MATRIX_EPSILON) {
    if (isZeroMatrix(matrix, tolerance)) {
      return 'The zero map sends every point to the origin.';
    }
    if (isProjectionMatrix2(matrix, tolerance)) {
      const a = matrix[0][0];
      const b = matrix[0][1];
      const c = matrix[1][0];
      const d = matrix[1][1];
      if (Math.abs(b) <= tolerance && Math.abs(c) <= tolerance && Math.abs(d) <= tolerance) {
        return 'Projection onto the x-axis.';
      }
      if (Math.abs(a) <= tolerance && Math.abs(b) <= tolerance && Math.abs(c) <= tolerance) {
        return 'Projection onto the y-axis.';
      }
      return 'Projection onto a line through the origin.';
    }
    return 'This transformation collapses the plane onto a line or a point.';
  }

  if (isRotationMatrix2(matrix, tolerance)) {
    const angle = Math.atan2(matrix[1][0], matrix[0][0]);
    let deg = ((angle * 180) / Math.PI + 360) % 360;
    deg = Math.round(deg * 100) / 100;
    if (deg > 180) {
      const clockwise = Math.round((360 - deg) * 100) / 100;
      const label = Number.isInteger(clockwise) ? clockwise.toString() : clockwise.toFixed(2);
      return `Rotation by ${label}° clockwise about the origin.`;
    }
    return `Rotation by ${degreesLabel(angle)}° counter-clockwise about the origin.`;
  }

  if (isReflectionMatrix2(matrix, tolerance)) {
    // Reflection across the line at angle φ: [[cos 2φ, sin 2φ], [sin 2φ, −cos 2φ]].
    const phi = 0.5 * Math.atan2(matrix[1][0], matrix[0][0]);
    const deg = ((phi * 180) / Math.PI + 360) % 360;
    const close = (target: number) => Math.abs(deg - target) <= 0.01 || Math.abs(deg - target - 360) <= 0.01;
    if (close(0)) return 'Reflection across the x-axis.';
    if (close(90)) return 'Reflection across the y-axis.';
    if (close(45)) return 'Reflection across the line y = x.';
    if (close(135)) return 'Reflection across the line y = −x.';
    return `Reflection across the line through the origin at ${degreesLabel(phi)}° from the x-axis.`;
  }

  if (isHorizontalShear(matrix, tolerance)) {
    return `Horizontal shear (shear-x) by factor ${formatNum(matrix[0][1])}.`;
  }
  if (isVerticalShear(matrix, tolerance)) {
    return `Vertical shear (shear-y) by factor ${formatNum(matrix[1][0])}.`;
  }

  if (isDiagonal(matrix, tolerance)) {
    const sx = matrix[0][0];
    const sy = matrix[1][1];
    if (Math.abs(sx - sy) <= tolerance) {
      if (sx > 0) return `Uniform scaling by ${formatNum(sx)}.`;
      return `Uniform scaling by ${formatNum(Math.abs(sx))} combined with a half-turn about the origin.`;
    }
    return `Scaling by ${formatNum(sx)} along the x-axis and ${formatNum(sy)} along the y-axis.`;
  }

  return 'This transformation changes direction and scale.';
}

/**
 * Deterministic short explanation of a 2×2 transformation, based on the
 * determinant and recognised matrix structure. Same matrix → same string.
 */
export function getMatrixDescription(matrix: Matrix2): string {
  const det = determinant2(matrix);
  const kind = describeKind(matrix, MATRIX_TOLERANCE);

  if (Math.abs(det) <= MATRIX_EPSILON) {
    return `${kind} This transformation is singular (det = 0): it has no inverse.`;
  }

  const orientation =
    det > 0
      ? `Orientation is preserved (det = ${formatNum(det)} > 0).`
      : `Orientation is flipped (det = ${formatNum(det)} < 0): the transformation reflects the plane.`;

  const area = `Area is scaled by ${formatNum(Math.abs(det))}× (|det| = ${formatNum(Math.abs(det))}).`;

  return `${kind} ${orientation} ${area}`;
}
