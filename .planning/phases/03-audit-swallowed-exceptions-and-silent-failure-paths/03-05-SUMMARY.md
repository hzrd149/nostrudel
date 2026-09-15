---
phase: 03-audit-swallowed-exceptions-and-silent-failure-paths
plan: 05
subsystem: error-handling
tags: [aislop, eslint, logging, sqlite, capacitor, react-hooks, silent-failure]

requires:
  - phase: 03-audit-swallowed-exceptions-and-silent-failure-paths
    provides: "03-01's whole-repo bucket-B error baseline (31 across 30 files) and the D-01 done-means-zero bar this plan closes out"
provides:
  - "src/index.tsx's protocol-handler catch logs the caught error via a namespaced logger instead of a bare console.log string — clears the phase's last error-severity ai-slop/swallowed-exception in src/"
  - "src/services/sqlite/index.ts's two ceremonial try/catch wrappers removed; openConnection/deleteDatabase still reject on any awaited throw via async-function semantics"
  - "src/components/qr-code/native-scanner.ts's barcode-install Promise executor is no longer async; the listener handle is assigned via a .then() continuation instead of an internal await"
  - "src/hooks/timeline/use-timeline-cache-key.ts's hidden-fallback finding suppressed with a rule-scoped, reasoned aislop-ignore-next-line documenting it as initialization, not error recovery"
affects: [phase-4-dead-code-audit, backlog-999.5-exhaustive-deps, backlog-999.8-comment-console-noise]

tech-stack:
  added: []
  patterns:
    - "Deleting a redundant try/catch wrapper around an already-async function body, rather than annotating it, when the catch only forwards to Promise.reject"
    - "Hoisting a Promise-executor's async listener registration into a .then() continuation with an optional-call (sub?.remove()) guard, to satisfy eslint/no-async-promise-executor without changing observable behavior"
    - "Rule-scoped aislop-ignore-next-line directives carrying a why-not-fixed reason (D-07/D-12), used for the second time in this repo after src/sw/client/error-logger.ts's file-scoped precedent"

key-files:
  created: []
  modified:
    - src/services/sqlite/index.ts
    - src/components/qr-code/native-scanner.ts
    - src/hooks/timeline/use-timeline-cache-key.ts
    - src/index.tsx

key-decisions:
  - "sqlite/index.ts: deletion, not annotation — an async function already returns a rejected promise for any uncaught throw, so catch (err) { return Promise.reject(err); } was pure ceremony"
  - "native-scanner.ts: sub is typed Awaited<ReturnType<typeof BarcodeScanner.addListener>> | undefined and assigned in a .then() continuation; all three terminal cases (COMPLETED/FAILED/CANCELED) call sub?.remove() since the handle may not exist yet on a very early event"
  - "use-timeline-cache-key.ts: hidden-fallback suppressed via rule-scoped ignore rather than fixed, since fallback is initialization (a stable useMemo'd nanoid serving the first render) not error recovery — there is no failure path to make explicit"
  - "index.tsx: one edit (logger.extend(\"Index\") plus a rewritten catch body) cleared four findings at once — error-severity swallowed-exception, warning silent-recovery, unused e binding, and console-leftover — per D-15's decision to route through the namespaced logger only, no toast"

requirements-completed: [D-01, D-06, D-07, D-12, D-13, D-14, D-15]

coverage:
  - id: D1
    description: "src/index.tsx's protocol-handler catch logs the caught error via logger.extend(\"Index\") instead of a bare console.log string"
    requirement: D-15
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq filter for ai-slop/swallowed-exception, ai-slop/silent-recovery, ai-slop/console-leftover, eslint/no-unused-vars on src/index.tsx:49-50 — all 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "sqlite/index.ts's two ceremonial try/catch wrappers removed without changing reject semantics or touching Phase 4's territory (module-level throw, unreachable code, dbName binding)"
    requirement: D-13
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq filter for ai-slop/redundant-try-catch on src/services/sqlite/index.ts — 0; eslint/no-unreachable count still 6; eslint/no-unused-vars count still 1; pnpm build"
        status: pass
    human_judgment: false
  - id: D3
    description: "native-scanner.ts's barcode-install Promise executor is no longer async; async-promise-executor finding cleared with no behavior change"
    requirement: D-13
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq filter for eslint/no-async-promise-executor — 0; pnpm build (tsc --project tsconfig.json && vite build) passes, confirming the Awaited<ReturnType<...>> annotation typechecks"
      - kind: manual_procedural
        ref: "Native-only Capacitor plugin code cannot be exercised in the web dev server; residual risk explicitly accepted in 03-05-PLAN.md's threat model (T-03-15) and 03-VALIDATION.md's Manual-Only Verifications"
        status: unknown
    human_judgment: true
    rationale: "The refactored code path (googleBarcodeScannerModuleInstallProgress listener settlement) only runs inside a native Capacitor build and cannot be triggered by pnpm build or the web dev server; structural acceptance criteria (all three terminal cases still call sub?.remove(), both rejection messages present, six log call sites — actually five, see deviations — survived) are the accepted substitute per the plan's own risk acceptance."
  - id: D4
    description: "use-timeline-cache-key.ts's hidden-fallback finding suppressed via a rule-scoped, reasoned aislop-ignore-next-line; code and the neighboring exhaustive-deps finding left untouched"
    requirement: D-14
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq filter for ai-slop/hidden-fallback on the file — 0; react-hooks/exhaustive-deps still 1 (proving no sweep); grep for the directive and its -- reason delimiter"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-09-15
status: complete
---

