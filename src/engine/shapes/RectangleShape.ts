
import { Shape, generateId, getShapeColor, formatNum, roundForDisplay } from './Shape';
import { ShapeData, Vec2, BoundingBox, HandleType, ShapeType } from '../../types';

export class RectangleShape extends Shape {
  constructor(cx = 0, cy = 0, w = 4, h = 3, data?: Partial<ShapeData>) {
    super({
      id: data?.id || generateId(),
      type: data?.type || 'rectangle',
      name: data?.name || 'Rectangle',
      visible: data?.visible ?? true,
      locked: data?.locked ?? false,
      color: data?.color || getShapeColor('rectangle'),
      params: { cx, cy, w, h, ...(data?.params || {}) },
      rotation: data?.rotation || 0
    });
  }

  get cx() { return this.data.params.cx as number; }
  set cx(v: number) { this.data.params.cx = v; }
  get cy() { return this.data.params.cy as number; }
  set cy(v: number) { this.data.params.cy = v; }
  get w() { return this.data.params.w as number; }
  set w(v: number) { this.data.params.w = Math.max(0.1, v); }
  get h() { return this.data.params.h as number; }
  set h(v: number) { this.data.params.h = Math.max(0.1, v); }

  get halfW() { return this.w / 2; }
  get halfH() { return this.h / 2; }

