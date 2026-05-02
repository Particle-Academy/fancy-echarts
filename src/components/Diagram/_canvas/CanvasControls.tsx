import { cn } from "../../../utils/cn";
import { useCanvas } from "./Canvas.context";
import type { CanvasControlsProps } from "./Canvas.types";

// Inline SVGs (avoid third-party icon dep — fancy-echarts is self-contained).
const iconProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ZoomIn = () => (<svg {...iconProps}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>);
const ZoomOut = () => (<svg {...iconProps}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>);
const Maximize = () => (<svg {...iconProps}><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /></svg>);
const RotateCcw = () => (<svg {...iconProps}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>);

export function CanvasControls({
  className,
  showZoomIn = true,
  showZoomOut = true,
  showReset = true,
  showFitAll = true,
}: CanvasControlsProps) {
  const { setViewport, nodeRects, containerRef } = useCanvas();

  const zoomIn = () => setViewport((v) => ({ ...v, zoom: Math.min(3, v.zoom * 1.25) }));
  const zoomOut = () => setViewport((v) => ({ ...v, zoom: Math.max(0.1, v.zoom / 1.25) }));
  const reset = () => setViewport({ panX: 0, panY: 0, zoom: 1 });

  const fitAll = () => {
    const container = containerRef.current;
    if (!container || nodeRects.size === 0) return reset();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodeRects.forEach((r) => {
      minX = Math.min(minX, r.x);
      minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.width);
      maxY = Math.max(maxY, r.y + r.height);
    });

    const padding = 40;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const zoom = Math.min(cw / contentW, ch / contentH, 1.5);
    const panX = (cw - contentW * zoom) / 2 - minX * zoom + padding * zoom;
    const panY = (ch - contentH * zoom) / 2 - minY * zoom + padding * zoom;

    setViewport({ panX, panY, zoom });
  };

  const btnClass =
    "flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors";

  return (
    <div
      data-react-fancy-canvas-controls=""
      className={cn(
        "absolute bottom-3 left-3 flex gap-1 rounded-lg border border-zinc-200 bg-white/90 p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90",
        className,
      )}
    >
      {showZoomIn && (
        <button type="button" onClick={zoomIn} className={btnClass} aria-label="Zoom in">
          <ZoomIn />
        </button>
      )}
      {showZoomOut && (
        <button type="button" onClick={zoomOut} className={btnClass} aria-label="Zoom out">
          <ZoomOut />
        </button>
      )}
      {showReset && (
        <button type="button" onClick={reset} className={btnClass} aria-label="Reset view">
          <RotateCcw />
        </button>
      )}
      {showFitAll && (
        <button type="button" onClick={fitAll} className={btnClass} aria-label="Fit all">
          <Maximize />
        </button>
      )}
    </div>
  );
}

CanvasControls.displayName = "CanvasControls";
