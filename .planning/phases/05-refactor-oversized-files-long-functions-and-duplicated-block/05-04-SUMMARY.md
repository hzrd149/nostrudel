---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 04
subsystem: ui
tags: [react, chakra-ui, useAsyncAction, service-worker, aislop]

# Dependency graph
requires:
  - phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
    provides: "05-01's measured D-19 baseline table in 05-BASELINE.md that this plan appends to"
provides:
  - "Three hand-rolled try/catch/toast handlers in the background-worker settings cards converted to the project's required useAsyncAction hook"
  - "Measured (not assumed) proof that the conversion cleared all three D-07-flagged code-quality/duplicate-block findings"
affects: [05-05, 05-06, 05-14]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useAsyncAction destructure-and-rename (`const { run: handlerName, loading: isLoadingName } = useAsyncAction(...)`) applied to convert convention-violating try/catch handlers without changing call sites"
    - "Name-valued local state (not boolean) preserved alongside useAsyncAction when per-row/per-item loading feedback cannot be represented by the hook's single boolean loading flag"

key-files:
  created: []
  modified:
    - src/views/settings/background-worker/cached-files-card.tsx
    - src/views/settings/background-worker/service-worker-status-card.tsx
    - .planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md

key-decisions:
  - "Single-cache clear handler keeps a name-valued isClearingCache state (not the hook's boolean loading) to preserve per-row spinner feedback; set/cleared via a scoped try/finally (no catch) inside the useAsyncAction callback so the row always resets even on error, while the hook still owns error/toast handling"
  - "Clear-all and refresh handlers bind directly to the hook's own loading flag since they have no per-item distinction"
  - "checkForUpdate converted; applyUpdate deliberately left unconverted (not flagged, no loading state) -- rescan confirmed this resolved the file's one duplicate-block finding, settling RESEARCH.md's Pitfall-1 anchor ambiguity in favor of checkForUpdate"
  - "No extraction or ignore-with-reason fallback needed: the conversion alone cleared all three findings (the plan's expected-outcome branch), confirmed by scoped rescan before any fallback logic was considered"

patterns-established: []

requirements-completed: []

coverage:
  - id: D1
    description: "Cached-files card's three flagged handlers (single-cache clear, clear-all, refresh) converted to useAsyncAction with per-row loading feedback preserved"
    verification:
      - kind: unit
        ref: "pnpm build (typecheck+bundle) after Task 1"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq duplicate-block count for cached-files-card.tsx -> 0"
        status: pass
    human_judgment: true
    rationale: "No test runner exists yet (vitest arrives in 05-13) and pnpm build only typechecks/bundles -- it cannot demonstrate that the per-row loading spinner, disabled state, or error toast actually render correctly in the browser. This is recorded as an outstanding manual-verification item, not assumed from the build passing."
  - id: D2
    description: "Service-worker status card's checkForUpdate handler converted to useAsyncAction with all three informational toasts intact; applyUpdate deliberately left unconverted"
    verification:
      - kind: unit
        ref: "pnpm build (typecheck+bundle) after Task 2"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq duplicate-block count for service-worker-status-card.tsx -> 0"
        status: pass
    human_judgment: true
    rationale: "Same test-runner gap as D1 -- pnpm build cannot demonstrate the update-check button's loading/disabled state or its three toast variants (no-registration warning, update-available notice, already-latest confirmation) actually render as intended. Recorded as outstanding, not verified."
  - id: D3
    description: "Measured (not assumed) rescan proof that all three D-07 duplicate-block findings cleared; 05-BASELINE.md updated with the after-counts and the resolution branch actually taken"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq '[.diagnostics[]|select(.rule==\"code-quality/duplicate-block\" and (.filePath|test(\"background-worker\")))]|length' -> 0"
        status: pass
    human_judgment: false

duration: ~12min
completed: 2026-09-24
status: complete
---

# Phase 5 Plan 04: Convert background-worker cards to useAsyncAction Summary

**Converted three hand-rolled try/catch/toast handlers in the cached-files and service-worker-status settings cards to the project's required `useAsyncAction` hook, and proved by scoped rescan (not assumption) that all three D-07-flagged `code-quality/duplicate-block` findings cleared as a result.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-09-24
- **Tasks:** 3
- **Files modified:** 3 (2 source, 1 shared baseline doc)

## Accomplishments

