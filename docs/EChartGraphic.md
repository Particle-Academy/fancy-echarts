# EChartGraphic

Component for custom drawing via the ECharts graphic layer. Supports shapes, text, images, and interactive elements.

## Import

```tsx
import { EChartGraphic } from "react-echarts";
import type { GraphicElement, EChartGraphicProps } from "react-echarts";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `elements` | `GraphicElement[]` | **required** | Array of graphic elements to render |
| `option` | `Partial<EChartsOption>` | `{}` | Extra ECharts options merged into the final option |
| `theme` | `string \| object` | `undefined` | Theme name or object |
| `renderer` | `"canvas" \| "svg"` | `"canvas"` | Rendering engine |
| `notMerge` | `boolean` | `false` | Replace option instead of merging |
| `lazyUpdate` | `boolean` | `false` | Delay chart update |
| `showLoading` | `boolean` | `false` | Show loading animation |
| `loadingOption` | `object` | `undefined` | Customize loading spinner |
| `onEvents` | `Record<string, (params) => void>` | `undefined` | Event handlers |
| `autoResize` | `boolean` | `true` | Auto-resize on container change |
| `style` | `CSSProperties` | `{ width: "100%", height: 400 }` | Container styles |
| `className` | `string` | `undefined` | CSS class name |

## GraphicElement

```ts
interface GraphicElement {
  type: "rect" | "circle" | "ring" | "arc" | "polygon" | "polyline"
      | "path" | "image" | "text" | "group";
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
  [key: string]: any;  // additional ECharts graphic properties
}
```

## Examples

### Basic Shapes

```tsx
<EChartGraphic
  elements={[
    {
      type: "rect",
      left: 50,
      top: 50,
      shape: { width: 200, height: 100, r: 8 },
      style: { fill: "#5470c6", stroke: "#333", lineWidth: 2 },
    },
    {
      type: "circle",
      left: 350,
      top: 100,
      shape: { r: 50 },
      style: { fill: "#91cc75" },
    },
    {
      type: "text",
      left: "center",
      top: 200,
      style: {
        text: "Hello ECharts",
        fontSize: 24,
        fontWeight: "bold",
        fill: "#333",
      },
    },
  ]}
/>
```

### Interactive Element

```tsx
<EChartGraphic
  elements={[
    {
      type: "rect",
      left: "center",
      top: "middle",
      shape: { width: 160, height: 50, r: 10 },
      style: { fill: "#5470c6", text: "Click me", fontSize: 16, fill: "#fff" },
      onclick: () => alert("Clicked!"),
      onmouseover: (e) => { e.target.style.opacity = 0.8; },
      onmouseout: (e) => { e.target.style.opacity = 1; },
    },
  ]}
/>
```

### Group with Children

```tsx
<EChartGraphic
  elements={[
    {
      type: "group",
      left: 100,
      top: 100,
      children: [
        {
          type: "rect",
          shape: { width: 120, height: 80 },
          style: { fill: "#fac858" },
        },
        {
          type: "text",
          left: 10,
          top: 30,
          style: { text: "Grouped", fill: "#333", fontSize: 14 },
        },
      ],
    },
  ]}
/>
```

### Combined with Chart Option

```tsx
<EChartGraphic
  elements={[
    {
      type: "text",
      left: "center",
      top: 20,
      style: { text: "Watermark", fontSize: 48, fill: "rgba(0,0,0,0.05)" },
    },
  ]}
  option={{
    xAxis: { type: "category", data: ["A", "B", "C"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: [10, 20, 30] }],
  }}
/>
```
