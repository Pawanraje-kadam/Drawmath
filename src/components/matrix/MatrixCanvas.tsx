import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { GridRenderer } from '../GridRenderer';
import { AxisRenderer } from '../AxisRenderer';
import { ZoomControls } from '../ZoomControls';
import { Vec2 } from '../../types';
import { Matrix2 } from '../../engine/matrix/types';
import { transformPoint, buildTransformedGrid } from '../../engine/matrix/transform2D';
import { MATRIX_COLORS, MatrixColorKey } from './colors';

interface Props {
  /**
   * The matrix to draw (already interpolated for animation). The entered
   * matrix itself is never mutated by this component.
   */
  displayMatrix: Matrix2;
}

const E1: Vec2 = { x: 1, y: 0 };
const E2: Vec2 = { x: 0, y: 1 };

interface VectorSpec {
  key: string;
  from: Vec2;
  to: Vec2;
  colorKey: MatrixColorKey;
  label: string;
  dashed?: boolean;
  width: number;
  opacity: number;
}

/**
 * SVG workspace for Matrix Mode.
 *
 * Reuses the shared CoordinateSystem (world ↔ screen, pan, zoom) and the
 * existing GridRenderer / AxisRenderer / ZoomControls so the original grid,
 * axes and theme stay identical to Draw Mode. On top of that it renders the
 * transformed grid, basis vectors and the test vector with its output.
 */
