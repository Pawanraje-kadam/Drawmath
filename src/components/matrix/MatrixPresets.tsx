import React from 'react';
import { useStore } from '../../store/useStore';
import { MATRIX_PRESETS } from '../../engine/matrix/presets';
import { MatrixPresetId } from '../../engine/matrix/types';

/** Playback speeds offered for the I → A animation (default: 1x). */
const SPEED_OPTIONS = [1, 0.8, 0.6, 0.4, 0.2];

/**
 * Preset transformations plus the animation / reset controls.
 * Selecting a preset animates smoothly from the identity matrix to it.
 */
export const MatrixPresets: React.FC = () => {
  const isAnimating = useStore(s => s.isAnimating);
  const selectMatrixPreset = useStore(s => s.selectMatrixPreset);
  const resetMatrix = useStore(s => s.resetMatrix);
  const startMatrixAnimation = useStore(s => s.startMatrixAnimation);
  const stopMatrixAnimation = useStore(s => s.stopMatrixAnimation);
  const animationSpeed = useStore(s => s.animationSpeed);
  const setAnimationSpeed = useStore(s => s.setAnimationSpeed);

  return (
    <div style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-tertiary)',
        marginBottom: 8
      }}>
        Presets
      </div>

      <div
        role="group"
        aria-label="Matrix presets"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6
        }}
      >
        {MATRIX_PRESETS.map(preset => (
          <button
            key={preset.id}
            type="button"
            title={preset.hint}
            aria-label={`Apply preset: ${preset.label}. ${preset.hint}`}
            onClick={() => selectMatrixPreset(preset.id as MatrixPresetId)}
            style={{
              padding: '8px 4px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--border-medium)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-light)';
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'flex-end' }}>
        <button
          type="button"
          onClick={() => (isAnimating ? stopMatrixAnimation() : startMatrixAnimation())}
          aria-label={isAnimating ? 'Stop the transformation animation' : 'Animate from identity to the current matrix'}
          title={isAnimating ? 'Stop and jump to the target matrix' : 'Smoothly animate from I to A'}
          style={{
            flex: 1.4,
            minWidth: 0,
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid transparent',
            background: 'var(--accent-primary)',
            color: 'var(--text-inverse)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {isAnimating ? '■ Stop' : '▶ Animate I → A'}
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', flex: '0 0 auto', width: 78 }}>
          <label
            htmlFor="matrix-animation-speed"
            style={{
              fontSize: 9,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              marginBottom: 2
            }}
          >
            Speed
          </label>
          <select
            id="matrix-animation-speed"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
            aria-label="Animation speed"
            title="Animation speed (0.2x to 1x)"
            style={{
              padding: '8px 4px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {SPEED_OPTIONS.map(speed => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={resetMatrix}
          aria-label="Reset the matrix to the identity matrix"
          title="Restore the identity matrix"
          style={{
            flex: 1,
            minWidth: 0,
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};
