---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 09
subsystem: wallets
tags: [rxjs, applesauce-wallet-connect, applesauce-wallet, webln, nip-60, cashu, aislop, module-split]

# Dependency graph
requires:
  - phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
    provides: proven rescan/verification loop from waves 1-2 (D-17 ordering) before the tier-three split
provides:
  - "src/services/wallets/ directory module (types.ts, webln.ts, nwc.ts, nutwallet.ts, index.ts) replacing the 591-line src/services/wallets.ts, zero-churn for all 13 import sites"
affects: [05-10, 05-11, 05-12, 05-13, 05-14]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Directory-module split by backend/concern behind an index.ts barrel (matches src/services/event-cache/ and src/services/database/ precedent)"
    - "Scoped logger passed as an explicit function parameter to leaf-module factories instead of imported back from the barrel, to avoid a circular import edge and to keep the barrel's export count unchanged"

key-files:
  created:
    - src/services/wallets/types.ts
    - src/services/wallets/webln.ts
    - src/services/wallets/nwc.ts
    - src/services/wallets/nutwallet.ts
  modified:
    - src/services/wallets/index.ts (moved from src/services/wallets.ts via git mv)
    - .planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md

key-decisions:
  - "createWeblnBackend/createNwcBackend take the scoped logger as a parameter (not a module-level import from index.ts) to keep exactly one logger.extend() declaration while avoiding a circular import and a 22nd export from index.ts"
  - "abortError is single-owned in webln.ts and imported by nwc.ts (one-directional sibling edge, no cycle); WEBLN_ID and nutWalletId each stay private to their one real call site"
  - "WalletConnect.pool = pool stays in index.ts per the plan's 'everything else stays' instruction"
  - "fromNwcTransaction gained an export keyword (module-private before) so 05-13's planned nwc.test.ts can unit test the pure NIP-47 transaction mapper; not re-exported from index.ts, so the 21-member public surface is unaffected"

patterns-established: []

requirements-completed: []

coverage: []

duration: ~20min
completed: 2026-09-24
status: complete
---

# Phase 5 Plan 9: Wallets service directory split Summary

**Split the 591-line `src/services/wallets.ts` into a five-module `src/services/wallets/` directory by backend (types/webln/nwc/nutwallet/index), zero-churn for all 13 import sites, clearing the `complexity/file-too-large` finding for this file.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-09-24
- **Tasks:** 2
- **Files modified:** 6 (1 renamed + 4 created + 1 docs file edited)

## Accomplishments

- `src/services/wallets.ts` (591 lines, over the 400-line budget) is now five focused modules
  behind an `index.ts` barrel: `types.ts` (53 lines — shared type surface), `webln.ts` (110 lines —
  WebLN backend + the shared `abortError` helper), `nwc.ts` (99 lines — Nostr Wallet Connect
  backend, invoice waiter, transaction mapper), `nutwallet.ts` (55 lines — NIP-60/Cashu backend),
  `index.ts` (289 lines — scoped logger, all reactive state, NIP-60 lifecycle, NWC registry
  reconciliation, and the public API).
- Git recorded the split as a rename (`wallets.ts` → `wallets/index.ts`, 50% similarity) in the
  same commit that created the four sibling files, so no intermediate git state ever had both
  `wallets.ts` and `wallets/index.ts` resolvable at once — the module-shadowing hazard called out
  in the execution context was avoided by construction. `test ! -f src/services/wallets.ts`
  confirmed after the commit.
- All 21 exported members (`WalletBackendType`, `ReceiveResult`, `WalletTransaction`,
  `WalletBackend`, `WALLET_TYPE_LABELS`, `hasWebln`, `NutWalletState`, `nutWalletState$`,
  `nutWallet$`, `nutWalletUnlocked$`, `nutWalletStaleTokenCount$`, `setNutWalletEnabled`,
  `unlockNutWallet`, `setNutWalletAutoUnlock`, `cleanupNutWalletDeletedTokens`, `wallets$`,
  `activeWallet$`, `addNwcWallet`, `removeNwcWallet`, `setActiveWallet`, `resolveInvoice`) survive
  unchanged from `index.ts`, counted directly against the pre-split file's 21 `^export` matches.