# Phase 03 Plan 05: Clear the remaining bucket-B strays (sqlite ceremony, native-scanner executor, cache-key false positive, index.tsx protocol handler) Summary

**Removed two ceremonial try/catch wrappers from the sqlite service, hoisted a barcode-install listener out of an async Promise executor, suppressed one hidden-fallback false positive with a reasoned rule-scoped ignore, and rewrote index.tsx's protocol-handler catch to log its cause via a namespaced logger — driving the whole-repo bucket-B error-severity count from 1 to 0.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-09-15
- **Tasks:** 3 completed (3 tasks in plan, matching plan structure)
- **Files modified:** 4

## Accomplishments
- Cleared all four warning-severity bucket-B strays named in D-13: 2x `ai-slop/redundant-try-catch` (sqlite), `eslint/no-async-promise-executor` (native-scanner), `ai-slop/hidden-fallback` (cache-key)
- Cleared the phase's final error-severity `ai-slop/swallowed-exception` finding in `src/`, bringing the whole-repo bucket-B error count to 0 (confirmed via direct scan, matching the orchestrator's expected outcome)
- In the same index.tsx edit, also cleared the bundled `ai-slop/silent-recovery`, `eslint/no-unused-vars`, and `ai-slop/console-leftover` findings (D-06, D-15) without adding any user-facing surfacing, per D-15's explicit decision
- Verified Phase 4's territory in `sqlite/index.ts` (module-level throw + 6 unreachable-code lines + the unused `dbName` binding) is provably untouched, and backlog 999.5's/999.8's findings in the touched files are still present

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove the two ceremonial try/catch wrappers in the sqlite service** - `2a8d3781f` (refactor)
2. **Task 2: Hoist the barcode listener registration out of the Promise executor** - `bdd45c0db` (refactor)
3. **Task 3: Document the timeline cache-key false positive and log the protocol-handler failure** - `32e212955` (fix)

_No TDD tasks in this plan; each task is a single commit._

## Files Created/Modified
- `src/services/sqlite/index.ts` - `openConnection`/`deleteDatabase`'s `try { ... } catch (err) { return Promise.reject(err); }` wrappers deleted; both functions are still `async` so an uncaught throw still rejects. Lines 1-16 (module-level web guard, unreachable jeep-sqlite setup) and the `dbName` binding on line 48 left untouched.
- `src/components/qr-code/native-scanner.ts` - The barcode-install `new Promise<void>(async (res, rej) => {...})` executor is now synchronous; `BarcodeScanner.addListener(...)` is called without `await` and its handle assigned via `.then((handle) => { sub = handle; })`; all three terminal cases (`COMPLETED`/`FAILED`/`CANCELED`) now call `sub?.remove()`.
- `src/hooks/timeline/use-timeline-cache-key.ts` - A rule-scoped `aislop-ignore-next-line ai-slop/hidden-fallback -- ...` comment added immediately above `return cacheKey || fallback;`, documenting the expression as `useMemo`'d initialization rather than error recovery. Code unchanged.
- `src/index.tsx` - Added `const log = logger.extend("Index");` above the protocol-handler registration block; the catch binding renamed `e` → `error` and now calls `log("Failed to register web+nostr protocol handler", error)` instead of `console.log("Failed to register handler")`.

## Decisions Made
- Native-scanner's listener handle is typed `Awaited<ReturnType<typeof BarcodeScanner.addListener>> | undefined` — this compiled cleanly under `tsc --project tsconfig.json` (the first half of `pnpm build`), so no fallback annotation or type-safety escape hatch was needed.
- No new module-private logger constant was added beyond the one the plan called for (`logger.extend("Index")` in index.tsx); `native-scanner.ts` reused its existing `logger.extend("NativeQrCodeScanner")` constant as instructed.

