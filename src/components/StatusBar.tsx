
import React from 'react';
import { useStore } from '../store/useStore';
import { formatNum } from '../engine/shapes/Shape';

export const StatusBar: React.FC = () => {
  const { shapes, selectedIds, snapping, cursorWorld, viewport } = useStore();

  return (
    <div style={{
      height: 'var(--statusbar-height)',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 16,
      fontSize: 11,
      color: 'var(--text-tertiary)',
      fontFamily: 'var(--font-mono)',
      flexShrink: 0
    }}>
      <span>Objects: {shapes.length}</span>
      {selectedIds.length > 0 && <span>Selected: {selectedIds.length}</span>}
      <span>Zoom: {Math.round(viewport.scale)}x</span>
      {snapping && <span style={{ color: 'var(--accent-primary)' }}>⊞ Snap</span>}
      <div style={{ flex: 1 }} />
      {cursorWorld && (
        <span>
          x: {formatNum(cursorWorld.x, 1)}  y: {formatNum(cursorWorld.y, 1)}
        </span>
      )}
    </div>
  );
};
