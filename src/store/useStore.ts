
import { create } from 'zustand';
import { ShapeType, Vec2, Viewport, EquationFormat, HandleType } from '../types';
import { Shape } from '../engine/shapes/Shape';
import { createShape, deserializeShape } from '../engine/GeometryEngine';
import { HistoryManager, HistoryState } from '../engine/HistoryManager';
import { CoordinateSystem } from '../engine/CoordinateSystem';
import { findIntersections, IntersectionInfo } from '../engine/IntersectionEngine';
import { LineShape } from '../engine/shapes/LineShape';
import { TriangleShape } from '../engine/shapes/TriangleShape';
import { VectorShape } from '../engine/shapes/VectorShape';
import { PolygonShape } from '../engine/shapes/PolygonShape';

interface MathSketchState {
  shapes: Shape[];
  selectedIds: string[];
  viewport: Viewport;
  coordSystem: CoordinateSystem;
  history: HistoryManager;
  equationFormat: EquationFormat;
  snapping: boolean;
  showMeasurements: boolean;
  showConstruction: boolean;
  theme: 'light' | 'dark';
  cursorWorld: Vec2 | null;
  isDragging: boolean;
  dragMode: 'none' | 'pan' | 'move' | 'handle' | 'create';
  activeHandle: { shapeId: string; handleType: HandleType; handleIndex: number } | null;
  intersections: IntersectionInfo[];
  contextMenu: { x: number; y: number; shapeId?: string } | null;
  isMobile: boolean;
  inspectorOpen: boolean;

  // Actions
  addShape: (type: ShapeType, position?: Vec2) => void;
  removeShape: (id: string) => void;
  selectShape: (id: string, multi?: boolean) => void;
  deselectAll: () => void;
  updateShape: (id: string, updater: (shape: Shape) => void) => void;
  moveSelected: (dx: number, dy: number) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  setEquationFormat: (format: EquationFormat) => void;
  toggleSnapping: () => void;
  toggleMeasurements: () => void;
  toggleConstruction: () => void;
  toggleTheme: () => void;
  setCursorWorld: (pos: Vec2 | null) => void;
  setDragging: (dragging: boolean) => void;
  setDragMode: (mode: 'none' | 'pan' | 'move' | 'handle' | 'create') => void;
  setActiveHandle: (handle: { shapeId: string; handleType: HandleType; handleIndex: number } | null) => void;
  setContextMenu: (menu: { x: number; y: number; shapeId?: string } | null) => void;
  setInspectorOpen: (open: boolean) => void;
  renameShape: (id: string, name: string) => void;
  toggleShapeVisibility: (id: string) => void;
  setShapeParam: (id: string, key: string, value: number) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  updateIntersections: () => void;

  saveWorkspace: () => string;
  loadWorkspace: (json: string) => void;
  clearWorkspace: () => void;

  getSelectedShapes: () => Shape[];
  getShapeById: (id: string) => Shape | undefined;

  initDemo: () => void;

  snapToGrid: (pos: Vec2) => Vec2;
}

