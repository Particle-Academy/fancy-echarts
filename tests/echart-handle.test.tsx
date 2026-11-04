// @vitest-environment jsdom
/**
 * Every chart component declared `forwardRef` and threw the ref away, and the
 * series shorthands (`EChart.Line`) took no ref at all. So a ref was silently
 * always null.
 *
 * jsdom has no canvas, so this file pins the WIRING against a fake `echarts/core`:
 * which instance a ref reaches, and what a capture asks ECharts for. Whether the
 * pixels come out right on a dark-mode machine is a real-browser question.
 */
import { act, createRef, useEffect, useState, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => {
  type Chart = {
    dom: HTMLElement;
    theme: unknown;
    opts: unknown;
    setOption: ReturnType<typeof vi.fn>;
    getDataURL: ReturnType<typeof vi.fn>;
    getOption: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    on: () => void;
    off: () => void;
    resize: () => void;
    showLoading: () => void;
    hideLoading: () => void;
  };
  const charts: Chart[] = [];
  const byDom = new Map<HTMLElement, Chart>();
  return {
    charts,
    byDom,
    use: vi.fn(),
    init(dom: HTMLElement, theme: unknown, opts: unknown) {
      const chart: Chart = {
        dom,
        theme,
        opts,
        setOption: vi.fn(),
        getDataURL: vi.fn(() => "data:image/png;base64,FAKE"),
        // A capture must not read this: it carries the live theme's colours.
        getOption: vi.fn(() => {
          throw new Error("capture must not re-render from getOption()");
        }),
        dispose: vi.fn(() => {
          byDom.delete(dom);
        }),
        on() {},
        off() {},
        resize() {},
        showLoading() {},
        hideLoading() {},
      };
      charts.push(chart);
      byDom.set(dom, chart);
      return chart;
    },
  };
});

vi.mock("echarts/core", () => ({
  init: (...args: Parameters<typeof fake.init>) => fake.init(...args),
  getInstanceByDom: (dom: HTMLElement) => fake.byDom.get(dom),
  use: fake.use,
}));
vi.mock("echarts-gl", () => ({}));

import { EChart } from "../src/components/EChart";
import { EChart3D } from "../src/components/EChart3D";
import { EChartGraphic } from "../src/components/EChartGraphic";
import { captureEChart } from "../src/utils/capture";
import { useECharts, type UseEChartsReturn } from "../src/hooks/use-echarts";
import type { EChartHandle } from "../src/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const OPTION = { series: [{ type: "bar", data: [1, 2] }] };

function stubDark(dark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: dark && query.includes("dark"),
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
}

const roots: Root[] = [];
function mount(el: ReactElement) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  act(() => root.render(el));
  return { host, root };
}

/** The chart on screen, as opposed to a capture's offscreen one. */
const mounted = () => fake.charts.find((c) => c.dom.isConnected && fake.byDom.get(c.dom) === c)!;

beforeEach(() => {
  fake.charts.length = 0;
  fake.byDom.clear();
  stubDark(false);
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  act(() => roots.splice(0).forEach((r) => r.unmount()));
  document.body.innerHTML = "";
});

describe("the ref reaches the chart", () => {
  const cases: Array<[string, (ref: React.Ref<EChartHandle>) => ReactElement]> = [
    ["EChart", (ref) => <EChart ref={ref} option={OPTION} />],
    ["EChart.Line", (ref) => <EChart.Line ref={ref} data={[1, 2]} />],
    ["EChart.Pie", (ref) => <EChart.Pie ref={ref} data={[1, 2]} />],
    ["EChartGraphic", (ref) => <EChartGraphic ref={ref} elements={[]} />],
    ["EChart3D", (ref) => <EChart3D ref={ref} option={OPTION} />],
    ["EChart3D.Bar", (ref) => <EChart3D.Bar ref={ref} data={[[0, 0, 1]]} />],
    ["EChart3D.Globe", (ref) => <EChart3D.Globe ref={ref} />],
  ];

  it.each(cases)("%s exposes its instance and element", async (name, render) => {
    const ref = createRef<EChartHandle>();
    const { host } = mount(render(ref));

    // EChart3D mounts only once echarts-gl has loaded.
    await act(async () => {
      await vi.dynamicImportSettled();
    });

    expect(ref.current, name).not.toBeNull();
    expect(ref.current!.instance).toBe(mounted());
    expect(ref.current!.element).toBe(mounted().dom);
    expect(host.contains(ref.current!.element)).toBe(true);
  });

  it("works with a callback ref", () => {
    let handle: EChartHandle | null = null;
    mount(<EChart ref={(h) => void (handle = h)} option={OPTION} />);

    expect(handle!.instance).toBe(mounted());
  });

  it("follows the instance when a theme change replaces it, on the same handle", () => {
    const ref = createRef<EChartHandle>();
    let setTheme: (t: string) => void = () => {};
    function Host() {
      const [theme, set] = useState("one");
      setTheme = set;
      return <EChart ref={ref} option={OPTION} theme={theme} />;
    }
    mount(<Host />);
    const handle = ref.current!;
    const first = handle.instance;

    act(() => setTheme("two"));

    expect(ref.current).toBe(handle);
    expect(handle.instance).not.toBe(first);
    expect(handle.instance).toBe(mounted());
  });

  it("is ready when the host's own effect runs on mount", () => {
    const ref = createRef<EChartHandle>();
    let seen: unknown = "not run";
    function Host() {
      useEffect(() => {
        seen = ref.current?.instance;
      }, []);
      return <EChart ref={ref} option={OPTION} />;
    }
    mount(<Host />);

    expect(seen).toBe(mounted());
  });

  it("clears on unmount", () => {
    const ref = createRef<EChartHandle>();
    const { root } = mount(<EChart ref={ref} option={OPTION} />);

    act(() => root.render(<div />));

    expect(ref.current).toBeNull();
  });

  it("still takes the div's attributes", () => {
    const { host } = mount(<EChart option={OPTION} id="sales" data-chart="x" />);

    expect(host.querySelector("#sales")?.getAttribute("data-chart")).toBe("x");
  });
});

