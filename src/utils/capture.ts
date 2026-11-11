import { init, use as echartsUse, ComponentModel } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";

export interface EChartCaptureOptions {
  /** The background to draw on, or `"transparent"` to ask for none. */
  backgroundColor: string;
  /**
   * Theme name or object. Omitted means ECharts' default light look. It never
   * follows `prefers-color-scheme`.
   */
  theme?: string | object;
  /** Width in CSS pixels. Default 800, or the chart's own when captured from one. */
  width?: number;
  /** Height in CSS pixels. Default 400, or the chart's own when captured from one. */
  height?: number;
  /** Output pixels per CSS pixel. Default 2. */
  pixelRatio?: number;
  /** ECharts component types to leave out, such as `["toolbox"]`. */
  excludeComponents?: string[];
}

/** Collect the chart/component type names an option references, so a render
 *  failure can name the likely-unregistered culprits. */
function collectOptionTypes(option: EChartsOption): string[] {
  const types = new Set<string>();
  const o = option as Record<string, unknown>;
  const series = o.series;
  const arr = Array.isArray(series) ? series : series ? [series] : [];
  for (const s of arr) {
    const t = (s as { type?: unknown })?.type;
    if (typeof t === "string") types.add(`series:${t}`);
  }
  for (const key of [
    "radar", "polar", "geo", "parallel", "calendar", "singleAxis",
    "timeline", "visualMap", "dataZoom", "toolbox", "brush", "graphic", "dataset",
  ]) {
    if (o[key] != null) types.add(key);
  }
  return [...types];
}

/**
 * echarts throws a cryptic minified error (e.g. "_u[o] is not a constructor")
 * when an option uses a chart/component type that was never registered. This is
 * something actionable that names the likely culprits and points at registration,
 * which is module-scoped per bundle, so every entry that renders charts must call
 * registerAll().
 */
export function chartRenderError(option: EChartsOption, err: unknown): Error {
  const types = collectOptionTypes(option);
  return new Error(
    `[fancy-echarts] Failed to render chart — a chart/component type is likely not registered. ` +
      `This option uses: ${types.length ? types.join(", ") : "(none detected)"}. ` +
      `Call registerAll() once at app startup, or registerCharts(...)/registerComponents(...) for the types you use. ` +
      `Registration is module-scoped per bundle entry — every entry that renders charts must register. ` +
      `Original error: ${err instanceof Error ? err.message : String(err)}`,
  );
}

/** Top-level option keys that name an ECharts component, mapped to the
 *  component main type that has to be registered for them. */
const COMPONENT_KEYS = [
  "title", "legend", "tooltip", "grid", "xAxis", "yAxis", "polar", "angleAxis",
  "radiusAxis", "radar", "geo", "parallel", "parallelAxis", "calendar",
  "singleAxis", "timeline", "visualMap", "dataZoom", "toolbox", "brush",
  "graphic", "dataset",
] as const;

/**
 * The chart and component types an option uses that nobody registered.
 *
 * ECharts does not throw for these: in production it drops them and draws
 * nothing in their place, and in development it only logs. So this is the one
 * place a missing registration can be named. An echarts build without the
 * class registry (a test double, say) reports nothing rather than everything.
 */
export function findUnregisteredTypes(option: EChartsOption): string[] {
  const missing: string[] = [];
  // `getClass` is on ComponentModel at runtime (echarts' class manager mounts
  // it beside `hasClass`) but only `hasClass` is in its published typings, and
  // `hasClass` looks at the main type alone, so it cannot tell bar from sankey.
  try {
    const registry = ComponentModel as unknown as {
      getClass(mainType: string, subType?: string): unknown;
      hasClass(componentType: string): boolean;
    };
    const o = option as Record<string, unknown>;
    const series = Array.isArray(o.series) ? o.series : o.series ? [o.series] : [];
    for (const s of series) {
      const t = (s as { type?: unknown })?.type;
      if (typeof t === "string" && !registry.getClass("series", t)) {
        missing.push(`series:${t}`);
      }
    }
    for (const key of COMPONENT_KEYS) {
      if (o[key] != null && !registry.hasClass(key)) missing.push(key);
    }
  } catch {
    return [];
  }
  return missing;
}

