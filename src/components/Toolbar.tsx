
import React, { useState } from 'react';
import { ShapeType } from '../types';
import { useStore } from '../store/useStore';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useExport } from '../hooks/useExport';

const shapeTools: { type: ShapeType; icon: string; label: string }[] = [
  { type: 'point', icon: '•', label: 'Point' },
  { type: 'line', icon: '╱', label: 'Line' },
  { type: 'segment', icon: '—', label: 'Segment' },
  { type: 'ray', icon: '→', label: 'Ray' },
  { type: 'circle', icon: '○', label: 'Circle' },
  { type: 'ellipse', icon: '⬭', label: 'Ellipse' },
  { type: 'rectangle', icon: '▭', label: 'Rectangle' },
  { type: 'square', icon: '□', label: 'Square' },
  { type: 'triangle', icon: '△', label: 'Triangle' },
  { type: 'parabola', icon: '⌒', label: 'Parabola' },
  { type: 'sine', icon: '∿', label: 'Sine' },
  { type: 'vector', icon: '⇀', label: 'Vector' },
  { type: 'polygon', icon: '⬠', label: 'Polygon' },
];

export const Toolbar: React.FC = () => {
  const { handleDragStart } = useDragAndDrop();
  const { exportPNG, exportSVG, exportJSON, importJSON } = useExport();
  const {
    undo, redo, snapping, toggleSnapping, toggleTheme, theme,
    saveWorkspace, clearWorkspace, addShape, showMeasurements,
    toggleMeasurements, isMobile, inspectorOpen, setInspectorOpen
  } = useStore();
  const [showActions, setShowActions] = useState(false);

  return (
    <div style={{
      height: 'var(--toolbar-height)',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: '8px',
      zIndex: 'var(--z-toolbar)',
      position: 'relative',
      flexShrink: 0
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginRight: '8px',
        flexShrink: 0
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: 14
        }}>M</div>
        {!isMobile && (
          <span style={{
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--text-primary)',
            letterSpacing: '-0.3px'
          }}>MathSketch</span>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: 'var(--border-light)', flexShrink: 0 }} />

      {/* Shape Tools */}
      <div style={{
        display: 'flex',
        gap: '2px',
        overflowX: 'auto',
        flex: 1,
        paddingRight: 8,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {shapeTools.map(tool => (
          <button
            key={tool.type}
            draggable
            onDragStart={(e) => handleDragStart(e, tool.type)}
            onClick={() => addShape(tool.type, { x: 0, y: 0 })}
            title={`${tool.label} — drag onto canvas or click to create`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              cursor: 'grab',
              flexShrink: 0,
              background: 'transparent',
              border: '1px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--border-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{tool.icon}</span>
            {!isMobile && <span>{tool.label}</span>}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: 'var(--border-light)', flexShrink: 0 }} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
        <ToolbarButton title="Undo (Ctrl+Z)" onClick={undo}>↶</ToolbarButton>
        <ToolbarButton title="Redo (Ctrl+Shift+Z)" onClick={redo}>↷</ToolbarButton>

        <div style={{ width: 1, height: 28, background: 'var(--border-light)', margin: '0 4px' }} />

        <ToolbarButton
          title={`Snap to Grid: ${snapping ? 'ON' : 'OFF'}`}
          onClick={toggleSnapping}
          active={snapping}
        >⊞</ToolbarButton>

        <ToolbarButton
          title={`Measurements: ${showMeasurements ? 'ON' : 'OFF'}`}
          onClick={toggleMeasurements}
          active={showMeasurements}
        >📐</ToolbarButton>

        <ToolbarButton
          title={`Theme: ${theme}`}
          onClick={toggleTheme}
        >{theme === 'light' ? '☀' : '☾'}</ToolbarButton>

        {isMobile && (
          <ToolbarButton
            title="Inspector"
            onClick={() => setInspectorOpen(!inspectorOpen)}
            active={inspectorOpen}
          >ℹ</ToolbarButton>
        )}

        <div style={{ position: 'relative' }}>
          <ToolbarButton title="More actions" onClick={() => setShowActions(!showActions)}>⋯</ToolbarButton>
          {showActions && (
            <div
              className="animate-scale-in"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '4px',
                zIndex: 300,
                minWidth: 160
              }}
            >
              <ActionMenuItem onClick={() => { saveWorkspace(); setShowActions(false); }}>💾 Save</ActionMenuItem>
              <ActionMenuItem onClick={() => { importJSON(); setShowActions(false); }}>📂 Load</ActionMenuItem>
              <ActionMenuItem onClick={() => { exportJSON(); setShowActions(false); }}>📄 Export JSON</ActionMenuItem>
              <ActionMenuItem onClick={() => { exportSVG(); setShowActions(false); }}>🖼 Export SVG</ActionMenuItem>
              <ActionMenuItem onClick={() => { exportPNG(); setShowActions(false); }}>📸 Export PNG</ActionMenuItem>
              <div style={{ height: 1, background: 'var(--border-light)', margin: '4px 0' }} />
              <ActionMenuItem onClick={() => { clearWorkspace(); setShowActions(false); }} danger>🗑 Clear All</ActionMenuItem>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ToolbarButton: React.FC<{
  onClick: () => void;
  title?: string;
  active?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, active, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-sm)',
      fontSize: 15,
      background: active ? 'var(--bg-active)' : 'transparent',
      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
      transition: 'all 0.15s',
      border: 'none'
    }}
    onMouseEnter={(e) => {
      if (!active) e.currentTarget.style.background = 'var(--bg-hover)';
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.background = 'transparent';
    }}
  >{children}</button>
);

const ActionMenuItem: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}> = ({ onClick, children, danger }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      padding: '8px 12px',
      fontSize: 13,
      color: danger ? 'var(--accent-danger)' : 'var(--text-primary)',
      borderRadius: 'var(--radius-sm)',
      textAlign: 'left',
      transition: 'background 0.1s',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
  >{children}</button>
);
