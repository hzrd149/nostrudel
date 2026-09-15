---
phase: 03-audit-swallowed-exceptions-and-silent-failure-paths
plan: 06
subsystem: documentation
tags: [aislop, error-handling, swallowed-exception, agents-md, phase-gate]

# Dependency graph
requires:
  - phase: 03-02
    provides: "D-05 parse/filter guard remedy sites — the exemplar cited in the new AGENTS.md subsection"
  - phase: 03-03
    provides: "D-10 log-and-continue remedy sites — the event-cache/index.ts exemplar cited in the new subsection"
  - phase: 03-04
    provides: "D-09 useAsyncAction conversions — cross-referenced from the new subsection"
  - phase: 03-05
    provides: "D-13/D-14/D-15 stray remedies that closed the whole-repo bucket-B error count to 0, which this plan confirms and reports"
provides:
  - "AGENTS.md §Error Handling documents the five swallowed-exception remedy shapes this phase established (D-03)"
  - "The D-04 scoped-rescan before/after report (31 -> 0), the phase's only verification mechanism"
  - "Phase-gate confirmation: bucket-B error-severity count is 0 whole-repo"
affects: [phase-4-dead-code-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AGENTS.md documents its own enforced conventions in place, following the Phase 2 precedent (D-12 inline ignores) — this phase adds the swallowed-exception remedy taxonomy alongside it"

key-files:
  created: []
  modified:
    - AGENTS.md

key-decisions:
  - "New '#### Swallowed Exceptions' subsection inserted between '#### Error Patterns' and '### State Management' (AGENTS.md lines 132-167), stating all five remedy shapes and cross-referencing the existing useAsyncAction and Inline ignores sections rather than restating their mechanics"
  - "The D-04 before/after table's 'before' column is 03-RESEARCH.md's per-file breakdown table corrected for one missing row: src/components/event-zap-modal/pay-step.tsx (1 error, D-10, fixed by 03-03) is named in 03-RESEARCH.md's D-10 decision-support text and in 03-03-SUMMARY.md's files-modified list, but was omitted from 03-RESEARCH.md's 'Full per-file bucket-B breakdown' table itself — a research documentation gap, not a missed fix. Adding the row reconciles the table's per-plan sum (03-01:6 + 03-02:13 + 03-03:8 + 03-04:3 + 03-05:1 = 31) with the file/error totals RESEARCH.md's own prose already claimed (33 files, 31 errors, 30 files carrying at least one error)."
  - "pnpm lint:ci's exit code (1, score 98) is NOT treated as a phase-gate failure. Its 3 error-severity findings are all react-hooks/rules-of-hooks in src/components/app-handler-modal/index.tsx lines 55/57/59, confirmed byte-identical at the phase's merge-base commit (77032fc00, before any Phase 03 edit) via git show — the only Phase 3 commit touching that file (fb3d77f59, 03-02) edited line ~141 only. These are backlog 999.2 (React hook-order), explicitly kept out of scope for Phase 3 per the 2026-09-12 backlog review and per .claude/CLAUDE.md's override ('Do not sweep pre-existing findings in touched files'). D-01's actual completion bar — the bucket-B error-severity count — is the jq quick-form assertion, which reads 0."

patterns-established: []

requirements-completed: [D-01, D-03, D-04]

coverage:
  - id: D1
    description: "AGENTS.md documents when an empty catch is legitimate, how to write one that satisfies the lint gate, that user-triggered actions route through useAsyncAction, and that logging goes through the namespaced debug logger"
    requirement: "D-03"
    verification:
      - kind: other
        ref: "grep -c '#### Swallowed Exceptions' AGENTS.md == 1; grep -c 'useAsyncAction' AGENTS.md == 7 (>= 5); grep -c 'logger.extend' AGENTS.md == 1; grep -c 'helpers/debug' AGENTS.md == 1; grep -c 'Inline ignores' AGENTS.md == 2; #### Swallowed Exceptions at line 132 < ### State Management at line 168; #### Error Patterns count 1, ### Linting count 1 (no section damaged); wc -l AGENTS.md == 518 (> 482)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Whole-repo bucket-B error-severity count reads 0"
    requirement: "D-01"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq quick-form filter -> 0; D-13 strays filter (redundant-try-catch, no-async-promise-executor, hidden-fallback) -> 0; full-form per-file jq pipeline across all six bucket-B rule names -> [] (zero findings of any severity, not just error)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Per-file before/after table records the 31 to 0 transition, attributed to plans 03-01 through 03-05"
    requirement: "D-04"
    verification:
      - kind: other
        ref: "33-row table below; totals row 31 -> 0; per-plan subtotals (6+13+8+3+1=31) cross-checked against each sibling SUMMARY's stated delta"
        status: pass
    human_judgment: false

# Metrics
duration: ~15min
completed: 2026-09-15
status: complete
---

# Phase 3 Plan 6: AGENTS.md convention + D-04 phase-gate report Summary

**AGENTS.md now documents the five swallowed-exception remedy shapes this audit established, and a scoped rescan confirms the whole-repo bucket-B error-severity count reached 0 (from 31 at phase start), closing Phase 3.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-09-15T15:29:33Z
- **Tasks:** 2 completed
- **Files modified:** 1 (AGENTS.md) + this SUMMARY.md

## Accomplishments

- `AGENTS.md` §Error Handling gained a new `#### Swallowed Exceptions` subsection (between `#### Error Patterns` and `### State Management`) stating: a reason comment alone never clears `ai-slop/swallowed-exception`; a parse/filter guard needs a reason comment plus an explicit `return`/`continue`/accumulator-return; code that must keep running after the catch should log via the namespaced logger instead of returning; a user-triggered action's failure belongs to `useAsyncAction`; logging goes through `logger.extend("<Module>")` from `src/helpers/debug.ts`, never the console; and a rule-scoped `aislop-ignore-*` is the last resort, cross-referencing the existing "Inline ignores" convention rather than restating its directive syntax
- Ran the D-04 scoped rescan (quick-form + full-form, both from `03-RESEARCH.md`'s tested commands): whole-repo bucket-B error-severity count is `0`; the D-13 four-stray filter is also `0`; the full-form per-file pipeline across all six bucket-B rule names returns `[]` — no bucket-B finding of any severity remains anywhere in the repo, not just at error level
- Confirmed `pnpm build` passes and reconciled `pnpm lint:ci`'s 3 remaining error-severity findings as pre-existing, out-of-scope `react-hooks/rules-of-hooks` defects (backlog 999.2), not a Phase 3 regression — see Decisions Made
- Built the 33-row per-file before/after table below, reconciling a one-row gap in `03-RESEARCH.md`'s own breakdown table (`pay-step.tsx` was named in prose but missing from the table)

## Task Commits

1. **Task 1: Write the error-handling convention into AGENTS.md** - `767ffadf3` (docs)
2. **Task 2: Produce the D-04 before/after report and run the phase gate** - this SUMMARY.md commit (docs, no source change)

## Files Created/Modified

- `AGENTS.md` — new `#### Swallowed Exceptions` subsection (36 lines) inside `### Error Handling`; no other section modified (`#### Error Patterns` and `### Linting` headings both still present exactly once; file grew from 482 to 518 lines)

## D-04 Before/After Report

### Phase-gate results

| Check | Command | Result |
|---|---|---|
| Bucket-B error-severity count (quick form) | `pnpm exec aislop scan --json . \| jq '[.diagnostics[] \| select((.rule=="ai-slop/swallowed-exception" or .rule=="ai-slop/silent-recovery") and .severity=="error")] \| length'` | **`0`** (was `31` at phase start) |
| D-13 four-stray filter | `jq` filter for `ai-slop/redundant-try-catch`, `eslint/no-async-promise-executor`, `ai-slop/hidden-fallback` | **`0`** |
| Full-form per-file pipeline (all six bucket-B rules, any severity) | `03-RESEARCH.md`'s grouped `jq` pipeline | **`[]`** — zero findings, error or warning, across the whole repo |
| Residual `eslint/no-empty` (whole repo) | `jq '[.diagnostics[] \| select(.rule=="eslint/no-empty")] \| length'` | **`0`** |
| Whole-repo aislop score | `pnpm exec aislop scan --json . \| jq .score` | **`81`** (Phase 2 baseline: 78) |
| `pnpm build` | typecheck + vite build | **pass** |
| `pnpm lint:ci` (after `git fetch origin next`) | `aislop ci --changes --base "$(git merge-base origin/next HEAD)"` | **fails** (exit 1, score 98) — see below |

**`pnpm lint:ci` result explained.** The 3 error-severity findings it reports are all `react-hooks/rules-of-hooks` in `src/components/app-handler-modal/index.tsx`, lines 55/57/59 (`useSingleEvent`/`useSingleEvent`/`useReplaceableEvent` called conditionally inside a `switch` in `useEventFromDecode`). Confirmed via `git show 77032fc00:src/components/app-handler-modal/index.tsx` that this exact conditional-hook-call code was already present at the phase's merge-base commit, i.e. before any Phase 3 edit. The only Phase 3 commit touching this file is `fb3d77f59` (03-02), and `git show fb3d77f59 -- src/components/app-handler-modal/index.tsx` shows it edited only the filter catch around line 138-141 — nowhere near lines 55-59. Per `AGENTS.md` §Linting, the gate scores whole touched files including pre-existing findings, so touching this file for its (unrelated) D-05 remedy means inheriting these three. They are backlog item 999.2 (React hook-order — "the only bucket of confirmed error-severity defects", per `STATE.md`'s 2026-09-12 backlog-review entry), explicitly deferred to its own phase, and out of scope here per `.claude/CLAUDE.md`'s override: "Fix findings your own change introduces. Do not sweep pre-existing findings in touched files; those belong to backlog phases 999.2–999.10." D-01's actual completion bar — the bucket-B error-severity count — is unaffected and reads `0`.

### Per-file before/after table (31 -> 0)

`03-RESEARCH.md`'s "Full per-file bucket-B breakdown" table is the authoritative "before" source, re-verified live with zero drift at plan time. Its own prose states the correct totals — "33 files, 31 total errors ... 30 files carrying at least one error" — but the table it renders is missing one row: `src/components/event-zap-modal/pay-step.tsx` (named in the D-10 decision text and in `03-03-SUMMARY.md`'s files-modified list, 1 error, fixed by 03-03). The row is added back below to reconcile the table with RESEARCH.md's own stated totals and with the five sibling SUMMARYs' stated per-plan deltas (6 + 13 + 8 + 3 + 1 = 31, matching exactly).

