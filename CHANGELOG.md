# Changelog

All notable changes to `@particle-academy/fancy-echarts` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> This file starts here. Earlier releases predate it and were never written up;
> `git log` is the record for those. It is not backfilled rather than
> guessed-at, because a changelog that invents its own history is worse than one
> that admits where it begins.

## [Unreleased]

### Fixed

- **`CHANGELOG.md` is now in the published tarball.** `files` did not whitelist it, so npm never shipped it: a consumer who followed a link to the changelog — from the README, from npm, or from an upgrade guide — found nothing. Nothing for you to do; the file simply arrives from this release on.

### Security

- `source-map-js` is pinned forward to `^1.2.2` via `overrides`. Versions up to
  1.2.1 allow an event-loop denial of service through indexed source-map section
  offsets, and it arrives here transitively through the build toolchain.
  **Nothing for a consumer to do, and no runtime change**: an npm package does
  not ship a lockfile, so this governs builds OF this repo, not anything
  installed FROM it. Recorded rather than left silent because the override it
  sits beside — `shell-quote` `^1.9.0`, added for an earlier advisory — was
  carried with no note of why, and had drifted back inside the vulnerable range
  before anyone looked.

## [6.1.0] - 2026-09-09

### Added

- **`useGraphRoam(instance)` — pan and zoom a `graph` series from ANYWHERE on
  the canvas**, not only over the nodes.

  ECharts binds the roam controller to the **series group's bounding rect** —
  the extent of what was drawn — so `roam: true` on a graph is dead on the empty
  canvas around the cluster, which is exactly where a person grabs to pan. A
  consumer lost hours to it: *"it only works if I put my mouse in the middle of
  the cluster."* Nothing in the option surface hints at it.

  ```ts
  const { instance } = useECharts({ option });
  useGraphRoam(instance);   // option keeps `series: [{ type: "graph", roam: true }]`
  ```

  **Keep `roam: true`.** The `graphRoam` action is applied by the series only
  when roam is enabled — the handler recalculates the view from the model, so
  with `roam: false` the dispatch is silently inert. Setting it false to "take
  over cleanly" is the natural move and costs a debugging cycle.

  Node dragging is untouched: `e.target` is zrender's free hit test, so a press
  that landed on a node is left to ECharts. It also sets a `grab` / `grabbing`
  cursor, because zrender sets `pointer` over a node and the default arrow
  everywhere else — once empty canvas IS draggable, nothing signals it.

### Two dead ends, documented so nobody re-walks them

- **Layout bounds do nothing.** `left` / `right` / `top` / `bottom` change the
  layout area, not the group's bounding rect, which is measured from content.
  They also re-spread the force layout, so it looks like they helped.
- **DOM listeners never fire.** zrender owns the canvas events; a `pointerdown`
  bound on the container element is never called. Worth stating because this
  package ships a `usePanZoom` that works exactly that way — it is for the DOM
  `EChartGraphic` surface, and reaching for it here is the dead end.

### And one about testing it

  **Synthetic input does not drive ECharts roam.** CDP drags, `MouseEvent` and
  `PointerEvent` sequences leave the canvas byte-identical. That was proven with
  a control rather than assumed: dragging over the cluster, where roam
  demonstrably works with a real mouse, produced no change either, while
  toggling a checkbox did change the canvas hash. Hover and cursor DO respond to
  synthetic events; only roam does not.

  So a browser-automation test of roam reports a **false negative**. The unit
  tests assert the dispatch and its payload; whether ECharts then paints is
  verified by a human with a real mouse. Saying where the boundary is beats a
  test that appears to cover it and does not.

## 6.0.0 — 2026-08-07

### Changed

- **BREAKING — Node 22 is no longer supported.** `engines.node` moves from `>=22` to `>=22`.

  **What you must do:** on Node 22 or newer, nothing. Note npm only *warns* on an `engines` mismatch while **pnpm fails the install**, so this surfaces differently depending on your package manager. Node 18 is end-of-life and 20 is maintenance-only.

- **BREAKING — React 18 is no longer supported.** `peerDependencies.react` / `react-dom` are now `^19.0.0`.

  **What you must do:** on React 19, nothing. On React 18, stay on the previous release, or upgrade your app to 19 first.

  React 18 support was a claim nothing tested — every build and test in this package ran against 19, so the 18 half of the old range was never executed. An untested compatibility claim is worse than an absent one, because it reads as support.

### Why

These are the kit 0.5 platform floors, applied across every package at once so a consumer never has to resolve a mix. **No API changed, nothing was removed, nothing was renamed** — only what the package requires.

This package is past 1.0, so a floor raise takes a **major**. Most of the suite is pre-1.0 and lands the identical change in a minor — that is semver, not a difference in how much changed.


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
