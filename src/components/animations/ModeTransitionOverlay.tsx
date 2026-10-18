import React, { useEffect, useState } from 'react';
import { useStore, MODE_TRANSITION_TOTAL_MS } from '../../store/useStore';
import { prefersReducedMotion } from '../../hooks/useButtonEffects';

/**
 * Overlay that plays on top of the workspace while the Draw ↔ Matrix
 * hand-off is running: a soft band of light sweeps across the canvas and a
 * badge names the mode that is being entered.
 *
 * It is purely decorative — `pointer-events: none` — and disappears as soon
 * as the transition settles.
 */
export const ModeTransitionOverlay: React.FC = () => {
  const phase = useStore(s => s.modeTransition);
  const target = useStore(s => s.transitionTarget);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  if (phase === 'idle' || !target || reduced) return null;

  const forward = target === 'matrix';

  return (
    <div
      className="dm-overlay"
      data-direction={forward ? 'forward' : 'backward'}
      style={{ ['--dm-overlay-duration' as string]: `${MODE_TRANSITION_TOTAL_MS}ms` }}
      aria-hidden="true"
    >
      <div className="dm-overlay__sweep" />
      <div className="dm-overlay__badge">
        <span className="dm-overlay__icon">{forward ? '▦' : '✎'}</span>
        <span className="dm-overlay__title">{forward ? 'Matrix Mode' : 'Draw Mode'}</span>
        <span className="dm-overlay__sub">
          {forward ? '2×2 transformation workspace' : 'Geometry canvas'}
        </span>
      </div>
    </div>
  );
};
