---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 07
subsystem: hooks
tags: [react, hooks, webxdc, refactor, aislop]

# Dependency graph
requires:
  - phase: 05-01
    provides: measured aislop baseline and per-finding disposition table (D-19)
provides:
  - useWebxdc split into two focused, non-exported sub-hooks (useWebxdcStateUpdates,
    useWebxdcRealtimeChannel), with useWebxdcStateUpdates itself split again into
    useWebxdcCollectedUpdates to clear the plain-function budget
  - measured resolution of the complexity/function-too-long finding for src/hooks/use-webxdc.ts
affects: [05-08 (post-modal/webxdc.tsx extractions), 05-14 (phase close-out D-19 table)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hook decomposition along ref-ownership seams: group a callback/effect pair only when
      they share a ref, keep the parent hook to composition + assembly"

key-files:
  created: []
  modified:
    - src/hooks/use-webxdc.ts
    - .planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md

key-decisions:
  - "useWebxdcStateUpdates (the plan's named sub-hook) still measured 91 lines after the first
    division, 11 over the 80-line budget; split again into useWebxdcCollectedUpdates
    (subscription effect + serial-numbering memo) so neither half exceeds the budget, per
    Task 2's instruction to split further rather than reach for an ignore"
  - "The realtime channel joiner is the sixth callback in this hook and the largest at 68 lines,
    missing from 05-CONTEXT.md's five-callback D-12 breakdown; recorded as a documentation
    correction in 05-BASELINE.md rather than promoted to backlog (D-18)"

patterns-established:
  - "When a plan's named sub-hook grouping still exceeds budget after the first split, split
    again along a ref-ownership seam inside it rather than adding an ignore — hooks are not
    eligible for D-12's ignore-with-reason disposition, extraction is the decided remedy"

requirements-completed: []

coverage:
  - id: D1
    description: "useWebxdc divided into useWebxdcStateUpdates/useWebxdcCollectedUpdates and useWebxdcRealtimeChannel sub-hooks, clearing the function-too-long finding with correct ref ownership and an unchanged public surface"
    verification:
      - kind: unit
        ref: "pnpm build (typecheck+bundle) — exit 0"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq bucket-H filter on src/hooks/use-webxdc.ts — returns 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Runtime correctness of the split hook (state-update delivery, listener registration, realtime channel join/send/leave) against a live relay or a running hosted mini-app"
    verification: []
    human_judgment: true
    rationale: "No test runner exists until 05-13; pnpm build only typechecks and bundles. No behavioural test coverage exists for this hook, so the webxdc realtime/persistent-update/listener surfaces were not exercised in a running browser this session."

duration: ~15min
completed: 2026-09-24
status: complete
---

# Phase 05 Plan 07: Split useWebxdc into state-updates and realtime-channel sub-hooks Summary

**useWebxdc (234 lines) divided into `useWebxdcStateUpdates`/`useWebxdcCollectedUpdates` and `useWebxdcRealtimeChannel` sub-hooks, clearing the function-too-long finding with ref ownership verified by grep**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-09-24T23:05:00Z (approx)
- **Completed:** 2026-09-24T23:23:54Z
- **Tasks:** 2
- **Files modified:** 2 (`src/hooks/use-webxdc.ts`, `05-BASELINE.md`)

## Accomplishments
- Extracted `useWebxdcStateUpdates` (persistent kind 4932 subscription delivery: listener ref,
  last-serial ref, delivery effect, `setUpdateListener`, `getAllUpdates`) and
  `useWebxdcRealtimeChannel` (ephemeral kind 20932 realtime joiner + unmount cleanup, sharing the
  active/abort refs), per the plan's named seams.
- Because `useWebxdcStateUpdates` still measured 91 lines after that first division — 11 over the
  80-line plain-function budget — split it again into `useWebxdcCollectedUpdates` (the
  subscription effect and its serial-numbering memo, owning only `stateEvents`) so neither
  resulting function exceeds budget.
- Measured (not assumed) the finding clear: scoped rescan of `src/hooks/use-webxdc.ts` across all
  four bucket-H rules returns 0; whole-repo `complexity/function-too-long` fell 5 → 4, bucket-H
  total 7 → 6.
- Confirmed ref ownership by direct grep: `realtimeActiveRef`/`realtimeAbortRef` appear only in
  `useWebxdcRealtimeChannel`'s body; `listenerRef`/`lastSerialRef` appear only in
  `useWebxdcStateUpdates`'s body.
- Confirmed the public surface is unchanged: the returned object still carries all ten members,
  both the named `useWebxdc` export and the default export survive, export count from the file
  is unchanged (2), no new file was created under `src/hooks/`, and both `WEBXDC_UPDATE_KIND` and
  `WEBXDC_REALTIME_KIND` are still used.
- Recorded the sixth-callback documentation gap: 05-CONTEXT.md's D-12 breakdown of this hook
  names five callbacks, but the realtime joiner (68 lines, the largest of the six) was missing
  from it; recorded in `05-BASELINE.md` as a documentation correction, not a bug.
- `05-BASELINE.md`'s D-19 per-rule table and a new resolution section updated with the measured
  after-counts.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract the state-updates and realtime-channel sub-hooks (D-12)** - `f4260d7ea` (refactor)
2. **Task 2: Confirm the division held and record the sixth-callback resolution** - `168d71936` (docs)

_No separate plan-metadata commit yet — this SUMMARY.md and STATE.md updates follow in the final commit._

## Files Created/Modified
- `src/hooks/use-webxdc.ts` - Split into `useWebxdcCollectedUpdates`, `useWebxdcStateUpdates`, `useWebxdcRealtimeChannel`, and a thinned `useWebxdc` that composes them plus the identity derivation, `sendUpdate` publisher, and the two unsupported stubs
- `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md` - D-19 table updated (function-too-long 5→4, bucket-H 7→6) plus a new resolution section

## Decisions Made
- Split `useWebxdcStateUpdates` a second time into `useWebxdcCollectedUpdates` when the first
  division still measured 91 lines (11 over budget) — per Task 2's explicit instruction to split
  further along an internal seam rather than reach for an ignore, since D-12 does not permit an
  ignore-with-reason disposition for a hook.
- Kept the realtime joiner (the sixth, previously undocumented callback) grouped with the unmount
  cleanup effect in `useWebxdcRealtimeChannel`, since both read and write the active/abort refs;
  documented the CONTEXT.md gap in `05-BASELINE.md` rather than the backlog (D-18), since it is a
  documentation correction, not a latent bug.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed an unused-variable regression introduced by the extraction**
- **Found during:** Task 1 (mid-edit, via the per-edit aislop hook)
- **Issue:** After moving the delivery effect, listener setter, and `getAllUpdates` into
  `useWebxdcStateUpdates`, the main `useWebxdc` hook still destructured `updates` from the
  sub-hook's return value even though it no longer used that binding directly (only
  `setUpdateListener`/`getAllUpdates` are consumed at that level), producing a new
  `eslint/no-unused-vars` finding.
