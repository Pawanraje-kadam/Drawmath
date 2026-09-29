export type ShapeType =
  | 'point'
  | 'line'
  | 'ray'
  | 'segment'
  | 'circle'
  | 'ellipse'
  | 'rectangle'
  | 'square'
  | 'triangle'
  | 'parabola'
  | 'sine'
  | 'vector'
  | 'polygon';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Viewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type HandleType =
  | 'nw' | 'ne' | 'sw' | 'se'
  | 'n' | 's' | 'e' | 'w'
  | 'rotate'
  | 'vertex';

export interface ShapeData {
  id: string;
  type: ShapeType;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  params: Record<string, number | number[]>;
  rotation: number;
}

export type EquationFormat = 'standard' | 'expanded';

export interface IntersectionResult {
  shapeA: string;
  shapeB: string;
  points: Vec2[];
}

export interface HistoryEntry {
  shapes: ShapeData[];
  selectedIds: string[];
  timestamp: number;
}
