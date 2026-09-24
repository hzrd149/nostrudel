---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 01
subsystem: infra
tags: [aislop, roadmap, planning-artifact, code-quality]

# Dependency graph
requires:
  - phase: 04-dead-code-and-import-hygiene-sweep
    provides: a clean dead-code baseline so this phase's bucket-H measurement is not polluted by code about to be deleted
provides:
  - "05-BASELINE.md: the re-measured 33-finding bucket-H inventory with a real disposition (extract/convert/delete/ignore-with-reason) for every finding"
  - "the seeded D-19 per-rule 33 -> N before/after table that plans 02-13 append to and plan 14 closes"
  - "a corrected ROADMAP.md Phase 5 entry (33 findings, ac904e754, 1162-line napplet-shell-provider, relay-stats.ts framed as dead code, torrents.ts framed as a static-table ignore)"
affects: [05-02, 05-03, 05-04, 05-05, 05-06, 05-07, 05-08, 05-09, 05-10, 05-11, 05-12, 05-13, 05-14]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Live-scan re-measurement before planning claims (D-03): never transcribe a written count, always re-run `pnpm exec aislop scan --json .` and record what it says, noting any disagreement rather than suppressing it"
    - "Scoped Edit-only correction of shared roadmap prose (T-05-01 mitigation): never Write a multi-phase document, verify with a phase-heading count and hunk-boundary check instead"

key-files:
  created:
    - .planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md
  modified:
    - .planning/ROADMAP.md

key-decisions:
  - "Live scan at commit ac904e754 measured score 85/100, 694 total diagnostics, 33 bucket-H findings (21/8/2/2) — matching 05-CONTEXT.md's D-03 figures exactly, so no discrepancy note was needed against the plan's expected 85/694/33 numbers"
  - "Per-finding Plan-column mapping onto ROADMAP's 14-plan wave list is best-effort at this point; the three napplet-shell-provider.tsx findings resolved by the D-08 split are spread across 05-10 through 05-12 since exact module boundaries are explicitly Claude's discretion in 05-CONTEXT.md"

requirements-completed: []

coverage:
  - id: D1
    description: "05-BASELINE.md exists with all 33 bucket-H findings, each carrying a real disposition, plus the seeded D-19 before/after table"
    verification:
      - kind: other
        ref: "grep -c 'src/' 05-BASELINE.md returns 33; disposition tally (16 extract, 13 ignore-with-reason, 3 convert, 1 delete) sums to 33; zero table-row occurrences of the text \"out of scope\""
        status: pass
    human_judgment: false
  - id: D2
    description: "ROADMAP.md Phase 5 entry corrected: 33-finding count with commit/date, torrents.ts reframed as a static-table ignore, napplet-shell-provider.tsx corrected to 1162 lines with split note, relay-stats.ts reframed as deleted dead code"
    verification:
      - kind: other
        ref: "node gsd-tools.cjs roadmap validate returns {\"warnings\": []} both before and after; grep -c '^### Phase ' .planning/ROADMAP.md returns 14; git diff -U0 .planning/ROADMAP.md hunks fall at lines 205 and 213, both inside the Phase 5 entry (196-224)"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-24
status: complete
---

# Phase 5 Plan 1: Re-measure baseline and correct stale ROADMAP entry Summary

