
import { Shape, generateId, getShapeColor, formatNum, roundForDisplay } from './Shape';
import { ShapeData, Vec2, BoundingBox, HandleType } from '../../types';

export class SineWaveShape extends Shape {
  constructor(amp = 2, freq = 1, phase = 0, vShift = 0, data?: Partial<ShapeData>) {
    super({
      id: data?.id || generateId(),
      type: 'sine',
      name: data?.name || 'Sine Wave',
      visible: data?.visible ?? true,
      locked: data?.locked ?? false,
      color: data?.color || getShapeColor('sine'),
      params: { amp, freq, phase, vShift, ...(data?.params || {}) },
      rotation: data?.rotation || 0
    });
  }

  get amp() { return this.data.params.amp as number; }
  set amp(v: number) { this.data.params.amp = v; }
  get freq() { return this.data.params.freq as number; }
  set freq(v: number) { this.data.params.freq = v || 0.1; }
  get phase() { return this.data.params.phase as number; }
  set phase(v: number) { this.data.params.phase = v; }
  get vShift() { return this.data.params.vShift as number; }
  set vShift(v: number) { this.data.params.vShift = v; }

  evaluate(x: number): number {
    return this.amp * Math.sin(this.freq * x + this.phase) + this.vShift;
  }

  getEquation(): string {
    const aStr = Math.abs(this.amp - 1) < 0.005 ? '' : formatNum(this.amp);
    const fStr = Math.abs(this.freq - 1) < 0.005 ? 'x' : `${formatNum(this.freq)}x`;
    const pStr = this.phase === 0 ? '' : ` ${this.phase > 0 ? '+' : '−'} ${formatNum(Math.abs(this.phase))}`;
    const vStr = this.vShift === 0 ? '' : ` ${this.vShift > 0 ? '+' : '−'} ${formatNum(Math.abs(this.vShift))}`;
    return `y = ${aStr}sin(${fStr}${pStr})${vStr}`;
  }

  getEquationLatex(): string {
    const aStr = Math.abs(this.amp - 1) < 0.005 ? '' : formatNum(this.amp);
    const fStr = Math.abs(this.freq - 1) < 0.005 ? 'x' : `${formatNum(this.freq)}x`;
    const pStr = this.phase === 0 ? '' : ` ${this.phase > 0 ? '+' : '-'} ${formatNum(Math.abs(this.phase))}`;
    const vStr = this.vShift === 0 ? '' : ` ${this.vShift > 0 ? '+' : '-'} ${formatNum(Math.abs(this.vShift))}`;
    return `y = ${aStr}\\sin(${fStr}${pStr})${vStr}`;
  }

  getBounds(): BoundingBox {
    return {
      minX: -10, maxX: 10,
      minY: this.vShift - Math.abs(this.amp) - 1,
      maxY: this.vShift + Math.abs(this.amp) + 1
    };
  }

  getCenter(): Vec2 { return { x: -this.phase / this.freq, y: this.vShift }; }

  getParameters() {
    return {
      'Amplitude': roundForDisplay(this.amp),
      'Frequency': roundForDisplay(this.freq),
      'Phase': roundForDisplay(this.phase),
      'Vertical Shift': roundForDisplay(this.vShift),
      'Period': roundForDisplay(2 * Math.PI / Math.abs(this.freq))
    };
  }

  move(dx: number, dy: number) {
    this.phase -= dx * this.freq;
    this.vShift += dy;
  }

  scale(sx: number, sy: number) {
    this.amp *= sy;
    this.freq /= sx;
  }

  getHandlePositions(): { type: HandleType; pos: Vec2; cursor?: string }[] {
    const peakX = (Math.PI / 2 - this.phase) / this.freq;
    return [
      { type: 'n', pos: { x: peakX, y: this.vShift + this.amp }, cursor: 'ns-resize' },
      { type: 's', pos: { x: peakX + Math.PI / this.freq, y: this.vShift - this.amp }, cursor: 'ns-resize' },
    ];
  }

  moveHandle(handle: HandleType, worldPos: Vec2) {
    if (handle === 'n') {
      this.amp = Math.max(0.1, worldPos.y - this.vShift);
    } else if (handle === 's') {
      this.amp = Math.max(0.1, this.vShift - worldPos.y);
    }
  }

  containsPoint(p: Vec2, tolerance = 0.3): boolean {
    const y = this.evaluate(p.x);
    return Math.abs(p.y - y) <= tolerance;
  }

  clone(): SineWaveShape {
    return new SineWaveShape(this.amp, this.freq, this.phase, this.vShift, { ...this.serialize(), id: generateId() });
  }

  getInfo() {
    return {
      'Amplitude': roundForDisplay(this.amp),
      'Frequency': roundForDisplay(this.freq),
      'Period': roundForDisplay(2 * Math.PI / Math.abs(this.freq)),
      'Phase Shift': roundForDisplay(-this.phase / this.freq),
      'Vertical Shift': roundForDisplay(this.vShift)
    };
  }
}