- **Fix:** Removed the unused `updates` destructure from `useWebxdc`, keeping only
  `setUpdateListener`/`getAllUpdates`.
- **Files modified:** `src/hooks/use-webxdc.ts`
- **Verification:** Rescoped rescan confirmed the `eslint/no-unused-vars` finding cleared; no
  other finding was introduced.
- **Committed in:** `f4260d7ea` (Task 1 commit)

**2. [Rule 1 - Bug] Split `useWebxdcStateUpdates` further to actually clear the budget**
- **Found during:** Task 1, confirmed at Task 2
- **Issue:** The two-sub-hook division the plan named cleared `complexity/function-too-long` for
  the file as a whole (since the scanner reports per-function, and the offending 234-line
  function no longer existed), but a scoped line count of the new `useWebxdcStateUpdates` showed
  it alone measured 91 lines — 11 over the 80-line plain-function budget, meaning the finding had
  merely relocated rather than cleared, which Task 2's acceptance criteria explicitly warns
  against ("a division that merely moves 234 lines into one 150-line sub-hook would clear
  nothing").
- **Fix:** Split the subscription-effect-and-memo half out into `useWebxdcCollectedUpdates`,
  leaving `useWebxdcStateUpdates` with only the refs, delivery effect, setter, and getter.
- **Files modified:** `src/hooks/use-webxdc.ts`
- **Verification:** Scoped full-repo rescan confirmed 0 bucket-H findings in the file after this
  split; both resulting functions measured well under 80 lines.
- **Committed in:** `f4260d7ea` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs introduced by this task's own edit and
fixed before committing)
**Impact on plan:** Both were self-introduced during the extraction and caught before commit via
the per-edit hook and the plan's own acceptance criteria; no scope creep, no change to the
plan's required grouping (state-updates vs. realtime-channel) or to any ref's ownership.

## Issues Encountered
None beyond the two auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Manual Verification — OUTSTANDING

**No behavioural test coverage exists for this hook.** No test runner exists until plan 05-13,
and `.planning/config.json` sets both `build_command` and `test_command` to `pnpm build`, which
only typechecks and bundles — it cannot exercise runtime behavior. The following were NOT
exercised in a running browser or against a live relay this session and are recorded here as
explicit OUTSTANDING items, not assumed verified from the passing build:

- Persistent state-update delivery: a hosted webxdc app registering a listener via
  `setUpdateListener()` and receiving previously-published kind 4932 updates in serial order.
- `getAllUpdates()` returning the full update history to a caller.
- The realtime channel: `joinRealtimeChannel()` → `setListener()` → sending/receiving ephemeral
  kind 20932 frames between two sessions, the 128,000-byte send-side limit, the own-event echo
  filter, and `leave()` correctly aborting the subscription (verified only by code inspection and
  by the unmount-cleanup effect firing correctly per React's hook-call-order guarantees, not by
  running it).

`pnpm build`'s passing typecheck is a partial mitigation (a hook call moved into a conditional,
a mismatched ref type, or a broken import would have failed it), but it cannot catch a runtime
hook-order violation from a stale render, a leaked effect cleanup, or a functional regression in
the moved logic.

## Next Phase Readiness
- `src/hooks/use-webxdc.ts` is done for this phase; `src/components/webxdc/webxdc.tsx` remains
  for plan 05-08, which was not touched here per its exclusion from this plan's scope.
- Bucket-H now stands at 6 whole-repo (`complexity/function-too-long` 4, `complexity/file-too-large` 2);
  the remaining `function-too-long` findings (`post-modal/index.tsx`, `webxdc.tsx`,
  `napplet-shell-provider.tsx` x2) are targeted by 05-08 and 05-11/05-12.

---
*Phase: 05-refactor-oversized-files-long-functions-and-duplicated-block*
*Completed: 2026-09-24*

## Self-Check: PASSED

- FOUND: `src/hooks/use-webxdc.ts`
- FOUND: `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-07-SUMMARY.md`
- FOUND commit: `f4260d7ea`
- FOUND commit: `168d71936`
