---
phase: 06-close-type-safety-escape-hatches
plan: 05
subsystem: napplet-shell, wallets
tags: [type-safety, kehto, webln, aislop]
requires: [06-01, 06-02, 06-03]
provides:
  - explicit RelayPoolLike adapter over the applesauce pool
  - typed toRelayFilters conversion
  - Window.webln.getBalance augmentation
affects:
  - src/services/napplet-shell/adapter.ts
  - src/services/napplet-shell/common-actions.ts
  - src/services/wallets/webln.ts
  - src/types/webln.d.ts
key-files:
  modified:
    - src/services/napplet-shell/adapter.ts
    - src/services/napplet-shell/common-actions.ts
    - src/services/wallets/webln.ts
    - src/types/webln.d.ts
decisions:
  - "D-11: poolLike exposes only subscription, request and publish; count omitted (applesauce count returns an Observable)"
  - "D-15: toRelayFilters is a shallow copy only; async publish resolves/rejects as pool.publish does"
metrics:
  completed: 2026-10-05
status: complete
---

# Phase 6 Plan 05: Napplet shell and WebLN boundary casts Summary

Replaced six library-boundary casts with real types: an explicit three-method `RelayPoolLike` adapter and typed `toRelayFilters` copy in the napplet shell, cast-free reaction drafting, and the global `Window.webln` augmentation (now declaring optional `getBalance`) in the WebLN backend.

## Tasks

| Task | Commit | Files |
| ---- | ------ | ----- |
| 1. Explicit RelayPoolLike adapter and typed filter conversion | aebaa2c88 | src/services/napplet-shell/adapter.ts |
| 2. Reaction draft and emoji without casts | a67e934a5 | src/services/napplet-shell/common-actions.ts |
| 3. window.webln via global augmentation | 72a651212 | src/services/wallets/webln.ts, src/types/webln.d.ts |

## Verification

- `pnpm build` passes after each task.
- aislop scan: bucket-E findings for the four files are 0. Remaining findings are the pre-existing `ai-slop/console-leftover` (adapter.ts) and `ai-slop/narrative-comment` (webln.ts); common-actions.ts has 0.
- Prettier check passes on all four files.
- OUTSTANDING (manual, for /gsd-verify-work): a napplet subscription returns events, a napplet publish reports success, and a WebLN wallet balance still shows. No test runner covers these browser paths.

## Deviations from Plan

None - plan executed exactly as written. The `filters` parameters of `subscription`/`request` in `poolLike` type-checked without needing `toRelayFilters`.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

Commits aebaa2c88, a67e934a5, 72a651212 exist; all four modified files present.
