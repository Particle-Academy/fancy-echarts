# Changelog

All notable changes to `@particle-academy/fancy-echarts` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> This file starts here. Earlier releases predate it and were never written up;
> `git log` is the record for those. It is not backfilled rather than
> guessed-at, because a changelog that invents its own history is worse than one
> that admits where it begins.

## [Unreleased]

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