describe("capture from a mounted chart", () => {
  it("renders a separate chart, leaving the one on screen alone", () => {
    const ref = createRef<EChartHandle>();
    mount(<EChart ref={ref} option={OPTION} />);
    const live = mounted();
    live.setOption.mockClear();

    const url = ref.current!.capture({ backgroundColor: "#fff" });

    expect(url).toBe("data:image/png;base64,FAKE");
    expect(live.setOption).not.toHaveBeenCalled();
    expect(live.getDataURL).not.toHaveBeenCalled();
    expect(live.dispose).not.toHaveBeenCalled();
  });

  it("pins theme and background on a dark-mode machine", () => {
    stubDark(true);
    const ref = createRef<EChartHandle>();
    mount(<EChart ref={ref} option={OPTION} />);
    // The on-screen chart follows the machine, which is the trap.
    expect(mounted().theme).toBe("dark");

    ref.current!.capture({ backgroundColor: "#ffffff" });

    const off = fake.charts.at(-1)!;
    expect(off.dom.isConnected).toBe(false);
    expect(off.theme).toBeUndefined();
    expect(off.setOption.mock.calls[0][0].backgroundColor).toBe("#ffffff");
    expect(off.getDataURL.mock.calls[0][0]).toMatchObject({ type: "png", backgroundColor: "#ffffff" });
  });

  it("renders from the option it was given, not the instance's getOption()", () => {
    // getOption() has the live theme's colours merged into it, so re-rendering
    // that under another theme keeps them. The fake's getOption throws.
    stubDark(true);
    const ref = createRef<EChartHandle>();
    mount(<EChart ref={ref} option={OPTION} />);

    ref.current!.capture({ backgroundColor: "#fff", theme: "report" });

    const off = fake.charts.at(-1)!;
    expect(off.theme).toBe("report");
    expect(off.setOption.mock.calls[0][0].series[0].data).toEqual([1, 2]);
  });

  it("captures the latest option", () => {
    const ref = createRef<EChartHandle>();
    const { root } = mount(<EChart ref={ref} option={OPTION} />);

    act(() => root.render(<EChart ref={ref} option={{ series: [{ type: "bar", data: [9] }] }} />));
    ref.current!.capture({ backgroundColor: "#fff" });

    expect(fake.charts.at(-1)!.setOption.mock.calls[0][0].series[0].data).toEqual([9]);
  });

  it("captures what a series shorthand built", () => {
    const ref = createRef<EChartHandle>();
    mount(<EChart.Line ref={ref} data={[3, 4]} title="T" />);

    ref.current!.capture({ backgroundColor: "#fff" });

    const sent = fake.charts.at(-1)!.setOption.mock.calls[0][0];
    expect(sent.series[0]).toMatchObject({ type: "line", data: [3, 4] });
    expect(sent.title).toEqual({ text: "T" });
  });

  it("takes its size from the element, unless told", () => {
    const ref = createRef<EChartHandle>();
    mount(<EChart ref={ref} option={OPTION} />);
    Object.defineProperty(ref.current!.element!, "clientWidth", { value: 640 });
    Object.defineProperty(ref.current!.element!, "clientHeight", { value: 320 });

    ref.current!.capture({ backgroundColor: "#fff" });
    expect(fake.charts.at(-1)!.opts).toMatchObject({ width: 640, height: 320 });

    ref.current!.capture({ backgroundColor: "#fff", width: 1000, height: 500 });
    expect(fake.charts.at(-1)!.opts).toMatchObject({ width: 1000, height: 500 });
  });

  it("is on the hook too", () => {
    let hook: UseEChartsReturn | undefined;
    function Host() {
      hook = useECharts({ option: OPTION });
      return <div ref={hook.chartRef} />;
    }
    mount(<Host />);

    expect(hook!.capture({ backgroundColor: "#fff" })).toBe("data:image/png;base64,FAKE");
  });
});

