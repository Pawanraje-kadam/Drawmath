
import React from 'react';
import { Shape } from '../engine/shapes/Shape';
import { PointShape } from '../engine/shapes/PointShape';
import { CircleShape } from '../engine/shapes/CircleShape';
import { EllipseShape } from '../engine/shapes/EllipseShape';
import { LineShape } from '../engine/shapes/LineShape';
import { RectangleShape } from '../engine/shapes/RectangleShape';
import { TriangleShape } from '../engine/shapes/TriangleShape';
import { ParabolaShape } from '../engine/shapes/ParabolaShape';
import { SineWaveShape } from '../engine/shapes/SineWaveShape';
import { VectorShape } from '../engine/shapes/VectorShape';
import { PolygonShape } from '../engine/shapes/PolygonShape';
import { CoordinateSystem } from '../engine/CoordinateSystem';

interface Props {
  shape: Shape;
  cs: CoordinateSystem;
  selected: boolean;
  width: number;
  height: number;
}

export const ShapeRenderer: React.FC<Props> = ({ shape, cs, selected, width, height }) => {
  if (!shape.data.visible) return null;

  const color = shape.data.color;
  const strokeW = selected ? 2.5 : 2;
  const opacity = 1;

  if (shape instanceof PointShape) {
    const p = cs.worldToScreen({ x: shape.x, y: shape.y });
    return (
      <g>
        <circle cx={p.x} cy={p.y} r={selected ? 6 : 5} fill={color} opacity={opacity} />
        <circle cx={p.x} cy={p.y} r={2} fill="white" />
      </g>
    );
  }

  if (shape instanceof CircleShape) {
    const center = cs.worldToScreen({ x: shape.cx, y: shape.cy });
    const r = cs.worldDistToScreen(shape.r);
    return (
      <circle cx={center.x} cy={center.y} r={r}
        fill="none" stroke={color} strokeWidth={strokeW} opacity={opacity} />
    );
  }

  if (shape instanceof EllipseShape) {
    const center = cs.worldToScreen({ x: shape.cx, y: shape.cy });
    const rx = cs.worldDistToScreen(shape.rx);
    const ry = cs.worldDistToScreen(shape.ry);
    return (
      <ellipse cx={center.x} cy={center.y} rx={rx} ry={ry}
        fill="none" stroke={color} strokeWidth={strokeW} opacity={opacity}
        transform={shape.data.rotation ? `rotate(${-shape.data.rotation * 180 / Math.PI} ${center.x} ${center.y})` : undefined} />
    );
  }

  if (shape instanceof LineShape) {
    const isSegment = shape.data.type === 'segment';
    const isRay = shape.data.type === 'ray';

    if (isSegment) {
      const p1 = cs.worldToScreen({ x: shape.x1, y: shape.y1 });
      const p2 = cs.worldToScreen({ x: shape.x2, y: shape.y2 });
      return (
        <g>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={color} strokeWidth={strokeW} opacity={opacity} />
          <circle cx={p1.x} cy={p1.y} r={3} fill={color} />
          <circle cx={p2.x} cy={p2.y} r={3} fill={color} />
        </g>
      );
    }

    // Extend line to canvas bounds
    const dx = shape.x2 - shape.x1;
    const dy = shape.y2 - shape.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-10) return null;
    const t = 100 / len;
    const extP1 = cs.worldToScreen({
      x: isRay ? shape.x1 : shape.x1 - dx * t,
      y: isRay ? shape.y1 : shape.y1 - dy * t
    });
    const extP2 = cs.worldToScreen({ x: shape.x1 + dx * t, y: shape.y1 + dy * t });

    return (
      <g>
        <line x1={extP1.x} y1={extP1.y} x2={extP2.x} y2={extP2.y}
          stroke={color} strokeWidth={strokeW} opacity={opacity} />
        {isRay && (() => {
          const p1 = cs.worldToScreen({ x: shape.x1, y: shape.y1 });
          return <circle cx={p1.x} cy={p1.y} r={3} fill={color} />;
        })()}
      </g>
    );
  }

  if (shape instanceof RectangleShape) {
    const verts = shape.getVertices();
    const screenVerts = verts.map(v => cs.worldToScreen(v));
    const d = screenVerts.map((v, i) => (i === 0 ? `M ${v.x} ${v.y}` : `L ${v.x} ${v.y}`)).join(' ') + ' Z';
    return (
      <path d={d} fill="none" stroke={color} strokeWidth={strokeW} opacity={opacity} />
    );
  }

  if (shape instanceof TriangleShape) {
    const verts = shape.getVertices();
    const screenVerts = verts.map(v => cs.worldToScreen(v));
    const d = screenVerts.map((v, i) => (i === 0 ? `M ${v.x} ${v.y}` : `L ${v.x} ${v.y}`)).join(' ') + ' Z';
    return (
      <g>
        <path d={d} fill="none" stroke={color} strokeWidth={strokeW} opacity={opacity} />
        {screenVerts.map((v, i) => (
          <circle key={i} cx={v.x} cy={v.y} r={3} fill={color} />
        ))}
      </g>
    );
  }

  if (shape instanceof ParabolaShape) {
    const bounds = cs.getVisibleWorldBounds();
    const step = (bounds.maxX - bounds.minX) / 200;
    const points: string[] = [];
    let started = false;

    for (let x = bounds.minX - 1; x <= bounds.maxX + 1; x += step) {
      const y = shape.evaluate(x);
      if (y >= bounds.minY - 5 && y <= bounds.maxY + 5) {
        const p = cs.worldToScreen({ x, y });
        if (!started) {
          points.push(`M ${p.x} ${p.y}`);
          started = true;
        } else {
          points.push(`L ${p.x} ${p.y}`);
        }
      } else {
        started = false;
      }
    }

    // Vertex dot
    const vertex = cs.worldToScreen({ x: shape.h, y: shape.k });

    return (
      <g>
        <path d={points.join(' ')} fill="none" stroke={color} strokeWidth={strokeW} opacity={opacity} />
        <circle cx={vertex.x} cy={vertex.y} r={3} fill={color} />
      </g>
    );
  }

  if (shape instanceof SineWaveShape) {
    const bounds = cs.getVisibleWorldBounds();
    const step = (bounds.maxX - bounds.minX) / 300;
    const points: string[] = [];
    let started = false;

    for (let x = bounds.minX - 1; x <= bounds.maxX + 1; x += step) {
      const y = shape.evaluate(x);
      const p = cs.worldToScreen({ x, y });
      if (!started) {
        points.push(`M ${p.x} ${p.y}`);
        started = true;
      } else {
        points.push(`L ${p.x} ${p.y}`);
      }
    }

    return (
      <path d={points.join(' ')} fill="none" stroke={color} strokeWidth={strokeW} opacity={opacity} />
    );
  }

  if (shape instanceof VectorShape) {
    const p1 = cs.worldToScreen({ x: shape.x1, y: shape.y1 });
    const p2 = cs.worldToScreen({ x: shape.x2, y: shape.y2 });
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return null;
    const arrowSize = 10;
    const nx = dx / len, ny = dy / len;
    const ax = p2.x - arrowSize * nx + arrowSize * 0.4 * ny;
    const ay = p2.y - arrowSize * ny - arrowSize * 0.4 * nx;
    const bx = p2.x - arrowSize * nx - arrowSize * 0.4 * ny;
    const by = p2.y - arrowSize * ny + arrowSize * 0.4 * nx;

    return (
      <g>
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          stroke={color} strokeWidth={strokeW} opacity={opacity} />
        <polygon points={`${p2.x},${p2.y} ${ax},${ay} ${bx},${by}`} fill={color} />
        <circle cx={p1.x} cy={p1.y} r={3} fill={color} />
      </g>
    );
  }

  if (shape instanceof PolygonShape) {
    const verts = shape.getVertices();
    const screenVerts = verts.map(v => cs.worldToScreen(v));
    const d = screenVerts.map((v, i) => (i === 0 ? `M ${v.x} ${v.y}` : `L ${v.x} ${v.y}`)).join(' ') + ' Z';
    return (
      <g>
        <path d={d} fill="none" stroke={color} strokeWidth={strokeW} opacity={opacity} />
        {screenVerts.map((v, i) => (
          <circle key={i} cx={v.x} cy={v.y} r={3} fill={color} />
        ))}
      </g>
    );
  }

  return null;
};
