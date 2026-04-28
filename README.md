# @particle-academy/fancy-echarts

React component library wrapping [Apache ECharts](https://echarts.apache.org/) with typed components for every chart type — 2D, 3D, and graphic layers.

## Installation

```bash
# npm
npm install @particle-academy/fancy-echarts echarts

# pnpm
pnpm add @particle-academy/fancy-echarts echarts

# yarn
yarn add @particle-academy/fancy-echarts echarts
```

For 3D charts (globe, surface, scatter3D, bar3D):

```bash
npm install echarts-gl
```

**Peer dependencies:** `react >= 18`, `react-dom >= 18`, `echarts >= 5.5`

## Quick Start

```tsx
import { EChart, registerAll } from "@particle-academy/fancy-echarts";

// Register all chart types (convenience for quick start)
registerAll();

function App() {
  return (
    <EChart
      option={{
        xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
        yAxis: { type: "value" },
        series: [{ type: "bar", data: [120, 200, 150, 80, 70] }],
      }}
    />
  );
}
```

## Security: untrusted formatter strings

ECharts permits HTML strings in many `option` text fields — `tooltip.formatter`, `title.subtext`, `legend.formatter`, axis label `formatter`, etc. The wrapper forwards your `option` to ECharts as-is. If a formatter string interpolates user-generated data, sanitize it first or use a function formatter and assemble safe DOM:

```tsx
// ❌ Unsafe — user-controlled name renders as HTML
option={{
  tooltip: { formatter: `<b>${userName}</b>: ${value}` },
}}

// ✅ Function formatter, escape user input
option={{
  tooltip: {
    formatter: (params) => {
      const safe = params.name.replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      }[c]!));
      return `<b>${safe}</b>: ${params.value}`;
    },
  },
}}
```

This is consumer responsibility — the wrapper does not introspect `option` to identify HTML-bearing fields.

## Documentation

Full component documentation is available in the [docs/](docs/) folder:

| Topic | Description |
|-------|-------------|
| [EChart](docs/EChart.md) | Base chart component + all 20 series sub-components |
| [EChart3D](docs/EChart3D.md) | 3D charts (Bar, Scatter, Line, Surface, Globe) |
| [EChartGraphic](docs/EChartGraphic.md) | Custom drawing with the graphic API |
| [useECharts](docs/useECharts.md) | Core hook for custom integrations |
| [Registration](docs/registration.md) | Tree shaking and selective chart registration |
| [Themes](docs/themes.md) | Built-in themes and custom theme creation |

## Components

### `<EChart>` — Base Component

Accepts any ECharts option object. Full power of ECharts with React lifecycle management.

```tsx
<EChart
  option={echartsOption}
  theme="dark"
  renderer="canvas"
  autoResize={true}
  onEvents={{ click: (params) => console.log(params) }}
  style={{ height: 500 }}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `option` | `EChartsOption` | — | ECharts option object |
| `theme` | `string \| object` | auto | Theme name or object. Auto-detects dark mode if omitted |
| `renderer` | `"canvas" \| "svg"` | `"canvas"` | Rendering engine |
| `notMerge` | `boolean` | `false` | Replace option instead of merging |
| `lazyUpdate` | `boolean` | `false` | Delay chart update |
| `showLoading` | `boolean` | `false` | Show loading animation |
| `loadingOption` | `object` | — | Loading animation config |
| `onEvents` | `Record<string, Function>` | — | Event handlers (`click`, `mouseover`, etc.) |
| `autoResize` | `boolean` | `true` | Auto-resize on container change |
| `style` | `CSSProperties` | `{ width: "100%", height: 400 }` | Container style |

### `<EChart3D>` — 3D Charts

Separate component that automatically loads `echarts-gl` before rendering. Shows a loading placeholder until the 3D engine is ready.

```tsx
import { EChart3D } from "@particle-academy/fancy-echarts";

<EChart3D
  option={{
    globe: {
      baseColor: "#1a3b5c",
      shading: "color",
      atmosphere: { show: true },
      viewControl: { autoRotate: true },
    },
  }}
  style={{ height: 500 }}
/>
```

### `<EChartGraphic>` — Graphic Layer

For custom drawing with the ECharts graphic API.

```tsx
import { EChartGraphic } from "@particle-academy/fancy-echarts";

<EChartGraphic
  elements={[
    { type: "circle", shape: { cx: 100, cy: 100, r: 50 }, style: { fill: "#5470c6" } },
    { type: "text", style: { text: "Hello", x: 100, y: 100, fill: "#fff" } },
  ]}
/>
```

## Hooks

### `useECharts`

Core hook for custom integrations:

```tsx
import { useECharts } from "@particle-academy/fancy-echarts";

function CustomChart() {
  const { chartRef, instance } = useECharts({
    option: { /* ... */ },
    autoResize: true,
  });

  return <div ref={chartRef} style={{ width: "100%", height: 400 }} />;
}
```

## Dark Mode

Dark mode is automatic. When no `theme` prop is provided, the component detects `prefers-color-scheme: dark` and applies ECharts' built-in dark theme with a transparent background (so charts blend with your page's dark background). The theme updates reactively when the user toggles their system preference.

To override, pass a specific `theme` prop:

```tsx
<EChart option={option} theme="dark" />    {/* Always dark */}
<EChart option={option} theme="vintage" /> {/* Always vintage */}
<EChart option={option} />                 {/* Auto dark/light */}
```

## Tree Shaking

For production bundle optimization, use `registerCharts` to register only the chart types you need instead of `registerAll`:

```tsx
import { registerCharts, BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer } from "@particle-academy/fancy-echarts";

registerCharts([BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer]);
```

## Themes

Built-in theme presets:

```tsx
import { registerBuiltinThemes } from "@particle-academy/fancy-echarts";

registerBuiltinThemes(); // Registers "dark-preset", "vintage", "pastel"

<EChart option={option} theme="vintage" />
```

## Supported Chart Types

**2D Charts:** Line, Bar, Pie, Scatter, Radar, Heatmap, Candlestick, Boxplot, Treemap, Sunburst, Funnel, Gauge, Sankey, Graph, Parallel, ThemeRiver, Calendar, PictorialBar, Map, Custom, EffectScatter

**3D Charts:** Bar3D, Scatter3D, Line3D, Surface, Globe

**Graphic:** Rect, Circle, Ring, Arc, Polygon, Polyline, Path, Image, Text, Group — with keyframe animation support

## License

MIT
