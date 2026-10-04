
import { Shape, generateId, getShapeColor, formatNum, roundForDisplay } from './Shape';
import { ShapeData, Vec2, BoundingBox, HandleType } from '../../types';

export class PointShape extends Shape {
  constructor(x: number = 0, y: number = 0, data?: Partial<ShapeData>) {
    super({
      id: data?.id || generateId(),
      type: 'point',
      name: data?.name || 'Point',
      visible: data?.visible ?? true,
      locked: data?.locked ?? false,
      color: data?.color || getShapeColor('point'),
      params: { x, y, ...(data?.params || {}) },
      rotation: data?.rotation || 0
    });
  }

  get x() { return this.data.params.x as number; }
  set x(v: number) { this.data.params.x = v; }
  get y() { return this.data.params.y as number; }
  set y(v: number) { this.data.params.y = v; }

  getEquation(): string {
    return `(${formatNum(this.x)}, ${formatNum(this.y)})`;
  }

  getEquationLatex(): string {
    return `(${formatNum(this.x)},\\, ${formatNum(this.y)})`;
  }

  getBounds(): BoundingBox {
    return { minX: this.x - 0.1, minY: this.y - 0.1, maxX: this.x + 0.1, maxY: this.y + 0.1 };
  }

  getCenter(): Vec2 { return { x: this.x, y: this.y }; }

  getParameters() {
    return { x: roundForDisplay(this.x), y: roundForDisplay(this.y) };
  }

  move(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
  }

  scale() {}

  getHandlePositions() {
    return [];
  }

  moveHandle() {}

  containsPoint(p: Vec2, tolerance = 0.3): boolean {
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= tolerance;
  }

  clone(): PointShape {
    return new PointShape(this.x, this.y, { ...this.serialize(), id: generateId() });
  }

  getInfo() {
    return {
      'X': roundForDisplay(this.x),
      'Y': roundForDisplay(this.y)
    };
  }
}
