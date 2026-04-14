# useECharts

Low-level hook that initializes an ECharts instance on a div ref, manages option updates, event binding, loading state, and auto-resize. Used internally by `EChart`, `EChart3D`, and `EChartGraphic`.

## Import

```tsx
import { useECharts } from "@particle-academy/react-echarts";
import type { UseEChartsOptions, UseEChartsReturn } from "@particle-academy/react-echarts";
```

## Signature

```ts
function useECharts(options: UseEChartsOptions): UseEChartsReturn
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `option` | `EChartsOption` | **required** | ECharts option object |
| `theme` | `string \| object` | `undefined` | Theme name or object. When omitted, auto-detects dark mode |
| `renderer` | `"canvas" \| "svg"` | `"canvas"` | Rendering engine |
| `notMerge` | `boolean` | `false` | Replace option instead of merging |
| `lazyUpdate` | `boolean` | `false` | Delay chart update |
| `showLoading` | `boolean` | `false` | Show loading animation |
| `loadingOption` | `object` | `undefined` | Customize loading spinner |
| `onEvents` | `Record<string, (params) => void>` | `undefined` | Event handlers keyed by event name |
| `autoResize` | `boolean` | `true` | Auto-resize via `ResizeObserver` |

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `chartRef` | `RefObject<HTMLDivElement \| null>` | Ref to attach to a container div |
| `instance` | `ECharts \| null` | The ECharts instance (null before init) |

## Behavior

- **Dark mode auto-detection:** When `theme` is omitted, the hook listens to `prefers-color-scheme: dark` and applies ECharts' built-in `"dark"` theme reactively. In auto-dark mode, `backgroundColor` is set to `"transparent"` so the chart blends with the page background.
- **Re-initialization:** The chart instance is disposed and re-created when `theme` or `renderer` changes.
- **StrictMode safe:** Handles React 18 StrictMode double-mount by disposing any existing instance on the same DOM element.
- **Event cleanup:** Event listeners are bound/unbound cleanly via `useEffect` cleanup.
- **Resize:** Uses `useResizeObserver` internally to call `chart.resize()` on container size changes.

## Basic Usage

```tsx
function MyChart({ data }) {
  const option = useMemo(() => ({
    xAxis: { type: "category", data: ["A", "B", "C"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", data }],
  }), [data]);

  const { chartRef } = useECharts({ option });

  return <div ref={chartRef} style={{ width: "100%", height: 400 }} />;
}
```

## Accessing the Instance

```tsx
function ExportableChart() {
  const { chartRef, instance } = useECharts({
    option: { /* ... */ },
  });

  const handleExport = () => {
    if (instance) {
      const dataUrl = instance.getDataURL({ type: "png" });
      // download or display dataUrl
    }
  };

  return (
    <div>
      <div ref={chartRef} style={{ width: "100%", height: 400 }} />
      <button onClick={handleExport}>Export PNG</button>
    </div>
  );
}
```

## Event Handling

```tsx
const { chartRef } = useECharts({
  option: myOption,
  onEvents: {
    click: (params) => console.log("Clicked:", params.name),
    mouseover: (params) => console.log("Hover:", params.data),
    legendselectchanged: (params) => console.log("Legend:", params.selected),
  },
});
```

## Custom Theme

```tsx
const { chartRef } = useECharts({
  option: myOption,
  theme: "vintage",       // registered theme name
  renderer: "svg",        // SVG instead of canvas
  autoResize: false,      // manual resize control
});
```

## useResizeObserver

A utility hook used internally. Calls a callback whenever the referenced element's size changes.

```ts
import { useResizeObserver } from "@particle-academy/react-echarts";

function useResizeObserver(
  ref: RefObject<HTMLElement | null>,
  callback: () => void
): void
```

```tsx
const divRef = useRef<HTMLDivElement>(null);
useResizeObserver(divRef, () => {
  console.log("Container resized");
});
```
