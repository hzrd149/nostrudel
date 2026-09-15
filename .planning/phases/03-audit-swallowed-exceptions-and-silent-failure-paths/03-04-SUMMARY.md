---
phase: 03-audit-swallowed-exceptions-and-silent-failure-paths
plan: 04
subsystem: error-handling
tags: [aislop, useAsyncAction, react-hooks, silent-failure, unverified]

requires:
  - phase: 03-audit-swallowed-exceptions-and-silent-failure-paths
    provides: "03-01's whole-repo bucket-B error baseline and the D-01 done-means-zero bar this plan contributes 3 of the 31 errors to"
provides:
  - "src/components/cashu/mint-control.tsx's Remove Mint handler runs through useAsyncAction; failure now toasts instead of doing nothing"
  - "src/views/settings/relays/components/relay-control.tsx's Remove Relay handler runs through useAsyncAction; failure now toasts instead of doing nothing"
  - "src/views/settings/cache/components/enable-with-delete.tsx's Clear Database handler runs through useAsyncAction with a corrected dependency array; failure now toasts instead of doing nothing"
affects: [phase-3-verification, backlog-D-09-manual-verification]

tech-stack:
  added: []
  patterns:
    - "Converting a hand-rolled useState loading + try/catch pair to useAsyncAction, deleting the local loading state and binding run/loading directly to the triggering control"

key-files:
  created: []
  modified:
    - src/components/cashu/mint-control.tsx
    - src/views/settings/relays/components/relay-control.tsx
    - src/views/settings/cache/components/enable-with-delete.tsx

key-decisions:
  - "Task 3's dev-server spot-check was NOT performed. The maintainer's explicit decision: close 03-04 with Task 3 recorded as unverified rather than continue waiting or silently dropping the item."
  - "wipeDatabase's original useCallback(async ..., []) closed over wipe with an empty dep array (a stale-closure hazard); it is now useAsyncAction(async ..., [wipe]) with the correct dependency, an incidental correctness improvement beyond the plan's stated scope"

requirements-completed: [D-01]

coverage:
  - id: D1
    description: "mint-control.tsx and relay-control.tsx Remove handlers converted to useAsyncAction; zero error-severity bucket-B findings; no orphaned useState import"
    requirement: D-01
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq filter for ai-slop/swallowed-exception / ai-slop/silent-recovery, error severity, scoped to both files -- 0 (Task 1 acceptance criteria); pnpm build passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "enable-with-delete.tsx wipeDatabase handler converted to useAsyncAction; zero error-severity bucket-B findings; parent-driven isLoading wiring on Button/MenuButton left untouched"
    requirement: D-01
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq filter for ai-slop/swallowed-exception / ai-slop/silent-recovery, error severity, scoped to the file -- 0 (Task 2 acceptance criteria); pnpm build passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "Loading-state rendering unchanged after useAsyncAction conversion across all three controls (D-09, 03-VALIDATION.md Manual-Only Verifications row 1)"
    requirement: D-09
    verification:
      - kind: manual_procedural
        ref: "pnpm dev spot-check per 03-VALIDATION.md and this plan's Task 3 how-to-verify"
        status: unknown
    human_judgment: true
    rationale: "The dev server was killed by the OS (OOM, swap fully consumed) before any control could be exercised and could not be restarted reliably on this machine. The maintainer's explicit decision was to close the plan with this item recorded as outstanding rather than continue attempting the spot-check or silently drop it. Static review (below) confirms the wiring is structurally correct, but only a running app can confirm the rendered spinner behavior matches pre-change, so this remains genuinely unverified."

duration: ~15min (Tasks 1-2) + continuation session (Task 3 closure)
completed: 2026-09-15
status: complete
---

# Phase 03 Plan 04: Convert three user-triggered actions to useAsyncAction Summary

