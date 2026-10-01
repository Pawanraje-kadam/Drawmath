
import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const ContextMenu: React.FC = () => {
  const { contextMenu, setContextMenu, selectShape, duplicateSelected, deleteSelected, removeShape } = useStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [setContextMenu]);

  if (!contextMenu) return null;

  const hasShape = !!contextMenu.shapeId;

  return (
    <div
      ref={ref}
      className="animate-scale-in"
      style={{
        position: 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        padding: 4,
        zIndex: 'var(--z-context)',
        minWidth: 160
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {hasShape && (
        <>
          <ContextMenuItem onClick={() => {
            selectShape(contextMenu.shapeId!);
            setContextMenu(null);
          }}>Select</ContextMenuItem>
          <ContextMenuItem onClick={() => {
            selectShape(contextMenu.shapeId!);
            duplicateSelected();
            setContextMenu(null);
          }}>Duplicate</ContextMenuItem>
          <div style={{ height: 1, background: 'var(--border-light)', margin: '4px 0' }} />
          <ContextMenuItem onClick={() => {
            removeShape(contextMenu.shapeId!);
            setContextMenu(null);
          }} danger>Delete</ContextMenuItem>
        </>
      )}
      {!hasShape && (
        <div style={{
          padding: '8px 12px',
          fontSize: 12,
          color: 'var(--text-tertiary)'
        }}>
          Right-click on a shape for options
        </div>
      )}
    </div>
  );
};

const ContextMenuItem: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}> = ({ onClick, children, danger }) => (
  <button
    onClick={onClick}
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '6px 12px',
      fontSize: 12,
      color: danger ? 'var(--accent-danger)' : 'var(--text-primary)',
      borderRadius: 'var(--radius-sm)',
      transition: 'background 0.1s',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer'
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    {children}
  </button>
);
