
import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface Props {
  latex: string;
  display?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const EquationDisplay: React.FC<Props> = ({ latex, display = false, className, style }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && latex) {
      try {
        katex.render(latex, ref.current, {
          throwOnError: false,
          displayMode: display,
          output: 'html'
        });
      } catch {
        ref.current.textContent = latex;
      }
    }
  }, [latex, display]);

  return <div ref={ref} className={className} style={style} />;
};
