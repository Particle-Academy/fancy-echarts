# EChart

Base chart component and compound series sub-components for rendering any ECharts chart type in React.

## Import

```tsx
import { EChart } from "@particle-academy/fancy-echarts";
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

## Ref

A `ref` on `EChart`, on any series shorthand (`EChart.Line`, ...), on `EChart3D` and on `EChartGraphic` holds an `EChartHandle`:

| Member | Type | Description |
|--------|------|-------------|
| `instance` | `ECharts \| null` | The live ECharts instance. Read it when you need it: a theme or renderer change replaces it |
| `element` | `HTMLDivElement \| null` | The element the chart renders into |
| `capture(options)` | `string` | A PNG data URL with a pinned theme and background. See [Capture](#capture) |

```tsx
const ref = useRef<EChartHandle>(null);

<EChart ref={ref} option={option} />;

ref.current?.instance?.dispatchAction({ type: "highlight", seriesIndex: 0 });
```

## Capture

For a PDF, a report or anything else that must look the same on every machine. Pin the background, and the theme if you want one other than ECharts' default:

```tsx
const png = ref.current?.capture({ backgroundColor: "#ffffff", width: 800, height: 400 });
```

`instance.getDataURL()` is not enough for this. With no `theme` prop the chart on screen follows `prefers-color-scheme`, so on a dark-mode machine it comes out with light text on a transparent background. `capture` renders a separate offscreen chart instead, with animation off, and leaves the one on screen alone.

To capture without mounting a chart at all:

```tsx
import { captureEChart } from "@particle-academy/fancy-echarts";

const png = captureEChart(option, { backgroundColor: "#ffffff", theme: "dark" });
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `backgroundColor` | `string` | **required** | The background, or `"transparent"` to ask for none. Wins over one in the option |
| `theme` | `string \| object` | ECharts' default | Theme name or object. Never follows the machine |
| `width` / `height` | `number` | The element's size, or 800 x 400 | CSS pixels |
| `pixelRatio` | `number` | `2` | Output pixels per CSS pixel |
| `excludeComponents` | `string[]` | - | Component types to leave out, such as `["toolbox"]` |

It renders from the chart's current `option` prop:

- **Calls you made yourself on the instance are not included**, nor are pieces of an earlier `option` that the default merge left on screen. Pass `notMerge` or a complete option if that matters.
- **It is synchronous**, so remote images in the option must already be loaded.
- **WebGL charts throw.** echarts-gl draws its first frame later, so the image would be blank. For those, pin the `theme` prop, wait for the chart to draw, and call `ref.current.instance.getDataURL({ type: "png", backgroundColor })`.

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
