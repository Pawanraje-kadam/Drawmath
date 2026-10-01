
import React from 'react';
import { CoordinateSystem } from '../engine/CoordinateSystem';
import { formatNum } from '../engine/shapes/Shape';

interface Props {
  cs: CoordinateSystem;
  width: number;
  height: number;
}

export const GridRenderer: React.FC<Props> = ({ cs, width, height }) => {
  const grid = cs.getGridSpacing();
  const bounds = cs.getVisibleWorldBounds();
  const elements: React.ReactNode[] = [];

  // Minor grid
  const minorStart = Math.floor(bounds.minX / grid.minor) * grid.minor;
  const minorEndX = Math.ceil(bounds.maxX / grid.minor) * grid.minor;
  const minorStartY = Math.floor(bounds.minY / grid.minor) * grid.minor;
  const minorEndY = Math.ceil(bounds.maxY / grid.minor) * grid.minor;

  for (let x = minorStart; x <= minorEndX; x += grid.minor) {
    const sx = cs.worldToScreen({ x, y: 0 }).x;
    if (sx >= -1 && sx <= width + 1) {
      const isMajor = Math.abs(x % grid.major) < grid.minor * 0.1;
      if (!isMajor) {
        elements.push(
          <line key={`mgx_${x}`} x1={sx} y1={0} x2={sx} y2={height}
            stroke="var(--grid-minor)" strokeWidth={0.5} />
        );
      }
    }
  }

  for (let y = minorStartY; y <= minorEndY; y += grid.minor) {
    const sy = cs.worldToScreen({ x: 0, y }).y;
    if (sy >= -1 && sy <= height + 1) {
      const isMajor = Math.abs(y % grid.major) < grid.minor * 0.1;
      if (!isMajor) {
        elements.push(
          <line key={`mgy_${y}`} x1={0} y1={sy} x2={width} y2={sy}
            stroke="var(--grid-minor)" strokeWidth={0.5} />
        );
      }
    }
  }

  // Major grid
  const majorStart = Math.floor(bounds.minX / grid.major) * grid.major;
  const majorEndX = Math.ceil(bounds.maxX / grid.major) * grid.major;
  const majorStartY = Math.floor(bounds.minY / grid.major) * grid.major;
  const majorEndY = Math.ceil(bounds.maxY / grid.major) * grid.major;

  for (let x = majorStart; x <= majorEndX; x += grid.major) {
    if (Math.abs(x) < 1e-10) continue;
    const sx = cs.worldToScreen({ x, y: 0 }).x;
    if (sx >= -1 && sx <= width + 1) {
      elements.push(
        <line key={`Mgx_${x}`} x1={sx} y1={0} x2={sx} y2={height}
          stroke="var(--grid-major)" strokeWidth={0.5} />
      );
    }
  }

  for (let y = majorStartY; y <= majorEndY; y += grid.major) {
    if (Math.abs(y) < 1e-10) continue;
    const sy = cs.worldToScreen({ x: 0, y }).y;
    if (sy >= -1 && sy <= height + 1) {
      elements.push(
        <line key={`Mgy_${y}`} x1={0} y1={sy} x2={width} y2={sy}
          stroke="var(--grid-major)" strokeWidth={0.5} />
      );
    }
  }

  return <g className="grid">{elements}</g>;
};
