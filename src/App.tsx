
import React, { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { StatusBar } from './components/StatusBar';
import { ContextMenu } from './components/ContextMenu';
import { useKeyboard } from './hooks/useKeyboard';
import { useStore, readSavedWorkspace } from './store/useStore';
import { createShape } from './engine/GeometryEngine';
import { CircleShape } from './engine/shapes/CircleShape';
import { LineShape } from './engine/shapes/LineShape';

const App: React.FC = () => {
  useKeyboard();

  const { shapes, isMobile, inspectorOpen } = useStore();

  // Initialize demo scene
  useEffect(() => {
    const state = useStore.getState();
    if (state.shapes.length > 0) return;

    // Check localStorage (falls back to the pre-rename key)
    const saved = readSavedWorkspace();
    if (saved) {
      try {
        state.loadWorkspace(saved);
        if (useStore.getState().shapes.length > 0) return;
      } catch {}
    }

    // Create demo shapes
    const circle = createShape('circle', { x: 2, y: 1 });
    if (circle instanceof CircleShape) {
      circle.r = 3;
    }
    circle.data.name = 'Circle 1';

    const line = createShape('line', { x: 0, y: 0 });
    if (line instanceof LineShape) {
      line.x1 = -5;
      line.y1 = 0;
      line.x2 = 5;
      line.y2 = 2.5;
    }
    line.data.name = 'Line 1';

    useStore.setState({
      shapes: [circle, line],
      selectedIds: [circle.id]
    });
    useStore.getState().updateIntersections();
  }, []);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      if (useStore.getState().shapes.length > 0) {
        useStore.getState().saveWorkspace();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Detect mobile
  useEffect(() => {
    const handleResize = () => {
      useStore.setState({ isMobile: window.innerWidth < 768 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Toolbar />

      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <Canvas />
        {(!isMobile || inspectorOpen) && <Inspector />}
      </div>

      {!isMobile && <StatusBar />}
      <ContextMenu />
    </div>
  );
};

export default App;
