---
phase: 06-close-type-safety-escape-hatches
plan: 01
subsystem: planning
tags: [aislop, baseline, roadmap, type-safety]

requires:
  - phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
    provides: post-split file layout that made the old Phase 6 entry stale
provides:
  - 06-BASELINE.md with the 68 measured bucket-E findings, dispositions and owning plans
  - Seeded per-rule 68 -> N table for plan 06-10 to close
  - Corrected ROADMAP Phase 6 entry (D-03)
affects: [06-02, 06-03, 06-04, 06-05, 06-06, 06-07, 06-08, 06-09, 06-10]

tech-stack:
  added: []
  patterns: ["baseline = live scan, confirmed against the planner's per-finding table"]

key-files:
  created:
    - .planning/phases/06-close-type-safety-escape-hatches/06-BASELINE.md
  modified:
    - .planning/ROADMAP.md

key-decisions:
  - "Live scan at 55afb48fd (src identical to 5884dac0a) matched the planner's measurement exactly: 35/20/13, score 85, 665 diagnostics, identical 68 file:line locations"
  - "Three surviving rule-scoped ignores expected (atSchema cast, MagicInput directive, vertex cast); RESEARCH.md's 'exactly 2' is superseded by D-17"

requirements-completed: [D-01, D-02, D-03, D-04, D-13, D-16]

duration: 10min
completed: 2026-10-05
status: complete
---

# Phase 6 Plan 01: Baseline and ROADMAP correction Summary

**Measured 68-finding bucket-E baseline recorded per finding with dispositions and owning plans, plus the stale ROADMAP Phase 6 entry corrected.**

## Accomplishments

- `06-BASELINE.md`: header with measured score/count/commit, seeded per-rule table (35/20/13 = 68, After TBD for 06-10), 68-row per-finding table (per-plan tally 19/9/1/6/4/8/5/16, 2 ignore-with-reason rows), the unflagged `services/debug-api.ts:52` row, the three-ignore inventory, D-04 scope note, D-16 wave order, and the rescan and grep commands (grep baseline 70 lines, confirmed live).
- ROADMAP Phase 6 entry: measured count at `5884dac0a`, post-split napplet-shell and wallets locations, the 19 DEV-only debug globals with the `Reflect.set` remedy, and the notification casts reframed as the `useVirtualListScrollRestore` ref type. Only prose inside the Phase 6 entry changed (hunks at lines 280 to 297, Phase 6 spans 271 to 328); 14 phase headings remain and `roadmap validate` returns no warnings before and after.

## Task Commits

1. Task 1: baseline document - `db09be9a0`
2. Task 2: ROADMAP D-03 correction - `cc10e3a98`

## Deviations from Plan

None - plan executed exactly as written. The live re-measurement agreed with the planner's table, so no discrepancy note was needed. `src/` and `.aislop/config.yml` were not touched; `pnpm build` exits 0.

## Issues Encountered

None.

## Known Stubs

None (the `TBD` cells in 06-BASELINE.md are intentional placeholders owned by plan 06-10).

## Self-Check: PASSED

- 06-BASELINE.md exists with 68 finding rows; commits `db09be9a0` and `cc10e3a98` exist.
