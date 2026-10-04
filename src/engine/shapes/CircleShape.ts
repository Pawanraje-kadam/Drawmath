
import { Shape, generateId, getShapeColor, formatNum, roundForDisplay } from './Shape';
import { ShapeData, Vec2, BoundingBox, HandleType, ShapeType } from '../../types';

export class CircleShape extends Shape {
  constructor(cx: number = 0, cy: number = 0, r: number = 2, data?: Partial<ShapeData>) {
    super({
      id: data?.id || generateId(),
      type: data?.type || 'circle',
      name: data?.name || 'Circle',
      visible: data?.visible ?? true,
      locked: data?.locked ?? false,
      color: data?.color || getShapeColor('circle'),
      params: { cx, cy, r, ...(data?.params || {}) },
      rotation: data?.rotation || 0
    });
    if (!this.data.params.cx) this.data.params.cx = cx;
    if (!this.data.params.cy) this.data.params.cy = cy;
    if (!this.data.params.r) this.data.params.r = r;
  }

  get cx() { return this.data.params.cx as number; }
  set cx(v: number) { this.data.params.cx = v; }
  get cy() { return this.data.params.cy as number; }
  set cy(v: number) { this.data.params.cy = v; }
  get r() { return this.data.params.r as number; }
  set r(v: number) { this.data.params.r = Math.max(0.1, v); }

  getEquation(format: 'standard' | 'expanded' = 'standard'): string {
    if (format === 'expanded') {
      const h = this.cx, k = this.cy, r = this.r;
      const D = roundForDisplay(-2 * h);
      const E = roundForDisplay(-2 * k);
      const F = roundForDisplay(h * h + k * k - r * r);
      return `x² + y² ${D >= 0 ? '+' : '−'} ${formatNum(Math.abs(D))}x ${E >= 0 ? '+' : '−'} ${formatNum(Math.abs(E))}y ${F >= 0 ? '+' : '−'} ${formatNum(Math.abs(F))} = 0`;
    }
    const hStr = this.cx === 0 ? 'x²' : `(x ${this.cx > 0 ? '−' : '+'} ${formatNum(Math.abs(this.cx))})²`;
    const kStr = this.cy === 0 ? 'y²' : `(y ${this.cy > 0 ? '−' : '+'} ${formatNum(Math.abs(this.cy))})²`;
    return `${hStr} + ${kStr} = ${formatNum(this.r * this.r)}`;
  }

  getEquationLatex(format: 'standard' | 'expanded' = 'standard'): string {
    if (format === 'expanded') {
      const h = this.cx, k = this.cy, r = this.r;
      const D = roundForDisplay(-2 * h);
      const E = roundForDisplay(-2 * k);
      const F = roundForDisplay(h * h + k * k - r * r);
      return `x^2 + y^2 ${D >= 0 ? '+' : '-'} ${formatNum(Math.abs(D))}x ${E >= 0 ? '+' : '-'} ${formatNum(Math.abs(E))}y ${F >= 0 ? '+' : '-'} ${formatNum(Math.abs(F))} = 0`;
    }
    const hPart = this.cx === 0 ? 'x' : `(x ${this.cx > 0 ? '-' : '+'} ${formatNum(Math.abs(this.cx))})`;
    const kPart = this.cy === 0 ? 'y' : `(y ${this.cy > 0 ? '-' : '+'} ${formatNum(Math.abs(this.cy))})`;
    return `${hPart}^2 + ${kPart}^2 = ${formatNum(this.r * this.r)}`;
  }

  getBounds(): BoundingBox {
    return {
      minX: this.cx - this.r,
      minY: this.cy - this.r,
      maxX: this.cx + this.r,
      maxY: this.cy + this.r
    };
  }

  getCenter(): Vec2 { return { x: this.cx, y: this.cy }; }

  getParameters() {
    return {
      'Center X': roundForDisplay(this.cx),
      'Center Y': roundForDisplay(this.cy),
      'Radius': roundForDisplay(this.r)
    };
  }

  move(dx: number, dy: number) {
    this.cx += dx;
    this.cy += dy;
  }

  scale(sx: number, sy: number, origin?: Vec2) {
    const o = origin || this.getCenter();
    this.cx = o.x + (this.cx - o.x) * sx;
    this.cy = o.y + (this.cy - o.y) * sy;
    if (Math.abs(sx - sy) < 0.001) {
      this.r *= Math.abs(sx);
    } else {
      this.r *= Math.abs((sx + sy) / 2);
    }
  }

  getHandlePositions(): { type: HandleType; pos: Vec2; cursor?: string }[] {
    return [
      { type: 'e', pos: { x: this.cx + this.r, y: this.cy }, cursor: 'ew-resize' },
      { type: 'w', pos: { x: this.cx - this.r, y: this.cy }, cursor: 'ew-resize' },
      { type: 'n', pos: { x: this.cx, y: this.cy + this.r }, cursor: 'ns-resize' },
      { type: 's', pos: { x: this.cx, y: this.cy - this.r }, cursor: 'ns-resize' },
      { type: 'ne', pos: { x: this.cx + this.r * 0.707, y: this.cy + this.r * 0.707 }, cursor: 'nesw-resize' },
      { type: 'nw', pos: { x: this.cx - this.r * 0.707, y: this.cy + this.r * 0.707 }, cursor: 'nwse-resize' },
      { type: 'se', pos: { x: this.cx + this.r * 0.707, y: this.cy - this.r * 0.707 }, cursor: 'nwse-resize' },
      { type: 'sw', pos: { x: this.cx - this.r * 0.707, y: this.cy - this.r * 0.707 }, cursor: 'nesw-resize' },
    ];
  }

  moveHandle(handle: HandleType, worldPos: Vec2) {
    const dx = worldPos.x - this.cx;
    const dy = worldPos.y - this.cy;
    if (handle === 'e' || handle === 'w') {
      this.r = Math.max(0.1, Math.abs(dx));
    } else if (handle === 'n' || handle === 's') {
      this.r = Math.max(0.1, Math.abs(dy));
    } else {
      this.r = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
    }
  }

  containsPoint(p: Vec2, tolerance = 0.2): boolean {
    const dx = p.x - this.cx;
    const dy = p.y - this.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return Math.abs(dist - this.r) <= tolerance;
  }

  clone(): CircleShape {
    return new CircleShape(this.cx, this.cy, this.r, { ...this.serialize(), id: generateId() });
  }

  getInfo() {
    return {
      'Center': `(${formatNum(this.cx)}, ${formatNum(this.cy)})`,
      'Radius': roundForDisplay(this.r),
      'Diameter': roundForDisplay(this.r * 2),
      'Area': roundForDisplay(Math.PI * this.r * this.r),
      'Circumference': roundForDisplay(2 * Math.PI * this.r)
    };
  }

  getMathProperties() {
    return {
      'center': `(${formatNum(this.cx)}, ${formatNum(this.cy)})`,
      'r': formatNum(this.r),
      'r²': formatNum(this.r * this.r),
    };
  }
}
