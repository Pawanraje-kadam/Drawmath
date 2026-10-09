import React from 'react';
import { useStore } from '../../store/useStore';
import { formatNum } from '../../engine/shapes/Shape';
import { Matrix2 } from '../../engine/matrix/types';
import { MATRIX_EPSILON, determinant2, getMatrixDescription } from '../../engine/matrix/Matrix2';
import { transformPoint } from '../../engine/matrix/transform2D';
import { MATRIX_COLORS } from './colors';

interface Props {
  /**
   * The matrix currently shown on the canvas (identity while the animation is
   * at t = 0, the target matrix at t = 1). All read-outs derive from it —
   * nothing derived is ever stored.
   */
  displayMatrix: Matrix2;
}

const E1 = { x: 1, y: 0 };
const E2 = { x: 0, y: 1 };

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-tertiary)',
    marginBottom: 8
  }}>
    {children}
  </div>
);

const VectorRow: React.FC<{ color: string; name: string; value: { x: number; y: number } }> = ({ color, name, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
    <span
      aria-hidden="true"
      style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}
    />
    <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 38 }}>{name}</span>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)' }}>
      ({formatNum(value.x)}, {formatNum(value.y)})
    </span>
  </div>
);

/** Determinant, orientation, area scale, singular warning, description. */
export const MatrixInspector: React.FC<Props> = ({ displayMatrix }) => {
  const testVector = useStore(s => s.testVector);

  const det = determinant2(displayMatrix);
  const singular = Math.abs(det) <= MATRIX_EPSILON;
  const orientation = singular ? '—' : det > 0 ? 'Preserved' : 'Flipped (reflected)';
  const description = getMatrixDescription(displayMatrix);

  const ae1 = transformPoint(displayMatrix, E1);
  const ae2 = transformPoint(displayMatrix, E2);
  const av = transformPoint(displayMatrix, testVector);

  return (
    <div>
      <div style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>
        <SectionTitle>Determinant</SectionTitle>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 18,
          fontWeight: 600,
          color: singular ? 'var(--accent-danger)' : 'var(--text-primary)'
        }}>
          det(A) = {formatNum(det)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Orientation</span>
            <span style={{
              color: singular ? 'var(--accent-danger)' : det > 0 ? 'var(--accent-success)' : 'var(--accent-warning)',
              fontWeight: 600
            }}>{orientation}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Area scale (|det|)</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
              {formatNum(Math.abs(det))}×
            </span>
          </div>
        </div>

        {singular && (
          <div
            role="alert"
            style={{
              marginTop: 10,
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--accent-danger)',
              borderLeftWidth: 3,
              fontSize: 11,
              color: 'var(--text-primary)',
              lineHeight: 1.5
            }}
          >
            <strong>Singular transformation.</strong> det(A) = 0, so A collapses the
            plane onto a line or a point and has <strong>no inverse</strong>. Every
            area is scaled to 0.
          </div>
        )}

        <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {description}
        </p>
      </div>

      <div style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>
        <SectionTitle>Transformed basis</SectionTitle>
        <VectorRow color={MATRIX_COLORS.e1} name="e₁" value={E1} />
        <VectorRow color={MATRIX_COLORS.e1} name="A·e₁" value={ae1} />
        <VectorRow color={MATRIX_COLORS.e2} name="e₂" value={E2} />
        <VectorRow color={MATRIX_COLORS.e2} name="A·e₂" value={ae2} />
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          The columns of A are exactly the transformed basis vectors: A·e₁ = (a, c), A·e₂ = (b, d).
        </div>
      </div>

      <div style={{ padding: '12px' }}>
        <SectionTitle>Test vector</SectionTitle>
        <VectorRow color={MATRIX_COLORS.test} name="v" value={testVector} />
        <VectorRow color={MATRIX_COLORS.output} name="A·v" value={av} />
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          A·v is computed live from the matrix entries — edit v or A and watch it move.
        </div>
      </div>
    </div>
  );
};