**Converted the mint-remove, relay-remove, and cache-wipe handlers to `useAsyncAction`, clearing their 3 error-severity bucket-B findings; the dev-server visual spot-check (Task 3) could not be performed due to an OOM-killed dev server and is closed as explicitly unverified per the maintainer's decision.**

## Performance

- **Duration:** ~15 min (Tasks 1-2, original executor) + continuation session (Task 3 closure only, no code)
- **Completed:** 2026-09-15
- **Tasks:** 2 of 3 completed with passing automated verification; Task 3 closed unverified by maintainer decision
- **Files modified:** 3

## Accomplishments
- `mint-control.tsx`'s Remove Mint handler and `relay-control.tsx`'s Remove Relay handler both now run through `useAsyncAction`, replacing their hand-rolled `useState` loading pair and empty-catch try/catch; a failure now raises a toast where previously nothing happened
- `enable-with-delete.tsx`'s Clear Database handler now runs through `useAsyncAction`, replacing a `useCallback`-wrapped handler that had no error feedback at all
- All three files confirmed zero error-severity bucket-B (`ai-slop/swallowed-exception`, `ai-slop/silent-recovery`) findings via the plan's jq assertions, and `pnpm build` passed after each task
- This plan closes 3 of the 31 whole-repo bucket-B error-severity findings tracked by D-01

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert the mint and relay remove handlers to useAsyncAction** - `f7f3404fe` (fix)
2. **Task 2: Convert the cache wipe handler to useAsyncAction** - `f4dce06d6` (fix)
3. **Task 3: Spot-check the three converted controls in dev** - not performed; closed unverified (no commit, no code change — see below)

_No TDD tasks in this plan; each task is a single commit._

**Note on repository state:** sibling plan 03-05 was executed and committed while this plan's Task 3 checkpoint was open (with maintainer authorization). Commits `2a8d3781f`, `bdd45c0db`, `32e212955`, `d01e4a865`, `bdb40ab84` on top of this plan's two commits belong to 03-05, not to 03-04, and touch none of this plan's three files.

## Files Created/Modified
- `src/components/cashu/mint-control.tsx` - `remove` is now `useAsyncAction(async () => onRemove(), [onRemove])`; `IconButton` bound to `onClick={remove.run}` / `isLoading={remove.loading}`; the hand-rolled `useState` loading pair and the orphaned `useState` import both removed.
- `src/views/settings/relays/components/relay-control.tsx` - Identical conversion to `mint-control.tsx`: `remove` driven by `useAsyncAction`, `IconButton` bound to `remove.run`/`remove.loading`, orphaned `useState` import removed.
- `src/views/settings/cache/components/enable-with-delete.tsx` - `wipeDatabase` is now `useAsyncAction(async () => { await wipe(); location.reload(); }, [wipe])`; `MenuItem` bound to `onClick={wipeDatabase.run}`; the orphaned `useCallback` import removed. The parent-supplied `isLoading` prop feeding the `Button` and `MenuButton` was left completely untouched — this component never had a local loading state to replace.

## Decisions Made
- **Close Task 3 unverified, per maintainer decision.** The `pnpm dev` server was killed by the OS during the verification attempt (memory exhaustion — swap fully consumed) before any of the three controls could be exercised, and it could not be restarted reliably on this machine. Rather than continue waiting on a verification environment that could not be brought up, or silently drop the checkpoint, the maintainer's explicit instruction was to close 03-04 with Task 3 recorded as unverified and the reason documented here. This continuation session did not attempt to restart the dev server, per that same instruction (this machine is memory-constrained, and restarting it is what caused the failure the first time).
- `wipeDatabase`'s original `useCallback(async ..., [])` had an empty dependency array while closing over `wipe` — a latent stale-closure hazard, since `useCallback` (unlike `useAsyncAction`) does not re-capture the closure on every render. The conversion to `useAsyncAction(async ..., [wipe])` supplies the correct dependency. This is an incidental improvement Task 2 made while doing the required conversion, not a scope expansion — the plan's `<action>` explicitly called out the original `[]` as wrong and `[wipe]` as correct.

