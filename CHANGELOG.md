# Changelog

All notable changes to `@particle-academy/fancy-echarts` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> This file starts here. Earlier releases predate it and were never written up;
> `git log` is the record for those. It is not backfilled rather than
> guessed-at, because a changelog that invents its own history is worse than one
> that admits where it begins.

## [Unreleased]

## 5.0.0 — 2026-07-01

### Changed

- **BREAKING** — **deps:** require echarts ^6.1.0 — GHSA-fgmj-fm8m-jvvx (XSS)

- use canonical Button name (Action is a deprecated react-fancy alias)

## 4.0.1 — 2026-05-29

### Fixed

- **DX:** actionable error when a chart type isn't registered (#1)

## 4.0.0 — 2026-05-19

### Changed

- 4.0.0 — delete diagram subsystem; charts only

## 3.0.2 — 2026-05-04

- Maintenance only (1 internal commit).

## 3.0.1 — 2026-05-02

### Fixed

- inline lucide-react icons (self-contained, no third-party deps)

## 3.0.0 — 2026-05-02

### Changed

- **BREAKING** — diagrams (DataDiagram, Flowchart, Mindmap, OrgChart) — moved from react-fancy

## 2.0.3 — 2026-05-01

- Maintenance only (2 internal commits).

## 2.0.2 — 2026-04-30

- Maintenance only (1 internal commit).

## 2.0.1 — 2026-04-30

- Maintenance only (1 internal commit).

## 2.0.0 — 2026-04-30

### Changed

- **BREAKING** — release 2.0.0: move echarts and echarts-gl to peer dependencies

## 1.2.1 — 2026-04-29

- Maintenance only (2 internal commits).

## 1.2.0 — 2026-04-28

- Maintenance only (4 internal commits).

## 1.1.3 — 2026-04-26

### Fixed

- register SingleAxisComponent in registerAll

## 1.1.2 — 2026-04-26

### Changed

- package.json: add repository / homepage / bugs URLs (required by provenance)

## 1.1.1 — 2026-04-14

### Changed

- Release v1.1.1 — docs fixes

## 1.1.0 — 2026-04-13

### Changed

- Release v1.1.0
- Bundle echarts into package, remove peer dependency requirement

## 1.0.3 — 2026-03-31

### Fixed

- Include docs/ in npm package

## 1.0.2 — 2026-03-31

### Changed

- Initial release — @particle-academy/react-echarts v1.0.1

### Changed

- Import `use` from `echarts/core` as `echartsUse`. A bare `use(...)` is
  indistinguishable from React's `use` hook to both a reader and
  `react-hooks/rules-of-hooks`, which reported all three registrars here as hooks
  called outside a component. **No action needed** — internal only, and
  `registerAll` / `registerCharts` / `registerComponents` are unchanged.

### Security

- **The `react-router` override was the vulnerability, not the fix.**
  GHSA-qwww-vcr4-c8h2 (high) affects `react-router >= 7.12.0 < 8.3.0`. An
  `overrides` entry pinning `react-router: ^7.15.1` — added earlier to force a
  patched 7.x — had since drifted *into* the vulnerable range and was actively
  preventing any upgrade out of it. The override is gone; the demo now depends
  on `react-router ^8.3.0` directly.

  `react-router-dom` never published a v8 — v7 folded it into `react-router` —
  so the imports moved to `react-router`. Same exports, same behaviour.

- **Dropped the `esbuild` override by removing esbuild instead.** The demo
  carried `overrides: { esbuild: ^0.28.1 }` for GHSA-g7r4-m6w7-qqqr. Vite 8
  replaced esbuild with rolldown, so upgrading the demo to Vite 8 (+
  `@vitejs/plugin-react` 6) takes the vulnerable package out of the tree
  altogether rather than pinning around it.

### Fixed

- **The demo build was broken and had been for a while.** `npm run build` failed
  with 88 `Transforming destructuring to the configured target environment ... is
  not supported yet` errors — the forced `esbuild@0.28.1` could not transpile to
  Vite 6's default browser target. This was pre-existing, not caused by the
  router upgrade: it reproduced on the untouched tree first. Vite 8 builds it in
  ~400ms.

  Both overrides were bandaids that each grew their own bug. Neither is needed
  now.

**Scope:** all of the above is inside `demo/`, which is `private: true` and
excluded from the published package. No consumer of `@particle-academy/fancy-echarts`
was ever affected, and there is nothing to upgrade to.
