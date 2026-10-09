/**
 * Built-in 2×2 transformation presets for Matrix Mode.
 * Preset matrices are shared constants — always clone before storing.
 */

import type { Matrix2, MatrixPreset, MatrixPresetId } from './types';
import { cloneMatrix2 } from './Matrix2';

export const MATRIX_PRESETS: MatrixPreset[] = [
  {
    id: 'identity',
    label: 'Identity',
    hint: 'Everything stays in place.',
    matrix: [[1, 0], [0, 1]]
  },
  {
    id: 'scale',
    label: 'Scale ×2',
    hint: 'Uniform scaling by 2.',
    matrix: [[2, 0], [0, 2]]
  },
  {
    id: 'rotation-90',
    label: 'Rotation 90°',
    hint: '90° counter-clockwise about the origin.',
    matrix: [[0, -1], [1, 0]]
  },
  {
    id: 'reflect-x',
    label: 'Reflect x-axis',
    hint: 'Mirror across the x-axis.',
    matrix: [[1, 0], [0, -1]]
  },
  {
    id: 'reflect-y',
    label: 'Reflect y-axis',
    hint: 'Mirror across the y-axis.',
    matrix: [[-1, 0], [0, 1]]
  },
  {
    id: 'shear-x',
    label: 'Shear x',
    hint: 'Horizontal shear.',
    matrix: [[1, 1], [0, 1]]
  },
  {
    id: 'shear-y',
    label: 'Shear y',
    hint: 'Vertical shear.',
    matrix: [[1, 0], [1, 1]]
  },
  {
    id: 'project-x',
    label: 'Project x',
    hint: 'Collapses the plane onto the x-axis (singular).',
    matrix: [[1, 0], [0, 0]]
  },
  {
    id: 'project-y',
    label: 'Project y',
    hint: 'Collapses the plane onto the y-axis (singular).',
    matrix: [[0, 0], [0, 1]]
  }
];

/** Look up a preset by id. */
export function getPreset(id: MatrixPresetId): MatrixPreset | undefined {
  return MATRIX_PRESETS.find((preset) => preset.id === id);
}

/** Independent copy of a preset's matrix. */
export function getPresetMatrix(id: MatrixPresetId): Matrix2 | null {
  const preset = getPreset(id);
  return preset ? cloneMatrix2(preset.matrix) : null;
}
