import React, { forwardRef, useMemo } from "react";
import type { EChartsOption } from "echarts";
import { useECharts, useEChartHandle } from "../hooks/use-echarts";
import type { EChartBaseProps, EChartHandle, ChartDivProps } from "../types";

export interface GraphicElement {
  type:
    | "rect"
    | "circle"
    | "ring"
    | "arc"
    | "polygon"
    | "polyline"
    | "path"
    | "image"
    | "text"
    | "group";
  left?: number | string;
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  shape?: Record<string, any>;
  style?: Record<string, any>;
  children?: GraphicElement[];
  onclick?: (e: any) => void;
  onmouseover?: (e: any) => void;
  onmouseout?: (e: any) => void;
  [key: string]: any;
}

export interface EChartGraphicProps
  extends Omit<EChartBaseProps, "option">,
    ChartDivProps,
    React.HTMLAttributes<HTMLDivElement> {
  elements: GraphicElement[];
  option?: Partial<EChartsOption>;
}

const DEFAULT_STYLE: React.CSSProperties = { width: "100%", height: 400 };

/**
 * EChartGraphic — for custom drawing via ECharts graphic layer.
 * Supports rect, circle, ring, arc, polygon, polyline, path, image, text, group elements.
 */
export const EChartGraphic = forwardRef<EChartHandle, EChartGraphicProps>(
  (
    {
      elements,
      option: extraOption = {},
      theme,
      renderer,
      notMerge,
      lazyUpdate,
      showLoading,
      loadingOption,
      onEvents,
      autoResize = true,
      style,
      className,
      ...rest
    },
    ref
  ) => {
    const option = useMemo((): EChartsOption => {
      return {
        graphic: {
          elements,
        },
        ...extraOption,
      } as EChartsOption;
    }, [elements, extraOption]);

    const chart = useECharts({
      option,
      theme,
      renderer,
      notMerge,
      lazyUpdate,
      showLoading,
      loadingOption,
      onEvents,
      autoResize,
    });
    useEChartHandle(ref, chart);

    return (
      <div
        ref={chart.chartRef}
        style={{ ...DEFAULT_STYLE, ...style }}
        className={className}
        {...rest}
      />
    );
  }
);

EChartGraphic.displayName = "EChartGraphic";
