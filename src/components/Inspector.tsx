
import React, { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { EquationDisplay } from './EquationDisplay';
import { ObjectList } from './ObjectList';
import { formatNum, roundForDisplay } from '../engine/shapes/Shape';
import { EquationFormat } from '../types';

export const Inspector: React.FC = () => {
  const {
    shapes, selectedIds, equationFormat, setEquationFormat,
    setShapeParam, intersections, showMeasurements,
    duplicateSelected, deleteSelected, isMobile, inspectorOpen
  } = useStore();

  const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
  const selectedShape = selectedShapes.length === 1 ? selectedShapes[0] : null;
  const [copiedEq, setCopiedEq] = useState(false);

  const copyEquation = useCallback(() => {
    if (!selectedShape) return;
    navigator.clipboard?.writeText(selectedShape.getEquation(equationFormat));
    setCopiedEq(true);
    setTimeout(() => setCopiedEq(false), 1500);
  }, [selectedShape, equationFormat]);

  if (isMobile && !inspectorOpen) return null;

  return (
    <div style={{
      width: isMobile ? '100%' : 'var(--inspector-width)',
      background: 'var(--bg-secondary)',
      borderLeft: isMobile ? 'none' : '1px solid var(--border-light)',
      borderTop: isMobile ? '1px solid var(--border-light)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
      ...(isMobile ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '50vh',
        zIndex: 200,
        borderRadius: '12px 12px 0 0',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
      } : {})
    }}>
      {/* Objects List */}
      <div style={{
        borderBottom: '1px solid var(--border-light)',
        maxHeight: selectedShape ? 180 : '100%',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '10px 12px 6px',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--text-tertiary)'
        }}>
          Objects ({shapes.length})
        </div>
        <ObjectList />
      </div>

      {/* Selected Shape Inspector */}
      {selectedShape && (
        <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
          {/* Type */}
          <div style={{
            padding: '12px 12px 8px',
            borderBottom: '1px solid var(--border-light)'
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--text-tertiary)',
              marginBottom: 6
            }}>
              {selectedShape.data.type}
            </div>

            {/* Equation */}
            <div style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              position: 'relative'
            }}>
              <EquationDisplay
                latex={selectedShape.getEquationLatex(equationFormat)}
                style={{
                  fontSize: 15,
                  color: 'var(--text-primary)',
                  overflow: 'auto'
                }}
              />
              <div style={{
                display: 'flex',
                gap: 4,
                marginTop: 8,
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setEquationFormat(equationFormat === 'standard' ? 'expanded' : 'standard')}
                  style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 3,
                    background: 'var(--bg-hover)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  {equationFormat === 'standard' ? 'Expanded' : 'Standard'}
                </button>
                <button
                  onClick={copyEquation}
                  style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 3,
                    background: copiedEq ? 'var(--accent-light)' : 'var(--bg-hover)',
                    color: copiedEq ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                    marginLeft: 'auto'
                  }}
                >
                  {copiedEq ? '✓ Copied' : '⧉ Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div style={{
            padding: '12px',
            borderBottom: '1px solid var(--border-light)'
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--text-tertiary)',
              marginBottom: 8
            }}>
              Parameters
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(selectedShape.getParameters()).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    width: 80,
                    flexShrink: 0,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}>
                    {key}
                  </label>
                  {typeof value === 'number' ? (
                    <input
                      type="number"
                      value={roundForDisplay(value)}
                      step={0.1}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) {
                          setShapeParam(selectedShape.id, key, v);
                        }
                      }}
                      style={{ flex: 1, fontSize: 12 }}
                    />
                  ) : (
                    <span style={{
                      flex: 1,
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)'
                    }}>
                      {String(value)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Properties */}
          {showMeasurements && (
            <div style={{
              padding: '12px',
              borderBottom: '1px solid var(--border-light)'
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--text-tertiary)',
                marginBottom: 8
              }}>
                Properties
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Object.entries(selectedShape.getInfo()).map(([key, value]) => (
                  <div key={key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 11
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{key}</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                      fontWeight: 500
                    }}>
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{
            padding: '12px',
            display: 'flex',
            gap: 6
          }}>
            <button
              onClick={duplicateSelected}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: 11,
                fontWeight: 500,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
            >
              ⧉ Duplicate
            </button>
            <button
              onClick={deleteSelected}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: 11,
                fontWeight: 500,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                color: 'var(--accent-danger)',
                border: '1px solid var(--border-light)',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
            >
              ✕ Delete
            </button>
          </div>

          {/* Intersections */}
          {intersections.length > 0 && (
            <div style={{
              padding: '12px',
              borderTop: '1px solid var(--border-light)'
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--text-tertiary)',
                marginBottom: 8
              }}>
                Intersections
              </div>
              {intersections
                .filter(i => i.shapeAId === selectedShape.id || i.shapeBId === selectedShape.id)
                .map((inter, idx) => (
                <div key={idx} style={{ marginBottom: 8 }}>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    marginBottom: 4
                  }}>
                    {inter.shapeAName} ∩ {inter.shapeBName}
                  </div>
                  {inter.points.map((p, i) => (
                    <div key={i} style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-danger)',
                      padding: '2px 0'
                    }}>
                      ({formatNum(p.x)}, {formatNum(p.y)})
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No selection */}
      {!selectedShape && selectedShapes.length === 0 && shapes.length > 0 && (
        <div style={{
          padding: '20px 12px',
          color: 'var(--text-tertiary)',
          fontSize: 12,
          textAlign: 'center'
        }}>
          Select an object to inspect
          <br />its mathematical properties
        </div>
      )}

      {/* Multi selection */}
      {selectedShapes.length > 1 && (
        <div style={{ padding: '12px' }}>
          <div style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginBottom: 8
          }}>
            {selectedShapes.length} objects selected
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={duplicateSelected}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: 11,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-light)'
              }}
            >
              Duplicate
            </button>
            <button
              onClick={deleteSelected}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: 11,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                color: 'var(--accent-danger)',
                border: '1px solid var(--border-light)'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
