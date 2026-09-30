
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { CoordinateSystem } from '../engine/CoordinateSystem';
import { GridRenderer } from './GridRenderer';
import { AxisRenderer } from './AxisRenderer';
import { ShapeRenderer } from './ShapeRenderer';
import { ManipulationHandles } from './ManipulationHandles';
import { Shape } from '../engine/shapes/Shape';
import { LineShape } from '../engine/shapes/LineShape';
import { TriangleShape } from '../engine/shapes/TriangleShape';
import { VectorShape } from '../engine/shapes/VectorShape';
import { PolygonShape } from '../engine/shapes/PolygonShape';
import { ParabolaShape } from '../engine/shapes/ParabolaShape';
import { Vec2, HandleType, ShapeType } from '../types';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { formatNum } from '../engine/shapes/Shape';
import { IntersectionInfo } from '../engine/IntersectionEngine';

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const cs = useRef(new CoordinateSystem());
  const { handleDrop } = useDragAndDrop();

  const {
    shapes, selectedIds, viewport, snapping,
    selectShape, deselectAll, moveSelected, deleteSelected,
    pushHistory, setViewport, setCursorWorld,
    setContextMenu, intersections, updateShape, snapToGrid,
    coordSystem, addShape
  } = useStore();

  const [dragState, setDragState] = useState<{
    mode: 'none' | 'pan' | 'move' | 'handle';
    startScreen: Vec2;
    startWorld: Vec2;
    lastWorld: Vec2;
    shapeId?: string;
    handleType?: HandleType;
    handleIndex?: number;
    hasMoved?: boolean;
  }>({ mode: 'none', startScreen: { x: 0, y: 0 }, startWorld: { x: 0, y: 0 }, lastWorld: { x: 0, y: 0 } });

  // Sync coord system
  useEffect(() => {
    cs.current.setViewport(viewport);
    coordSystem.setViewport(viewport);
  }, [viewport, coordSystem]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
        cs.current.setCanvasSize(width, height);
        coordSystem.setCanvasSize(width, height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [coordSystem]);

  const getScreenPos = useCallback((e: React.PointerEvent): Vec2 => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const findShapeAt = useCallback((world: Vec2): Shape | null => {
    const tolerance = cs.current.screenDistToWorld(10);
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      if (!s.data.visible) continue;
      if (s.containsPoint(world, tolerance)) return s;
    }
    return null;
  }, [shapes]);

  const findHandleAt = useCallback((screen: Vec2): { shape: Shape; handleType: HandleType; handleIndex: number } | null => {
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    for (const shape of selectedShapes) {
      const handles = shape.getHandlePositions();
      for (let i = 0; i < handles.length; i++) {
        const sp = cs.current.worldToScreen(handles[i].pos);
        const dx = sp.x - screen.x;
        const dy = sp.y - screen.y;
        if (Math.sqrt(dx * dx + dy * dy) <= 10) {
          return { shape, handleType: handles[i].type, handleIndex: i };
        }
      }
    }
    return null;
  }, [shapes, selectedIds]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 2) return; // context menu
    const screen = getScreenPos(e);
    const world = cs.current.screenToWorld(screen);

    setContextMenu(null);

    // Check handles first
    const handle = findHandleAt(screen);
    if (handle) {
      pushHistory();
      setDragState({
        mode: 'handle',
        startScreen: screen,
        startWorld: world,
        lastWorld: world,
        shapeId: handle.shape.id,
        handleType: handle.handleType,
        handleIndex: handle.handleIndex,
        hasMoved: false
      });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }

    // Check shape hit
    const hit = findShapeAt(world);
    if (hit) {
      if (!selectedIds.includes(hit.id)) {
        selectShape(hit.id, e.shiftKey);
      }
      pushHistory();
      setDragState({
        mode: 'move',
        startScreen: screen,
        startWorld: world,
        lastWorld: world,
        shapeId: hit.id,
        hasMoved: false
      });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }

    // Pan
    deselectAll();
    setDragState({
      mode: 'pan',
      startScreen: screen,
      startWorld: world,
      lastWorld: world,
      hasMoved: false
    });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [getScreenPos, findHandleAt, findShapeAt, selectedIds, selectShape, deselectAll, pushHistory, setContextMenu]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const screen = getScreenPos(e);
    const world = cs.current.screenToWorld(screen);
    setCursorWorld(world);

    if (dragState.mode === 'none') return;

    const ds = dragState;

    if (ds.mode === 'pan') {
      const dx = screen.x - ds.startScreen.x;
      const dy = screen.y - ds.startScreen.y;
      setViewport({
        offsetX: viewport.offsetX + (screen.x - ds.lastWorld.x),
        offsetY: viewport.offsetY + (screen.y - (ds.lastWorld as any).sy || ds.startScreen.y)
      });
      // Direct pan
      const panDx = e.movementX;
      const panDy = e.movementY;
      setViewport({
        offsetX: viewport.offsetX + panDx,
        offsetY: viewport.offsetY + panDy
      });
      setDragState({ ...ds, hasMoved: true });
      return;
    }

    if (ds.mode === 'move') {
      const snappedWorld = snapping ? snapToGrid(world) : world;
      const snappedLast = snapping ? snapToGrid(ds.lastWorld) : ds.lastWorld;
      const dx = snappedWorld.x - snappedLast.x;
      const dy = snappedWorld.y - snappedLast.y;
      if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
        moveSelected(dx, dy);
        setDragState({ ...ds, lastWorld: world, hasMoved: true });
      }
      return;
    }

    if (ds.mode === 'handle' && ds.shapeId) {
      const snappedWorld = snapping ? snapToGrid(world) : world;
      const shape = shapes.find(s => s.id === ds.shapeId);
      if (!shape) return;

      // Handle vertex-based shapes
      if (ds.handleType === 'vertex') {
        if (shape instanceof LineShape || shape instanceof VectorShape) {
          (shape as any).moveEndpoint(ds.handleIndex!, snappedWorld);
        } else if (shape instanceof TriangleShape) {
          shape.moveVertex(ds.handleIndex!, snappedWorld);
        } else if (shape instanceof PolygonShape) {
          shape.moveVertex(ds.handleIndex!, snappedWorld);
        } else if (shape instanceof ParabolaShape) {
          shape.moveHandle(ds.handleType!, snappedWorld);
        }
      } else {
        shape.moveHandle(ds.handleType!, snappedWorld);
      }

      useStore.setState({ shapes: [...shapes] });
      useStore.getState().updateIntersections();
      setDragState({ ...ds, lastWorld: world, hasMoved: true });
    }
  }, [dragState, getScreenPos, setCursorWorld, viewport, setViewport, snapping, snapToGrid, moveSelected, shapes]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragState.mode !== 'none') {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
    setDragState({ mode: 'none', startScreen: { x: 0, y: 0 }, startWorld: { x: 0, y: 0 }, lastWorld: { x: 0, y: 0 } });
  }, [dragState]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const screen = getScreenPos(e as any);
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const worldBefore = cs.current.screenToWorld(screen);
    const newScale = Math.max(5, Math.min(500, viewport.scale * factor));
    const newViewport = { ...viewport, scale: newScale };
    cs.current.setViewport(newViewport);
    coordSystem.setViewport(newViewport);
    const worldAfter = cs.current.screenToWorld(screen);
    newViewport.offsetX += (worldAfter.x - worldBefore.x) * newScale;
    newViewport.offsetY -= (worldAfter.y - worldBefore.y) * newScale;
    setViewport(newViewport);
  }, [getScreenPos, viewport, setViewport, coordSystem]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const screen = getScreenPos(e as any);
    const world = cs.current.screenToWorld(screen);
    const hit = findShapeAt(world);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      shapeId: hit?.id
    });
  }, [getScreenPos, findShapeAt, setContextMenu]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDropEvent = useCallback((e: React.DragEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    handleDrop(e, rect);
  }, [handleDrop]);

  // Reset view
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.detail === 2) {
      const screen = getScreenPos(e as any);
      const world = cs.current.screenToWorld(screen);
      const hit = findShapeAt(world);
      if (!hit) {
        setViewport({ offsetX: 0, offsetY: 0, scale: 50 });
      }
    }
  }, [getScreenPos, findShapeAt, setViewport]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        cursor: dragState.mode === 'pan' ? 'grabbing' : dragState.mode === 'move' ? 'move' : 'crosshair',
        touchAction: 'none'
      }}
      onDragOver={handleDragOver}
      onDrop={handleDropEvent}
    >
      <svg
        id="math-canvas-svg"
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block', userSelect: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      >
        <GridRenderer cs={cs.current} width={dimensions.width} height={dimensions.height} />
        <AxisRenderer cs={cs.current} width={dimensions.width} height={dimensions.height} />

        {/* Shapes */}
        {shapes.map(shape => (
          <ShapeRenderer
            key={shape.id}
            shape={shape}
            cs={cs.current}
            selected={selectedIds.includes(shape.id)}
            width={dimensions.width}
            height={dimensions.height}
          />
        ))}

        {/* Manipulation handles for selected shapes */}
        {shapes
          .filter(s => selectedIds.includes(s.id) && s.data.visible)
          .map(shape => (
            <ManipulationHandles key={`h_${shape.id}`} shape={shape} cs={cs.current} />
          ))
        }

        {/* Intersection points */}
        {intersections.map((inter, i) =>
          inter.points.map((p, j) => {
            const sp = cs.current.worldToScreen(p);
            return (
              <g key={`int_${i}_${j}`}>
                <circle cx={sp.x} cy={sp.y} r={4} fill="none" stroke="var(--accent-danger)"
                  strokeWidth={1.5} />
                <circle cx={sp.x} cy={sp.y} r={1.5} fill="var(--accent-danger)" />
              </g>
            );
          })
        )}
      </svg>

      {/* Cursor coordinates */}
      <CursorCoordinates />
    </div>
  );
};

const CursorCoordinates: React.FC = () => {
  const cursorWorld = useStore(s => s.cursorWorld);
  if (!cursorWorld) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 8,
      left: 8,
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-sm)',
      padding: '3px 8px',
      fontSize: 11,
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-secondary)',
      pointerEvents: 'none',
      boxShadow: 'var(--shadow-sm)'
    }}>
      ({formatNum(cursorWorld.x, 1)}, {formatNum(cursorWorld.y, 1)})
    </div>
  );
};
