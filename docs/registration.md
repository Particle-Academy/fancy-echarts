# Registration

ECharts uses a modular architecture. You must register chart types and components before using them. This package provides helpers for both quick-start and tree-shaking-optimized approaches.

## Import

```tsx
import {
  registerAll,
  registerCharts,
  registerComponents,
  // Individual charts
  LineChart, BarChart, PieChart, ScatterChart, RadarChart,
  HeatmapChart, GaugeChart, FunnelChart, TreemapChart, SunburstChart,
  SankeyChart, GraphChart, CandlestickChart, BoxplotChart, ParallelChart,
  ThemeRiverChart, MapChart, CustomChart, EffectScatterChart, PictorialBarChart,
  // Components
  GridComponent, TooltipComponent, TitleComponent, LegendComponent,
  DataZoomComponent, ToolboxComponent, VisualMapComponent, GeoComponent,
  CalendarComponent, GraphicComponent, PolarComponent, DatasetComponent,
  // Renderers
  CanvasRenderer, SVGRenderer,
} from "react-echarts";
```

## Quick Start: registerAll

Registers all chart types, all components, and both renderers. Convenient but not tree-shakeable.

```tsx
// Call once at app entry (e.g., main.tsx)
import { registerAll } from "react-echarts";
registerAll();
```

Calling `registerAll()` multiple times is safe -- it no-ops after the first call.

## Selective Registration

### registerCharts

Register only the chart types you need.

```tsx
import {
  registerCharts,
  LineChart,
  BarChart,
  PieChart,
} from "react-echarts";

registerCharts(LineChart, BarChart, PieChart);
```

### registerComponents

Register only the UI components you need.

```tsx
import {
  registerComponents,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from "react-echarts";

registerComponents(GridComponent, TooltipComponent, TitleComponent, LegendComponent);
```

### Manual Registration

For full control, import and register directly via `echarts/core`:

```tsx
import { use } from "echarts/core";
import { LineChart } from "react-echarts";
import { GridComponent, TooltipComponent } from "react-echarts";
import { CanvasRenderer } from "react-echarts";

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);
```

## Available Charts

| Export | ECharts Type |
|--------|-------------|
| `LineChart` | `line` |
| `BarChart` | `bar` |
| `PieChart` | `pie` |
| `ScatterChart` | `scatter` |
| `RadarChart` | `radar` |
| `HeatmapChart` | `heatmap` |
| `GaugeChart` | `gauge` |
| `FunnelChart` | `funnel` |
| `TreemapChart` | `treemap` |
| `SunburstChart` | `sunburst` |
| `SankeyChart` | `sankey` |
| `GraphChart` | `graph` |
| `CandlestickChart` | `candlestick` |
| `BoxplotChart` | `boxplot` |
| `ParallelChart` | `parallel` |
| `ThemeRiverChart` | `themeRiver` |
| `MapChart` | `map` |
| `CustomChart` | `custom` |
| `EffectScatterChart` | `effectScatter` |
| `PictorialBarChart` | `pictorialBar` |

## Available Components

| Export | Purpose |
|--------|---------|
| `GridComponent` | Cartesian grid layout |
| `TooltipComponent` | Hover tooltips |
| `TitleComponent` | Chart title |
| `LegendComponent` | Series legend |
| `DataZoomComponent` | Zoom/pan controls |
| `ToolboxComponent` | Save, restore, data view tools |
| `VisualMapComponent` | Color/size mapping |
| `GeoComponent` | Geographic coordinate system |
| `CalendarComponent` | Calendar heatmap layout |
| `GraphicComponent` | Custom graphic elements |
| `PolarComponent` | Polar coordinate system |
| `DatasetComponent` | Dataset-driven charts |

## Renderers

| Export | Description |
|--------|-------------|
| `CanvasRenderer` | Canvas-based rendering (default, better performance) |
| `SVGRenderer` | SVG-based rendering (better for small charts, CSS styling) |

## Recommended Setup

For production apps, register only what you use:

```tsx
// chart-setup.ts
import { registerCharts, registerComponents, CanvasRenderer } from "react-echarts";
import { LineChart, BarChart, PieChart } from "react-echarts";
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from "react-echarts";
import { use } from "echarts/core";

registerCharts(LineChart, BarChart, PieChart);
registerComponents(GridComponent, TooltipComponent, TitleComponent, LegendComponent);
use([CanvasRenderer]);
```

```tsx
// main.tsx
import "./chart-setup";
```
