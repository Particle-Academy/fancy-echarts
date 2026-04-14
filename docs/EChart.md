# EChart

Base chart component and compound series sub-components for rendering any ECharts chart type in React.

## Import

```tsx
import { EChart } from "@particle-academy/react-echarts";
```

## Base Component

`EChart` accepts a raw ECharts option object for full control.

```tsx
<EChart
  option={{
    xAxis: { type: "category", data: ["Mon", "Tue", "Wed"] },
    yAxis: { type: "value" },
    series: [{ type: "line", data: [150, 230, 224] }],
  }}
  style={{ height: 400 }}
/>
```

### Base Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `option` | `EChartsOption` | **required** | Full ECharts option object |
| `theme` | `string \| object` | `undefined` | Theme name or object. Auto-detects dark mode when omitted |
| `renderer` | `"canvas" \| "svg"` | `"canvas"` | Rendering engine |
| `notMerge` | `boolean` | `false` | Replace option instead of merging |
| `lazyUpdate` | `boolean` | `false` | Delay chart update |
| `showLoading` | `boolean` | `false` | Show loading animation |
| `loadingOption` | `object` | `undefined` | Customize loading spinner |
| `onEvents` | `Record<string, (params) => void>` | `undefined` | Event handlers keyed by event name |
| `autoResize` | `boolean` | `true` | Auto-resize on container size change |
| `style` | `CSSProperties` | `{ width: "100%", height: 400 }` | Container styles |
| `className` | `string` | `undefined` | CSS class name |

Also accepts any `HTMLDivElement` attribute.

## Series Sub-Components

All sub-components share a simplified props API. They build the ECharts option internally.

### Shared Series Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `any[] \| { categories?, series[] }` | **required** | Chart data (see formats below) |
| `title` | `string` | `undefined` | Chart title text |
| `xAxis` | `EChartsOption["xAxis"]` | `{ type: "category" }` | X-axis config (axis charts only) |
| `yAxis` | `EChartsOption["yAxis"]` | `{ type: "value" }` | Y-axis config (axis charts only) |
| `tooltip` | `boolean \| object` | `true` | Tooltip config. `true` = `{ trigger: "axis" }` |
| `legend` | `boolean \| object` | `false` | Legend config. `true` = default legend |
| `grid` | `EChartsOption["grid"]` | `undefined` | Grid layout config |
| `seriesOptions` | `Record<string, any>` | `{}` | Extra options merged into each series |
| `option` | `Partial<EChartsOption>` | `{}` | Extra ECharts options merged last (overrides everything) |

Plus all base props (`theme`, `renderer`, `autoResize`, etc.) and HTML div attributes.

### Data Formats

**Single series** -- pass an array directly:

```tsx
<EChart.Line data={[150, 230, 224, 218, 135]} />
```

**Multi-series** -- pass an object with `categories` and `series`:

```tsx
<EChart.Bar
  data={{
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [
      { name: "2024", data: [120, 200, 150, 80] },
      { name: "2025", data: [180, 230, 190, 140] },
    ],
  }}
  legend
/>
```

## Available Sub-Components

### Axis-based charts

These automatically configure `xAxis` / `yAxis`.

| Component | Series Type | Typical Data |
|-----------|-------------|-------------|
| `EChart.Line` | `line` | `number[]` or `[x, y][]` |
| `EChart.Bar` | `bar` | `number[]` or `[x, y][]` |
| `EChart.Scatter` | `scatter` | `[x, y][]` |
| `EChart.Candlestick` | `candlestick` | `[open, close, low, high][]` |
| `EChart.Boxplot` | `boxplot` | `[min, Q1, median, Q3, max][]` |
| `EChart.Heatmap` | `heatmap` | `[x, y, value][]` |
| `EChart.EffectScatter` | `effectScatter` | `[x, y][]` |
| `EChart.PictorialBar` | `pictorialBar` | `number[]` |

### Non-axis charts

These do NOT auto-configure axes.

| Component | Series Type | Typical Data |
|-----------|-------------|-------------|
| `EChart.Pie` | `pie` | `{ name, value }[]` |
| `EChart.Radar` | `radar` | `{ name, value[] }[]` (requires `radar` in `option`) |
| `EChart.Gauge` | `gauge` | `{ value, name? }[]` |
| `EChart.Funnel` | `funnel` | `{ name, value }[]` |
| `EChart.Treemap` | `treemap` | `{ name, value, children? }[]` |
| `EChart.Sunburst` | `sunburst` | `{ name, value?, children? }[]` |
| `EChart.Sankey` | `sankey` | Requires `nodes` and `links` via `seriesOptions` |
| `EChart.Graph` | `graph` | Requires `nodes` and `links` via `seriesOptions` |
| `EChart.Parallel` | `parallel` | `number[][]` (requires `parallelAxis` in `option`) |
| `EChart.ThemeRiver` | `themeRiver` | `[date, value, name][]` |
| `EChart.Map` | `map` | `{ name, value }[]` (requires map registration + `seriesOptions.map`) |
| `EChart.Custom` | `custom` | Any (requires `seriesOptions.renderItem`) |

## Examples

### Line Chart

```tsx
<EChart.Line
  title="Monthly Sales"
  data={[820, 932, 901, 934, 1290, 1330, 1320]}
  seriesOptions={{ smooth: true, areaStyle: {} }}
/>
```

### Pie Chart

```tsx
<EChart.Pie
  title="Browser Share"
  data={[
    { name: "Chrome", value: 65 },
    { name: "Firefox", value: 15 },
    { name: "Safari", value: 12 },
    { name: "Edge", value: 8 },
  ]}
  seriesOptions={{ radius: ["40%", "70%"] }}
  legend
/>
```

### Multi-Series Bar

```tsx
<EChart.Bar
  title="Revenue by Quarter"
  data={{
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [
      { name: "Product A", data: [120, 200, 150, 80] },
      { name: "Product B", data: [60, 140, 190, 220] },
    ],
  }}
  legend
/>
```

### Scatter with Event Handling

```tsx
<EChart.Scatter
  data={[[10, 20], [30, 40], [50, 60], [70, 80]]}
  seriesOptions={{ symbolSize: 12 }}
  onEvents={{
    click: (params) => console.log("Clicked:", params.data),
  }}
/>
```

### Gauge

```tsx
<EChart.Gauge
  data={[{ value: 72, name: "Completion" }]}
  seriesOptions={{ detail: { formatter: "{value}%" } }}
/>
```

### Full Control via Base Component

```tsx
<EChart
  option={{
    radar: {
      indicator: [
        { name: "Sales", max: 100 },
        { name: "Admin", max: 100 },
        { name: "Tech", max: 100 },
      ],
    },
    series: [{
      type: "radar",
      data: [{ value: [80, 60, 90], name: "Team A" }],
    }],
  }}
  theme="dark-preset"
/>
```