/** The error for an option whose types {@link findUnregisteredTypes} found missing. */
export function unregisteredTypesError(types: string[]): Error {
  return new Error(
    `[fancy-echarts] This chart uses ${types.join(", ")}, which is likely not registered, ` +
      `so ECharts would draw nothing for it. ` +
      `Call registerAll() once at app startup, or registerCharts(...)/registerComponents(...) for the types you use. ` +
      `Registration is module-scoped per bundle entry — every entry that renders charts must register.`,
  );
}

/**
 * echarts' init() throws when no renderer was registered: in a production
 * bundle as an opaque "Xa[a] is not a constructor". A page that never called
 * registerAll() hits this before any option is looked at.
 */
export function chartInitError(renderer: string, err: unknown): Error {
  return new Error(
    `[fancy-echarts] Failed to start the chart: the "${renderer}" renderer is likely not registered. ` +
      `Call registerAll() once at app startup, or register ${renderer === "svg" ? "SVGRenderer" : "CanvasRenderer"} ` +
      `with your chart types. Registration is module-scoped per bundle entry — every entry that renders charts must register. ` +
      `Original error: ${err instanceof Error ? err.message : String(err)}`,
  );
}

/** Whether an option draws through echarts-gl. */
function usesWebGL(option: EChartsOption): boolean {
  const o = option as Record<string, unknown>;
  if (["globe", "grid3D", "geo3D", "mapbox3D", "maptalks3D"].some((key) => o[key] != null)) {
    return true;
  }
  const series = Array.isArray(o.series) ? o.series : o.series ? [o.series] : [];
  return series.some((s) => {
    const type = (s as { type?: unknown })?.type;
    return typeof type === "string" && (/(3D|GL)$/.test(type) || type === "surface");
  });
}

/**
 * A capture reads the canvas straight after the first render, so anything still
 * animating would be caught at its first frame: bars at height zero. A series'
 * own `animation` outranks the global one, so both go off.
 */
function withoutAnimation(option: EChartsOption): EChartsOption {
  const off = (series: unknown) => ({ ...(series as object), animation: false });
  const { series } = option;

  return {
    ...option,
    animation: false,
    ...(series === undefined
      ? null
      : { series: Array.isArray(series) ? series.map(off) : off(series) }),
  } as EChartsOption;
}

/**
 * Render an option to a PNG data URL with the theme and background you pinned, for
 * a PDF or anything else that must look the same on every machine.
 *
 * It renders a separate, offscreen chart. Calling `getDataURL` on a chart already
 * on screen is not enough: with no `theme` that chart follows
 * `prefers-color-scheme`, so a capture on a dark-mode machine comes out with light
 * text on a transparent background. Its `getOption()` does not help either, because
 * the live theme's colours are already merged into it.
 *
 * Browser only, and synchronous, so an option that loads remote images must have
 * them loaded first. The types the option uses must be registered, as for any chart.
 * Throws on a WebGL (echarts-gl) option rather than return a blank image.
 */
export function captureEChart(
  option: EChartsOption,
  {
    backgroundColor = "#ffffff",
    theme,
    width = 800,
    height = 400,
    pixelRatio = 2,
    excludeComponents,
  }: EChartCaptureOptions,
): string {
  // echarts-gl draws its first frame later, so this would return a blank image of
  // the right size, and nothing downstream could tell.
  if (usesWebGL(option)) {
    throw new Error(
      `[fancy-echarts] captureEChart cannot capture a WebGL (echarts-gl) chart: its first frame is drawn later, ` +
        `so the image would be blank. Pin the \`theme\` prop on the mounted chart, wait for it to draw, ` +
        `and call ref.current.instance.getDataURL({ type: "png", backgroundColor }).`,
    );
  }

  // A PNG needs the canvas renderer, whichever one the app registered for screen.
  echartsUse(CanvasRenderer);

  const chart = init(document.createElement("div"), theme, {
    renderer: "canvas",
    width,
    height,
  });

  try {
    const pinned = { ...withoutAnimation(option), backgroundColor };
    try {
      chart.setOption(pinned, { notMerge: true, lazyUpdate: false });
    } catch (err) {
      throw chartRenderError(pinned, err);
    }
    return chart.getDataURL({ type: "png", pixelRatio, backgroundColor, excludeComponents });
  } finally {
    chart.dispose();
  }
}
