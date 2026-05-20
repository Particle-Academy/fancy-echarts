// Components
export { EChart } from "./components/EChart";
export { EChart3D } from "./components/EChart3D";
export { EChartGraphic } from "./components/EChartGraphic";
export type { GraphicElement, EChartGraphicProps } from "./components/EChartGraphic";

// Hooks
export { useECharts } from "./hooks/use-echarts";
export type { UseEChartsOptions, UseEChartsReturn } from "./hooks/use-echarts";
export { useResizeObserver } from "./hooks/use-resize-observer";

// Types
export type {
  EChartsOption,
  EChartsInstance,
  EChartBaseProps,
  EChartComponentProps,
  SeriesComponentProps,
  ChartDivProps,
} from "./types";

// Utils
export {
  registerAll,
  registerCharts,
  registerComponents,
  // Individual charts for manual registration
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  RadarChart,
  HeatmapChart,
  GaugeChart,
  FunnelChart,
  TreemapChart,
  SunburstChart,
  SankeyChart,
  GraphChart,
  CandlestickChart,
  BoxplotChart,
  ParallelChart,
  ThemeRiverChart,
  MapChart,
  CustomChart,
  EffectScatterChart,
  PictorialBarChart,
  // Components
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  VisualMapComponent,
  GeoComponent,
  CalendarComponent,
  GraphicComponent,
  PolarComponent,
  DatasetComponent,
  // Renderers
  CanvasRenderer,
  SVGRenderer,
} from "./utils/register";

export {
  darkTheme,
  vintageTheme,
  pastelTheme,
  registerTheme,
  registerBuiltinThemes,
} from "./utils/themes";

// NOTE — the hand-rolled diagram subsystem (Diagram, DataDiagram, Flowchart,
// Mindmap, OrgChart) was removed in 4.0.0. ECharts and fancy-flow each own
// their domain now:
//   - charts (bar/line/pie/sankey/etc) → real ECharts via <EChart> here
//   - node-edge graphs (flows, org trees, ERDs) → fancy-flow's <FlowEditor>
// Migration guide: README.md → "Migrating from 3.x".
