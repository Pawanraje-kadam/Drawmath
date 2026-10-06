
import { useCallback } from 'react';
import { useStore } from '../store/useStore';

export function useExport() {
  const exportPNG = useCallback(() => {
    const svg = document.getElementById('math-canvas-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const rect = svg.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = 'drawmath.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const exportSVG = useCallback(() => {
    const svg = document.getElementById('math-canvas-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.download = 'drawmath.svg';
    a.href = URL.createObjectURL(blob);
    a.click();
  }, []);

  const exportJSON = useCallback(() => {
    const json = useStore.getState().saveWorkspace();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.download = 'drawmath.json';
    a.href = URL.createObjectURL(blob);
    a.click();
  }, []);

  const importJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const json = ev.target?.result as string;
        useStore.getState().loadWorkspace(json);
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  return { exportPNG, exportSVG, exportJSON, importJSON };
}
