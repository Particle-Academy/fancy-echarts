import { useEffect } from "react";

/**
 * Pan and zoom a `graph` series from ANYWHERE on the canvas.
 *
 * ## The trap
 *
 * ECharts binds the roam controller to the **series group's bounding rect** —
 * the extent of what was actually drawn. So `roam: true` on a graph responds
 * over the nodes and is dead on the empty canvas around them, which is exactly
 * where a person grabs to pan. A graph occupying a corner has a correspondingly
 * small interactive area. Reported by a consumer as *"it only works if I put my
 * mouse in the middle of the cluster."*
 *
 * Nothing in the option surface hints at it, and the two obvious fixes do not
 * work:
 *
 * - **Layout bounds do nothing.** `left` / `right` / `top` / `bottom` change the
 *   layout area, not the group's bounding rect, which is measured from content.
 *   They also re-spread the force layout, so it looks like they helped.
 * - **DOM listeners never fire.** zrender owns the canvas events; a
 *   `pointerdown` bound on the container element is simply never called. Note
 *   this package also ships {@link usePanZoom}, which works exactly that way —
 *   it is for the DOM `EChartGraphic` surface, and reaching for it here is the
 *   dead end.
 *
 * ## What this does
 *
 * Drives the series' own documented `graphRoam` action from **zrender's** event
 * bus, which is the only bus that sees canvas input.
 *
 * **`roam` must stay `true` in your option.** The action is applied by the
 * series only when roam is enabled — the handler recalculates the view from the
 * model, so with `roam: false` the dispatch is silently inert. Setting it false
 * to "take over cleanly" is the natural move and it costs a debugging cycle.
 *
 * `e.target` is zrender's free hit test: set means the press landed on a node,
 * so we leave it alone and node dragging keeps working.
 *
 * ## Verifying it
 *
 * **Synthetic input does not drive ECharts roam.** CDP drags, `MouseEvent` and
 * `PointerEvent` sequences leave the canvas byte-identical — proven with a
 * control, by dragging over the cluster where roam demonstrably works with a
 * real mouse and getting no change either. Hover and cursor DO respond to
 * synthetic events; only roam does not. So a browser-automation test of this
 * reports a false negative. The unit tests assert the dispatch and payload;
 * whether ECharts paints is verified by a human with a real mouse.
 *
 * @example
 * const { instance } = useECharts({ option });
 * useGraphRoam(instance);   // option keeps `series: [{ type: "graph", roam: true }]`
 */
export interface UseGraphRoamOptions {
  /** Turn the whole thing off. Default `true`. */
  enabled?: boolean;
  /** Multiplier per wheel notch. Zooming out uses its reciprocal. Default `1.15`. */
  zoomStep?: number;
  /** Set a grab / grabbing cursor over empty canvas. Default `true`. */
  cursor?: boolean;
}

/** The slice of an ECharts instance this needs — kept structural so a caller is not forced to import echarts types. */
interface RoamableInstance {
  getZr(): {
    on(name: string, handler: (e: never) => void): void;
    off(name: string, handler: (e: never) => void): void;
    setCursorStyle(cursor: string): void;
  };
  dispatchAction(payload: Record<string, unknown>): void;
  isDisposed?(): boolean;
}

interface ZrEvent {
  target?: unknown;
  offsetX?: number;
  offsetY?: number;
  wheelDelta?: number;
}

/**
 * Wire the handlers up. Returns a detach function.
 *
 * Exposed off the hook so it can be tested without a renderer — the hook body
 * is one `useEffect` around this, and a test that re-implemented the wiring
 * would be asserting against itself.
 */
function attach(instance: RoamableInstance | null | undefined, options: UseGraphRoamOptions = {}): () => void {
  const { enabled = true, zoomStep = 1.15, cursor = true } = options;

  if (!enabled || !instance || instance.isDisposed?.()) return () => {};

  const zr = instance.getZr();
  if (!zr) return () => {};

  let panning = false;
  let lastX = 0;
  let lastY = 0;

  const onMouseDown = (e: ZrEvent) => {
    // A target means a node. Node dragging is ECharts' own behaviour and
    // stealing the press would trade one broken interaction for another.
    if (e.target) return;

    panning = true;
    lastX = e.offsetX ?? 0;
    lastY = e.offsetY ?? 0;
    if (cursor) zr.setCursorStyle("grabbing");
  };

  const onMouseMove = (e: ZrEvent) => {
    if (!panning) {
      // zrender sets `pointer` over a node and the default arrow everywhere
      // else, so once empty canvas IS draggable nothing signals it.
      if (cursor && !e.target) zr.setCursorStyle("grab");
      return;
    }

    const x = e.offsetX ?? 0;
    const y = e.offsetY ?? 0;
    const dx = x - lastX;
    const dy = y - lastY;
    lastX = x;
    lastY = y;

    if (dx === 0 && dy === 0) return;

    instance.dispatchAction({ type: "graphRoam", dx, dy });
  };

  const stop = () => {
    if (!panning) return;
    panning = false;
    if (cursor) zr.setCursorStyle("grab");
  };

  const onWheel = (e: ZrEvent) => {
    const delta = e.wheelDelta ?? 0;
    if (delta === 0) return;

    instance.dispatchAction({
      type: "graphRoam",
      // Reciprocal on the way out, so a notch in and a notch out return you to
      // where you started rather than drifting.
      zoom: delta > 0 ? zoomStep : 1 / zoomStep,
      originX: e.offsetX ?? 0,
      originY: e.offsetY ?? 0,
    });
  };

  const bound: [string, (e: never) => void][] = [
    ["mousedown", onMouseDown as (e: never) => void],
    ["mousemove", onMouseMove as (e: never) => void],
    ["mouseup", stop as (e: never) => void],
    ["globalout", stop as (e: never) => void],
    ["mousewheel", onWheel as (e: never) => void],
  ];

  for (const [name, handler] of bound) zr.on(name, handler);

  return () => {
    for (const [name, handler] of bound) zr.off(name, handler);
  };
}

export function useGraphRoam(
  instance: RoamableInstance | null | undefined,
  options: UseGraphRoamOptions = {},
): void {
  const { enabled = true, zoomStep = 1.15, cursor = true } = options;

  useEffect(
    () => attach(instance, { enabled, zoomStep, cursor }),
    [instance, enabled, zoomStep, cursor],
  );
}

/** The wiring, without React. Same code the hook runs; see {@link attach}. */
useGraphRoam.attach = attach;
