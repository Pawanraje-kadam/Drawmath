/**
 * Colour tokens for Matrix Mode. Values are CSS custom properties so both
 * themes stay in sync via `global.css`.
 */
export const MATRIX_COLORS = {
  grid: 'var(--matrix-grid)',
  e1: 'var(--matrix-e1)',
  e2: 'var(--matrix-e2)',
  test: 'var(--matrix-test)',
  output: 'var(--matrix-output)'
} as const;

export type MatrixColorKey = keyof typeof MATRIX_COLORS;
