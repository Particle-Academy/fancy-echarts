import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type ForwardedRef,
  type RefObject,
} from "react";
import { init, getInstanceByDom, type EChartsType } from "echarts/core";
import type { EChartsOption } from "echarts";

type ECharts = EChartsType;
import { useResizeObserver } from "./use-resize-observer";
import {
  captureEChart,
  chartRenderError,
  type EChartCaptureOptions,
} from "../utils/capture";
import type { EChartHandle } from "../types";

export interface UseEChartsOptions {
  option: EChartsOption;
  theme?: string | object;
  renderer?: "canvas" | "svg";
  notMerge?: boolean;
  lazyUpdate?: boolean;
  showLoading?: boolean;
  loadingOption?: object;
  onEvents?: Record<string, (params: any) => void>;
  autoResize?: boolean;
}

export interface UseEChartsReturn {
  chartRef: RefObject<HTMLDivElement | null>;
  instance: ECharts | null;
  /** Render the current `option` to a PNG data URL with a pinned theme and background. */
  capture: (options: EChartCaptureOptions) => string;
}

/** Detect system dark mode preference reactively. */
function useDarkMode(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
}

export function useECharts(options: UseEChartsOptions): UseEChartsReturn {
  const {
    option,
    theme,
    renderer = "canvas",
    notMerge = false,
    lazyUpdate = false,
    showLoading = false,
    loadingOption,
    onEvents,
    autoResize = true,
  } = options;

  const isDark = useDarkMode();
  // Auto-detect theme: use explicit theme if provided, otherwise "dark" or undefined
  const autoDark = theme === undefined && isDark;
  const resolvedTheme = theme !== undefined ? theme : isDark ? "dark" : undefined;

  const chartRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<ECharts | null>(null);
  const [instance, setInstance] = useState<ECharts | null>(null);
  // What a capture renders. Not the instance's getOption(): the live theme's
  // colours are merged into that.
  const optionRef = useRef(option);

  // Init/dispose — re-init when theme changes (including dark mode toggle)
  useEffect(() => {
    if (!chartRef.current) return;

    // Dispose any existing instance (handles StrictMode double-mount)
    const existing = getInstanceByDom(chartRef.current);
    if (existing) {
      existing.dispose();
    }

    const chart = init(chartRef.current, resolvedTheme, { renderer });
    instanceRef.current = chart;
    setInstance(chart);

    return () => {
      chart.dispose();
      instanceRef.current = null;
      setInstance(null);
    };
  }, [resolvedTheme, renderer]);

  // Set option
  useEffect(() => {
    optionRef.current = option;
    const chart = instanceRef.current;
    if (!chart || !option) return;
    // When using auto-detected dark theme, force transparent background
    // so charts blend with the page's own dark background
    const finalOption = autoDark
      ? { backgroundColor: "transparent", ...option }
      : option;
    try {
      chart.setOption(finalOption, { notMerge, lazyUpdate });
    } catch (err) {
      throw chartRenderError(finalOption, err);
    }
  }, [option, notMerge, lazyUpdate, autoDark]);

  // Loading state
  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart) return;
    if (showLoading) {
      chart.showLoading("default", loadingOption);
    } else {
      chart.hideLoading();
    }
  }, [showLoading, loadingOption]);

  // Event binding
  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart || !onEvents) return;

    const entries = Object.entries(onEvents);
    for (const [event, handler] of entries) {
      chart.on(event, handler);
    }

    return () => {
      for (const [event, handler] of entries) {
        chart.off(event, handler);
      }
    };
  }, [onEvents]);

  // Auto-resize
  useResizeObserver(chartRef, () => {
    if (autoResize && instanceRef.current) {
      instanceRef.current.resize();
    }
  });

  const capture = useCallback((captureOptions: EChartCaptureOptions) => {
    const el = chartRef.current;
    return captureEChart(optionRef.current, {
      ...(el?.clientWidth ? { width: el.clientWidth } : null),
      ...(el?.clientHeight ? { height: el.clientHeight } : null),
      ...captureOptions,
    });
  }, []);

  return { chartRef, instance, capture };
}

/**
 * Give a component's forwarded ref its {@link EChartHandle}.
 *
 * Getters rather than a captured value: the ref attaches before the effect that
 * creates the instance runs, and a theme change replaces the instance while the
 * ref stays put.
 */
export function useEChartHandle(
  ref: ForwardedRef<EChartHandle>,
  { chartRef, capture }: Pick<UseEChartsReturn, "chartRef" | "capture">,
): void {
  useImperativeHandle(
    ref,
    () => ({
      get instance() {
        const el = chartRef.current;
        return (el && getInstanceByDom(el)) ?? null;
      },
      get element() {
        return chartRef.current;
      },
      capture,
    }),
    [chartRef, capture],
  );
}
