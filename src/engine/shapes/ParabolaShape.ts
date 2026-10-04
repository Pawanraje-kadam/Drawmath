
import { Shape, generateId, getShapeColor, formatNum, roundForDisplay } from './Shape';
import { ShapeData, Vec2, BoundingBox, HandleType } from '../../types';

export class ParabolaShape extends Shape {
  constructor(a = 1, h = 0, k = 0, data?: Partial<ShapeData>) {
    super({
      id: data?.id || generateId(),
      type: 'parabola',
      name: data?.name || 'Parabola',
      visible: data?.visible ?? true,
      locked: data?.locked ?? false,
      color: data?.color || getShapeColor('parabola'),
      params: { a, h, k, ...(data?.params || {}) },
      rotation: data?.rotation || 0
    });
  }

  get a() { return this.data.params.a as number; }
  set a(v: number) { this.data.params.a = v || 0.1; }
  get h() { return this.data.params.h as number; }
  set h(v: number) { this.data.params.h = v; }
  get k() { return this.data.params.k as number; }
  set k(v: number) { this.data.params.k = v; }

  get focus(): Vec2 {
    return { x: this.h, y: this.k + 1 / (4 * this.a) };
  }

  get directrix(): number {
    return this.k - 1 / (4 * this.a);
  }

  evaluate(x: number): number {
    return this.a * (x - this.h) ** 2 + this.k;
  }

  getEquation(format: 'standard' | 'expanded' = 'standard'): string {
    if (format === 'expanded') {
      const a = this.a, h = this.h, k = this.k;
      const b = -2 * a * h;
      const c = a * h * h + k;
      return `y = ${formatNum(a)}x² ${b >= 0 ? '+' : '−'} ${formatNum(Math.abs(b))}x ${c >= 0 ? '+' : '−'} ${formatNum(Math.abs(c))}`;
    }
    const aStr = Math.abs(this.a - 1) < 0.005 ? '' : Math.abs(this.a + 1) < 0.005 ? '−' : formatNum(this.a);
    const hStr = this.h === 0 ? 'x²' : `(x ${this.h > 0 ? '−' : '+'} ${formatNum(Math.abs(this.h))})²`;
    const kStr = this.k === 0 ? '' : ` ${this.k > 0 ? '+' : '−'} ${formatNum(Math.abs(this.k))}`;
    return `y = ${aStr}${hStr}${kStr}`;
  }

  getEquationLatex(format: 'standard' | 'expanded' = 'standard'): string {
    if (format === 'expanded') {
      const a = this.a, h = this.h, k = this.k;
      const b = roundForDisplay(-2 * a * h);
      const c = roundForDisplay(a * h * h + k);
      const aStr = Math.abs(a - 1) < 0.005 ? '' : Math.abs(a + 1) < 0.005 ? '-' : formatNum(a);
      return `y = ${aStr}x^2 ${b >= 0 ? '+' : '-'} ${formatNum(Math.abs(b))}x ${c >= 0 ? '+' : '-'} ${formatNum(Math.abs(c))}`;
    }
    const aStr = Math.abs(this.a - 1) < 0.005 ? '' : Math.abs(this.a + 1) < 0.005 ? '-' : formatNum(this.a);
    const hPart = this.h === 0 ? 'x' : `(x ${this.h > 0 ? '-' : '+'} ${formatNum(Math.abs(this.h))})`;
    const kStr = this.k === 0 ? '' : ` ${this.k > 0 ? '+' : '-'} ${formatNum(Math.abs(this.k))}`;
    return `y = ${aStr}${hPart}^2${kStr}`;
  }

  getBounds(): BoundingBox {
    const range = 5;
    return {
      minX: this.h - range,
      minY: Math.min(this.k, this.evaluate(this.h - range), this.evaluate(this.h + range)),
      maxX: this.h + range,
      maxY: Math.max(this.k, this.evaluate(this.h - range), this.evaluate(this.h + range))
    };
  }

  getCenter(): Vec2 { return { x: this.h, y: this.k }; }

  getParameters() {
    return {
      'a': roundForDisplay(this.a),
      'Vertex X (h)': roundForDisplay(this.h),
      'Vertex Y (k)': roundForDisplay(this.k)
    };
  }

  move(dx: number, dy: number) {
    this.h += dx;
    this.k += dy;
  }

  scale(sx: number, sy: number, origin?: Vec2) {
    const o = origin || this.getCenter();
    this.h = o.x + (this.h - o.x) * sx;
    this.k = o.y + (this.k - o.y) * sy;
    if (Math.abs(sx) > 0.001) {
      this.a = this.a * sy / (sx * sx);
    }
  }

  getHandlePositions(): { type: HandleType; pos: Vec2; cursor?: string }[] {
    return [
      { type: 'vertex', pos: { x: this.h, y: this.k }, cursor: 'move' },
      { type: 'n', pos: { x: this.h + 1, y: this.evaluate(this.h + 1) }, cursor: 'pointer' },
      { type: 's', pos: { x: this.h - 1, y: this.evaluate(this.h - 1) }, cursor: 'pointer' },
    ];
  }

  moveHandle(handle: HandleType, worldPos: Vec2) {
    if (handle === 'vertex') {
      this.h = worldPos.x;
      this.k = worldPos.y;
    } else {
      const dx = worldPos.x - this.h;
      if (Math.abs(dx) > 0.1) {
        this.a = (worldPos.y - this.k) / (dx * dx);
      }
    }
  }

  containsPoint(p: Vec2, tolerance = 0.3): boolean {
    const y = this.evaluate(p.x);
    return Math.abs(p.y - y) <= tolerance;
  }

  clone(): ParabolaShape {
    return new ParabolaShape(this.a, this.h, this.k, { ...this.serialize(), id: generateId() });
  }

  getInfo() {
    const f = this.focus;
    return {
      'Vertex': `(${formatNum(this.h)}, ${formatNum(this.k)})`,
      'a': roundForDisplay(this.a),
      'Opens': this.a > 0 ? 'Upward' : 'Downward',
      'Axis of Symmetry': `x = ${formatNum(this.h)}`,
      'Focus': `(${formatNum(f.x)}, ${formatNum(f.y)})`,
      'Directrix': `y = ${formatNum(this.directrix)}`
    };
  }
}
