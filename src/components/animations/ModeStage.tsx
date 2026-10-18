import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useStore, MODE_TRANSITION_IN_MS, MODE_TRANSITION_OUT_MS } from '../../store/useStore';
import { prefersReducedMotion } from '../../hooks/useButtonEffects';

/**
 * The workspace stage: the box that holds either the Draw workspace or the
 * Matrix workspace and plays the animated hand-off between them.
 *
 * The motion is driven with the Web Animations API instead of CSS classes so
 * that an interrupted transition (the user re-clicking mid-flight) can pick
 * up from the exact visual state it was in instead of snapping.
 */

/** Visually identical to the untransformed element. */
const IDENTITY_TRANSFORM = 'translate3d(0px, 0px, 0) scale(1)';

/** How far the workspace travels sideways (fraction of its width). */
const TRAVEL_X = 0.035;
/** How far the workspace travels vertically on narrow screens. */
const TRAVEL_Y = 0.02;
/** Blur applied at the peak of the transition (desktop only). */
const TRAVEL_BLUR = 8;

/**
 * Combine an existing computed transform with an extra translation + scale so
 * the animation can continue from wherever it currently is.
 */
const composeTransform = (base: string, dx: number, dy: number, scale: number): string => {
  if (!base || base === 'none') {
    return `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
  }
  try {
    const m = new DOMMatrix(base);
    return `translate3d(${m.e + dx}px, ${m.f + dy}px, 0) scale(${m.a * scale})`;
  } catch {
    return `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
  }
};

interface ModeStageProps {
  children: React.ReactNode;
}

export const ModeStage: React.FC<ModeStageProps> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);

  const phase = useStore(s => s.modeTransition);
  const target = useStore(s => s.transitionTarget);
  const isMobile = useStore(s => s.isMobile);

  // Release the animation when the stage goes away.
  useEffect(() => () => { animationRef.current?.cancel(); }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Without the Web Animations API the workspace simply swaps instantly.
    if (typeof el.animate !== 'function') return;

    const previous = animationRef.current;

    if (phase === 'idle') {
      previous?.cancel();
      animationRef.current = null;
      el.style.willChange = '';
      return;
    }

    const reduced = prefersReducedMotion();
    const forward = target === 'matrix';
    const rect = el.getBoundingClientRect();
    const computed = getComputedStyle(el);
    const currentOpacity = parseFloat(computed.opacity);
    const currentTransform = computed.transform;
    const currentFilter = computed.filter;

    // On narrow screens the workspace is stacked vertically, so travelling
    // sideways would look wrong — move along the stack instead.
    const travelX = isMobile ? 0 : (forward ? -1 : 1) * rect.width * TRAVEL_X;
    const travelY = isMobile ? (forward ? -1 : 1) * rect.height * TRAVEL_Y : 0;
    const blur = isMobile ? 0 : TRAVEL_BLUR;

    let animation: Animation;

    if (phase === 'leaving') {
      // Continue from the current visual state and travel away.
      animation = el.animate(
        [
          {
            opacity: Number.isFinite(currentOpacity) ? currentOpacity : 1,
            transform: currentTransform === 'none' ? IDENTITY_TRANSFORM : currentTransform,
            filter: currentFilter === 'none' ? 'none' : currentFilter,
          },
          {
            opacity: 0,
            transform: composeTransform(currentTransform, travelX, travelY, 0.96),
            filter: blur > 0 ? `blur(${blur}px)` : 'none',
          },
        ],
        {
          duration: reduced ? 1 : MODE_TRANSITION_OUT_MS,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'both',
        }
      );
    } else {
      // Enter from the opposite side and settle into place.
      const enterX = isMobile ? 0 : (forward ? 1 : -1) * rect.width * TRAVEL_X;
      const enterY = isMobile ? (forward ? 1 : -1) * rect.height * TRAVEL_Y : 0;
      animation = el.animate(
        [
          {
            opacity: 0,
            transform: `translate3d(${enterX}px, ${enterY}px, 0) scale(1.035)`,
            filter: blur > 0 ? `blur(${blur + 2}px)` : 'none',
          },
          {
            opacity: 1,
            transform: IDENTITY_TRANSFORM,
            filter: 'none',
          },
        ],
        {
          duration: reduced ? 1 : MODE_TRANSITION_IN_MS,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'both',
        }
      );
    }

    el.style.willChange = 'transform, opacity, filter';
    animationRef.current = animation;
    // The new animation takes over as soon as it is registered, so the old
    // one can be dropped without a visible jump.
    previous?.cancel();
  }, [phase, target, isMobile]);

  return (
    <div
      ref={ref}
      className="dm-stage"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
        // The outgoing workspace fades away — don't let clicks land on it.
        pointerEvents: phase === 'leaving' ? 'none' : 'auto'
      }}
    >
      {children}
    </div>
  );
};