  getVertices(): Vec2[] {
    const hw = this.halfW, hh = this.halfH;
    const cos = Math.cos(this.data.rotation);
    const sin = Math.sin(this.data.rotation);
    const corners = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh }
    ];
    return corners.map(c => ({
      x: this.cx + c.x * cos - c.y * sin,
      y: this.cy + c.x * sin + c.y * cos
    }));
  }

  getEquation(): string {
    if (Math.abs(this.data.rotation) < 0.01) {
      return `|x ${this.cx >= 0 ? '−' : '+'} ${formatNum(Math.abs(this.cx))}| ≤ ${formatNum(this.halfW)}, |y ${this.cy >= 0 ? '−' : '+'} ${formatNum(Math.abs(this.cy))}| ≤ ${formatNum(this.halfH)}`;
    }
    return `Rectangle at (${formatNum(this.cx)}, ${formatNum(this.cy)}), ${formatNum(this.w)}×${formatNum(this.h)}, θ=${formatNum(this.data.rotation * 180 / Math.PI)}°`;
  }

  getEquationLatex(): string {
    if (Math.abs(this.data.rotation) < 0.01) {
      const hPart = this.cx === 0 ? '|x|' : `|x ${this.cx > 0 ? '-' : '+'} ${formatNum(Math.abs(this.cx))}|`;
      const kPart = this.cy === 0 ? '|y|' : `|y ${this.cy > 0 ? '-' : '+'} ${formatNum(Math.abs(this.cy))}|`;
      return `${hPart} \\leq ${formatNum(this.halfW)}, \\quad ${kPart} \\leq ${formatNum(this.halfH)}`;
    }
    return `\\text{Rect}(${formatNum(this.cx)},\\, ${formatNum(this.cy)}),\\; ${formatNum(this.w)} \\times ${formatNum(this.h)},\\; \\theta = ${formatNum(this.data.rotation * 180 / Math.PI)}°`;
  }

  getBounds(): BoundingBox {
    const verts = this.getVertices();
    return {
      minX: Math.min(...verts.map(v => v.x)),
      minY: Math.min(...verts.map(v => v.y)),
      maxX: Math.max(...verts.map(v => v.x)),
      maxY: Math.max(...verts.map(v => v.y))
    };
  }

  getCenter(): Vec2 { return { x: this.cx, y: this.cy }; }

  getParameters() {
    return {
      'Center X': roundForDisplay(this.cx),
      'Center Y': roundForDisplay(this.cy),
      'Width': roundForDisplay(this.w),
      'Height': roundForDisplay(this.h),
      'Rotation': roundForDisplay(this.data.rotation * 180 / Math.PI)
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
    this.w *= Math.abs(sx);
    this.h *= Math.abs(sy);
  }

  getHandlePositions(): { type: HandleType; pos: Vec2; cursor?: string }[] {
    const verts = this.getVertices();
    return [
      { type: 'sw', pos: verts[0], cursor: 'nesw-resize' },
      { type: 'se', pos: verts[1], cursor: 'nwse-resize' },
      { type: 'ne', pos: verts[2], cursor: 'nesw-resize' },
      { type: 'nw', pos: verts[3], cursor: 'nwse-resize' },
      { type: 'e', pos: { x: (verts[1].x + verts[2].x) / 2, y: (verts[1].y + verts[2].y) / 2 }, cursor: 'ew-resize' },
      { type: 'w', pos: { x: (verts[0].x + verts[3].x) / 2, y: (verts[0].y + verts[3].y) / 2 }, cursor: 'ew-resize' },
      { type: 'n', pos: { x: (verts[2].x + verts[3].x) / 2, y: (verts[2].y + verts[3].y) / 2 }, cursor: 'ns-resize' },
      { type: 's', pos: { x: (verts[0].x + verts[1].x) / 2, y: (verts[0].y + verts[1].y) / 2 }, cursor: 'ns-resize' },
    ];
  }

  moveHandle(handle: HandleType, worldPos: Vec2) {
    const cos = Math.cos(-this.data.rotation);
    const sin = Math.sin(-this.data.rotation);
    const localX = (worldPos.x - this.cx) * cos - (worldPos.y - this.cy) * sin;
    const localY = (worldPos.x - this.cx) * sin + (worldPos.y - this.cy) * cos;

    switch (handle) {
      case 'e': this.w = Math.max(0.1, Math.abs(localX) * 2); break;
      case 'w': this.w = Math.max(0.1, Math.abs(localX) * 2); break;
      case 'n': this.h = Math.max(0.1, Math.abs(localY) * 2); break;
      case 's': this.h = Math.max(0.1, Math.abs(localY) * 2); break;
      case 'ne': case 'nw': case 'se': case 'sw':
        this.w = Math.max(0.1, Math.abs(localX) * 2);
        this.h = Math.max(0.1, Math.abs(localY) * 2);
        break;
    }
  }

  containsPoint(p: Vec2, tolerance = 0.2): boolean {
    const cos = Math.cos(-this.data.rotation);
    const sin = Math.sin(-this.data.rotation);
    const dx = p.x - this.cx;
    const dy = p.y - this.cy;
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    const hw = this.halfW, hh = this.halfH;
    const onLeft = Math.abs(lx + hw) < tolerance && Math.abs(ly) <= hh + tolerance;
    const onRight = Math.abs(lx - hw) < tolerance && Math.abs(ly) <= hh + tolerance;
    const onTop = Math.abs(ly - hh) < tolerance && Math.abs(lx) <= hw + tolerance;
    const onBottom = Math.abs(ly + hh) < tolerance && Math.abs(lx) <= hw + tolerance;
    return onLeft || onRight || onTop || onBottom;
  }

  clone(): RectangleShape {
    return new RectangleShape(this.cx, this.cy, this.w, this.h, { ...this.serialize(), id: generateId() });
  }

  shouldConvertTo(): ShapeType | null {
    if (Math.abs(this.w - this.h) < 0.05) return 'square';
    return null;
  }

  getInfo() {
    return {
      'Center': `(${formatNum(this.cx)}, ${formatNum(this.cy)})`,
      'Width': roundForDisplay(this.w),
      'Height': roundForDisplay(this.h),
      'Area': roundForDisplay(this.w * this.h),
      'Perimeter': roundForDisplay(2 * (this.w + this.h)),
      'Diagonal': roundForDisplay(Math.sqrt(this.w * this.w + this.h * this.h))
    };
  }
}
