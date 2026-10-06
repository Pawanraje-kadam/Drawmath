
import React from 'react';
import { useStore } from '../store/useStore';
import { DEFAULT_SCALE, MAX_SCALE, MIN_SCALE, ZOOM_STEP } from '../engine/CoordinateSystem';

/**
 * Floating zoom widget shown in the top-right corner of the graph.
 * Zoom-in / zoom-out step around the centre of the view; the middle chip
 * shows the current zoom level and resets the view when clicked.
 */
export const ZoomControls: React.FC = () => {
  const scale = useStore(s => s.viewport.scale);
  const isMobile = useStore(s => s.isMobile);
  const zoomBy = useStore(s => s.zoomBy);
  const resetView = useStore(s => s.resetView);

  const canZoomIn = scale < MAX_SCALE - 1e-6;
  const canZoomOut = scale > MIN_SCALE + 1e-6;
  const isDefault = Math.abs(scale - DEFAULT_SCALE) < 1e-6;
  const zoomPercent = Math.round((scale / DEFAULT_SCALE) * 100);

  const buttonSize = isMobile ? 34 : 36;

  // Keep pointer / wheel / double-click gestures away from the canvas below.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div
      role="group"
      aria-label="Zoom controls"
      onPointerDown={stop}
      onPointerUp={stop}
      onDoubleClick={stop}
      onWheel={stop}
      onContextMenu={stop}
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      <ZoomButton
        title="Zoom in (Ctrl + +)"
        label="Zoom in"
        onClick={() => zoomBy(ZOOM_STEP)}
        disabled={!canZoomIn}
        size={buttonSize}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M8 3.25v9.5M3.25 8h9.5" />
        </svg>
      </ZoomButton>

      <div style={{ height: 1, background: 'var(--border-light)' }} />

      <ZoomButton
        title="Zoom out (Ctrl + -)"
        label="Zoom out"
        onClick={() => zoomBy(1 / ZOOM_STEP)}
        disabled={!canZoomOut}
        size={buttonSize}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3.25 8h9.5" />
        </svg>
      </ZoomButton>

      <div style={{ height: 1, background: 'var(--border-light)' }} />

      <button
        type="button"
        title={`Zoom ${zoomPercent}% — click to reset view (Ctrl + 0)`}
        aria-label={`Reset zoom, currently ${zoomPercent}%`}
        onClick={resetView}
        style={{
          width: '100%',
          minWidth: buttonSize,
          height: 26,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 6px',
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          letterSpacing: '-0.2px',
          color: isDefault ? 'var(--text-tertiary)' : 'var(--accent-primary)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.15s, color 0.15s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {zoomPercent}%
      </button>
    </div>
  );
};

const ZoomButton: React.FC<{
  title: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  size: number;
  children: React.ReactNode;
}> = ({ title, label, onClick, disabled, size, children }) => (
  <button
    type="button"
    title={title}
    aria-label={label}
    aria-disabled={disabled}
    disabled={disabled}
    onClick={onClick}
    style={{
      width: '100%',
      minWidth: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      border: 'none',
      color: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
      opacity: disabled ? 0.45 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background 0.15s, color 0.15s'
    }}
    onMouseEnter={(e) => {
      if (!disabled) e.currentTarget.style.background = 'var(--bg-hover)';
    }}
    onMouseLeave={(e) => {
      if (!disabled) e.currentTarget.style.background = 'transparent';
    }}
  >
    {children}
  </button>
);
