---
phase: 06-close-type-safety-escape-hatches
plan: 02
subsystem: services
tags: [type-safety, debug-globals, reflect-set, aislop]
requires: []
provides:
  - "19 DEV-only window debug globals assigned via Reflect.set with no TypeScript directive"
affects: [06-04, 06-09]
tech-stack:
  added: []
  patterns: ["Reflect.set(window, name, value) inside import.meta.env.DEV (precedent: src/services/debug-api.ts)"]
key-files:
  created: []
  modified:
    - src/services/loaders.ts
    - src/services/pool.ts
    - src/services/event-store.ts
    - src/services/outbox-cache.ts
    - src/services/relay-info.ts
    - src/services/database/index.ts
    - src/services/event-cache/index.ts
    - src/services/event-cache/wasm-worker.ts
    - src/services/read-status.ts
    - src/services/relay-scoreboard.ts
    - src/services/dns-identity-loader.ts
    - src/services/preferences.ts
    - src/services/social-graph.ts
    - src/services/wallets/index.ts
    - src/services/xml-feeds.ts
decisions:
  - "D-09: Reflect.set rather than a Window augmentation or folding into the noStrudel debug API"
metrics:
  tasks: 3
  files: 15
completed: 2026-10-05
status: complete
---

# Phase 6 Plan 02: Reflect.set DEV debug globals Summary

19 directive-backed `window.X = value` DEV debug assignments across 15 service files became `Reflect.set(window, "X", value)`, clearing 19 bucket-E findings with no behavior change.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1: relay and loader globals (9 sites) | a5a0d1070 | loaders, pool, event-store, outbox-cache, relay-info |
| 2: cache and storage globals (5 sites) | 9097258e3 | database/index, event-cache/index, event-cache/wasm-worker, read-status, relay-scoreboard |
| 3: remaining globals (5 sites) | c93713665 | dns-identity-loader, preferences, social-graph, wallets/index, xml-feeds |

## Verification

- `pnpm build` passed after each task.
- aislop bucket-E (ts-directive, double-type-assertion, unsafe-type-assertion) count is 0 for all files in tasks 1 and 3 and for the four non-database files in task 2.
- `database/index.ts` retains exactly 1 `ai-slop/ts-directive` (06-04) and 16 `ai-slop/double-type-assertion` (06-09).
- All-findings remaining: pool.ts 2, outbox-cache.ts 5, preferences.ts 2, wallets/index.ts 3 (all pre-existing, matching the plan's expected column).
- numstat per commit matched the plan (loaders 5/10, wallets 2/3, others 1/2), so neither prettier-drifted file (preferences.ts, wallets/index.ts) was reformatted; `prettier --check` passes on the other files.
- 19 `Reflect.set(window, ...)` calls, all inside `if (import.meta.env.DEV)` blocks (awk containment check). No `@ts-*` directives remain in the touched DEV blocks. `addressLoader`/`replaceableLoader` and `socialGraph`/`socialGraph$` pairings preserved.

## Deviations from Plan

None - plan executed exactly as written. The single-line rewrites were applied with a perl substitution; the multi-line `wallets` literal was edited by hand (opening and closing lines only).

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

Commits a5a0d1070, 9097258e3, c93713665 exist on the worktree branch; all 15 files modified as listed.