describe("captureEChart", () => {
  const last = () => fake.charts.at(-1)!;

  it("needs no mounted chart", () => {
    const url = captureEChart(OPTION, { backgroundColor: "#fff" });

    expect(url).toBe("data:image/png;base64,FAKE");
    expect(last().dom.isConnected).toBe(false);
  });

  it("forces canvas, because only canvas makes a PNG", () => {
    captureEChart(OPTION, { backgroundColor: "#fff" });

    expect(last().opts).toMatchObject({ renderer: "canvas" });
    expect(fake.use).toHaveBeenCalled();
  });

  it("wins over a background in the option", () => {
    captureEChart({ ...OPTION, backgroundColor: "#123456" }, { backgroundColor: "#ffffff" });

    expect(last().setOption.mock.calls[0][0].backgroundColor).toBe("#ffffff");
  });

  it("lets transparent be pinned on purpose", () => {
    captureEChart(OPTION, { backgroundColor: "transparent" });

    expect(last().getDataURL.mock.calls[0][0].backgroundColor).toBe("transparent");
  });

  it("falls back to white for a caller with no types to stop them", () => {
    captureEChart(OPTION, {} as never);

    expect(last().getDataURL.mock.calls[0][0].backgroundColor).toBe("#ffffff");
  });

  it("turns animation off globally and on every series", () => {
    captureEChart(
      { animation: true, series: [{ type: "bar", animation: true, data: [1] }, { type: "line", data: [2] }] } as never,
      { backgroundColor: "#fff" },
    );

    const sent = last().setOption.mock.calls[0][0];
    expect(sent.animation).toBe(false);
    expect(sent.series.map((s: { animation: boolean }) => s.animation)).toEqual([false, false]);
  });

  it("handles a lone series object", () => {
    captureEChart({ series: { type: "bar", animation: true, data: [1] } } as never, { backgroundColor: "#fff" });

    expect(last().setOption.mock.calls[0][0].series.animation).toBe(false);
  });

  it("does not touch the caller's option", () => {
    const option = { series: [{ type: "bar", animation: true, data: [1] }] };
    const before = JSON.stringify(option);

    captureEChart(option as never, { backgroundColor: "#fff" });

    expect(JSON.stringify(option)).toBe(before);
  });

  it("passes pixelRatio and excludeComponents, defaulting the ratio to 2", () => {
    captureEChart(OPTION, { backgroundColor: "#fff" });
    expect(last().getDataURL.mock.calls[0][0].pixelRatio).toBe(2);

    captureEChart(OPTION, { backgroundColor: "#fff", pixelRatio: 3, excludeComponents: ["toolbox"] });
    expect(last().getDataURL.mock.calls[0][0]).toMatchObject({ pixelRatio: 3, excludeComponents: ["toolbox"] });
  });

  // echarts-gl draws its first frame later, so a synchronous capture came out as a
  // blank image with a real size. Measured in headless Chromium. Refusing beats
  // handing a blank chart to a PDF.
  it.each([
    ["a 3D series", { series: [{ type: "bar3D", data: [] }] }],
    ["a GL series", { series: [{ type: "scatterGL", data: [] }] }],
    ["a surface", { series: { type: "surface", data: [] } }],
    ["a globe", { globe: {} }],
    ["a 3D grid", { grid3D: {}, series: [] }],
  ])("refuses %s, rather than returning a blank image", (_name, option) => {
    const before = fake.charts.length;

    expect(() => captureEChart(option as never, { backgroundColor: "#fff" })).toThrow(/WebGL/);
    expect(fake.charts.length).toBe(before);
  });

  it("refuses from a mounted EChart3D too", async () => {
    const ref = createRef<EChartHandle>();
    mount(<EChart3D.Bar ref={ref} data={[[0, 0, 1]]} />);
    await act(async () => {
      await vi.dynamicImportSettled();
    });

    expect(() => ref.current!.capture({ backgroundColor: "#fff" })).toThrow(/instance\.getDataURL/);
  });

  it("disposes its chart when it succeeds", () => {
    captureEChart(OPTION, { backgroundColor: "#fff" });

    expect(last().dispose).toHaveBeenCalledTimes(1);
  });

  it("disposes its chart when rendering fails, and names the likely unregistered type", () => {
    const init = fake.init;
    let made: { dispose: ReturnType<typeof vi.fn> } | undefined;
    fake.init = ((...args: Parameters<typeof init>) => {
      const c = init(...args);
      c.setOption = vi.fn(() => {
        throw new Error("_u[o] is not a constructor");
      });
      made = c;
      return c;
    }) as typeof init;

    try {
      expect(() => captureEChart(OPTION, { backgroundColor: "#fff" })).toThrow(/series:bar/);
      expect(made!.dispose).toHaveBeenCalledTimes(1);
    } finally {
      fake.init = init;
    }
  });
});