export const useStore = create<MathSketchState>((set, get) => {
  const coordSystem = new CoordinateSystem();
  const history = new HistoryManager();

  return {
    shapes: [],
    selectedIds: [],
    viewport: { offsetX: 0, offsetY: 0, scale: 50 },
    coordSystem,
    history,
    equationFormat: 'standard',
    snapping: false,
    showMeasurements: true,
    showConstruction: false,
    theme: 'light',
    cursorWorld: null,
    isDragging: false,
    dragMode: 'none',
    activeHandle: null,
    intersections: [],
    contextMenu: null,
    isMobile: window.innerWidth < 768,
    inspectorOpen: true,

    addShape: (type, position) => {
      const state = get();
      state.pushHistory();
      const shape = createShape(type, position);
      set({
        shapes: [...state.shapes, shape],
        selectedIds: [shape.id]
      });
      get().updateIntersections();
    },

    removeShape: (id) => {
      const state = get();
      state.pushHistory();
      set({
        shapes: state.shapes.filter(s => s.id !== id),
        selectedIds: state.selectedIds.filter(sid => sid !== id)
      });
      get().updateIntersections();
    },

    selectShape: (id, multi = false) => {
      const state = get();
      if (multi) {
        const isSelected = state.selectedIds.includes(id);
        set({
          selectedIds: isSelected
            ? state.selectedIds.filter(sid => sid !== id)
            : [...state.selectedIds, id]
        });
      } else {
        set({ selectedIds: [id] });
      }
    },

    deselectAll: () => set({ selectedIds: [] }),

    updateShape: (id, updater) => {
      const state = get();
      const shape = state.shapes.find(s => s.id === id);
      if (shape) {
        updater(shape);
        set({ shapes: [...state.shapes] });
        get().updateIntersections();
      }
    },

    moveSelected: (dx, dy) => {
      const state = get();
      state.selectedIds.forEach(id => {
        const shape = state.shapes.find(s => s.id === id);
        if (shape) shape.move(dx, dy);
      });
      set({ shapes: [...state.shapes] });
      get().updateIntersections();
    },

    duplicateSelected: () => {
      const state = get();
      state.pushHistory();
      const newShapes: Shape[] = [];
      state.selectedIds.forEach(id => {
        const shape = state.shapes.find(s => s.id === id);
        if (shape) {
          const clone = shape.clone();
          clone.move(0.5, -0.5);
          newShapes.push(clone);
        }
      });
      set({
        shapes: [...state.shapes, ...newShapes],
        selectedIds: newShapes.map(s => s.id)
      });
    },

    deleteSelected: () => {
      const state = get();
      if (state.selectedIds.length === 0) return;
      state.pushHistory();
      set({
        shapes: state.shapes.filter(s => !state.selectedIds.includes(s.id)),
        selectedIds: []
      });
      get().updateIntersections();
    },

    setViewport: (viewport) => {
      const state = get();
      const newVP = { ...state.viewport, ...viewport };
      coordSystem.setViewport(newVP);
      set({ viewport: newVP });
    },

    setEquationFormat: (format) => set({ equationFormat: format }),
    toggleSnapping: () => set(s => ({ snapping: !s.snapping })),
    toggleMeasurements: () => set(s => ({ showMeasurements: !s.showMeasurements })),
    toggleConstruction: () => set(s => ({ showConstruction: !s.showConstruction })),
    toggleTheme: () => {
      const newTheme = get().theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      set({ theme: newTheme });
    },
    setCursorWorld: (pos) => set({ cursorWorld: pos }),
    setDragging: (dragging) => set({ isDragging: dragging }),
    setDragMode: (mode) => set({ dragMode: mode }),
    setActiveHandle: (handle) => set({ activeHandle: handle }),
    setContextMenu: (menu) => set({ contextMenu: menu }),
    setInspectorOpen: (open) => set({ inspectorOpen: open }),

    renameShape: (id, name) => {
      const state = get();
      const shape = state.shapes.find(s => s.id === id);
      if (shape) {
        shape.data.name = name;
        set({ shapes: [...state.shapes] });
      }
    },

    toggleShapeVisibility: (id) => {
      const state = get();
      const shape = state.shapes.find(s => s.id === id);
      if (shape) {
        shape.data.visible = !shape.data.visible;
        set({ shapes: [...state.shapes] });
      }
    },

    setShapeParam: (id, key, value) => {
      const state = get();
      state.pushHistory();
      const shape = state.shapes.find(s => s.id === id);
      if (!shape) return;

      const p = shape.data.params;
      // Direct param update
      if (key in p) {
        (p as any)[key] = value;
      }
      // Named parameter mapping for inspector
      else {
        const map: Record<string, string> = {
          'Center X': 'cx', 'Center Y': 'cy',
          'Radius': 'r', 'Radius X': 'rx', 'Radius Y': 'ry',
          'Width': 'w', 'Height': 'h',
          'Slope': '', 'Y-intercept': '',
          'Point 1 X': 'x1', 'Point 1 Y': 'y1',
          'Point 2 X': 'x2', 'Point 2 Y': 'y2',
          'Start X': 'x1', 'Start Y': 'y1',
          'End X': 'x2', 'End Y': 'y2',
          'A X': 'ax', 'A Y': 'ay',
          'B X': 'bx', 'B Y': 'by',
          'C X': 'cx', 'C Y': 'cy',
          'a': 'a',
          'Vertex X (h)': 'h', 'Vertex Y (k)': 'k',
          'Amplitude': 'amp', 'Frequency': 'freq',
          'Phase': 'phase', 'Vertical Shift': 'vShift',
          'X': 'x', 'Y': 'y',
          'Rotation': '__rotation',
          'Component X': '', 'Component Y': '',
        };
        const paramKey = map[key];
        if (paramKey === '__rotation') {
          shape.data.rotation = value * Math.PI / 180;
        } else if (paramKey && paramKey !== '') {
          (p as any)[paramKey] = value;
        }
      }

      set({ shapes: [...state.shapes] });
      get().updateIntersections();
    },

    pushHistory: () => {
      const state = get();
      history.push({
        shapes: state.shapes.map(s => s.serialize()),
        selectedIds: [...state.selectedIds]
      });
    },

    undo: () => {
      const state = get();
      const currentState: HistoryState = {
        shapes: state.shapes.map(s => s.serialize()),
        selectedIds: [...state.selectedIds]
      };
      const prev = history.undo(currentState);
      if (prev) {
        set({
          shapes: prev.shapes.map(d => deserializeShape(d)),
          selectedIds: prev.selectedIds
        });
        get().updateIntersections();
      }
    },

    redo: () => {
      const state = get();
      const currentState: HistoryState = {
        shapes: state.shapes.map(s => s.serialize()),
        selectedIds: [...state.selectedIds]
      };
      const next = history.redo(currentState);
      if (next) {
        set({
          shapes: next.shapes.map(d => deserializeShape(d)),
          selectedIds: next.selectedIds
        });
        get().updateIntersections();
      }
    },

    updateIntersections: () => {
      const shapes = get().shapes.filter(s => s.data.visible);
      const intersections = findIntersections(shapes);
      set({ intersections });
    },

    saveWorkspace: () => {
      const state = get();
      const data = {
        version: 1,
        viewport: state.viewport,
        shapes: state.shapes.map(s => s.serialize()),
        settings: {
          equationFormat: state.equationFormat,
          snapping: state.snapping,
          showMeasurements: state.showMeasurements,
          theme: state.theme
        }
      };
      const json = JSON.stringify(data, null, 2);
      localStorage.setItem('mathsketch_workspace', json);
      return json;
    },

    loadWorkspace: (json) => {
      try {
        const data = JSON.parse(json);
        const shapes = data.shapes.map((d: any) => deserializeShape(d));
        set({
          shapes,
          selectedIds: [],
          viewport: data.viewport || { offsetX: 0, offsetY: 0, scale: 50 },
          equationFormat: data.settings?.equationFormat || 'standard',
          snapping: data.settings?.snapping || false,
          showMeasurements: data.settings?.showMeasurements ?? true,
          theme: data.settings?.theme || 'light'
        });
        coordSystem.setViewport(data.viewport || { offsetX: 0, offsetY: 0, scale: 50 });
        if (data.settings?.theme) {
          document.documentElement.setAttribute('data-theme', data.settings.theme);
        }
        get().updateIntersections();
        history.clear();
      } catch (e) {
        console.error('Failed to load workspace:', e);
      }
    },

    clearWorkspace: () => {
      get().pushHistory();
      set({ shapes: [], selectedIds: [], intersections: [] });
      localStorage.removeItem('mathsketch_workspace');
    },

    getSelectedShapes: () => {
      const state = get();
      return state.shapes.filter(s => state.selectedIds.includes(s.id));
    },

    getShapeById: (id) => get().shapes.find(s => s.id === id),

    initDemo: () => {
      const saved = localStorage.getItem('mathsketch_workspace');
      if (saved) {
        try {
          get().loadWorkspace(saved);
          return;
        } catch {}
      }

      const { CircleShape: CS } = require('../engine/shapes/CircleShape');
      const { LineShape: LS } = require('../engine/shapes/LineShape');

      const circle = createShape('circle', { x: 2, y: 1 });
      (circle as any).r = 3;
      circle.data.name = 'Circle 1';

      const line = createShape('line', { x: 0, y: 0 });
      const ls = line as LineShape;
      ls.x1 = -4; ls.y1 = 0;
      ls.x2 = 4; ls.y2 = 4;
      line.data.name = 'Line 1';

      set({ shapes: [circle, line], selectedIds: [circle.id] });
      get().updateIntersections();
    },

    snapToGrid: (pos) => {
      const state = get();
      if (!state.snapping) return pos;
      const grid = coordSystem.getGridSpacing();
      return {
        x: Math.round(pos.x / grid.major) * grid.major,
        y: Math.round(pos.y / grid.major) * grid.major
      };
    }
  };
});
