
import { ShapeData, Vec2, BoundingBox, ShapeType, HandleType } from '../../types';

let shapeCounter = 0;

export function generateId(): string {
  return `shape_${Date.now()}_${++shapeCounter}`;
}

export function getShapeColor(type: ShapeType): string {
  const colors: Record<ShapeType, string> = {
    point: '#1a1a2e',
    line: '#059669',
    ray: '#059669',
    segment: '#059669',
    circle: '#4f6ef7',
    ellipse: '#7c3aed',
    rectangle: '#d97706',
    square: '#d97706',
    triangle: '#dc2626',
    parabola: '#0891b2',
    sine: '#c026d3',
    vector: '#65a30d',
    polygon: '#ea580c'
  };
  return colors[type] || '#4f6ef7';
}

export function getShapeName(type: ShapeType, index: number): string {
  const names: Record<ShapeType, string> = {
    point: 'Point',
    line: 'Line',
    ray: 'Ray',
    segment: 'Segment',
    circle: 'Circle',
    ellipse: 'Ellipse',
    rectangle: 'Rectangle',
    square: 'Square',
    triangle: 'Triangle',
    parabola: 'Parabola',
    sine: 'Sine Wave',
    vector: 'Vector',
    polygon: 'Polygon'
  };
  return `${names[type] || 'Shape'} ${index}`;
}

export abstract class Shape {
  data: ShapeData;

  constructor(data: ShapeData) {
    this.data = data;
  }

  get id() { return this.data.id; }
  get type() { return this.data.type; }

  abstract getEquation(format?: 'standard' | 'expanded'): string;
  abstract getEquationLatex(format?: 'standard' | 'expanded'): string;
  abstract getBounds(): BoundingBox;
  abstract getCenter(): Vec2;
  abstract getParameters(): Record<string, any>;
  abstract move(dx: number, dy: number): void;
  abstract scale(sx: number, sy: number, origin?: Vec2): void;
  abstract getHandlePositions(): { type: HandleType; pos: Vec2; cursor?: string }[];
  abstract moveHandle(handle: HandleType, worldPos: Vec2, startData?: ShapeData): void;
  abstract containsPoint(p: Vec2, tolerance?: number): boolean;
  abstract clone(): Shape;

  rotate(angle: number, _origin?: Vec2): void {
    this.data.rotation = (this.data.rotation + angle) % (Math.PI * 2);
  }

  serialize(): ShapeData {
    return JSON.parse(JSON.stringify(this.data));
  }

  getInfo(): Record<string, string | number> {
    return {};
  }

  getMathProperties(): Record<string, string | number> {
    return {};
  }

  shouldConvertTo(): ShapeType | null {
    return null;
  }
}

export function roundForDisplay(n: number, decimals = 2): number {
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function formatNum(n: number, decimals = 2): string {
  const r = roundForDisplay(n, decimals);
  if (Object.is(r, -0)) return '0';
  return r.toString();
}
