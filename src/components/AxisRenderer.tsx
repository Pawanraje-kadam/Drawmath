import React from 'react';
import { CoordinateSystem } from '../engine/CoordinateSystem';

interface Props {
  cs: CoordinateSystem;
  width: number;
  height: number;
}

export const AxisRenderer: React.FC<Props> = ({ cs, width, height }) => {
  const origin = cs.worldToScreen({ x: 0, y: 0 });
  const grid = cs.getGridSpacing();
  const bounds = cs.getVisibleWorldBounds();
  const labels: React.ReactNode[] = [];

  const majorStart = Math.floor(bounds.minX / grid.major) * grid.major;
  const majorEndX = Math.ceil(bounds.maxX / grid.major) * grid.major;
  const majorStartY = Math.floor(bounds.minY / grid.major) * grid.major;
  const majorEndY = Math.ceil(bounds.maxY / grid.major) * grid.major;

  // X axis labels
  for (let x = majorStart; x <= majorEndX; x += grid.major) {
    if (Math.abs(x) < 1e-10) continue;
    const sx = cs.worldToScreen({ x, y: 0 }).x;
    if (sx >= 20 && sx <= width - 20) {
      const labelY = Math.min(Math.max(origin.y + 18, 14), height - 4);
      const labelText = grid.major >= 1 ? Math.round(x).toString() : x.toFixed(1);
      labels.push(
        <text key={`lx_${x}`} x={sx} y={labelY}
          textAnchor="middle" fontSize={10} fill="var(--text-tertiary)"
          fontFamily="var(--font-mono)" fontWeight={400}>
          {labelText}
        </text>
      );
      labels.push(
        <line key={`tx_${x}`} x1={sx} y1={origin.y - 3} x2={sx} y2={origin.y + 3}
          stroke="var(--axis-color)" strokeWidth={1} />
      );
    }
  }

  // Y axis labels
  for (let y = majorStartY; y <= majorEndY; y += grid.major) {
    if (Math.abs(y) < 1e-10) continue;
    const sy = cs.worldToScreen({ x: 0, y }).y;
    if (sy >= 14 && sy <= height - 14) {
      const labelX = Math.min(Math.max(origin.x - 8, 24), width - 8);
      const labelText = grid.major >= 1 ? Math.round(y).toString() : y.toFixed(1);
      labels.push(
        <text key={`ly_${y}`} x={labelX} y={sy + 3}
          textAnchor="end" fontSize={10} fill="var(--text-tertiary)"
          fontFamily="var(--font-mono)" fontWeight={400}>
          {labelText}
        </text>
      );
      labels.push(
        <line key={`ty_${y}`} x1={origin.x - 3} y1={sy} x2={origin.x + 3} y2={sy}
          stroke="var(--axis-color)" strokeWidth={1} />
      );
    }
  }

  return (
    <g className="axes">
      {/* X axis */}
      {origin.y >= 0 && origin.y <= height && (
        <line x1={0} y1={origin.y} x2={width} y2={origin.y}
          stroke="var(--axis-color)" strokeWidth={1.5} />
      )}
      {/* Y axis */}
      {origin.x >= 0 && origin.x <= width && (
        <line x1={origin.x} y1={0} x2={origin.x} y2={height}
          stroke="var(--axis-color)" strokeWidth={1.5} />
      )}
      {/* Arrow heads */}
      {origin.y >= 0 && origin.y <= height && (
        <polygon points={`${width - 1},${origin.y} ${width - 8},${origin.y - 4} ${width - 8},${origin.y + 4}`}
          fill="var(--axis-color)" />
      )}
      {origin.x >= 0 && origin.x <= width && (
        <polygon points={`${origin.x},1 ${origin.x - 4},8 ${origin.x + 4},8`}
          fill="var(--axis-color)" />
      )}
      {/* Origin label */}
      {origin.x >= 10 && origin.x <= width - 10 && origin.y >= 10 && origin.y <= height - 10 && (
        <text x={origin.x - 10} y={origin.y + 16}
          fontSize={10} fill="var(--text-tertiary)" fontFamily="var(--font-mono)">
          O
        </text>
      )}
      {labels}
    </g>
  );
};
