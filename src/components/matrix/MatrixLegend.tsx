import React from 'react';
import { MATRIX_COLORS } from './colors';

const ROWS: { color: string; label: string }[] = [
  { color: MATRIX_COLORS.grid, label: 'Transformed grid' },
  { color: MATRIX_COLORS.e1, label: 'e₁ / A·e₁ (basis)' },
  { color: MATRIX_COLORS.e2, label: 'e₂ / A·e₂ (basis)' },
  { color: MATRIX_COLORS.test, label: 'v (test vector)' },
  { color: MATRIX_COLORS.output, label: 'A·v (output)' }
];

/** Colour key for everything drawn in Matrix Mode. */
export const MatrixLegend: React.FC = () => (
  <div style={{ padding: '12px' }}>
    <div style={{
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: 'var(--text-tertiary)',
      marginBottom: 8
    }}>
      Legend
    </div>
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {ROWS.map(row => (
        <li key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span
            aria-hidden="true"
            style={{
              width: 14,
              height: 3,
              borderRadius: 2,
              background: row.color,
              flexShrink: 0
            }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
        </li>
      ))}
      <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
        <span
          aria-hidden="true"
          style={{
            width: 14,
            height: 1,
            background: 'var(--grid-major)',
            flexShrink: 0
          }}
        />
        <span style={{ color: 'var(--text-secondary)' }}>Original grid (unchanged)</span>
      </li>
    </ul>
  </div>
);
