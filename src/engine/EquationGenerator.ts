
// Centralized equation generation is handled by each shape's getEquation/getEquationLatex methods.
// This module provides shared utilities.

export function formatCoefficient(n: number, isFirst = false): string {
  if (Math.abs(n) < 0.005) return isFirst ? '0' : '';
  if (Math.abs(n - 1) < 0.005) return isFirst ? '' : '+ ';
  if (Math.abs(n + 1) < 0.005) return isFirst ? '-' : '- ';
  const abs = Math.round(Math.abs(n) * 100) / 100;
  if (n < 0) return isFirst ? `-${abs}` : `- ${abs}`;
  return isFirst ? `${abs}` : `+ ${abs}`;
}

export function formatConstant(n: number): string {
  if (Math.abs(n) < 0.005) return '';
  const abs = Math.round(Math.abs(n) * 100) / 100;
  return n >= 0 ? `+ ${abs}` : `- ${abs}`;
}
