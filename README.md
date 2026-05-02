# @particle-academy/fancy-echarts

React component library wrapping [Apache ECharts](https://echarts.apache.org/) with typed components for every chart type — 2D, 3D, and graphic layers.

## Installation

```bash
# npm
npm install @particle-academy/fancy-echarts

# pnpm
pnpm add @particle-academy/fancy-echarts

# yarn
yarn add @particle-academy/fancy-echarts
```

`echarts` is a peer dependency. **npm 7+** and **yarn 3+** install peer deps automatically — nothing extra needed. **pnpm** needs `auto-install-peers=true` in `.npmrc`, or run `pnpm add echarts` once.

3D charts (globe, surface, scatter3D, bar3D) need the optional `echarts-gl` peer dep:

```bash
npm install echarts-gl
```

**Peer dependencies:** `react >= 18`, `react-dom >= 18`, `echarts >= 5.5`, `echarts-gl >= 2.0` (optional, only needed for 3D)

> **Breaking change in 2.0** — `echarts` and `echarts-gl` moved from regular dependencies to peer dependencies. If you're on npm 7+ or yarn 3+ the upgrade is transparent. On older tooling or pnpm without auto-install, run `npm install echarts` (and `echarts-gl` if you use 3D charts) once.

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

## Recipes: ECharts × react-fancy

`fancy-echarts` is a thin wrapper — every interaction surface is reachable through `onEvents`, `useECharts().instance`, and `tooltip.formatter`. These recipes cover the patterns that hold up across charts.

### Wrap any chart with a Popover, ContextMenu, and Action button

The pattern that scales: a single `ChartFrame` wrapper that gives every chart an info popover next to the title, action buttons in the header, and a right-click context menu on the body. Build it once, reuse for every chart type:

```tsx
import { Card, Popover, Action, Badge, ContextMenu, Icon, useToast } from "@particle-academy/react-fancy";

function ChartFrame({ title, info, actions = [], onExport, extraMenu, children }) {
  const { toast } = useToast();
  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            <Popover hover placement="right">
              <Popover.Trigger>
                <button><Icon name="info" size="sm" /></button>
              </Popover.Trigger>
              <Popover.Content>
                <p className="w-64 text-sm text-zinc-500">{info}</p>
              </Popover.Content>
            </Popover>
          </div>
          <div className="flex gap-2">
            {actions.map((a) => <Action key={a.label} size="sm" onClick={a.onClick}>{a.label}</Action>)}
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        <ContextMenu>
          <ContextMenu.Trigger><div>{children}</div></ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item onClick={onExport}>Export CSV</ContextMenu.Item>
            <ContextMenu.Item onClick={() => toast({ title: "Exported PNG" })}>Export PNG</ContextMenu.Item>
            {extraMenu && <ContextMenu.Separator />}
            {extraMenu}
          </ContextMenu.Content>
        </ContextMenu>
      </Card.Body>
    </Card>
  );
}

<ChartFrame title="Revenue" info="..." actions={[{ label: "Forecast", onClick: ... }]}>
  <EChart option={lineOption} style={{ height: 320 }} />
</ChartFrame>
```

Three reasons this works: `<ContextMenu.Trigger>` wraps the chart canvas without injecting DOM into ECharts, `Popover hover` is independent of any chart event, and the chart inside is unaware of the frame.

### Right-click a data point → open a Modal drill-down

`onEvents.contextmenu` fires per-datum with the same `params` shape as `click`. Call `params.event.event.preventDefault()` to suppress the browser menu, then drive your own state.

```tsx
<EChart
  option={barOption}
  onEvents={{
    contextmenu: (params) => {
      params.event.event.preventDefault();
      const region = regions.find((r) => r.name === params.name);
      setDrill(region);  // opens a <Modal>
    },
  }}
/>
```

If you also wrap the chart in `<ContextMenu>` (chart-level actions), this still works — the per-bar `contextmenu` event fires *and* the wrapper menu opens. Suppress one or the other based on which event the cursor was over.

### Click-to-toast and hover-popover on a slice

`onEvents.click` for actions, native ECharts `tooltip` for hover details — they don't conflict.

```tsx
<EChart
  option={{
    tooltip: { trigger: "item", formatter: "{b}<br/>${c}k ({d}%)" },
    series: [{ type: "pie", data: categories }],
  }}
  onEvents={{
    click: (p) => toast({ title: `${p.name}: ${p.percent}%`, variant: "info" }),
  }}
/>
```

### Rich HTML tooltips with sanitized data

`tooltip.formatter` accepts a function returning an HTML string. Compose colored arrows, badges, and metadata — but always escape user input.

```tsx
tooltip: {
  trigger: "axis",
  formatter: (params) => {
    const p = params[0];
    const region = regions.find((r) => r.name === p.name);
    const arrow = region.growth >= 0 ? "▲" : "▼";
    const color = region.growth >= 15 ? "#10b981" : "#3b82f6";
    return `<div style="font-weight:600">${escape(p.name)}</div>
            <div>Revenue: <b>$${p.value.toLocaleString()}k</b></div>
            <div style="color:${color}">${arrow} ${region.growth}% YoY</div>`;
  },
}
```

For interactive content inside a tooltip (buttons that fire React state), use a `Popover` keyed off `onEvents.mouseover` instead — ECharts tooltips are detached HTML and lose React handlers.

### Per-datum styling from an array of objects

Pass `data` as `{ value, itemStyle }[]` to color each bar/slice individually based on a property of the underlying record:

```tsx
series: [{
  type: "bar",
  data: regions.map((r) => ({
    value: r.value,
    itemStyle: {
      color: r.growth >= 15 ? "#10b981" : "#3b82f6",
      borderRadius: [0, 6, 6, 0],
    },
  })),
}]
```

### Wrap the page in `<Toast.Provider>` for toast feedback

`useToast()` only works inside a provider. Wrap the demo's outermost element so chart-event toasts have somewhere to render:

```tsx
export function Showcase() {
  return (
    <Toast.Provider position="bottom-right">
      <ShowcaseInner />
    </Toast.Provider>
  );
}
```

### Keep the chart `option` memoized

Re-creating the option object on every render forces ECharts to diff and reapply. `useMemo` keeps the reference stable so the chart only updates when its inputs actually change:

```tsx
const lineOption = useMemo(() => ({ /* ... */ }), [revenue, expenses]);
<EChart option={lineOption} />
```

### Theme-toggling is a prop swap

Pass `theme="dark-preset"` (after `registerBuiltinThemes()`) or `theme="light"` and re-render — the wrapper rebuilds the chart with the new theme automatically. No `dispose()` calls needed.

```tsx
const [theme, setTheme] = useState<"light" | "dark-preset">("light");

<Action onClick={() => setTheme((t) => t === "light" ? "dark-preset" : "light")}>
  Toggle theme
</Action>
<EChart theme={theme} option={option} />
```

### Pitfalls

- **Badge takes `color`, not `variant`.** Valid colors: `zinc | red | blue | green | amber | violet | rose`. The `variant` prop selects the *style* (`soft | solid | outline`), not the semantic intent. Don't confuse this with `Toast.toast({ variant: "success" })`, which uses semantic names.
- **`<ContextMenu.Trigger>` needs a single DOM child.** Wrap `<EChart>` in a plain `<div>` if you have additional siblings (or none — Trigger forwards refs through the wrapper).
- **`params.event` vs `params.event.event`.** ECharts wraps the native event. Call `params.event.event.preventDefault()` to stop the browser context menu, not `params.event.preventDefault()`.
- **Don't render React inside `tooltip.formatter`.** Returning an HTML string is fine; expecting React state or handlers to attach to that HTML is not. For interactive tooltips, use `Popover` driven by `onEvents.mouseover` / `mouseout` instead.

## Diagrams

Beyond charts, fancy-echarts ships four schema-driven diagram components for data-modeling, process flows, mindmapping, and hierarchies. They share one routing/marker engine — same import surface, same theming.

```tsx
import { DataDiagram, Flowchart, Mindmap, OrgChart } from "@particle-academy/fancy-echarts";
```

| Component | Use case | Default routing |
|-----------|----------|-----------------|
| `<DataDiagram>` | ERD / UML class diagrams with fields, primary/foreign keys, exports | manhattan |
| `<Flowchart>` | Boxes + typed arrows, no fields | manhattan |
| `<Mindmap>` | Radial single-root tree with bezier connectors | bezier |
| `<OrgChart>` | Top-down hierarchy, tidy-tree layout, inheritance markers | manhattan |

See [docs/Diagram.md](docs/Diagram.md) for schemas, props, and layout details.

## Documentation

Full component documentation is available in the [docs/](docs/) folder:

| Topic | Description |
|-------|-------------|
| [EChart](docs/EChart.md) | Base chart component + all 20 series sub-components |
| [EChart3D](docs/EChart3D.md) | 3D charts (Bar, Scatter, Line, Surface, Globe) |
| [EChartGraphic](docs/EChartGraphic.md) | Custom drawing with the graphic API |
| [Diagram](docs/Diagram.md) | Diagram engine + DataDiagram, Flowchart, Mindmap, OrgChart presets |
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
