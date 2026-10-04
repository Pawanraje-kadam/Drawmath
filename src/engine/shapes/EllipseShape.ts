
import { Shape, generateId, getShapeColor, formatNum, roundForDisplay } from './Shape';
import { ShapeData, Vec2, BoundingBox, HandleType, ShapeType } from '../../types';

export class EllipseShape extends Shape {
  constructor(cx = 0, cy = 0, rx = 3, ry = 2, data?: Partial<ShapeData>) {
    super({
      id: data?.id || generateId(),
      type: 'ellipse',
      name: data?.name || 'Ellipse',
      visible: data?.visible ?? true,
      locked: data?.locked ?? false,
      color: data?.color || getShapeColor('ellipse'),
      params: { cx, cy, rx, ry, ...(data?.params || {}) },
      rotation: data?.rotation || 0
    });
  }

  get cx() { return this.data.params.cx as number; }
  set cx(v: number) { this.data.params.cx = v; }
  get cy() { return this.data.params.cy as number; }
  set cy(v: number) { this.data.params.cy = v; }
  get rx() { return this.data.params.rx as number; }
  set rx(v: number) { this.data.params.rx = Math.max(0.1, v); }
  get ry() { return this.data.params.ry as number; }
  set ry(v: number) { this.data.params.ry = Math.max(0.1, v); }

  getEquation(format: 'standard' | 'expanded' = 'standard'): string {
    if (format === 'expanded') {
      return `${formatNum(this.ry * this.ry)}(x ${this.cx >= 0 ? '−' : '+'} ${formatNum(Math.abs(this.cx))})² + ${formatNum(this.rx * this.rx)}(y ${this.cy >= 0 ? '−' : '+'} ${formatNum(Math.abs(this.cy))})² = ${formatNum(this.rx * this.rx * this.ry * this.ry)}`;
    }
    const hStr = this.cx === 0 ? 'x²' : `(x ${this.cx > 0 ? '−' : '+'} ${formatNum(Math.abs(this.cx))})²`;
    const kStr = this.cy === 0 ? 'y²' : `(y ${this.cy > 0 ? '−' : '+'} ${formatNum(Math.abs(this.cy))})²`;
    return `${hStr}/${formatNum(this.rx * this.rx)} + ${kStr}/${formatNum(this.ry * this.ry)} = 1`;
  }

  getEquationLatex(format: 'standard' | 'expanded' = 'standard'): string {
    const hPart = this.cx === 0 ? 'x' : `(x ${this.cx > 0 ? '-' : '+'} ${formatNum(Math.abs(this.cx))})`;
    const kPart = this.cy === 0 ? 'y' : `(y ${this.cy > 0 ? '-' : '+'} ${formatNum(Math.abs(this.cy))})`;
    if (format === 'expanded') {
      return `${formatNum(this.ry * this.ry)}${hPart}^2 + ${formatNum(this.rx * this.rx)}${kPart}^2 = ${formatNum(this.rx * this.rx * this.ry * this.ry)}`;
    }
    return `\\frac{${hPart}^2}{${formatNum(this.rx * this.rx)}} + \\frac{${kPart}^2}{${formatNum(this.ry * this.ry)}} = 1`;
  }

  getBounds(): BoundingBox {
    return {
      minX: this.cx - this.rx,
      minY: this.cy - this.ry,
      maxX: this.cx + this.rx,
      maxY: this.cy + this.ry
    };
  }

  getCenter(): Vec2 { return { x: this.cx, y: this.cy }; }

  getParameters() {
    return {
      'Center X': roundForDisplay(this.cx),
      'Center Y': roundForDisplay(this.cy),
      'Radius X': roundForDisplay(this.rx),
      'Radius Y': roundForDisplay(this.ry)
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
    this.rx *= Math.abs(sx);
    this.ry *= Math.abs(sy);
  }

  getHandlePositions(): { type: HandleType; pos: Vec2; cursor?: string }[] {
    return [
      { type: 'e', pos: { x: this.cx + this.rx, y: this.cy }, cursor: 'ew-resize' },
      { type: 'w', pos: { x: this.cx - this.rx, y: this.cy }, cursor: 'ew-resize' },
      { type: 'n', pos: { x: this.cx, y: this.cy + this.ry }, cursor: 'ns-resize' },
      { type: 's', pos: { x: this.cx, y: this.cy - this.ry }, cursor: 'ns-resize' },
      { type: 'ne', pos: { x: this.cx + this.rx, y: this.cy + this.ry }, cursor: 'nesw-resize' },
      { type: 'nw', pos: { x: this.cx - this.rx, y: this.cy + this.ry }, cursor: 'nwse-resize' },
      { type: 'se', pos: { x: this.cx + this.rx, y: this.cy - this.ry }, cursor: 'nwse-resize' },
      { type: 'sw', pos: { x: this.cx - this.rx, y: this.cy - this.ry }, cursor: 'nesw-resize' },
    ];
  }

  moveHandle(handle: HandleType, worldPos: Vec2) {
    switch (handle) {
      case 'e': this.rx = Math.max(0.1, worldPos.x - this.cx); break;
      case 'w': this.rx = Math.max(0.1, this.cx - worldPos.x); break;
      case 'n': this.ry = Math.max(0.1, worldPos.y - this.cy); break;
      case 's': this.ry = Math.max(0.1, this.cy - worldPos.y); break;
      case 'ne': case 'nw': case 'se': case 'sw':
        this.rx = Math.max(0.1, Math.abs(worldPos.x - this.cx));
        this.ry = Math.max(0.1, Math.abs(worldPos.y - this.cy));
        break;
    }
  }

  containsPoint(p: Vec2, tolerance = 0.2): boolean {
    const nx = (p.x - this.cx) / this.rx;
    const ny = (p.y - this.cy) / this.ry;
    const d = Math.sqrt(nx * nx + ny * ny);
    return Math.abs(d - 1) <= tolerance / Math.min(this.rx, this.ry);
  }

  clone(): EllipseShape {
    return new EllipseShape(this.cx, this.cy, this.rx, this.ry, { ...this.serialize(), id: generateId() });
  }

  shouldConvertTo(): ShapeType | null {
    if (Math.abs(this.rx - this.ry) < 0.05) return 'circle';
    return null;
  }

  getInfo() {
    const a = Math.max(this.rx, this.ry);
    const b = Math.min(this.rx, this.ry);
    const c = Math.sqrt(a * a - b * b);
    const e = c / a;
    return {
      'Center': `(${formatNum(this.cx)}, ${formatNum(this.cy)})`,
      'Semi-major': roundForDisplay(a),
      'Semi-minor': roundForDisplay(b),
      'Eccentricity': roundForDisplay(e, 4),
      'Area': roundForDisplay(Math.PI * this.rx * this.ry),
      'Perimeter ≈': roundForDisplay(Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))))
    };
  }
}
