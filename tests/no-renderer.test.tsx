// @vitest-environment jsdom
/**
 * The page in kit benchmark finding K11 had registered nothing at all, so no
 * renderer existed and echarts' init() threw. In a production bundle that throw
 * reads `Xa[a] is not a constructor` (zrender doing `new painterCtors[type]`),
 * and it came from the effect that creates the instance, which nothing caught:
 * React unmounted the whole root.
 *
 * Nothing is registered in this file, on purpose. Registration is module-global,
 * and vitest gives each test file its own modules.
 */
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EChart } from "../src/components/EChart";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const OPTION = { series: [{ type: "bar" as const, data: [1, 2] }] };

const roots: Root[] = [];
function mount(el: ReactElement) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  act(() => root.render(el));
  return host;
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

describe("a page that never registered a renderer", () => {
  it("keeps the rest of the page, and says what to register", () => {
    const errors: unknown[] = [];
    vi.spyOn(console, "error").mockImplementation((...args) => void errors.push(...args));
    const onRenderError = vi.fn();

    const host = mount(
      <div>
        <p id="banner">consent banner</p>
        <EChart option={OPTION} data-chart="sales" onRenderError={onRenderError} />
      </div>,
    );

    expect(host.querySelector("#banner")?.textContent).toBe("consent banner");
    const el = host.querySelector('[data-chart="sales"]');
    expect(el?.getAttribute("data-echart-error")).toBe("not-registered");

    expect(onRenderError).toHaveBeenCalledTimes(1);
    const err = onRenderError.mock.calls[0][0] as Error;
    expect(err.message).toMatch(/^\[fancy-echarts\] .*renderer.*is likely not registered/);
    expect(err.message).toContain("registerAll()");
    expect(errors).toContain(err);
  });

  it("does not crash when the chart unmounts after failing", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mount(<EChart option={OPTION} />);

    expect(() => act(() => roots.splice(0).forEach((r) => r.unmount()))).not.toThrow();
  });
});
