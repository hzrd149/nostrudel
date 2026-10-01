---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 14
subsystem: planning
tags: [aislop, refactor, verification, closeout]
requires:
  - phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
    provides: plans 05-01 through 05-13 (baseline, ignores, extractions, splits, test runner)
provides:
  - "closed 33-to-0 per-rule before/after table, measured against a live scan"
  - "surviving-ignore inventory: 13 findings behind 9 rule-scoped directives, each with its reason"
  - "latent-bug disposition ledger (D-18) with no item left as a passing mention"
affects: [phase-05-verification, backlog-999.x, phase-06, phase-08]
tech-stack:
  added: []
  patterns: ["measure suppressed findings by stripping directives from a scratch copy and rescanning"]
key-files:
  created: []
  modified:
    - .planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md
    - src/views/notifications/index.tsx
    - .planning/ROADMAP.md
key-decisions:
  - "Corrected the plan's '11 findings behind 9 directives' to 13: the torrents file-level directive alone covers 5"
  - "Notification badge dead ternary fixed in its own commit rather than promoted (provable: count is an array length)"
  - "Nothing promoted to backlog; ROADMAP keeps 14 phase entries"
patterns-established:
  - "Directive-stripped scratch rescan proves exactly which findings an ignore set hides"
requirements-completed: []
status: complete
duration: 20min
completed: 2026-10-01
---

# Phase 5 Plan 14: Close the refactor phase Summary

**Bucket-H closed from 33 to 0 against a live scan (20 fixed in code, 13 behind nine reasoned directives), latent items all disposed, build and 17 tests green.**

## Accomplishments

- Per-rule table closed with measured after-counts: duplicate-block 21 -> 0, function-too-long 8 -> 0, file-too-large 2 -> 0, thin-wrapper 2 -> 0. The live jq measurement from the plan's acceptance criteria returns 0, matching the table.
- Repo-wide: score 85 -> 85, total diagnostics 694 -> 664.
- Surviving-ignore inventory built and confirmed by stripping every `aislop-ignore` line from the nine files in a scratch copy and rescanning: it reproduced exactly 13 findings (5 torrents, 4 borderline duplicate blocks, 3 page components, 1 `verifyEvent`) and nothing else.
- All 33 original rows reconcile to exactly one status (20 fixed, 13 ignored-with-reason, 0 untriaged).
- Gates: `pnpm build` exit 0, `pnpm test` exit 0 (2 files, 17 tests).

## Task Commits

1. Task 1: close the table and inventory - `a1dc31aba` (docs)
2. Task 2: latent-bug fix - `bf9bf5c63` (fix); disposition ledger - `baa3257fb` (docs); roadmap refresh via handler (in the final metadata commit)

## Latent-bug dispositions (D-18)

| Item | Disposition |
|---|---|
| `getRTTTag` parameter-ignoring bug (Phase 4-deferred) | Fixed by deletion in 05-02 (`5ac9e7443`) |
| Notification badge redundant `count > 0 ? "primary" : "gray"` (05-05) | Fixed here, `bf9bf5c63`: `count` is a filtered array length and the zero case returns null above, so the gray branch was unreachable |
| Sixth `useWebxdc` callback missing from CONTEXT.md (05-07) | Not a defect: documentation gap, already corrected in 05-BASELINE.md |
| 05-10 plan prose vs. acceptance-criterion conflict | Not a defect: plan-text conflict, resolved in favour of never exporting the map |
| `log` passed as a parameter in wallet backends (05-09) | Not a defect: deliberate non-move adjustment, avoids an import cycle |
| `shareReplay(1)` textual count 4 -> 2 (05-06) | Not a defect: each loader still has an independent pipeline |
| `applyUpdate` still on `try/catch` (05-04) | Not a defect: logs and toasts the failure, was never a flagged finding |
| `nwc.ts` needs a `preferences` mock under node (05-13) | Not a defect of this phase: pre-existing import-time side effect |
| Pre-existing findings in touched files | Already tracked in Phase 6, Phase 8, backlog 999.5 and 999.8 |
| Un-exercised runtime behaviour (OUTSTANDING lists, 05-04 to 05-12) | Not defects: carried to the phase verifier's human-UAT list |

**Promoted to backlog:** none. `grep -c '^### Phase ' .planning/ROADMAP.md` stays at 14.

## D-15 departure from Phase 3 precedent

Phase 3 rejected a test framework as its own phase. D-15 deliberately reopened that: this phase relocates roughly 1,750 lines of behaviour-bearing code with no coverage, where the type checker proves types but nothing proves behaviour. The D-08 split is what finally made the permission and grant decisions pure and testable, and D-17 therefore placed the harness last (05-13), after the split had produced something worth testing. Scope was held to exactly two test files (permissions and the NWC transaction mapper), with nothing for views or components. A reader seeing two phases decide the same question opposite ways should read this as a change of circumstance (large untested relocation, newly pure code), not a contradiction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Plan miscount] "Eleven findings behind nine directives" is thirteen**
- **Found during:** Task 1
- **Issue:** the plan's expected survivor count did not add up: the torrents directive covers 5 findings, not 1.
- **Fix:** the inventory records 13 findings behind 9 directives, confirmed by the directive-stripped rescan.
- **Files modified:** 05-BASELINE.md
- **Commit:** `a1dc31aba`

**2. [Rule 1 - Bug] Dead colour ternary on the notification badge** (see ledger above) - `bf9bf5c63`.

### Other notes

- The repo score did not move (85 -> 85) even though bucket-H went to 0; the 694 -> 664 drop is 20 bucket-H fixes plus 10 findings that went with touched code. Not claimed as a phase goal.
- D-17 wave order was followed as planned (waves 1-2 small and mechanical, 3-5 the splits, 6 the harness, 7 this closeout). The harness landing after both splits rather than alongside them matches the stated rationale; recorded in 05-BASELINE.md.
- ROADMAP.md was changed only through the `roadmap update-plan-progress` handler, never with Write.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- 05-BASELINE.md, 05-14-SUMMARY.md present; commits `a1dc31aba`, `bf9bf5c63`, `baa3257fb` present in `git log`.