**Note on CONTEXT.md's original figure:** `03-CONTEXT.md`'s D-01/D-04 wording says "32 across 33" — this was a severity misclassification caught during research (`ai-slop/silent-recovery` is warning-severity, not error-severity). `03-RESEARCH.md`'s live rescan corrected this to 31 error-severity findings, and that correction — not a discrepancy — is what this table reports.

| File | Before (errors) | After (errors) | Plan |
|---|---|---|---|
| `src/classes/encrypted-storage.tsx` | 1 | 0 | 03-01 |
| `src/services/decryption-cache.ts` | 1 | 0 | 03-01 |
| `src/helpers/nostr/dms.ts` | 1 | 0 | 03-01 |
| `src/components/blob-details-modal.tsx` | 2 | 0 | 03-01 |
| `src/views/messages/chat/components/decrypt-placeholder.tsx` | 1 | 0 | 03-01 |
| `src/helpers/parse.ts` | 1 | 0 | 03-02 |
| `src/helpers/nip19.ts` | 1 | 0 | 03-02 |
| `src/components/content/transform/bip-notation.ts` | 1 | 0 | 03-02 |
| `src/components/content/transform/nip-notation.ts` | 1 | 0 | 03-02 |
| `src/helpers/nostr/goal.ts` | 1 | 0 | 03-02 |
| `src/hooks/use-open-graph-data.ts` | 1 | 0 | 03-02 |
| `src/views/tools/event-publisher/index.tsx` | 1 | 0 | 03-02 |
| `src/views/wallet/components/receive-token-modal.tsx` | 1 | 0 | 03-02 |
| `src/views/streams/stream/components/stream-top-zappers.tsx` | 1 | 0 | 03-02 |
| `src/components/app-handler-modal/index.tsx` | 1 | 0 | 03-02 |
| `src/components/relay-url-input.tsx` | 1 | 0 | 03-02 |
| `src/views/lists/components/list-history-modal.tsx` | 1 | 0 | 03-02 |
| `src/views/settings/cache/database/components/import-events-button.tsx` | 1 | 0 | 03-02 |
| `src/services/lnurl-metadata.ts` | 1 | 0 | 03-03 |
| `src/components/debug-modal/event-tags.tsx` | 1 | 0 | 03-03 |
| `src/components/lightning/inline-invoice-card.tsx` | 1 | 0 | 03-03 |
| `src/providers/route/invoice-modal-provider.tsx` | 1 | 0 | 03-03 |
| `src/components/event-zap-modal/pay-step.tsx` | 1 | 0 | 03-03 |
| `src/hooks/use-cache-form.ts` | 1 | 0 | 03-03 |
| `src/components/qr-code/qr-code-scanner-button.tsx` | 1 | 0 | 03-03 |
| `src/services/event-cache/index.ts` | 1 | 0 | 03-03 |
| `src/components/cashu/mint-control.tsx` | 1 | 0 | 03-04 |
| `src/views/settings/relays/components/relay-control.tsx` | 1 | 0 | 03-04 |
| `src/views/settings/cache/components/enable-with-delete.tsx` | 1 | 0 | 03-04 |
| `src/services/sqlite/index.ts` | 0 (2 warning `redundant-try-catch`) | 0 | 03-05 |
| `src/components/qr-code/native-scanner.ts` | 0 (1 warning `no-async-promise-executor`) | 0 | 03-05 |
| `src/hooks/timeline/use-timeline-cache-key.ts` | 0 (1 warning `hidden-fallback`) | 0 | 03-05 |
| `src/index.tsx` | 1 (+1 warning `silent-recovery`) | 0 | 03-05 |
| **Total** | **31** | **0** | — |

