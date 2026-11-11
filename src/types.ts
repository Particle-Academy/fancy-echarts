import type {
  EChartsOption,
  SetOptionOpts,
  ECharts as EChartsInstance,
} from "echarts";

import type { EChartCaptureOptions } from "./utils/capture";

export type { EChartsOption, SetOptionOpts, EChartsInstance };

/**
 * What a `ref` on `EChart`, `EChart3D`, `EChartGraphic` or a series shorthand holds.
 * The same object for the life of the component. `instance` always reads the current
 * ECharts instance, because a theme or renderer change disposes and replaces it.
 */
export interface EChartHandle {
  /** The live ECharts instance, or `null` before the first effect has run. */
  readonly instance: EChartsInstance | null;
  /** The element the chart renders into. */
  readonly element: HTMLDivElement | null;
  /**
   * Render the chart's current `option` prop offscreen to a PNG data URL, with the
   * theme and background you pin, at this element's size unless told otherwise.
   */
  capture(options: EChartCaptureOptions): string;
}

export interface EChartBaseProps {
  option: EChartsOption;
  theme?: string | object;
  renderer?: "canvas" | "svg";
  notMerge?: boolean;
  lazyUpdate?: boolean;
  showLoading?: boolean;
  loadingOption?: object;
  onEvents?: Record<string, (params: any) => void>;
  autoResize?: boolean;
  /**
   * Called with a clear `[fancy-echarts] …` error when the chart cannot render:
   * a renderer, chart type or component that was never registered, or an option
   * ECharts rejects. Also logged with `console.error`, and the chart element gets
   * `data-echart-error`. Never thrown into React, so the page around it survives.
   */
  onRenderError?: (error: Error) => void;
}

export interface SeriesComponentProps<T = any>
  extends Omit<EChartBaseProps, "option"> {
  data: T;
  title?: string;
  xAxis?: EChartsOption["xAxis"];
  yAxis?: EChartsOption["yAxis"];
  tooltip?: boolean | EChartsOption["tooltip"];
  legend?: boolean | EChartsOption["legend"];
  grid?: EChartsOption["grid"];
  seriesOptions?: Record<string, any>;
  option?: Partial<EChartsOption>;
}

export interface ChartDivProps {
  style?: React.CSSProperties;
  className?: string;
}

export type EChartComponentProps = EChartBaseProps &
  ChartDivProps &
  React.HTMLAttributes<HTMLDivElement>;
