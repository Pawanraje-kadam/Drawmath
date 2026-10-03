
import { ShapeType, ShapeData, Vec2 } from '../types';
import { Shape, getShapeColor, getShapeName } from './shapes/Shape';
import { PointShape } from './shapes/PointShape';
import { LineShape } from './shapes/LineShape';
import { CircleShape } from './shapes/CircleShape';
import { EllipseShape } from './shapes/EllipseShape';
import { RectangleShape } from './shapes/RectangleShape';
import { TriangleShape } from './shapes/TriangleShape';
import { ParabolaShape } from './shapes/ParabolaShape';
import { SineWaveShape } from './shapes/SineWaveShape';
import { VectorShape } from './shapes/VectorShape';
import { PolygonShape } from './shapes/PolygonShape';

const shapeCounters: Record<string, number> = {};

export function createShape(type: ShapeType, position?: Vec2): Shape {
  const count = (shapeCounters[type] = (shapeCounters[type] || 0) + 1);
  const name = getShapeName(type, count);
  const x = position?.x ?? 0;
  const y = position?.y ?? 0;

  switch (type) {
    case 'point':
      return new PointShape(x, y, { name, color: getShapeColor(type) });
    case 'line':
      return new LineShape(x - 3, y - 1, x + 3, y + 2, { name, color: getShapeColor(type) });
    case 'ray':
      return new LineShape(x, y, x + 4, y + 2, { name, type: 'ray', color: getShapeColor(type) });
    case 'segment':
      return new LineShape(x - 2, y, x + 2, y + 1, { name, type: 'segment', color: getShapeColor(type) });
    case 'circle':
      return new CircleShape(x, y, 2, { name, color: getShapeColor(type) });
    case 'ellipse':
      return new EllipseShape(x, y, 3, 2, { name, color: getShapeColor(type) });
    case 'rectangle':
      return new RectangleShape(x, y, 4, 3, { name, color: getShapeColor(type) });
    case 'square':
      return new RectangleShape(x, y, 3, 3, { name, type: 'square', color: getShapeColor(type) });
    case 'triangle':
      return new TriangleShape(x - 2, y - 1, x + 2, y - 1, x, y + 2, { name, color: getShapeColor(type) });
    case 'parabola':
      return new ParabolaShape(0.5, x, y, { name, color: getShapeColor(type) });
    case 'sine':
      return new SineWaveShape(2, 1, -x, y, { name, color: getShapeColor(type) });
    case 'vector':
      return new VectorShape(x, y, x + 3, y + 2, { name, color: getShapeColor(type) });
    case 'polygon':
      return new PolygonShape([
        { x: x, y: y }, { x: x + 3, y: y }, { x: x + 4, y: y + 2 },
        { x: x + 2, y: y + 3.5 }, { x: x - 1, y: y + 2 }
      ], { name, color: getShapeColor(type) });
    default:
      return new PointShape(x, y, { name });
  }
}

export function deserializeShape(data: ShapeData): Shape {
  switch (data.type) {
    case 'point':
      return new PointShape(data.params.x as number, data.params.y as number, data);
    case 'line':
    case 'ray':
    case 'segment':
      return new LineShape(data.params.x1 as number, data.params.y1 as number, data.params.x2 as number, data.params.y2 as number, data);
    case 'circle':
      return new CircleShape(data.params.cx as number, data.params.cy as number, data.params.r as number, data);
    case 'ellipse':
      return new EllipseShape(data.params.cx as number, data.params.cy as number, data.params.rx as number, data.params.ry as number, data);
    case 'rectangle':
    case 'square':
      return new RectangleShape(data.params.cx as number, data.params.cy as number, data.params.w as number, data.params.h as number, data);
    case 'triangle':
      return new TriangleShape(
        data.params.ax as number, data.params.ay as number,
        data.params.bx as number, data.params.by as number,
        data.params.cx as number, data.params.cy as number, data
      );
    case 'parabola':
      return new ParabolaShape(data.params.a as number, data.params.h as number, data.params.k as number, data);
    case 'sine':
      return new SineWaveShape(data.params.amp as number, data.params.freq as number, data.params.phase as number, data.params.vShift as number, data);
    case 'vector':
      return new VectorShape(data.params.x1 as number, data.params.y1 as number, data.params.x2 as number, data.params.y2 as number, data);
    case 'polygon':
      const flat = data.params.vertices as number[];
      const verts: Vec2[] = [];
      for (let i = 0; i < flat.length; i += 2) verts.push({ x: flat[i], y: flat[i + 1] });
      return new PolygonShape(verts, data);
    default:
      return new PointShape(0, 0, data);
  }
}