Per-plan subtotals: 03-01 = 6, 03-02 = 13, 03-03 = 8, 03-04 = 3, 03-05 = 1. Sum = 31, matching every sibling SUMMARY's stated delta exactly.

### Residual warning-severity bucket-B findings

**None.** The full-form rescan (all six bucket-B rule names, any severity) returns `[]` — zero findings whole-repo. This exceeds D-01's bar, which only required warnings to be cleared "where the decision was deliberate": `eslint/no-empty` fell out entirely as a side effect of the D-05/D-09/D-10 remedies converting catches to bare `catch {}` with real bodies, and all four D-13 strays (`redundant-try-catch` x2, `no-async-promise-executor`, `hidden-fallback`) are confirmed cleared.

## Outstanding Items (not resolved by this phase)

Recorded accurately per the phase's own validation contract, not glossed as complete:

1. **D-09 loading-state manual verification — OUTSTANDING.** `03-04-PLAN.md`'s Task 3 (dev-server spot-check of Remove Mint / Remove Relay / Clear Database) was never performed: `pnpm dev` was OOM-killed on this machine and the maintainer explicitly elected to close the plan with the item unverified. See `03-04-SUMMARY.md` and `03-VALIDATION.md`'s Manual-Only Verifications row 1. `pnpm build`'s typecheck is a partial mitigation (a missed render call site would fail compilation) but does not confirm the spinner/toast visually renders as expected.
2. **D-11 legacy-DM decryption `error` Alert — never exercised.** `03-VALIDATION.md`'s Manual-Only Verifications row 2 (trigger a legacy-DM decryption failure, confirm the existing `error` Alert renders) was not performed. The static case for correctness (`useLegacyMessagePlaintext` never rethrows, so the deleted try/catch was genuinely unreachable, and the component's existing `if (error)` branch is unchanged) was confirmed via source read in `03-01`, but the live UI render itself is unverified.
3. **`native-scanner.ts` unhandled rejection path — accepted risk.** `03-05`'s async-executor fix left `BarcodeScanner.addListener(...).then(...)` without a `.catch`, so an `addListener` rejection would leave `installNativeScanner` hanging. Not a regression (the prior async-executor form swallowed it too), native-only code that cannot be exercised in this environment, and explicitly accepted by the maintainer per `03-VALIDATION.md`'s Manual-Only Verifications row 3 ("accept as residual risk and rely on `pnpm build` typecheck").