## Deviations from Plan

None functionally — all three tasks executed exactly as specified, and every acceptance criterion in the plan passed. Two of the plan's own measured-fact counts in its acceptance criteria were off by one; both are documented here for the record since they surfaced during verification, not because any scope was adjusted:

**1. [Plan measurement note] `native-scanner.ts`'s "6 log( sites" acceptance criterion actually reads 5, both before and after this plan's edit**
- **Found during:** Task 2 acceptance-criteria check
- **Issue:** The plan's acceptance criteria state `grep -c 'log(' src/components/qr-code/native-scanner.ts` should output `6`. It outputs `5` both on the pre-edit file (`git show <pre-task1-commit>:...`) and post-edit — confirmed by diffing against the file as it existed before this plan started. There is no sixth `log(` call site in the file; the file has always had exactly five (one top-of-callback progress log plus four state-branch logs for `PENDING`/`DOWNLOADING`/`DOWNLOAD_PAUSED`/`INSTALLING`).
- **Fix:** None needed — this is a plan documentation discrepancy (an off-by-one in the plan's own measured facts), not a regression introduced by this plan. All five pre-existing log sites are verified present and unchanged via `git diff`.
- **Files affected:** src/components/qr-code/native-scanner.ts (verification only, no additional edit)
- **Verification:** `git diff src/components/qr-code/native-scanner.ts` confirms every original `log(...)` call site survived verbatim; only the executor's `async` keyword, the `sub` declaration/assignment, and the three `.remove()` call sites changed.

**2. [Plan measurement note] The plan's whole-plan verification block's "expect 11" out-of-scope-findings count is actually 12**
- **Found during:** Post-Task-3 plan-level `<verification>` block
- **Issue:** The plan's own verification block asserts `eslint/no-unreachable` (6, sqlite) + `ai-slop/trivial-comment` (4, index.tsx) + `react-hooks/exhaustive-deps` (1, cache-key) = 11. The live count is 12: `src/services/sqlite/index.ts` also carries one pre-existing `ai-slop/trivial-comment` finding on line 6 (the `// Setup hacky web sqlite` comment), which sits inside the same lines-1-16 region this plan was explicitly forbidden from touching (Task 1's hard boundary) and was never listed in the plan's own `<measured_facts>` table for that file.
- **Fix:** None needed — confirmed via `git diff` across all three task commits that lines 1-17 of `sqlite/index.ts` were never touched. This finding predates the plan and belongs to backlog 999.8 (comment/console noise) alongside index.tsx's four trivial-comment findings, not to this plan's scope.
- **Files affected:** src/services/sqlite/index.ts (verification only, no additional edit)
- **Verification:** `git diff src/services/sqlite/index.ts` across all task commits shows the diff starts at line 18; line 6 is unchanged in every commit.

---

**Total deviations:** 0 code changes; 2 plan-measurement discrepancies noted for the record.
**Impact on plan:** None — both discrepancies are pre-existing facts about the codebase that the plan's own measured-facts table under-counted; no scope was added or removed, and every functional acceptance criterion in the plan passed as written.

## Issues Encountered
None. All three tasks' automated verification (aislop scan jq filters, grep assertions, `pnpm build`) passed on the first attempt with no auto-fixes required under Rules 1-3.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Bucket B (D-01's "zero bucket-B error-severity findings in src/") is now fully closed: the whole-repo `ai-slop/swallowed-exception` error-severity count is confirmed 0 via direct scan (`pnpm exec aislop scan --json . | jq '[.diagnostics[] | select(.severity=="error") | select(.rule=="ai-slop/swallowed-exception")] | length'` → `0`), matching the orchestrator's expected outcome of driving the count from 1 to 0.

Plan 03-04 remains paused at a human-verification checkpoint (unrelated files: `src/components/cashu/mint-control.tsx`, `src/views/settings/relays/components/relay-control.tsx`, `src/views/settings/cache/components/enable-with-delete.tsx`) — not advanced by this plan, per the orchestrator's explicit instruction. No blockers for Phase 4 (dead-code audit), which inherits `sqlite/index.ts`'s untouched module-level throw/unreachable region and `dbName` binding exactly as before.

---
*Phase: 03-audit-swallowed-exceptions-and-silent-failure-paths*
*Completed: 2026-09-15*

## Self-Check: PASSED

All 4 modified source files and this SUMMARY.md confirmed present on disk. All 4 task/summary commit hashes (`2a8d3781f`, `bdd45c0db`, `32e212955`, `d01e4a865`) confirmed present in `git log --oneline --all`.