export const MatrixCanvas: React.FC<Props> = ({ displayMatrix }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const coordSystem = useStore(s => s.coordSystem);
  const viewport = useStore(s => s.viewport);
  const setViewport = useStore(s => s.setViewport);
  const setCursorWorld = useStore(s => s.setCursorWorld);
  const resetView = useStore(s => s.resetView);
  const testVector = useStore(s => s.testVector);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);

  // Keep the shared CoordinateSystem canvas size in sync (same as Draw Mode).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        coordSystem.setCanvasSize(width, height);
        setDimensions({ width, height });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [coordSystem]);

  // Keep the shared CoordinateSystem viewport in sync with the store.
  useEffect(() => {
    coordSystem.setViewport(viewport);
  }, [coordSystem, viewport]);

  // Transformed grid, rebuilt when the shown matrix or the view changes.
  const grid = useMemo(
    () =>
      buildTransformedGrid(
        displayMatrix,
        coordSystem.getVisibleWorldBounds(),
        coordSystem.getGridSpacing()
      ),
    [displayMatrix, viewport, dimensions, coordSystem]
  );

  const getScreenPos = useCallback((e: React.PointerEvent | React.MouseEvent | React.WheelEvent): Vec2 => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 2) return;
    setIsPanning(true);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const screen = getScreenPos(e);
    setCursorWorld(coordSystem.screenToWorld(screen));
    if (!isPanning) return;
    const vp = useStore.getState().viewport;
    setViewport({
      offsetX: vp.offsetX + e.movementX,
      offsetY: vp.offsetY + e.movementY
    });
  }, [coordSystem, getScreenPos, isPanning, setCursorWorld, setViewport]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanning) {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    }
    setIsPanning(false);
  }, [isPanning]);

  // Zoom around the cursor — the CoordinateSystem keeps the cursor's world
  // point fixed, exactly like in Draw Mode.
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const screen = getScreenPos(e);
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    coordSystem.setViewport(useStore.getState().viewport);
    coordSystem.zoom(factor, screen);
    setViewport(coordSystem.getViewport());
  }, [coordSystem, getScreenPos, setViewport]);

  const handleDoubleClick = useCallback(() => {
    resetView();
  }, [resetView]);

  // --- vector geometry (world → screen through the shared CoordinateSystem) ---

  const vectors: VectorSpec[] = [
    { key: 'e1', from: { x: 0, y: 0 }, to: E1, colorKey: 'e1', label: 'e₁', dashed: true, width: 2, opacity: 0.75 },
    { key: 'e2', from: { x: 0, y: 0 }, to: E2, colorKey: 'e2', label: 'e₂', dashed: true, width: 2, opacity: 0.75 },
    { key: 'ae1', from: { x: 0, y: 0 }, to: transformPoint(displayMatrix, E1), colorKey: 'e1', label: 'A·e₁', width: 3, opacity: 1 },
    { key: 'ae2', from: { x: 0, y: 0 }, to: transformPoint(displayMatrix, E2), colorKey: 'e2', label: 'A·e₂', width: 3, opacity: 1 },
    { key: 'v', from: { x: 0, y: 0 }, to: testVector, colorKey: 'test', label: 'v', dashed: true, width: 2.5, opacity: 0.85 },
    { key: 'av', from: { x: 0, y: 0 }, to: transformPoint(displayMatrix, testVector), colorKey: 'output', label: 'A·v', width: 3, opacity: 1 }
  ];

  const renderVector = (spec: VectorSpec): React.ReactNode => {
    const color = MATRIX_COLORS[spec.colorKey];
    const from = coordSystem.worldToScreen(spec.from);
    const to = coordSystem.worldToScreen(spec.to);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);

    const labelStyle: React.CSSProperties = {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 600,
      fill: color,
      stroke: 'var(--bg-primary)',
      strokeWidth: 3,
      paintOrder: 'stroke' as const,
      pointerEvents: 'none'
    };

    if (length < 2) {
      // Zero (or near-zero) vector: a dot at the tip with its label.
      return (
        <g key={spec.key}>
          <circle cx={to.x} cy={to.y} r={4} fill={color} opacity={spec.opacity} />
          <text x={to.x + 10} y={to.y - 8} style={labelStyle}>{spec.label} = 0</text>
        </g>
      );
    }

    const labelX = to.x + (dx / length) * 18;
    const labelY = to.y + (dy / length) * 18;

    return (
      <g key={spec.key}>
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={color}
          strokeWidth={spec.width}
          strokeOpacity={spec.opacity}
          strokeDasharray={spec.dashed ? '7 5' : undefined}
          strokeLinecap="round"
          markerEnd={`url(#matrix-arrow-${spec.colorKey})`}
        />
        <text x={labelX} y={labelY + 4} textAnchor="middle" style={labelStyle}>
          {spec.label}
        </text>
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        cursor: isPanning ? 'grabbing' : 'grab',
        touchAction: 'none',
        minHeight: 0
      }}
    >
      <svg
        id="math-canvas-svg"
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block', userSelect: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        {/* Original grid + axes (identical to Draw Mode, kept subtle) */}
        <GridRenderer cs={coordSystem} width={dimensions.width} height={dimensions.height} />
        <AxisRenderer cs={coordSystem} width={dimensions.width} height={dimensions.height} />

        {/* Arrowheads, one marker per vector colour */}
        <defs>
          {(Object.keys(MATRIX_COLORS) as MatrixColorKey[]).map(key => (
            <marker
              key={key}
              id={`matrix-arrow-${key}`}
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="9"
              markerHeight="9"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill={MATRIX_COLORS[key]} />
            </marker>
          ))}
        </defs>

        {/* Transformed grid (major/minor/axes) */}
        <g aria-label="Transformed grid">
          {grid.segments.map((segment, i) => {
            const p1 = coordSystem.worldToScreen({ x: segment.x1, y: segment.y1 });
            const p2 = coordSystem.worldToScreen({ x: segment.x2, y: segment.y2 });
            const isAxis = segment.kind === 'axisX' || segment.kind === 'axisY';
            return (
              <line
                key={`tgrid_${i}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={MATRIX_COLORS.grid}
                strokeWidth={isAxis ? 2 : segment.kind === 'major' ? 1.2 : 0.8}
                strokeOpacity={isAxis ? 0.85 : segment.kind === 'major' ? 0.55 : 0.3}
                strokeLinecap="round"
              />
            );
          })}
          {grid.collapsedPoints.map((p, i) => {
            const sp = coordSystem.worldToScreen(p);
            return (
              <circle
                key={`tcollapse_${i}`}
                cx={sp.x}
                cy={sp.y}
                r={2.5}
                fill={MATRIX_COLORS.grid}
                opacity={0.75}
              />
            );
          })}
        </g>

        {/* Basis + test vectors */}
        <g aria-label="Basis and test vectors">
          {vectors.map(renderVector)}
        </g>
      </svg>

      <ZoomControls />
    </div>
  );
};
