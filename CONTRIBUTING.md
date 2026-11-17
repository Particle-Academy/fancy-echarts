# Contributing to @particle-academy/fancy-echarts

Notes for anyone, human or agent, working ON this package's code. How to USE the
package is in [AGENTS.md](./AGENTS.md); what it is, is in [README.md](./README.md).
`CLAUDE.md` is a symlink to this file, so Claude Code reads these notes when it
works in this repo.

## Layout

- `src/components/` — `EChart`, `EChart3D`, `EChartGraphic`.
- `src/hooks/` — `useECharts`, `useResizeObserver`, `useGraphRoam`.
- `src/utils/` — registration (`register.ts`), themes, capture, `cn`.
- `tests/` — vitest suites.
- `docs/` — per-component reference docs; they ship in the package.
- `demo/` — demo sources.

## Commands

```bash
npm run build       # tsup
npm run dev         # tsup --watch
npm run lint        # tsc --noEmit && eslint .
npm test            # vitest run
npm run test:watch  # vitest
```

## Changelog

Update `CHANGELOG.md` in the same commit as the change.
