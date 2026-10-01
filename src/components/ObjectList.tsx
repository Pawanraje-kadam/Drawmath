
import React, { useState } from 'react';
import { useStore } from '../store/useStore';

const typeIcons: Record<string, string> = {
  point: '•',
  line: '╱',
  ray: '→',
  segment: '—',
  circle: '○',
  ellipse: '⬭',
  rectangle: '▭',
  square: '□',
  triangle: '△',
  parabola: '⌒',
  sine: '∿',
  vector: '⇀',
  polygon: '⬠'
};

export const ObjectList: React.FC = () => {
  const { shapes, selectedIds, selectShape, toggleShapeVisibility, removeShape, renameShape, duplicateSelected } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (shapes.length === 0) {
    return (
      <div style={{
        padding: '20px 12px',
        color: 'var(--text-tertiary)',
        fontSize: 12,
        textAlign: 'center'
      }}>
        Drag shapes from the toolbar
        <br />onto the canvas to begin
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 0' }}>
      {shapes.map(shape => {
        const isSelected = selectedIds.includes(shape.id);
        const isEditing = editingId === shape.id;

        return (
          <div
            key={shape.id}
            onClick={() => selectShape(shape.id)}
            onDoubleClick={() => {
              setEditingId(shape.id);
              setEditName(shape.data.name);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              cursor: 'pointer',
              background: isSelected ? 'var(--bg-active)' : 'transparent',
              borderLeft: isSelected ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'background 0.1s',
              fontSize: 12
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{
              fontSize: 14,
              width: 18,
              textAlign: 'center',
              color: shape.data.color,
              flexShrink: 0
            }}>
              {typeIcons[shape.data.type] || '?'}
            </span>

            {isEditing ? (
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => {
                  renameShape(shape.id, editName || shape.data.name);
                  setEditingId(null);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    renameShape(shape.id, editName || shape.data.name);
                    setEditingId(null);
                  }
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={e => e.stopPropagation()}
                style={{
                  flex: 1,
                  fontSize: 12,
                  padding: '1px 4px',
                  minWidth: 0
                }}
              />
            ) : (
              <span style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: shape.data.visible ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontWeight: isSelected ? 500 : 400
              }}>
                {shape.data.name}
              </span>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); toggleShapeVisibility(shape.id); }}
              title={shape.data.visible ? 'Hide' : 'Show'}
              style={{
                width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11,
                opacity: shape.data.visible ? 0.5 : 0.3,
                borderRadius: 3,
                flexShrink: 0
              }}
            >
              {shape.data.visible ? '👁' : '👁‍🗨'}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); removeShape(shape.id); }}
              title="Delete"
              style={{
                width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10,
                opacity: 0.4,
                borderRadius: 3,
                flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent-danger)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'inherit'; }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};
