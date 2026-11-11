// @vitest-environment jsdom
/**
 * An option naming a component type nobody registered makes echarts throw from
 * setOption. That throw escaped a React effect uncaught, so React unmounted the
 * whole root: one bad chart took the page, and the consent banner beside it,
 * down with it (kit benchmark finding K11). The renderer case, which is what a
 * page that never called registerAll() actually hits, is in no-renderer.test.tsx.
 *
 * Real echarts here, not a fake: the failure is echarts' own. Only the SVG
 * renderer and the bar chart are registered (jsdom has no canvas); the tooltip
 * component never is.
 */
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { use as echartsUse } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { BarChart } from "echarts/charts";
import { GridComponent } from "echarts/components";

import { EChart } from "../src/components/EChart";

echartsUse([SVGRenderer, BarChart, GridComponent]);

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const UNREGISTERED = {
  tooltip: {},
  xAxis: { type: "category" as const, data: ["a"] },
  yAxis: { type: "value" as const },
  series: [{ type: "bar" as const, data: [1] }],
};
const REGISTERED = {
  xAxis: { type: "category" as const, data: ["a"] },
  yAxis: { type: "value" as const },
  series: [{ type: "bar" as const, data: [1] }],
};

const roots: Root[] = [];
function mount(el: ReactElement) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  act(() => root.render(el));
  return { host, root };
}

beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  act(() => roots.splice(0).forEach((r) => r.unmount()));
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("a component type that was never registered", () => {
  it("does not take the rest of the page down", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { host } = mount(
      <div>
        <p id="banner">consent banner</p>
        <EChart option={UNREGISTERED} renderer="svg" data-chart="sales" />
      </div>,
    );

    expect(host.querySelector("#banner")?.textContent).toBe("consent banner");
    expect(host.querySelector('[data-chart="sales"]')).not.toBeNull();
  });

  it("reports the clear error the README promises, naming the type", () => {
    const errors: unknown[] = [];
    vi.spyOn(console, "error").mockImplementation((...args) => void errors.push(...args));
    const onRenderError = vi.fn();

    mount(<EChart option={UNREGISTERED} renderer="svg" onRenderError={onRenderError} />);

    expect(onRenderError).toHaveBeenCalledTimes(1);
    const err = onRenderError.mock.calls[0][0] as Error;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/^\[fancy-echarts\] .*is likely not registered/);
    expect(err.message).toContain("tooltip");
    expect(err.message).toContain("registerAll()");
    // Without an onRenderError the developer still sees it.
    expect(errors).toContain(err);
  });

  it("reports an unregistered series type, which echarts drops without a word", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onRenderError = vi.fn();

    mount(
      <EChart
        option={{ series: [{ type: "sankey", data: [] }] }}
        renderer="svg"
        onRenderError={onRenderError}
      />,
    );

    expect(onRenderError).toHaveBeenCalledTimes(1);
    const err = onRenderError.mock.calls[0][0] as Error;
    expect(err.message).toMatch(/^\[fancy-echarts\] .*is likely not registered/);
    expect(err.message).toContain("series:sankey");
    expect(err.message).not.toContain("tooltip");
  });

  it("stays quiet for an option whose types are all registered", () => {
    const errors: unknown[] = [];
    vi.spyOn(console, "error").mockImplementation((...args) => void errors.push(...args));
    const onRenderError = vi.fn();

    const { host } = mount(
      <EChart option={REGISTERED} renderer="svg" onRenderError={onRenderError} data-chart="ok" />,
    );

    expect(onRenderError).not.toHaveBeenCalled();
    expect(errors.some((e) => String(e).includes("[fancy-echarts]"))).toBe(false);
    expect(host.querySelector('[data-chart="ok"]')?.hasAttribute("data-echart-error")).toBe(false);
  });

  it("marks the chart's own element as failed, and clears the mark once it renders", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { host, root } = mount(
      <EChart option={UNREGISTERED} renderer="svg" data-chart="sales" />,
    );
    const el = () => host.querySelector('[data-chart="sales"]');

    expect(el()?.getAttribute("data-echart-error")).toBe("not-registered");

    act(() =>
      root.render(<EChart option={REGISTERED} renderer="svg" notMerge data-chart="sales" />),
    );

    expect(el()?.hasAttribute("data-echart-error")).toBe(false);
  });
});
