
import { Shape, generateId, getShapeColor, formatNum, roundForDisplay } from './Shape';
import { ShapeData, Vec2, BoundingBox, HandleType } from '../../types';

export class TriangleShape extends Shape {
  constructor(
    ax = 0, ay = 0, bx = 4, by = 0, cx = 2, cy = 3,
    data?: Partial<ShapeData>
  ) {
    super({
      id: data?.id || generateId(),
      type: 'triangle',
      name: data?.name || 'Triangle',
      visible: data?.visible ?? true,
      locked: data?.locked ?? false,
      color: data?.color || getShapeColor('triangle'),
      params: { ax, ay, bx, by, cx, cy, ...(data?.params || {}) },
      rotation: data?.rotation || 0
    });
  }

  get ax() { return this.data.params.ax as number; }
  set ax(v: number) { this.data.params.ax = v; }
  get ay() { return this.data.params.ay as number; }
  set ay(v: number) { this.data.params.ay = v; }
  get bx() { return this.data.params.bx as number; }
  set bx(v: number) { this.data.params.bx = v; }
  get by() { return this.data.params.by as number; }
  set by(v: number) { this.data.params.by = v; }
  get tcx() { return this.data.params.cx as number; }
  set tcx(v: number) { this.data.params.cx = v; }
  get tcy() { return this.data.params.cy as number; }
  set tcy(v: number) { this.data.params.cy = v; }

  getVertices(): Vec2[] {
    return [
      { x: this.ax, y: this.ay },
      { x: this.bx, y: this.by },
      { x: this.tcx, y: this.tcy }
    ];
  }

  getSideLengths(): number[] {
    const v = this.getVertices();
    const d = (a: Vec2, b: Vec2) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    return [d(v[0], v[1]), d(v[1], v[2]), d(v[2], v[0])];
  }

  getArea(): number {
    return Math.abs(
      (this.ax * (this.by - this.tcy) + this.bx * (this.tcy - this.ay) + this.tcx * (this.ay - this.by)) / 2
    );
  }

  getCentroid(): Vec2 {
    return {
      x: (this.ax + this.bx + this.tcx) / 3,
      y: (this.ay + this.by + this.tcy) / 3
    };
  }

  getAngles(): number[] {
    const v = this.getVertices();
    const angles: number[] = [];
    for (let i = 0; i < 3; i++) {
      const a = v[i];
      const b = v[(i + 1) % 3];
      const c = v[(i + 2) % 3];
      const ab = { x: b.x - a.x, y: b.y - a.y };
      const ac = { x: c.x - a.x, y: c.y - a.y };
      const dot = ab.x * ac.x + ab.y * ac.y;
      const mag = Math.sqrt(ab.x ** 2 + ab.y ** 2) * Math.sqrt(ac.x ** 2 + ac.y ** 2);
      angles.push(Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180 / Math.PI);
    }
    return angles;
  }

  getSideEquation(idx: number): string {
    const v = this.getVertices();
    const p1 = v[idx];
    const p2 = v[(idx + 1) % 3];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (Math.abs(dx) < 1e-10) return `x = ${formatNum(p1.x)}`;
    const m = dy / dx;
    const b = p1.y - m * p1.x;
    if (Math.abs(b) < 0.005) return `y = ${formatNum(m)}x`;
    return `y = ${formatNum(m)}x ${b >= 0 ? '+' : '−'} ${formatNum(Math.abs(b))}`;
  }

  getEquation(): string {
    const v = this.getVertices();
    return `△ A(${formatNum(v[0].x)},${formatNum(v[0].y)}) B(${formatNum(v[1].x)},${formatNum(v[1].y)}) C(${formatNum(v[2].x)},${formatNum(v[2].y)})`;
  }

  getEquationLatex(): string {
    const v = this.getVertices();
    return `\\triangle\\; A(${formatNum(v[0].x)},${formatNum(v[0].y)})\\; B(${formatNum(v[1].x)},${formatNum(v[1].y)})\\; C(${formatNum(v[2].x)},${formatNum(v[2].y)})`;
  }

  getBounds(): BoundingBox {
    const v = this.getVertices();
    return {
      minX: Math.min(...v.map(p => p.x)),
      minY: Math.min(...v.map(p => p.y)),
      maxX: Math.max(...v.map(p => p.x)),
      maxY: Math.max(...v.map(p => p.y))
    };
  }

  getCenter(): Vec2 { return this.getCentroid(); }

  getParameters() {
    return {
      'A X': roundForDisplay(this.ax),
      'A Y': roundForDisplay(this.ay),
      'B X': roundForDisplay(this.bx),
      'B Y': roundForDisplay(this.by),
      'C X': roundForDisplay(this.tcx),
      'C Y': roundForDisplay(this.tcy)
    };
  }

  move(dx: number, dy: number) {
    this.ax += dx; this.ay += dy;
    this.bx += dx; this.by += dy;
    this.tcx += dx; this.tcy += dy;
  }

  scale(sx: number, sy: number, origin?: Vec2) {
    const o = origin || this.getCenter();
    this.ax = o.x + (this.ax - o.x) * sx;
    this.ay = o.y + (this.ay - o.y) * sy;
    this.bx = o.x + (this.bx - o.x) * sx;
    this.by = o.y + (this.by - o.y) * sy;
    this.tcx = o.x + (this.tcx - o.x) * sx;
    this.tcy = o.y + (this.tcy - o.y) * sy;
  }

  getHandlePositions(): { type: HandleType; pos: Vec2; cursor?: string }[] {
    return this.getVertices().map((v, _i) => ({
      type: 'vertex' as HandleType,
      pos: v,
      cursor: 'move'
    }));
  }

  moveHandle(_handle: HandleType, _worldPos: Vec2) {}

  moveVertex(index: number, worldPos: Vec2) {
    if (index === 0) { this.ax = worldPos.x; this.ay = worldPos.y; }
    else if (index === 1) { this.bx = worldPos.x; this.by = worldPos.y; }
    else { this.tcx = worldPos.x; this.tcy = worldPos.y; }
  }

  containsPoint(p: Vec2, tolerance = 0.2): boolean {
    const verts = this.getVertices();
    for (let i = 0; i < 3; i++) {
      const a = verts[i], b = verts[(i + 1) % 3];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1e-10) continue;
      const dist = Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
      const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len);
      if (dist <= tolerance && t >= -tolerance / len && t <= 1 + tolerance / len) return true;
    }
    return false;
  }

  clone(): TriangleShape {
    return new TriangleShape(this.ax, this.ay, this.bx, this.by, this.tcx, this.tcy, { ...this.serialize(), id: generateId() });
  }

  getInfo() {
    const sides = this.getSideLengths();
    const angles = this.getAngles();
    const centroid = this.getCentroid();
    return {
      'Side AB': roundForDisplay(sides[0]),
      'Side BC': roundForDisplay(sides[1]),
      'Side CA': roundForDisplay(sides[2]),
      'Angle A': `${roundForDisplay(angles[0])}°`,
      'Angle B': `${roundForDisplay(angles[1])}°`,
      'Angle C': `${roundForDisplay(angles[2])}°`,
      'Area': roundForDisplay(this.getArea()),
      'Perimeter': roundForDisplay(sides[0] + sides[1] + sides[2]),
      'Centroid': `(${formatNum(centroid.x)}, ${formatNum(centroid.y)})`
    };
  }
}