- All 12 external bare-specifier importers (`grep -rn 'from ".*services/wallets"' src` → 12,
  unchanged) plus the 13th sibling import (`src/services/wallet-migration.ts`'s `from "./wallets"`)
  resolve unchanged; `git diff --name-only` for both commits lists only files under
  `src/services/wallets/` and `05-BASELINE.md`. No consumer was edited.
- Scoped rescan filtered to `src/services/wallets` returns 0 findings across all four bucket-H
  rules. Whole-repo `complexity/file-too-large` fell 2 → 1 (the remaining finding belongs to
  `napplet-shell-provider.tsx`, owned by 05-10–05-12); bucket-H total fell 4 → 3.
- `pnpm build` (typecheck + bundle) passed after both tasks.

## Task Commits

1. **Task 1: Move the types and the three backends into the new directory (D-10, D-16)** -
   `07a482f1c` (refactor)
2. **Task 2: Confirm the public surface and the file-size finding (D-10, D-19)** - `14e6deaa1`
   (docs — 05-BASELINE.md update only; no source change was needed to clear the finding, the
   split from Task 1 already cleared it)

**Plan metadata:** committed via this SUMMARY's own commit (see final_commit step)

## Files Created/Modified

- `src/services/wallets/index.ts` - Barrel: scoped logger, `WalletConnect.pool = pool`, all
  reactive wallet state (`wallets$`, `activeWallet$`, NIP-60 lifecycle, NWC registry
  reconciliation), and the 21-member public API
- `src/services/wallets/types.ts` - `WalletBackendType`, `ReceiveResult`, `WalletTransaction`,
  `WalletBackend`, `WALLET_TYPE_LABELS`
- `src/services/wallets/webln.ts` - `hasWebln`, `createWeblnBackend` (takes `log` as a parameter),
  `abortError` (shared with `nwc.ts`), `awaitBalanceIncrease`
- `src/services/wallets/nwc.ts` - `createNwcBackend` (takes `log` as a parameter),
  `waitForNwcPaid`, `fromNwcTransaction` (now exported for 05-13's planned unit test)
- `src/services/wallets/nutwallet.ts` - `nutWalletBackend`
- `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md` -
  D-19 per-rule after-count (file-too-large 2→1, bucket-H total 4→3) and a new resolution section

## Decisions Made

- The scoped logger stays declared exactly once, in `index.ts`, per the plan's explicit
  instruction. Since `createWeblnBackend`/`createNwcBackend` (which log on error) move into
  sibling leaf modules that `index.ts` itself imports, the leaf modules cannot import `log` back
  from `index.ts` without creating a circular import edge (`index → webln → index`) and making
  `log` a 22nd export of the barrel. The chosen fix — pass `log: Debugger` as an explicit function
  parameter (`import type { Debugger } from "debug"`, an existing in-repo pattern from
  `src/services/cron.ts`) — keeps the single declaration, the export count at 21, and changes no
  log message or call-site argument, only where the function reference comes from. Documented as
  a non-pure-move adjustment in the Task 1 commit message per D-16's own escape hatch.
- `abortError` (used by both `webln.ts` and `nwc.ts`) is single-owned in `webln.ts` and imported by
  `nwc.ts` — a one-directional sibling edge that cannot cycle back, unlike importing from
  `index.ts` would. `WEBLN_ID` and `nutWalletId` are each used only by their own backend's real
  call site (grep-confirmed against the actual pre-split file, not the plan's prose which
  described a hypothetical index-module use that does not exist in the current source), so both
  stay module-private in their own backend files.
- `WalletConnect.pool = pool` stayed in `index.ts`, not moved into `nwc.ts`, since the plan's
  action text lists it under "everything else stays in the index module" by omission from the
  three named extraction targets (types/webln/nwc backend bodies specifically). Timing is
  unaffected either way: it runs during `index.ts`'s own module evaluation, before `reconcileNwc`
  (triggered by `localSettings.wallets.subscribe` at the end of `index.ts`) ever constructs a
  `WalletConnect` client.
- `fromNwcTransaction` gained an `export` keyword (was module-private) so 05-13's planned
  `nwc.test.ts` can unit test the pure NIP-47-to-`WalletTransaction` mapper directly, per the
  execution context's explicit note. This is additive to `nwc.ts` only, not re-exported from
  `index.ts`, so it does not affect the 21-member public surface.

## Deviations from Plan

### Auto-fixed Issues

None — no bug, missing functionality, or blocking issue was found during execution.

### Documented non-pure-move adjustments (per D-16's own allowance)

**1. Logger threaded as a parameter instead of a module-level import**
- **Found during:** Task 1 (moving `createWeblnBackend`/`createNwcBackend` into their own files)
- **Issue:** Both factories log on error using the single scoped `log` the plan requires to live
  only in `index.ts`. Since `index.ts` imports these factories (to compose the reactive state),
  the factories importing `log` back from `index.ts` would create a circular module edge and add
  a 22nd export to the barrel, both of which the plan/acceptance criteria explicitly forbid.
- **Fix:** `createWeblnBackend(log: Debugger)` and `createNwcBackend(stored, log: Debugger)` now
  accept the logger as their last parameter; `index.ts` passes its own `log` at both call sites
  (`weblnBackend$`'s construction, `reconcileNwc`'s two backend-creation branches, and
  `addNwcWallet`'s validation call).
- **Files modified:** `src/services/wallets/webln.ts`, `src/services/wallets/nwc.ts`,
  `src/services/wallets/index.ts`
- **Verification:** `grep -rn 'logger.extend(' src/services/wallets/*.ts` → exactly one hit (in
  `index.ts`); `grep -n 'log(' src/services/wallets/webln.ts src/services/wallets/nwc.ts` shows
  the same two log call sites with the same messages as the pre-split file; `pnpm build` passed.
- **Committed in:** `07a482f1c` (Task 1 commit, with the adjustment called out in the commit body)

---

**Total deviations:** 0 auto-fixed; 1 documented non-pure-move adjustment (mechanical parameter
threading, no behavior change).
**Impact on plan:** No scope creep. The adjustment was the only way to satisfy the plan's own
"exactly one logger, no circular imports, 21 exports" constraints simultaneously; it is called
out per D-16's explicit instruction rather than silently folded into the move.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None. All four STRIDE items in the plan's threat model (T-05-30 credential handling during the
move, T-05-31 active-wallet reconciliation tampering, T-05-32 duplicate-backend DoS, T-05-33
broken side-effect import) were mitigated as specified: the NWC backend factory moved as an
atomic unit with no credential-handling expression rewritten (confirmed via the plan's own
grep/build checks); the reactive composition in `index.ts` was not redesigned; each shared helper
is defined exactly once (grep-confirmed); the wallet-migration module's `./wallets` import
resolves unchanged (confirmed by `pnpm build`).

## Next Phase Readiness

`src/services/wallets/` is ready for 05-13's vitest harness — `nwc.ts`'s `fromNwcTransaction` is
now an importable pure function for the planned `nwc.test.ts`. No behavioral test coverage exists
yet for any of the three wallet backends (no test runner until 05-13; `build_command`/
`test_command` in `.planning/config.json` are both `pnpm build`, a typecheck+bundle only). The
following are recorded as explicit OUTSTANDING manual-verification items, not assumed verified
from the passing build:

- Connecting/using a WebLN browser-extension wallet (balance read, invoice creation with the
  balance-rise payment-detection fallback, invoice payment)
- Connecting/using a Nostr Wallet Connect wallet (balance read, transaction history, invoice
  creation, the `payment_received` notification wait, invoice payment, rename, add/remove)
- The NIP-60/Cashu wallet lifecycle (load on account switch, auto-unlock preference, manual
  unlock, mint-quote invoice creation and redemption, melt/pay-invoice mint selection, stale
  token-event cleanup both manual and threshold-triggered)

The two remaining bucket-H findings after this plan (`complexity/function-too-long` x2,
`complexity/file-too-large` x1, all in `napplet-shell-provider.tsx`) are 05-10 through 05-12's
scope; this plan's own file is confirmed clean of all four bucket-H rules.

---
*Phase: 05-refactor-oversized-files-long-functions-and-duplicated-block*
*Completed: 2026-09-24*

## Self-Check: PASSED

All 7 created/modified files confirmed present on disk; both task commits (`07a482f1c`,
`14e6deaa1`) confirmed present in `git log --oneline --all`.
