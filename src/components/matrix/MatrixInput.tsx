import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { formatNum } from '../../engine/shapes/Shape';
import { Matrix2, MatrixColIndex, MatrixRowIndex } from '../../engine/matrix/types';
import { cloneMatrix2 } from '../../engine/matrix/Matrix2';

/**
 * Editable 2×2 matrix A and test vector v.
 *
 * Cells keep a local string draft so intermediate input ("-", "1.") never
 * reaches the store; only finite numbers are committed, and invalid drafts
 * fall back to the last committed value on blur. The graph updates immediately
 * on every valid keystroke.
 */

type MatrixCellKey = 'a' | 'b' | 'c' | 'd';
type VectorCellKey = 'vx' | 'vy';

interface Drafts {
  a: string;
  b: string;
  c: string;
  d: string;
  vx: string;
  vy: string;
}

const CELL_POSITIONS: Record<MatrixCellKey, [MatrixRowIndex, MatrixColIndex]> = {
  a: [0, 0],
  b: [0, 1],
  c: [1, 0],
  d: [1, 1]
};

const CELL_LABELS: Record<MatrixCellKey, string> = {
  a: 'Matrix A, row 1, column 1 (a)',
  b: 'Matrix A, row 1, column 2 (b)',
  c: 'Matrix A, row 2, column 1 (c)',
  d: 'Matrix A, row 2, column 2 (d)'
};

const matrixEqual = (x: Matrix2, y: Matrix2): boolean =>
  x[0][0] === y[0][0] && x[0][1] === y[0][1] && x[1][0] === y[1][0] && x[1][1] === y[1][1];

/** Parse a draft string; returns null for empty / non-finite input. */
const parseDraft = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
};

export const MatrixInput: React.FC = () => {
  const matrix = useStore(s => s.matrix);
  const testVector = useStore(s => s.testVector);
  const setMatrixCell = useStore(s => s.setMatrixCell);
  const setTestVector = useStore(s => s.setTestVector);

  const [drafts, setDrafts] = useState<Drafts>(() => ({
    a: formatNum(matrix[0][0]),
    b: formatNum(matrix[0][1]),
    c: formatNum(matrix[1][0]),
    d: formatNum(matrix[1][1]),
    vx: formatNum(testVector.x),
    vy: formatNum(testVector.y)
  }));

  // Track the values this component committed so external changes (preset,
  // reset) re-sync the drafts while our own keystrokes never get clobbered.
  const lastCommitted = useRef<{ matrix: Matrix2; vector: { x: number; y: number } }>({
    matrix: cloneMatrix2(matrix),
    vector: { ...testVector }
  });

  useEffect(() => {
    const committed = lastCommitted.current;
    const matrixChanged = !matrixEqual(matrix, committed.matrix);
    const vectorChanged = testVector.x !== committed.vector.x || testVector.y !== committed.vector.y;
    if (!matrixChanged && !vectorChanged) return;
    setDrafts({
      a: formatNum(matrix[0][0]),
      b: formatNum(matrix[0][1]),
      c: formatNum(matrix[1][0]),
      d: formatNum(matrix[1][1]),
      vx: formatNum(testVector.x),
      vy: formatNum(testVector.y)
    });
    lastCommitted.current = { matrix: cloneMatrix2(matrix), vector: { ...testVector } };
  }, [matrix, testVector]);

  const handleMatrixChange = useCallback((key: MatrixCellKey, raw: string) => {
    setDrafts(prev => ({ ...prev, [key]: raw }));
    const value = parseDraft(raw);
    if (value === null) return;
    const [row, col] = CELL_POSITIONS[key];
    setMatrixCell(row, col, value);
    const next = cloneMatrix2(lastCommitted.current.matrix);
    next[row][col] = value;
    lastCommitted.current = { ...lastCommitted.current, matrix: next };
  }, [setMatrixCell]);

  const handleVectorChange = useCallback((key: VectorCellKey, raw: string) => {
    setDrafts(prev => ({ ...prev, [key]: raw }));
    const value = parseDraft(raw);
    if (value === null) return;
    const vector = key === 'vx'
      ? { x: value, y: lastCommitted.current.vector.y }
      : { x: lastCommitted.current.vector.x, y: value };
    setTestVector(vector);
    lastCommitted.current = { ...lastCommitted.current, vector };
  }, [setTestVector]);

  /** On blur: restore the committed value only when the draft is invalid. */
  const handleBlur = useCallback((key: keyof Drafts, committedValue: number) => {
    setDrafts(prev => {
      const parsed = parseDraft(prev[key]);
      if (parsed !== null) return prev;
      return { ...prev, [key]: formatNum(committedValue) };
    });
  }, []);

  const numberInput = (key: keyof Drafts, label: string, committedValue: number, onChange: (raw: string) => void) => (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-label={label}
      title={label}
      value={drafts[key]}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => handleBlur(key, committedValue)}
      style={{
        width: 58,
        padding: '6px 4px',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 13
      }}
    />
  );

  const bracket = (side: 'left' | 'right') => (
    <div
      aria-hidden="true"
      style={{
        width: 8,
        alignSelf: 'stretch',
        borderLeft: side === 'left' ? '2px solid var(--border-medium)' : 'none',
        borderRight: side === 'right' ? '2px solid var(--border-medium)' : 'none',
        borderTop: '2px solid var(--border-medium)',
        borderBottom: '2px solid var(--border-medium)',
        borderRadius: side === 'left' ? '4px 0 0 4px' : '0 4px 4px 0'
      }}
    />
  );

  return (
    <div style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>
      {/* Matrix A */}
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-tertiary)',
        marginBottom: 8
      }}>
        Matrix A
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          A =
        </span>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 4 }}>
          {bracket('left')}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 6, padding: '2px 0' }}>
            {(['a', 'b', 'c', 'd'] as MatrixCellKey[]).map(key => (
              <React.Fragment key={key}>
                {numberInput(key, CELL_LABELS[key], matrix[CELL_POSITIONS[key][0]][CELL_POSITIONS[key][1]], (raw) => handleMatrixChange(key, raw))}
              </React.Fragment>
            ))}
          </div>
          {bracket('right')}
        </div>
      </div>

      {/* Test vector v */}
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-tertiary)',
        margin: '14px 0 8px'
      }}>
        Test vector v
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          v =
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden="true" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>(</span>
          {numberInput('vx', 'Test vector, x coordinate', testVector.x, (raw) => handleVectorChange('vx', raw))}
          <span aria-hidden="true" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>,</span>
          {numberInput('vy', 'Test vector, y coordinate', testVector.y, (raw) => handleVectorChange('vy', raw))}
          <span aria-hidden="true" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>)</span>
        </div>
      </div>
    </div>
  );
};
