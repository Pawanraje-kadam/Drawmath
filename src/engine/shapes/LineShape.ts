
import { Shape, generateId, getShapeColor, formatNum, roundForDisplay } from './Shape';
import { ShapeData, Vec2, BoundingBox, HandleType } from '../../types';

export class LineShape extends Shape {
  constructor(x1 = -3, y1 = -1, x2 = 3, y2 = 2, data?: Partial<ShapeData>) {
    super({
      id: data?.id || generateId(),
      type: data?.type || 'line',
      name: data?.name || 'Line',
      visible: data?.visible ?? true,
      locked: data?.locked ?? false,
      color: data?.color || getShapeColor('line'),
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

  get slope(): number | null {
    if (Math.abs(this.x2 - this.x1) < 1e-10) return null;
    return (this.y2 - this.y1) / (this.x2 - this.x1);
  }

  get yIntercept(): number | null {
    const m = this.slope;
    if (m === null) return null;
    return this.y1 - m * this.x1;
  }

  get xIntercept(): number | null {
    const m = this.slope;
    if (m === null) return this.x1;
    if (Math.abs(m) < 1e-10) return null;
    return -this.yIntercept! / m;
  }

  get angle(): number {
    return Math.atan2(this.y2 - this.y1, this.x2 - this.x1) * 180 / Math.PI;
  }

  get length(): number {
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getEquation(): string {
    const m = this.slope;
    if (m === null) return `x = ${formatNum(this.x1)}`;
    const b = this.yIntercept!;
    if (Math.abs(b) < 0.005) return `y = ${formatNum(m)}x`;
    return `y = ${formatNum(m)}x ${b >= 0 ? '+' : '−'} ${formatNum(Math.abs(b))}`;
  }

  getEquationLatex(format?: 'standard' | 'expanded'): string {
    const m = this.slope;
    if (m === null) return `x = ${formatNum(this.x1)}`;
    const b = this.yIntercept!;
    if (Math.abs(m) < 0.005) return `y = ${formatNum(b)}`;
    const mStr = Math.abs(m - 1) < 0.005 ? '' : Math.abs(m + 1) < 0.005 ? '-' : formatNum(m);
    if (Math.abs(b) < 0.005) return `y = ${mStr}x`;
    return `y = ${mStr}x ${b >= 0 ? '+' : '-'} ${formatNum(Math.abs(b))}`;
  }

  getBounds(): BoundingBox {
    return {
      minX: Math.min(this.x1, this.x2),
      minY: Math.min(this.y1, this.y2),
      maxX: Math.max(this.x1, this.x2),
      maxY: Math.max(this.y1, this.y2)
    };
  }

  getCenter(): Vec2 {
    return { x: (this.x1 + this.x2) / 2, y: (this.y1 + this.y2) / 2 };
  }

  getParameters() {
    const params: Record<string, any> = {};
    const m = this.slope;
    if (m !== null) {
      params['Slope'] = roundForDisplay(m);
      params['Y-intercept'] = roundForDisplay(this.yIntercept!);
    }
    params['Point 1 X'] = roundForDisplay(this.x1);
    params['Point 1 Y'] = roundForDisplay(this.y1);
    params['Point 2 X'] = roundForDisplay(this.x2);
    params['Point 2 Y'] = roundForDisplay(this.y2);
    return params;
  }

  move(dx: number, dy: number) {
    this.x1 += dx; this.y1 += dy;
    this.x2 += dx; this.y2 += dy;
  }

  scale(sx: number, sy: number, origin?: Vec2) {
    const o = origin || this.getCenter();
    this.x1 = o.x + (this.x1 - o.x) * sx;
    this.y1 = o.y + (this.y1 - o.y) * sy;
    this.x2 = o.x + (this.x2 - o.x) * sx;
    this.y2 = o.y + (this.y2 - o.y) * sy;
  }

  getHandlePositions(): { type: HandleType; pos: Vec2; cursor?: string }[] {
    return [
      { type: 'vertex' as any, pos: { x: this.x1, y: this.y1 }, cursor: 'move' },
      { type: 'vertex' as any, pos: { x: this.x2, y: this.y2 }, cursor: 'move' },
    ];
  }

  moveHandle(handle: HandleType, worldPos: Vec2) {
    const handles = this.getHandlePositions();
    const idx = handles.findIndex(h => {
      const dx = h.pos.x - worldPos.x;
      const dy = h.pos.y - worldPos.y;
      return true;
    });
    if (handle === 'vertex') return;
    // Use index from stored start info
  }

  moveEndpoint(index: number, worldPos: Vec2) {
    if (index === 0) {
      this.x1 = worldPos.x;
      this.y1 = worldPos.y;
    } else {
      this.x2 = worldPos.x;
      this.y2 = worldPos.y;
    }
  }

  containsPoint(p: Vec2, tolerance = 0.2): boolean {
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-10) return false;
    const dist = Math.abs(dy * p.x - dx * p.y + this.x2 * this.y1 - this.y2 * this.x1) / len;
    return dist <= tolerance;
  }

  clone(): LineShape {
    return new LineShape(this.x1, this.y1, this.x2, this.y2, { ...this.serialize(), id: generateId() });
  }

  getInfo() {
    const result: Record<string, any> = {};
    const m = this.slope;
    if (m !== null) {
      result['Slope'] = roundForDisplay(m);
      result['Angle'] = `${roundForDisplay(this.angle)}°`;
      result['Y-intercept'] = roundForDisplay(this.yIntercept!);
      const xi = this.xIntercept;
      if (xi !== null) result['X-intercept'] = roundForDisplay(xi);
    } else {
      result['Type'] = 'Vertical';
      result['X-intercept'] = roundForDisplay(this.x1);
    }
    if (this.data.type === 'segment') {
      result['Length'] = roundForDisplay(this.length);
    }
    return result;
  }
}
