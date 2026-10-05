---
phase: 06-close-type-safety-escape-hatches
plan: 04
subsystem: database
tags: [indexeddb, idb, migration, bugfix, type-safety]
requires: [06-01, 06-02, 06-03]
provides:
  - "clearCacheData() clears the identities store and its reload is reachable"
  - "v5 accounts migration without a TypeScript directive"
affects: [06-09]
key-files:
  modified:
    - src/services/database/index.ts
decisions:
  - "D-07: retarget the clear at identities (not drop it), separate fix commit"
  - "D-08: destructure useExtension out; same stored shape (D-15)"
requirements: [D-07, D-08, D-13, D-15, D-16]
metrics:
  tasks: 2
  files: 1
completed: 2026-10-05
status: complete
---

# Phase 6 Plan 04: Database fixes Summary

Fixed `clearCacheData()` to clear the live `identities` store instead of the deleted `dnsIdentifiers` store, and replaced the v5 migration's `@ts-ignore` key deletion with a `useExtension` destructure.

## Tasks

| Task | Name | Commit |
| ---- | ---- | ------ |
| 1 | D-07: clear `identities` in `clearCacheData()` (bug fix, own commit) | f37f7fbe6 |
| 2 | D-08: destructure `useExtension` out of v5 account (type-only) | 46d2dd113 |

## Details

- Task 1: old call rejected with NotFoundError, so `relayScoreboardStats` was never cleared and `window.location.reload()` never ran. Order is now userSearch, relayInfo, identities, relayScoreboardStats, reload. 2 insertions / 2 deletions; `internal.tsx` untouched.
- Task 2: `const { useExtension, ...rest } = account;` then `newAccount` built from `...rest` plus `connectionType`. Same keys in the same order, `put` call unchanged.

## Verification

- `pnpm build` passed after each task; prettier check passes.
- aislop scan for `src/services/database/index.ts`: 0 `ts-directive`, 16 `double-type-assertion` (the casts plan 06-09 owns).

## Deviations from Plan

None - plan executed exactly as written.

## OUTSTANDING (manual, for /gsd-verify-work)

Settings > Cache > Database > "Clear cache data" should stop spinning and reload with no `NotFoundError` in the console. Not automatable (no fake-indexeddb); not yet verified.

## Known Stubs

None.

## Self-Check: PASSED

Both commits (f37f7fbe6, 46d2dd113) exist; modified file exists; no STATE.md/ROADMAP.md changes.