**Live aislop scan confirms 33 bucket-H findings at commit ac904e754 (score 85/100, 694 total diagnostics) with a per-finding disposition table, and the ROADMAP Phase 5 entry's three stale claims (torrents.ts as a real target, ">600 lines" napplet provider, "thin wrapper" relay-stats.ts) are corrected via scoped Edit calls.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-24T19:58:37Z
- **Completed:** 2026-09-24T20:04:45Z
- **Tasks:** 2 completed
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments
- Ran a live `pnpm exec aislop scan --json .` at commit `ac904e754` and built `05-BASELINE.md`: a per-rule 33→N before/after table seeded from the measurement, and a 33-row per-finding table where every row carries a real disposition (`extract`, `convert`, `delete`, or `ignore-with-reason`) drawn from `05-CONTEXT.md`'s D-05/D-06/D-07/D-08/D-12/D-13/D-14 verdicts — including the 14 findings in files the ROADMAP never named (D-02)
- The live scan's headline numbers (score 85, 694 total diagnostics, 33 bucket-H findings split 21/8/2/2) matched `05-CONTEXT.md`'s D-03 figures exactly — no live-scan-vs-written-count discrepancy to record
- Corrected all three D-04 staleness points in the ROADMAP Phase 5 entry using scoped `Edit` calls only (never `Write`): the count sentence now reads 33 findings measured on `next` at `ac904e754`; `helpers/nostr/torrents.ts` moved out of "Real targets" into a sentence describing it as a static-taxonomy table cleared by one file-level ignore; `napplet-shell-provider.tsx`'s size corrected from ">600 lines" to the measured 1162, with a note that it splits into `src/services/napplet-shell/*` with modals moved to `components/napplets/`; `relay-stats.ts` reframed from "thin wrapper to inline or justify" to half-dead code whose dead symbols are deleted, and `verify-event.ts` reframed as load-bearing and kept behind an ignore-with-reason
- Verified the edit's blast radius: `roadmap validate` returned `{"warnings": []}` both before and after the edits, the phase-heading count stayed at 14, and both diff hunks (at lines 205 and 213) fall entirely inside the Phase 5 entry (lines 196-224), leaving the other thirteen phase entries byte-identical

## Task Commits

Each task was committed atomically:

1. **Task 1: Re-measure the bucket-H baseline and record per-finding dispositions** - `333e4aaab` (docs)
2. **Task 2: Correct the three stale points in the ROADMAP Phase 5 entry** - `dec197048` (docs)

_No plan-metadata commit yet — this SUMMARY.md and STATE.md/ROADMAP.md progress updates are committed separately per the sequential-executor final-commit step._

## Files Created/Modified
- `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md` - the re-measured 33-finding inventory, seeded per-rule before/after table, scope note (D-02), and wave-order note (D-17)
- `.planning/ROADMAP.md` - Phase 5 entry corrected per D-04 (count, torrents framing, napplet-shell-provider size, relay-stats/verify-event framing)

## Decisions Made
- Live scan re-measurement (D-03) reproduced the plan's expected 85/100, 694-total, 33-bucket-H numbers exactly at the commit actually run (`ac904e754`, not the plan's stale hardcoded `3e210b641` reference — the orchestrator's note to record the actual HEAD was followed)
- The two `napplet-shell-provider.tsx` `function-too-long` findings (`createResourceService`, `NappletShellProvider`) and its `file-too-large` finding are recorded with `extract` disposition and mapped across plans 05-10 through 05-12, since D-08's split spans multiple waves and exact module boundaries are explicitly left to Claude's discretion in `05-CONTEXT.md`
- The three `cached-files-card.tsx`/`service-worker-status-card.tsx` duplicate-block findings are dispositioned `convert` (not `extract`) since D-07 treats the `useAsyncAction` conversion as the primary remedy, with the duplicate-block clearing as a verified side effect

## Deviations from Plan

None - plan executed exactly as written. The orchestrator's three pre-flight notes were followed as instructed: the actual HEAD commit (`ac904e754`) was recorded instead of the plan's stale `3e210b641` reference, the live scan's 85/694/33 figures were recorded as measured (they happened to match the plan's expected numbers, so no discrepancy note was needed), and every one of the 33 rows received a real disposition per D-01.

## Issues Encountered

None. The live scan's per-rule breakdown (21 duplicate-block, 8 function-too-long, 2 file-too-large, 2 thin-wrapper) matched `05-CONTEXT.md`'s figures line-for-line, including every specific file:line site named in D-05/D-06/D-08/D-12/D-13/D-14 — no unexpected findings and no missing ones.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`05-BASELINE.md` and the corrected ROADMAP entry give plans 02-14 an authoritative, re-measured starting point and a shared before/after table to append to. Wave 1 siblings (05-02, 05-03) can proceed immediately — their target dispositions (torrents.ts file-level ignore, relay-stats.ts deletion, verify-event.ts ignore, the four borderline duplicate-block ignores, the three oversized-page-component ignores) are already recorded in the baseline's per-finding table. No blockers.

---
*Phase: 05-refactor-oversized-files-long-functions-and-duplicated-block*
*Completed: 2026-09-24*

## Self-Check: PASSED

- FOUND: `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md`
- FOUND: `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-01-SUMMARY.md`
- FOUND commit: `333e4aaab`
- FOUND commit: `dec197048`
