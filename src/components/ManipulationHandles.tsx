
import React from 'react';
import { Shape } from '../engine/shapes/Shape';
import { CoordinateSystem } from '../engine/CoordinateSystem';

interface Props {
  shape: Shape;
  cs: CoordinateSystem;
}

export const ManipulationHandles: React.FC<Props> = ({ shape, cs }) => {
  const handles = shape.getHandlePositions();
  const bounds = shape.getBounds();
  const topLeft = cs.worldToScreen({ x: bounds.minX, y: bounds.maxY });
  const bottomRight = cs.worldToScreen({ x: bounds.maxX, y: bounds.minY });
  const padding = 8;

  return (
    <g className="manipulation-handles">
      {/* Bounding box */}
      <rect
        x={topLeft.x - padding}
        y={topLeft.y - padding}
        width={bottomRight.x - topLeft.x + padding * 2}
        height={bottomRight.y - topLeft.y + padding * 2}
        fill="none"
        stroke="var(--accent-primary)"
        strokeWidth={1}
        strokeDasharray="4 3"
        rx={2}
        opacity={0.6}
      />

      {/* Handles */}
      {handles.map((h, i) => {
        const sp = cs.worldToScreen(h.pos);
        return (
          <g key={i}>
            <rect
              x={sp.x - 5}
              y={sp.y - 5}
              width={10}
              height={10}
              rx={2}
              fill="var(--bg-secondary)"
              stroke="var(--accent-primary)"
              strokeWidth={1.5}
              style={{ cursor: h.cursor || 'pointer' }}
            />
          </g>
        );
      })}

      {/* Center dot */}
      {(() => {
        const center = cs.worldToScreen(shape.getCenter());
        return (
          <circle cx={center.x} cy={center.y} r={3}
            fill="var(--accent-primary)" opacity={0.5} />
        );
      })()}
    </g>
  );
};