These three items are unrelated to D-01/D-03/D-04 (this plan's own requirements, all satisfied) and do not block Phase 3's closure per D-04's explicit rejection of a manual UAT wave — they are recorded here so phase-level verification surfaces them rather than assuming they passed.

## Decisions Made

- The new AGENTS.md subsection is inserted precisely between `#### Error Patterns` (ends line 130) and `### State Management` (now line 168), per `03-PATTERNS.md`'s pinned insertion point; cross-references "useAsyncAction Hook (REQUIRED)" and "Inline ignores" rather than restating either's mechanics
- `pay-step.tsx`'s missing row in `03-RESEARCH.md`'s per-file table is treated as a research documentation gap (the file is real, was fixed by 03-03, and is named in RESEARCH.md's own D-10 prose and in 03-03-SUMMARY.md) — added back to this plan's table rather than silently reproducing the gap, so the 33-file/31-error/30-files-with-errors totals RESEARCH.md itself claims actually reconcile
- `pnpm lint:ci`'s failing exit code is documented, not treated as a phase blocker or an auto-fix target: its 3 errors are confirmed pre-existing (present at the merge-base commit, in file lines untouched by any Phase 3 commit) `react-hooks/rules-of-hooks` findings belonging to backlog 999.2, which `.claude/CLAUDE.md` explicitly instructs not to sweep from touched files during this phase

## Deviations from Plan

### Auto-fixed Issues

None — this plan made no source-code changes; the only file touched is `AGENTS.md`.

### Documentation reconciliation (not a code deviation)

**1. [Research gap] `03-RESEARCH.md`'s per-file breakdown table is missing the `pay-step.tsx` row**
- **Found during:** Task 2, building the D-04 before/after table
- **Issue:** `03-RESEARCH.md`'s "Full per-file bucket-B breakdown" table has 32 rows summing to 30 errors across 29 files, but the same document's prose (Rescan Command section) and this plan's own `<measured_facts>` state "33 files, 31 total errors, 30 files carrying at least one error." `src/components/event-zap-modal/pay-step.tsx` (1 error, D-10 remedy) is named in `03-RESEARCH.md`'s D-10 decision-support prose and confirmed fixed in `03-03-SUMMARY.md`'s files-modified list, but its table row was never written.
- **Fix:** Added the row to this plan's before/after table. No code change; this is a documentation reconciliation only, matching the precedent 03-05 set for its own plan's measured-fact gaps (documented, not fixed, since the underlying work was already correct).
- **Files affected:** None (documentation only, recorded in this SUMMARY).
- **Verification:** Per-plan subtotals (6+13+8+3+1=31) now match every sibling SUMMARY's stated delta and RESEARCH.md's own claimed totals exactly.

## Issues Encountered

None beyond the `pay-step.tsx` table gap and the `pnpm lint:ci` pre-existing-finding reconciliation documented above, both of which are documentation/verification findings, not code issues.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 3 is closed: `AGENTS.md` documents the swallowed-exception convention (D-03), the whole-repo bucket-B error-severity count is confirmed `0` (D-01), and the before/after report is recorded (D-04). `pnpm build` passes. `pnpm lint:ci`'s residual failure is attributable entirely to backlog 999.2 (React hook-order), already scheduled as its own phase. The three outstanding manual-verification items above should be carried forward to phase-level verification rather than assumed resolved. No blockers for Phase 4 (dead-code audit).

---
*Phase: 03-audit-swallowed-exceptions-and-silent-failure-paths*
*Completed: 2026-09-15*

## Self-Check: PASSED

`AGENTS.md` confirmed present on disk with the new subsection (`grep -c '#### Swallowed Exceptions' AGENTS.md` → `1`). This SUMMARY.md confirmed present on disk. Commit `767ffadf3` confirmed present in `git log --oneline --all`.
