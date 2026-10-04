
import { useCallback } from 'react';
import { ShapeType, Vec2 } from '../types';
import { useStore } from '../store/useStore';

export function useDragAndDrop() {
  const handleDragStart = useCallback((e: React.DragEvent, type: ShapeType) => {
    e.dataTransfer.setData('shapeType', type);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, canvasRect: DOMRect) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('shapeType') as ShapeType;
    if (!type) return;

    const state = useStore.getState();
    const screenX = e.clientX - canvasRect.left;
    const screenY = e.clientY - canvasRect.top;
    const worldPos = state.coordSystem.screenToWorld({ x: screenX, y: screenY });
    const snapped = state.snapToGrid(worldPos);
    state.addShape(type, snapped);
  }, []);

  return { handleDragStart, handleDrop };
}
