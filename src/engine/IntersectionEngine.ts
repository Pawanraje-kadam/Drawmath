
import { Vec2 } from '../types';
import { Shape } from './shapes/Shape';
import { CircleShape } from './shapes/CircleShape';
import { LineShape } from './shapes/LineShape';
import { EllipseShape } from './shapes/EllipseShape';

export interface IntersectionInfo {
  shapeAId: string;
  shapeBId: string;
  shapeAName: string;
  shapeBName: string;
  points: Vec2[];
}

export function findIntersections(shapes: Shape[]): IntersectionInfo[] {
  const results: IntersectionInfo[] = [];

  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i], b = shapes[j];
      const points = intersect(a, b);
      if (points.length > 0) {
        results.push({
          shapeAId: a.id,
          shapeBId: b.id,
          shapeAName: a.data.name,
          shapeBName: b.data.name,
          points
        });
      }
    }
  }

  return results;
}

function intersect(a: Shape, b: Shape): Vec2[] {
  if (a instanceof LineShape && b instanceof LineShape) return lineLineIntersection(a, b);
  if (a instanceof CircleShape && b instanceof LineShape) return circleLineIntersection(a, b);
  if (a instanceof LineShape && b instanceof CircleShape) return circleLineIntersection(b, a);
  if (a instanceof CircleShape && b instanceof CircleShape) return circleCircleIntersection(a, b);
  return [];
}

function lineLineIntersection(l1: LineShape, l2: LineShape): Vec2[] {
  const x1 = l1.x1, y1 = l1.y1, x2 = l1.x2, y2 = l1.y2;
  const x3 = l2.x1, y3 = l2.y1, x4 = l2.x2, y4 = l2.y2;
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return [];
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  return [{ x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) }];
}

function circleLineIntersection(c: CircleShape, l: LineShape): Vec2[] {
  const dx = l.x2 - l.x1;
  const dy = l.y2 - l.y1;
  const fx = l.x1 - c.cx;
  const fy = l.y1 - c.cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const cc = fx * fx + fy * fy - c.r * c.r;
  const disc = b * b - 4 * a * cc;

  if (disc < -1e-10) return [];

  const points: Vec2[] = [];
  if (Math.abs(disc) < 1e-10) {
    const t = -b / (2 * a);
    points.push({ x: l.x1 + t * dx, y: l.y1 + t * dy });
  } else {
    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);
    points.push({ x: l.x1 + t1 * dx, y: l.y1 + t1 * dy });
    points.push({ x: l.x1 + t2 * dx, y: l.y1 + t2 * dy });
  }
  return points;
}

function circleCircleIntersection(c1: CircleShape, c2: CircleShape): Vec2[] {
  const dx = c2.cx - c1.cx;
  const dy = c2.cy - c1.cy;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d > c1.r + c2.r + 1e-10) return [];
  if (d < Math.abs(c1.r - c2.r) - 1e-10) return [];
  if (d < 1e-10) return [];

  const a = (c1.r * c1.r - c2.r * c2.r + d * d) / (2 * d);
  const h2 = c1.r * c1.r - a * a;
  if (h2 < -1e-10) return [];
  const h = Math.sqrt(Math.max(0, h2));

  const mx = c1.cx + a * dx / d;
  const my = c1.cy + a * dy / d;

  if (Math.abs(h) < 1e-10) {
    return [{ x: mx, y: my }];
  }

  return [
    { x: mx + h * dy / d, y: my - h * dx / d },
    { x: mx - h * dy / d, y: my + h * dx / d }
  ];
}
