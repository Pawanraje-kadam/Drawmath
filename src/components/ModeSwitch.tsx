import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { AppMode } from '../types';

/**
 * Segmented Draw / Matrix switch for the toolbar.
 *
 * Instead of swapping the active background instantly, a pill slides from
 * one segment to the other, so the mode change is readable at a glance and
 * the eye is led to where the workspace is going.
 */

const MODES: { id: AppMode; label: string; icon: string; hint: string }[] = [
  { id: 'draw', label: 'Draw', icon: '✎', hint: 'Draw Mode — sketch geometric shapes' },
  { id: 'matrix', label: 'Matrix', icon: '▦', hint: 'Matrix Mode — explore 2×2 matrix transformations' },
];

export const ModeSwitch: React.FC = () => {
  const appMode = useStore(s => s.appMode);
  const setAppMode = useStore(s => s.setAppMode);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Partial<Record<AppMode, HTMLButtonElement | null>>>({});
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const button = buttonRefs.current[appMode];
    if (!container || !button) return;
    const cRect = container.getBoundingClientRect();
    const bRect = button.getBoundingClientRect();
    setPill({ x: bRect.left - cRect.left, w: bRect.width });
  }, [appMode]);

  // Position the pill before the browser paints the new mode.
  useLayoutEffect(() => {
    measure();
  }, [measure]);

  // Keep the pill aligned when the toolbar reflows (resize, font load, …).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    MODES.forEach(mode => {
      const button = buttonRefs.current[mode.id];
      if (button) observer.observe(button);
    });
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Application mode"
      className="dm-mode-switch"
    >
      {pill && (
        <span
          className="dm-mode-pill"
          aria-hidden="true"
          style={{ width: pill.w, transform: `translateX(${pill.x}px)` }}
        />
      )}

      {MODES.map(mode => {
        const active = appMode === mode.id;
        return (
          <button
            key={mode.id}
            ref={(el) => { buttonRefs.current[mode.id] = el; }}
            type="button"
            className="dm-mode-switch__btn"
            aria-pressed={active}
            title={mode.hint}
            onClick={() => setAppMode(mode.id)}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: 'calc(var(--radius-md) - 3px)',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              background: 'transparent',
              color: active ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              transition: 'color 0.25s ease, transform 0.15s ease',
              border: 'none'
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: 13,
                lineHeight: 1,
                opacity: active ? 1 : 0.7,
                transition: 'opacity 0.25s ease'
              }}
            >
              {mode.icon}
            </span>
            {mode.label}
          </button>
        );
      })}
    </div>
  );
};
