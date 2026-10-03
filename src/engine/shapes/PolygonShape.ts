
import { Shape, generateId, getShapeColor, formatNum, roundForDisplay } from './Shape';
import { ShapeData, Vec2, BoundingBox, HandleType } from '../../types';

export class PolygonShape extends Shape {
  constructor(vertices?: Vec2[], data?: Partial<ShapeData>) {
    const verts = vertices || [
      { x: 0, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 2 }, { x: 2, y: 3.5 }, { x: -1, y: 2 }
    ];
    const flatVerts: number[] = [];
    verts.forEach(v => { flatVerts.push(v.x, v.y); });

    super({
      id: data?.id || generateId(),
      type: 'polygon',
      name: data?.name || 'Polygon',
      visible: data?.visible ?? true,
      locked: data?.locked ?? false,
      color: data?.color || getShapeColor('polygon'),
      params: { vertices: flatVerts, n: verts.length, ...(data?.params || {}) },
      rotation: data?.rotation || 0
    });
  }

  getVertices(): Vec2[] {
    const flat = this.data.params.vertices as number[];
    const verts: Vec2[] = [];
    for (let i = 0; i < flat.length; i += 2) {
      verts.push({ x: flat[i], y: flat[i + 1] });
    }
    return verts;
  }

  setVertices(verts: Vec2[]) {
    const flat: number[] = [];
    verts.forEach(v => { flat.push(v.x, v.y); });
    this.data.params.vertices = flat;
    this.data.params.n = verts.length;
  }

  getArea(): number {
    const v = this.getVertices();
    let area = 0;
    for (let i = 0; i < v.length; i++) {
      const j = (i + 1) % v.length;
      area += v[i].x * v[j].y - v[j].x * v[i].y;
    }
    return Math.abs(area / 2);
  }

  getPerimeter(): number {
    const v = this.getVertices();
    let p = 0;
    for (let i = 0; i < v.length; i++) {
      const j = (i + 1) % v.length;
      p += Math.sqrt((v[j].x - v[i].x) ** 2 + (v[j].y - v[i].y) ** 2);
    }
    return p;
  }

  getEquation(): string {
    const v = this.getVertices();
    return `Polygon: ${v.map(p => `(${formatNum(p.x)},${formatNum(p.y)})`).join(' ')}`;
  }

  getEquationLatex(): string {
    const v = this.getVertices();
    const n = v.length;
    return `\\text{${n}-gon}:\\; ${v.map(p => `(${formatNum(p.x)},${formatNum(p.y)})`).join('\\;')}`;
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

  getCenter(): Vec2 {
    const v = this.getVertices();
    const cx = v.reduce((s, p) => s + p.x, 0) / v.length;
    const cy = v.reduce((s, p) => s + p.y, 0) / v.length;
    return { x: cx, y: cy };
  }

  getParameters() {
    const v = this.getVertices();
    const params: Record<string, any> = { 'Sides': v.length };
    v.forEach((p, i) => {
      params[`V${i + 1} X`] = roundForDisplay(p.x);
      params[`V${i + 1} Y`] = roundForDisplay(p.y);
    });
    return params;
  }

  move(dx: number, dy: number) {
    const v = this.getVertices().map(p => ({ x: p.x + dx, y: p.y + dy }));
    this.setVertices(v);
  }

  scale(sx: number, sy: number, origin?: Vec2) {
    const o = origin || this.getCenter();
    const v = this.getVertices().map(p => ({
      x: o.x + (p.x - o.x) * sx,
      y: o.y + (p.y - o.y) * sy
    }));
    this.setVertices(v);
  }

  getHandlePositions(): { type: HandleType; pos: Vec2; cursor?: string }[] {
    return this.getVertices().map(v => ({
      type: 'vertex' as HandleType,
      pos: v,
      cursor: 'move'
    }));
  }

  moveHandle() {}

  moveVertex(index: number, worldPos: Vec2) {
    const v = this.getVertices();
    if (index >= 0 && index < v.length) {
      v[index] = worldPos;
      this.setVertices(v);
    }
  }

  containsPoint(p: Vec2, tolerance = 0.2): boolean {
    const v = this.getVertices();
    for (let i = 0; i < v.length; i++) {
      const a = v[i], b = v[(i + 1) % v.length];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1e-10) continue;
      const dist = Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
      const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len);
      if (dist <= tolerance && t >= -0.05 && t <= 1.05) return true;
    }
    return false;
  }

  clone(): PolygonShape {
    return new PolygonShape(this.getVertices(), { ...this.serialize(), id: generateId() });
  }

  getInfo() {
    return {
      'Sides': (this.data.params.n as number),
      'Area': roundForDisplay(this.getArea()),
      'Perimeter': roundForDisplay(this.getPerimeter()),
      'Center': `(${formatNum(this.getCenter().x)}, ${formatNum(this.getCenter().y)})`
    };
  }
}
