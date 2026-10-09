/**
 * Shared types for the Matrix Mode engine.
 *
 * The module is pure (no React, no DOM, no store) so the 2×2 math can be
 * unit-verified in isolation and reused by any renderer.
 */

import type { Vec2 } from '../../types';

export type { Vec2 };

/** A 2×2 matrix in row-major form: [[a, b], [c, d]]. Never mutate in place. */
export type Matrix2 = [[number, number], [number, number]];

/** One row of a {@link Matrix2}. */
export type MatrixRow = [number, number];

/** Which row/column a matrix cell refers to. */
export type MatrixRowIndex = 0 | 1;
export type MatrixColIndex = 0 | 1;

/** Result of {@link validateMatrix2}. */
export interface MatrixValidation {
  valid: boolean;
  /** Human-readable problems, empty when `valid` is true. */
  errors: string[];
  /** Parsed copy of the input when valid, otherwise null. */
  matrix: Matrix2 | null;
}

/** Identifier of a built-in transformation preset. */
export type MatrixPresetId =
  | 'identity'
  | 'scale'
  | 'rotation-90'
  | 'reflect-x'
  | 'reflect-y'
  | 'shear-x'
  | 'shear-y'
  | 'project-x'
  | 'project-y';

/** A named teaching preset. */
export interface MatrixPreset {
  id: MatrixPresetId;
  label: string;
  /** Short deterministic hint shown in the UI. */
  hint: string;
  matrix: Matrix2;
}
