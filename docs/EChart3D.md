# EChart3D

3D chart component that lazy-loads `echarts-gl` and provides sub-components for common 3D chart types.

## Import

```tsx
import { EChart3D } from "@particle-academy/react-echarts";
```

`echarts-gl` is bundled — no extra peer dependency install is required. The GL engine is dynamically loaded on first render of an `EChart3D`.

## Base Component

`EChart3D` accepts a raw ECharts option (including 3D-specific options like `grid3D`, `xAxis3D`, etc.). It automatically lazy-loads `echarts-gl` and shows a "Loading 3D engine..." placeholder until ready.

```tsx
<EChart3D
  option={{
    grid3D: {},
    xAxis3D: { type: "value" },
    yAxis3D: { type: "value" },
    zAxis3D: { type: "value" },
    series: [{
      type: "scatter3D",
      data: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
    }],
  }}
/>
```

### Base Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `option` | `EChartsOption` | **required** | Full ECharts option including 3D config |
| `theme` | `string \| object` | `undefined` | Theme name or object |
| `renderer` | `"canvas" \| "svg"` | `"canvas"` | Rendering engine |
| `notMerge` | `boolean` | `false` | Replace option instead of merging |
| `lazyUpdate` | `boolean` | `false` | Delay chart update |
| `showLoading` | `boolean` | `false` | Show loading animation |
| `loadingOption` | `object` | `undefined` | Customize loading spinner |
| `onEvents` | `Record<string, (params) => void>` | `undefined` | Event handlers |
| `autoResize` | `boolean` | `true` | Auto-resize on container change |
| `style` | `CSSProperties` | `{ width: "100%", height: 500 }` | Container styles |
| `className` | `string` | `undefined` | CSS class name |

## Sub-Components

### Shared Series Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `any` | **required** | Chart data (typically `[x, y, z][]`) |
| `title` | `string` | `undefined` | Chart title |
| `tooltip` | `boolean \| object` | `true` | Tooltip config |
| `seriesOptions` | `Record<string, any>` | `{}` | Extra options merged into the series |
| `option` | `Partial<EChartsOption>` | `{}` | Extra ECharts options merged last |
| `style` | `CSSProperties` | `undefined` | Container styles |
| `className` | `string` | `undefined` | CSS class name |

### EChart3D.Bar

3D bar chart. Auto-configures `xAxis3D`, `yAxis3D`, `zAxis3D`, and `grid3D`.

```tsx
<EChart3D.Bar
  title="3D Bars"
  data={[[0, 0, 5], [0, 1, 3], [1, 0, 8], [1, 1, 2]]}
/>
```

**Data format:** `[x, y, z][]`

### EChart3D.Scatter

3D scatter plot. Auto-configures 3D axes and grid.

```tsx
<EChart3D.Scatter
  data={[[1, 2, 3], [4, 5, 6], [7, 8, 9], [2, 4, 6]]}
  seriesOptions={{ symbolSize: 8 }}
/>
```

**Data format:** `[x, y, z][]`

### EChart3D.Line

3D line chart. Auto-configures 3D axes and grid.

```tsx
<EChart3D.Line
  data={[[0, 0, 0], [1, 1, 1], [2, 4, 8], [3, 9, 27]]}
/>
```

**Data format:** `[x, y, z][]`

### EChart3D.Surface

3D surface chart. Auto-configures 3D axes and grid.

```tsx
<EChart3D.Surface
  title="Surface"
  seriesOptions={{
    wireframe: { show: true },
    equation: {
      x: { min: -3, max: 3, step: 0.1 },
      y: { min: -3, max: 3, step: 0.1 },
      z: (x, y) => Math.sin(x * x + y * y) * x / Math.PI,
    },
  }}
/>
```

**Data format:** `[x, y, z][]` or use `seriesOptions.equation` for parametric surfaces.

### EChart3D.Globe

Globe visualization. Uses a different prop interface -- no `data` prop. Configure via `globe` and `series`.

```tsx
<EChart3D.Globe
  title="Earth"
  globe={{
    baseTexture: "/earth-texture.jpg",
    heightTexture: "/earth-height.jpg",
    shading: "lambert",
    atmosphere: { show: true },
  }}
  series={[{
    type: "scatter3D",
    coordinateSystem: "globe",
    data: [[-74, 40.7, 1000], [2.35, 48.86, 800]],
  }]}
/>
```

#### Globe Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | Chart title |
| `globe` | `object` | `{ baseTexture: "", shading: "lambert", atmosphere: { show: true } }` | Globe configuration |
| `series` | `any[]` | `[]` | Additional series to overlay on the globe |
| `option` | `Partial<EChartsOption>` | `{}` | Extra ECharts options merged last |

## Examples

### Scatter with Custom Grid

```tsx
<EChart3D.Scatter
  title="3D Distribution"
  data={points}
  seriesOptions={{ symbolSize: 5, itemStyle: { opacity: 0.8 } }}
  option={{
    grid3D: { viewControl: { autoRotate: true } },
  }}
/>
```

### Full Control via Base

```tsx
<EChart3D
  option={{
    visualMap: { max: 100, inRange: { color: ["#50a3ba", "#eac736", "#d94e5d"] } },
    grid3D: { viewControl: { projection: "orthographic" } },
    xAxis3D: {},
    yAxis3D: {},
    zAxis3D: {},
    series: [{ type: "bar3D", data: myData, shading: "lambert" }],
  }}
/>
```
