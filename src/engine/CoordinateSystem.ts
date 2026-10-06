import { Vec2, Viewport } from '../types';

/** Zoom level used when the view is reset (pixels per world unit). */
export const DEFAULT_SCALE = 50;
/** Smallest / largest allowed zoom level. */
export const MIN_SCALE = 5;
export const MAX_SCALE = 500;
/** Multiplier applied by each zoom-in / zoom-out step. */
export const ZOOM_STEP = 1.25;

export const clampScale = (scale: number): number =>
  Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

export class CoordinateSystem {
  private canvasWidth: number = 800;
  private canvasHeight: number = 600;
  private viewport: Viewport = { offsetX: 0, offsetY: 0, scale: DEFAULT_SCALE };

  setCanvasSize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  setViewport(viewport: Viewport) {
    this.viewport = { ...viewport };
  }

  getViewport(): Viewport {
    return { ...this.viewport };
  }

  get originX(): number {
    return this.canvasWidth / 2 + this.viewport.offsetX;
  }

  get originY(): number {
    return this.canvasHeight / 2 + this.viewport.offsetY;
  }

  get scale(): number {
    return this.viewport.scale;
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  /** Centre of the visible canvas, in screen pixels. */
  getCanvasCenter(): Vec2 {
    return { x: this.canvasWidth / 2, y: this.canvasHeight / 2 };
  }

  canZoomIn(): boolean {
    return this.viewport.scale < MAX_SCALE - 1e-6;
  }

  canZoomOut(): boolean {
    return this.viewport.scale > MIN_SCALE + 1e-6;
  }

  worldToScreen(world: Vec2): Vec2 {
    return {
      x: this.originX + world.x * this.viewport.scale,
      y: this.originY - world.y * this.viewport.scale
    };
  }

  screenToWorld(screen: Vec2): Vec2 {
    return {
      x: (screen.x - this.originX) / this.viewport.scale,
      y: (this.originY - screen.y) / this.viewport.scale
    };
  }

  worldDistToScreen(d: number): number {
    return d * this.viewport.scale;
  }

  screenDistToWorld(d: number): number {
    return d / this.viewport.scale;
  }

  getVisibleWorldBounds() {
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({ x: this.canvasWidth, y: this.canvasHeight });
    return {
      minX: topLeft.x,
      maxX: bottomRight.x,
      minY: bottomRight.y,
      maxY: topLeft.y
    };
  }

  getGridSpacing(): { major: number; minor: number } {
    const pixelsPerUnit = this.viewport.scale;
    const targetMajorPx = 80;
    const rawSpacing = targetMajorPx / pixelsPerUnit;
    const pow = Math.pow(10, Math.floor(Math.log10(rawSpacing)));
    const norm = rawSpacing / pow;
    let major: number;
    if (norm < 1.5) major = 1 * pow;
    else if (norm < 3.5) major = 2 * pow;
    else if (norm < 7.5) major = 5 * pow;
    else major = 10 * pow;
    return { major, minor: major / 5 };
  }

  /** Zoom by `factor` around `center` (screen pixels), keeping that point fixed. */
  zoom(factor: number, center?: Vec2) {
    const newScale = clampScale(this.viewport.scale * factor);
    const centerPoint = center ?? this.getCanvasCenter();
    const worldBefore = this.screenToWorld(centerPoint);
    this.viewport.scale = newScale;
    const worldAfter = this.screenToWorld(centerPoint);
    this.viewport.offsetX += (worldAfter.x - worldBefore.x) * newScale;
    this.viewport.offsetY -= (worldAfter.y - worldBefore.y) * newScale;
  }

  /** Zoom a step in/out around the centre of the canvas. */
  zoomAtCenter(factor: number) {
    this.zoom(factor, this.getCanvasCenter());
  }

  /** Jump to an absolute zoom level, keeping the canvas centre fixed. */
  zoomToScale(scale: number) {
    this.zoom(clampScale(scale) / this.viewport.scale, this.getCanvasCenter());
  }

  pan(dx: number, dy: number) {
    this.viewport.offsetX += dx;
    this.viewport.offsetY += dy;
  }

  reset() {
    this.viewport = { offsetX: 0, offsetY: 0, scale: DEFAULT_SCALE };
  }

  fitBounds(minX: number, minY: number, maxX: number, maxY: number, padding = 1.2) {
    const worldW = (maxX - minX) * padding;
    const worldH = (maxY - minY) * padding;
    if (worldW <= 0 || worldH <= 0) {
      this.reset();
      return;
    }
    const scaleX = this.canvasWidth / worldW;
    const scaleY = this.canvasHeight / worldH;
    this.viewport.scale = clampScale(Math.min(scaleX, scaleY));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    this.viewport.offsetX = -centerX * this.viewport.scale;
    this.viewport.offsetY = centerY * this.viewport.scale;
  }
}
