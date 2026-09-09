// @vitest-environment jsdom
/**
 * Pan and zoom a `graph` series from ANYWHERE on the canvas.
 *
 * ## The trap this closes
 *
 * ECharts binds the roam controller to the **series group's bounding rect** —
 * the extent of what was drawn. So `roam: true` on a graph works over the nodes
 * and is dead on the empty canvas around them, which is exactly where a person
 * grabs to pan. A consumer lost hours to it: *"it only works if I put my mouse
 * in the middle of the cluster."*
 *
 * Nothing in the option surface hints at it, and two reasonable fixes do not
 * work:
 *
 * 1. **Layout bounds do nothing.** `left/right/top/bottom` change the layout
 *    area, not the group's bounding rect, which is measured from content. They
 *    also re-spread the force layout, so it looks like they did something.
 * 2. **DOM listeners never fire.** zrender owns the canvas events; a
 *    `pointerdown` bound on the container element is never called. Worth
 *    stating plainly because this package already ships a `usePanZoom` that
 *    works exactly that way — it is for the DOM `EChartGraphic` surface, and
 *    reaching for it here is the dead end.
 *
 * ## Why these assertions are on the DISPATCH and not on the picture
 *
 * **Synthetic input does not drive ECharts roam.** The reporter proved it with
 * a control rather than assuming: dragging over the CLUSTER — where roam
 * demonstrably works with a real mouse — also left the canvas byte-identical,
 * while toggling a checkbox did change the canvas hash. CDP drags,
 * `MouseEvent` and `PointerEvent` sequences all fail the same way. Hover and
 * cursor DO respond to synthetic events; only roam does not.
 *
 * So a browser-automation test of this would report a **false negative** and
 * send the next person chasing a fix that already works. The honest boundary is
 * that this hook's job is to dispatch the right action with the right payload;
 * whether ECharts then paints is ECharts' job, verified by a human with a real
 * mouse.
 */
import { describe, expect, test, vi } from "vitest";
import { useGraphRoam } from "../src/hooks/use-graph-roam";

/** A zrender stand-in that records handlers so a test can fire them. */
function fakeInstance() {
  const handlers: Record<string, ((e: unknown) => void)[]> = {};
  const zr = {
    on: vi.fn((name: string, fn: (e: unknown) => void) => {
      (handlers[name] ??= []).push(fn);
    }),
    off: vi.fn((name: string, fn: (e: unknown) => void) => {
      handlers[name] = (handlers[name] ?? []).filter((h) => h !== fn);
    }),
    setCursorStyle: vi.fn(),
  };
  const instance = {
    getZr: () => zr,
    dispatchAction: vi.fn(),
    isDisposed: () => false,
  };
  const fire = (name: string, e: unknown) => (handlers[name] ?? []).forEach((h) => h(e));

  return { instance, zr, fire, handlers };
}

/** Run the hook's effect body without a renderer. */
function mount(instance: unknown, options?: Parameters<typeof useGraphRoam>[1]) {
  return useGraphRoam.attach(instance as never, options);
}

describe("useGraphRoam", () => {
  test("pans from EMPTY canvas — the whole point", () => {
    const { instance, fire } = fakeInstance();
    mount(instance);

    // `e.target` unset means zrender hit nothing: empty canvas.
    fire("mousedown", { target: null, offsetX: 100, offsetY: 100 });
    fire("mousemove", { target: null, offsetX: 130, offsetY: 90 });

    expect(instance.dispatchAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "graphRoam", dx: 30, dy: -10 }),
    );
  });

  test("does NOT pan when the press landed on a node", () => {
    // `e.target` set means a node, and node dragging is ECharts' own behaviour.
    // Stealing that press would trade one broken interaction for another.
    const { instance, fire } = fakeInstance();
    mount(instance);

    fire("mousedown", { target: {}, offsetX: 100, offsetY: 100 });
    fire("mousemove", { target: {}, offsetX: 130, offsetY: 90 });

    expect(instance.dispatchAction).not.toHaveBeenCalled();
  });

  test("zooms about the POINTER, not the centre", () => {
    // Zooming to the middle when the cursor is in a corner is the thing that
    // makes a graph feel broken even when it technically zooms.
    const { instance, fire } = fakeInstance();
    mount(instance);

    fire("mousewheel", { wheelDelta: 120, offsetX: 42, offsetY: 84 });

    expect(instance.dispatchAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "graphRoam", originX: 42, originY: 84 }),
    );
  });

  test("wheel direction picks zoom in vs out, and they are reciprocal", () => {
    const { instance, fire } = fakeInstance();
    mount(instance, { zoomStep: 1.2 });

    fire("mousewheel", { wheelDelta: 120, offsetX: 0, offsetY: 0 });
    fire("mousewheel", { wheelDelta: -120, offsetX: 0, offsetY: 0 });

    const [zin] = instance.dispatchAction.mock.calls[0] as [{ zoom: number }];
    const [zout] = instance.dispatchAction.mock.calls[1] as [{ zoom: number }];

    expect(zin.zoom).toBeCloseTo(1.2);
    expect(zout.zoom).toBeCloseTo(1 / 1.2);
  });

  test("stops panning on mouseup, so the graph does not follow the cursor", () => {
    const { instance, fire } = fakeInstance();
    mount(instance);

    fire("mousedown", { target: null, offsetX: 0, offsetY: 0 });
    fire("mouseup", {});
    instance.dispatchAction.mockClear();

    fire("mousemove", { target: null, offsetX: 50, offsetY: 50 });

    expect(instance.dispatchAction).not.toHaveBeenCalled();
  });

  test("sets a grab cursor, because empty canvas has no affordance otherwise", () => {
    // zrender sets `pointer` over a node and leaves the default arrow
    // everywhere else. Once empty space IS draggable, nothing says so.
    const { instance, zr, fire } = fakeInstance();
    mount(instance);

    fire("mousemove", { target: null, offsetX: 10, offsetY: 10 });
    expect(zr.setCursorStyle).toHaveBeenCalledWith("grab");

    fire("mousedown", { target: null, offsetX: 10, offsetY: 10 });
    expect(zr.setCursorStyle).toHaveBeenCalledWith("grabbing");
  });

  test("detaching removes every handler it added", () => {
    const { instance, zr } = fakeInstance();
    const detach = mount(instance);

    const added = zr.on.mock.calls.length;
    expect(added).toBeGreaterThan(0);

    detach();

    expect(zr.off.mock.calls.length).toBe(added);
  });

  test("is inert with no instance, rather than throwing", () => {
    // The instance is null on the first render of every consumer.
    expect(() => mount(null)).not.toThrow();
  });

  test("enabled:false attaches nothing at all", () => {
    const { instance, zr } = fakeInstance();
    mount(instance, { enabled: false });

    expect(zr.on).not.toHaveBeenCalled();
  });
});