- `cached-files-card.tsx`'s three flagged handlers (single-cache clear, clear-all, refresh) now use `useAsyncAction`; the unflagged `loadCachedFiles` handler (lines 44-61) was confirmed untouched by `git diff` in every task.
- Per-row loading feedback in the cached-files table is preserved: the single-cache clear keeps a name-valued `isClearingCache` state (not the hook's boolean) so only the row being cleared shows its spinner; the clear-all button and the refresh button now bind directly to their own hooks' `loading` flags.
- `service-worker-status-card.tsx`'s `checkForUpdate` handler now uses `useAsyncAction`, with all three informational toasts (no-registration warning, update-available notice, already-latest confirmation) preserved inside the callback. `applyUpdate` was deliberately left unconverted per the plan (not flagged, no loading state to migrate).
- Scoped rescan after each task, and again in Task 3, confirmed the measured outcome rather than assuming it: all three findings cleared (`cached-files-card.tsx` 2→0, `service-worker-status-card.tsx` 1→0). This resolved RESEARCH.md's Pitfall-1 ambiguity — the service-worker file's finding anchor was in `checkForUpdate`, not `applyUpdate` — without needing the plan's fallback conversion or shared-toast-extraction branches.
- `05-BASELINE.md`'s D-19 table and per-finding record updated with the measured after-counts (`code-quality/duplicate-block` 12→9, bucket-H total 19→16) and a new section documenting which resolution branch was actually taken.

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert the cached-files card's three flagged handlers to useAsyncAction** - `fb140185f` (refactor)
2. **Task 2: Convert the service-worker status card's update-check handler** - `e542b8562` (refactor)
3. **Task 3: Rescan, and resolve whatever the measurement shows (D-07)** - `73c905f19` (docs)

**Plan metadata:** committed as part of this SUMMARY/STATE/ROADMAP update (see final commit below).

## Files Created/Modified

- `src/views/settings/background-worker/cached-files-card.tsx` - Three handlers converted to `useAsyncAction`; per-row loading state preserved via name-valued `isClearingCache`.
- `src/views/settings/background-worker/service-worker-status-card.tsx` - `checkForUpdate` converted to `useAsyncAction`; `applyUpdate` untouched.
- `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md` - D-19 table and per-finding record updated with 05-04's measured after-counts and resolution branch (Edit-only, existing rows preserved byte-identical).

## Decisions Made

- Single-cache clear handler's per-row state is set at the top of the `useAsyncAction` callback and cleared in a scoped `try/finally` (no `catch`) at the end, so the row's spinner always resets even when `clearCache` throws — the hook's own `catch` still owns the error and failure toast. This is a Rule 2 correctness addition beyond the plan's literal "set at the top, clear at the end" wording, because without the `finally` a failed clear would leave that row's spinner stuck indefinitely.
- Clear-all's button `isLoading` now reads the hook's own `loading` flag directly (`isClearingAllCaches`) instead of the old `isClearingCache === "all"` sentinel comparison, since clear-all no longer shares state with the per-row clear.
- `checkForUpdate`'s no-registration early return changed from `return toast({...})` to a toast call followed by a plain `return;` guard — behaviourally identical, cleaner once the try/catch scaffolding was removed, exactly as the plan anticipated.
- No extraction or ignore-with-reason fallback was applied: the conversion alone resolved all three findings (the plan's expected-outcome branch), confirmed by rescan before considering either fallback.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added a scoped `try/finally` around the single-cache clear handler's body to guarantee per-row state cleanup**
- **Found during:** Task 1 (cached-files card conversion)
- **Issue:** The plan's literal instruction ("set it at the top of the useAsyncAction callback and clear it at the end") would leave `isClearingCache` permanently set to the failed cache's name if `clearCache()` throws, since the "clear at the end" statement would never execute on the error path — silently stuck spinner, a correctness regression relative to the original hand-rolled `try/finally`.
- **Fix:** Kept a `try { ... } finally { setIsClearingCache(null); }` wrapper around the mutation and success toast, without a `catch` — the thrown error still propagates to `useAsyncAction`'s own catch/toast, so no error handling is duplicated or swallowed; only the row-cleanup guarantee is preserved.
- **Files modified:** `src/views/settings/background-worker/cached-files-card.tsx`
- **Verification:** `pnpm build` passed; scoped rescan confirmed 0 duplicate-block findings in the file; per-row `isLoading` prop still compares `isClearingCache` against `cacheInfo.name` as before.
- **Committed in:** `fb140185f` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical / correctness)
**Impact on plan:** Necessary to avoid a stuck-spinner regression; no scope creep — no other files touched, no unflagged handler converted.

## Issues Encountered

None. Both files' duplicate-block findings cleared on the first conversion pass; the plan's fallback branches (converting `applyUpdate`, extracting a shared toast helper, or adding a rule-scoped ignore) were not needed.

## OUTSTANDING Manual Verification (NOT performed — do not treat as confirmed)

This project has no test runner yet (vitest arrives in plan 05-13), and `.planning/config.json` sets both `build_command` and `test_command` to `pnpm build`, which only typechecks and bundles — it never exercises component behavior at runtime. Separately, Phase 03's D-09 required a manual spot-check of this exact class of loading-state conversion, and that check was never performed (03-04's dev-server session died to an OOM and was closed unverified by explicit maintainer decision, per STATE.md's 2026-09-15 entry).

Therefore, for both cards converted in this plan, the following behaviors are **explicitly outstanding and unverified** — `pnpm build` passing does not demonstrate any of them:

- Cached-files card: that the single-cache "Clear" button shows its spinner only on the row being cleared (not on other rows), that the "Clear All" and "Update offline cache" buttons show their own loading/disabled state correctly, and that both success and failure toasts actually render with the expected text.
- Service-worker status card: that the "Check for Update" button's loading/disabled state renders correctly, and that all three informational toasts (no-registration warning, update-available notice, already-latest confirmation) actually appear as expected in the browser.

No claim of "verified" or "confirmed" is made for any of the above. A future phase-level UAT pass (or a working dev-server session) is needed to close this gap.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three D-07-flagged findings in the background-worker cards are measured to zero; bucket-H total now at 16 (from 33 at phase start), tracked in `05-BASELINE.md`.
- The outstanding manual-verification item above should be carried forward into phase-level UAT/verification for Phase 05, alongside the still-open D-09 item from Phase 03 it inherits its shape from.
- No blockers for subsequent Wave 2 plans (05-05, 05-06); this plan touched only the two named background-worker files.

---
*Phase: 05-refactor-oversized-files-long-functions-and-duplicated-block*
*Completed: 2026-09-24*

## Self-Check: PASSED

- FOUND: src/views/settings/background-worker/cached-files-card.tsx
- FOUND: src/views/settings/background-worker/service-worker-status-card.tsx
- FOUND: .planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-04-SUMMARY.md
- FOUND commit: fb140185f
- FOUND commit: e542b8562
- FOUND commit: 73c905f19
