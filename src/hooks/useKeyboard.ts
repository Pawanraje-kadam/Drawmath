
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ZOOM_STEP } from '../engine/CoordinateSystem';

export function useKeyboard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useStore.getState();
      const isInput = (e.target as HTMLElement)?.tagName === 'INPUT';
      if (isInput) return;

      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        state.redo();
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        state.undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        state.zoomBy(ZOOM_STEP);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        state.zoomBy(1 / ZOOM_STEP);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        state.resetView();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        state.deleteSelected();
      } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        state.duplicateSelected();
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const allIds = state.shapes.map(s => s.id);
        useStore.setState({ selectedIds: allIds });
      } else if (e.key === 'Escape') {
        state.deselectAll();
        state.setContextMenu(null);
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        state.saveWorkspace();
      } else if (e.key === 'g') {
        state.toggleSnapping();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
