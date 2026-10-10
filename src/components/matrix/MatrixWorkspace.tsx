import React, { useEffect, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { IDENTITY_MATRIX2, interpolateMatrix2 } from '../../engine/matrix/Matrix2';
import { MatrixCanvas } from './MatrixCanvas';
import { MatrixInput } from './MatrixInput';
import { MatrixPresets } from './MatrixPresets';
import { MatrixInspector } from './MatrixInspector';
import { MatrixLegend } from './MatrixLegend';

/**
 * Full duration of the I → A sweep at 1x speed, in milliseconds.
 * The effective duration is `ANIMATION_DURATION_MS / animationSpeed`,
 * so 0.2x plays 5× slower (4500 ms) and 1x plays at full speed (900 ms).
 */
const ANIMATION_DURATION_MS = 900;

/**
 * Matrix Mode workspace: canvas on the left, controls / inspector on the right
 * (bottom sheet on mobile, mirroring the Draw Mode layout conventions).
 *
 * Owns the animation loop: `requestAnimationFrame` drives
 * `animationProgress` from 0 → 1, so the rendered matrix is
 * `interpolate(I, A, t)` and lands exactly on A at t = 1. The loop is
 * cancelled on unmount.
 */
export const MatrixWorkspace: React.FC = () => {
  const isMobile = useStore(s => s.isMobile);
  const inspectorOpen = useStore(s => s.inspectorOpen);
  const matrix = useStore(s => s.matrix);
  const animationProgress = useStore(s => s.animationProgress);
  const isAnimating = useStore(s => s.isAnimating);
  const animationSpeed = useStore(s => s.animationSpeed);

  /** What is currently drawn: identity at t = 0, the entered matrix at t = 1. */
  const displayMatrix = useMemo(
    () => interpolateMatrix2(IDENTITY_MATRIX2, matrix, animationProgress),
    [matrix, animationProgress]
  );

  // Animation loop: identity → target matrix. Re-entrant across mode switches
  // (resumes from the stored progress) and cancelled cleanly on unmount.
  // Re-runs when the speed changes so mid-animation adjustments take effect
  // immediately, resuming from the current progress with the new duration.
  useEffect(() => {
    if (!isAnimating) return;

    let raf = 0;
    const startProgress = useStore.getState().animationProgress;
    const startTime = performance.now();
    const clampedSpeed = Math.min(1, Math.max(0.2, animationSpeed));
    const durationMs = ANIMATION_DURATION_MS / clampedSpeed;

    const step = (now: number) => {
      const elapsed = Math.max(0, (now - startTime) / durationMs);
      // Smoothstep easing; exactly 1 at the end so the sweep lands on A.
      const eased = elapsed >= 1 ? 1 : elapsed * elapsed * (3 - 2 * elapsed);
      const t = startProgress + (1 - startProgress) * eased;

      if (t >= 1) {
        useStore.getState().setAnimationProgress(1);
        useStore.getState().stopMatrixAnimation();
        return;
      }
      useStore.getState().setAnimationProgress(t);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isAnimating, animationSpeed]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden',
        minHeight: 0
      }}
    >
      <MatrixCanvas displayMatrix={displayMatrix} />

      {(!isMobile || inspectorOpen) && (
        <div
          className="animate-fade-in"
          aria-label="Matrix controls"
          style={{
            width: isMobile ? '100%' : 'var(--inspector-width)',
            background: 'var(--bg-secondary)',
            borderLeft: isMobile ? 'none' : '1px solid var(--border-light)',
            borderTop: isMobile ? '1px solid var(--border-light)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
            flexShrink: 0,
            ...(isMobile ? {
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '50vh',
              zIndex: 200,
              borderRadius: '12px 12px 0 0',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
            } : {})
          }}
        >
          <MatrixInput />
          <MatrixPresets />
          <MatrixInspector displayMatrix={displayMatrix} />
          <MatrixLegend />
        </div>
      )}
    </div>
  );
};
