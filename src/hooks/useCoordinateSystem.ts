
import { useCallback, useRef } from 'react';
import { CoordinateSystem } from '../engine/CoordinateSystem';
import { Vec2 } from '../types';

export function useCoordinateSystem() {
  const csRef = useRef(new CoordinateSystem());
  const cs = csRef.current;

  return {
    cs,
    worldToScreen: useCallback((p: Vec2) => cs.worldToScreen(p), [cs]),
    screenToWorld: useCallback((p: Vec2) => cs.screenToWorld(p), [cs]),
    worldDistToScreen: useCallback((d: number) => cs.worldDistToScreen(d), [cs]),
    screenDistToWorld: useCallback((d: number) => cs.screenDistToWorld(d), [cs]),
  };
}