## Deviations from Plan

None in the code — plan executed exactly as written for Tasks 1 and 2, and every automated acceptance criterion in both tasks passed on the original run (per the completed-tasks record from the paused checkpoint). Task 3 itself is not a deviation: the plan's own `<action>` for Task 3 anticipated a non-"approved" outcome ("If the maintainer reports a spinner or loading-state difference, record it verbatim... rather than fixing it silently"). What happened here — the verification environment failing before any observation could be made — is the same category of outcome: a real result that must be recorded honestly rather than assumed to have passed.

## Issues Encountered

**Task 3 could not be executed: dev server killed by OOM.** The `pnpm dev` server was killed by the OS during the verification attempt because the machine's swap was fully consumed, and it could not be restarted reliably. No control (Remove Mint, Remove Relay, Clear Database) was ever exercised in a running app. This is recorded as an outstanding manual verification, not as a passed check:

- **D-09 requirement status:** OUTSTANDING. Per `03-VALIDATION.md`'s "Manual-Only Verifications" table, row 1 ("Loading-state rendering unchanged after `useAsyncAction` conversion", requirement D-09) requires clicking Remove Mint, Remove Relay, and Clear Database in a running dev instance to confirm spinner/disabled behavior matches pre-change and that a failure now toasts. That row is not satisfied by this plan and remains open for phase-level verification to surface.
- **Partial mitigation that did hold:** threat T-03-14 in this plan's threat model ("Button stuck in a loading state after conversion") is *partly* covered by `pnpm build`. Deleting the old `loading`/`setLoading` state breaks any stale `isLoading={loading}` reference at compile time via `tsc`, so a missed render call site would have failed the build — and `pnpm build` passed after both Task 1 and Task 2, and again at the end of the wave (per 03-05's SUMMARY, which ran the whole-repo build after its own tasks with these files untouched). This narrows T-03-14's untested remainder to purely visual spinner-rendering behavior (does the spinner *look* right, does it clear on both success and failure) — it does not prove the type-level wiring is also visually correct, which only a running app can confirm.
- **Static confirmation performed this session (does not replace the visual check):** in `mint-control.tsx` and `relay-control.tsx`, `IconButton` binds `onClick={remove.run}` and `isLoading={remove.loading}` — the same button element the hand-rolled `loading` state previously drove (confirmed via `grep -n` against both files, lines 46-47 and 45-46 respectively). In `enable-with-delete.tsx`, `wipeDatabase.loading` is not referenced anywhere in the render — confirmed the file never had a local loading state to replace; its `Button` and `MenuButton` spinners are driven entirely by the parent-supplied `isLoading` prop (lines 35 and 39), which this plan left untouched. This narrows the residual risk to rendering behavior only, but is not a substitute for the visual spot-check.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Tasks 1 and 2 are complete and verified by automation (`pnpm build`, scoped aislop rescans). This plan's 3 findings are cleared from the bucket-B error count. Task 3 (D-09's dev-server spot-check) is explicitly OUTSTANDING and must be surfaced at phase-level verification (`/gsd-verify-work` or equivalent) rather than assumed complete — 03-VALIDATION.md's Manual-Only Verifications table row 1 should be marked accordingly when phase verification runs. No source file was modified in this continuation session; the working tree is unchanged from the state left by the original executor's Task 2 commit (`f4dce06d6`).

---
*Phase: 03-audit-swallowed-exceptions-and-silent-failure-paths*
*Completed: 2026-09-15*

## Self-Check: PASSED

All 3 modified source files and this SUMMARY.md confirmed present on disk. Both task commit hashes (`f7f3404fe`, `f4dce06d6`) confirmed present in `git log --oneline --all`. Static grep confirmation of `remove.run`/`remove.loading`/`isLoading` wiring in all three files performed and recorded above.
