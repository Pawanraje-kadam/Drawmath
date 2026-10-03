
import { Shape, generateId, getShapeColor, formatNum, roundForDisplay } from './Shape';
import { ShapeData, Vec2, BoundingBox, HandleType } from '../../types';

export class VectorShape extends Shape {
  constructor(x1 = 0, y1 = 0, x2 = 3, y2 = 2, data?: Partial<ShapeData>) {
    super({
      id: data?.id || generateId(),
      type: 'vector',
      name: data?.name || 'Vector',
      visible: data?.visible ?? true,
      locked: data?.locked ?? false,
      color: data?.color || getShapeColor('vector'),
      params: { x1, y1, x2, y2, ...(data?.params || {}) },
      rotation: data?.rotation || 0
    });
  }

  get x1() { return this.data.params.x1 as number; }
  set x1(v: number) { this.data.params.x1 = v; }
  get y1() { return this.data.params.y1 as number; }
  set y1(v: number) { this.data.params.y1 = v; }
  get x2() { return this.data.params.x2 as number; }
  set x2(v: number) { this.data.params.x2 = v; }
  get y2() { return this.data.params.y2 as number; }
  set y2(v: number) { this.data.params.y2 = v; }

  get dx() { return this.x2 - this.x1; }
  get dy() { return this.y2 - this.y1; }
  get magnitude() { return Math.sqrt(this.dx * this.dx + this.dy * this.dy); }
  get angle() { return Math.atan2(this.dy, this.dx) * 180 / Math.PI; }

  getEquation(): string {
    return `⟨${formatNum(this.dx)}, ${formatNum(this.dy)}⟩`;
  }

  getEquationLatex(): string {
    return `\\vec{v} = \\langle ${formatNum(this.dx)},\\, ${formatNum(this.dy)} \\rangle`;
  }

  getBounds(): BoundingBox {
    return {
      minX: Math.min(this.x1, this.x2),
      minY: Math.min(this.y1, this.y2),
      maxX: Math.max(this.x1, this.x2),
      maxY: Math.max(this.y1, this.y2)
    };
  }

  getCenter(): Vec2 { return { x: (this.x1 + this.x2) / 2, y: (this.y1 + this.y2) / 2 }; }

  getParameters() {
    return {
      'Start X': roundForDisplay(this.x1),
      'Start Y': roundForDisplay(this.y1),
      'End X': roundForDisplay(this.x2),
      'End Y': roundForDisplay(this.y2),
      'Component X': roundForDisplay(this.dx),
      'Component Y': roundForDisplay(this.dy)
    };
  }

  move(dx: number, dy: number) {
    this.x1 += dx; this.y1 += dy;
    this.x2 += dx; this.y2 += dy;
  }

  scale(sx: number, sy: number, origin?: Vec2) {
    const o = origin || { x: this.x1, y: this.y1 };
    this.x1 = o.x + (this.x1 - o.x) * sx;
    this.y1 = o.y + (this.y1 - o.y) * sy;
    this.x2 = o.x + (this.x2 - o.x) * sx;
    this.y2 = o.y + (this.y2 - o.y) * sy;
  }

  getHandlePositions(): { type: HandleType; pos: Vec2; cursor?: string }[] {
    return [
      { type: 'vertex', pos: { x: this.x1, y: this.y1 }, cursor: 'move' },
      { type: 'vertex', pos: { x: this.x2, y: this.y2 }, cursor: 'move' },
    ];
  }

  moveHandle() {}

  moveEndpoint(index: number, worldPos: Vec2) {
    if (index === 0) { this.x1 = worldPos.x; this.y1 = worldPos.y; }
    else { this.x2 = worldPos.x; this.y2 = worldPos.y; }
  }

  containsPoint(p: Vec2, tolerance = 0.25): boolean {
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-10) return false;
    const dist = Math.abs(dy * p.x - dx * p.y + this.x2 * this.y1 - this.y2 * this.x1) / len;
    const t = ((p.x - this.x1) * dx + (p.y - this.y1) * dy) / (len * len);
    return dist <= tolerance && t >= -0.05 && t <= 1.05;
  }

  clone(): VectorShape {
    return new VectorShape(this.x1, this.y1, this.x2, this.y2, { ...this.serialize(), id: generateId() });
  }

  getInfo() {
    return {
      'Start': `(${formatNum(this.x1)}, ${formatNum(this.y1)})`,
      'End': `(${formatNum(this.x2)}, ${formatNum(this.y2)})`,
      'Components': `⟨${formatNum(this.dx)}, ${formatNum(this.dy)}⟩`,
      'Magnitude': roundForDisplay(this.magnitude),
      'Direction': `${roundForDisplay(this.angle)}°`
    };
  }
}
