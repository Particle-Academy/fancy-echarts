# Themes

Built-in theme presets and utilities for registering custom themes with ECharts.

## Import

```tsx
import {
  darkTheme,
  vintageTheme,
  pastelTheme,
  registerTheme,
  registerBuiltinThemes,
} from "@particle-academy/fancy-echarts";
```

## Quick Start

Register all built-in themes at app entry:

```tsx
import { registerBuiltinThemes } from "@particle-academy/fancy-echarts";
registerBuiltinThemes();
```

Then use by name:

```tsx
<EChart option={myOption} theme="vintage" />
<EChart option={myOption} theme="pastel" />
<EChart option={myOption} theme="dark-preset" />
```

## Built-in Themes

### darkTheme

Registered as `"dark-preset"`. Dark background (`#1a1a2e`) with light text and muted axis lines.

| Property | Value |
|----------|-------|
| Background | `#1a1a2e` |
| Text color | `#e0e0e0` |
| Title color | `#ffffff` |
| Axis lines | `#444` |
| Palette | `#5470c6`, `#91cc75`, `#fac858`, `#ee6666`, `#73c0de`, `#3ba272`, `#fc8452`, `#9a60b4`, `#ea7ccc` |

### vintageTheme

Registered as `"vintage"`. Warm parchment background (`#fef8ef`) with earthy tones.

| Property | Value |
|----------|-------|
| Background | `#fef8ef` |
| Title color | `#333333` |
| Axis lines | `#ccc` |
| Palette | `#d87c7c`, `#919e8b`, `#d7ab82`, `#6e7074`, `#61a0a8`, `#efa18d`, `#787464`, `#cc7e63`, `#724e58`, `#4b565b` |

### pastelTheme

Registered as `"pastel"`. Light background (`#fafafa`) with soft pastel colors.

| Property | Value |
|----------|-------|
| Background | `#fafafa` |
| Text color | `#555` |
| Title color | `#333` |
| Palette | `#c4b5fd`, `#a5f3fc`, `#fca5a5`, `#fde68a`, `#a7f3d0`, `#fbcfe8`, `#c7d2fe`, `#fed7aa` |

## API

### registerTheme

Register a custom theme by name. Wraps `echarts.registerTheme()`.

```ts
function registerTheme(name: string, theme: object): void
```

```tsx
registerTheme("corporate", {
  color: ["#003f5c", "#58508d", "#bc5090", "#ff6361", "#ffa600"],
  backgroundColor: "#ffffff",
  textStyle: { color: "#333" },
  title: { textStyle: { color: "#003f5c" } },
});
```

### registerBuiltinThemes

Registers all three built-in themes (`"dark-preset"`, `"vintage"`, `"pastel"`). Call once at app startup.

```ts
function registerBuiltinThemes(): void
```

## Using Themes

### By registered name

```tsx
<EChart option={option} theme="vintage" />
```

### By object (inline, no registration needed)

```tsx
<EChart option={option} theme={darkTheme} />
<EChart option={option} theme={{ color: ["#e63946", "#457b9d", "#1d3557"] }} />
```

### Auto Dark Mode

When `theme` is omitted, `useECharts` auto-detects the system `prefers-color-scheme: dark` preference and applies ECharts' built-in `"dark"` theme (not `darkTheme` from this package). The background is set to `transparent` so the chart inherits the page background.

```tsx
{/* Automatically switches between light and dark based on OS setting */}
<EChart option={option} />
```

To opt out, pass any explicit theme (including `undefined` as a string or object):

```tsx
<EChart option={option} theme="" />
```

## Custom Theme Example

```tsx
import { registerTheme } from "@particle-academy/fancy-echarts";

const neonTheme = {
  backgroundColor: "#0a0a0a",
  textStyle: { color: "#00ff88" },
  title: { textStyle: { color: "#00ff88" } },
  color: ["#00ff88", "#ff0080", "#00ccff", "#ffcc00", "#ff4400"],
  categoryAxis: {
    axisLine: { lineStyle: { color: "#333" } },
    axisLabel: { color: "#888" },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: "#333" } },
    splitLine: { lineStyle: { color: "#222" } },
    axisLabel: { color: "#888" },
  },
};

registerTheme("neon", neonTheme);

// Then use it
<EChart option={option} theme="neon" />
```
