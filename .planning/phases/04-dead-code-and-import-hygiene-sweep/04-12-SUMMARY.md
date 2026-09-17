---
phase: 04-dead-code-and-import-hygiene-sweep
plan: 12
subsystem: ui
tags: [react, react-hook-form, web-worker, proof-of-work, nostr]

# Dependency graph
requires:
  - phase: 04-dead-code-and-import-hygiene-sweep
    provides: D-12's cleanup() fix (04-07) and the settled root-cause diagnosis in .planning/debug/pow-mining-never-starts.md
provides:
  - Both PoW composers (new-note form, post modal) now create the draft before branching on difficulty, so the miningTarget && draft render gate can open on the PoW path
  - MinePOW's success screen now matches the worker's difficulty >= target break condition
affects: [04-UAT, follow-up UAT round for the runtime PoW mining flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hoist a single existing side-effecting call above a branch rather than duplicating it into each branch, to populate shared state both branches depend on"

key-files:
  created: []
  modified:
    - src/views/new/note/short-text-form.tsx
    - src/components/post-modal/index.tsx
    - src/components/pow/mine-pow.tsx

key-decisions:
  - "Hoisted the existing createDraft(values) call above the difficulty branch in both composers rather than adding a second call inside the PoW branch, per the plan's T-04-34 mitigation against double-finalizing the draft"
  - "Left mine-pow.tsx:47 (cleanup();) and the line above (stopMiner();) untouched — D-12 was positively exonerated during diagnosis and reverting it would reintroduce a worker leak"
  - "Changed mine-pow.tsx's success ternary from strict > to >=, matching miner.ts:25's own difficulty >= target break condition, so the success screen is reachable in the normal case (exact match) instead of almost never"

patterns-established: []

requirements-completed: [D-12]

coverage:
  - id: D1
    description: "Both composers (new-note form, post modal) create the draft before branching on PoW difficulty, so the miningTarget && draft render gate can open on the PoW path"
    requirement: "D-12"
    verification:
      - kind: unit
        ref: "grep -Fn 'await createDraft(values)' vs 'values.difficulty > 0' line-order assertion in src/views/new/note/short-text-form.tsx and src/components/post-modal/index.tsx"
        status: pass
      - kind: manual_procedural
        ref: "Posting a note with PoW difficulty above 0 in a running dev server, in both the new-note view and the post modal"
        status: unknown
    human_judgment: true
    rationale: "pnpm build only typechecks; all edits are type-identical before and after. This project has no test runner. Whether the render gate actually opens and mining progress/publish occur at runtime cannot be proven without a browser, and pnpm dev could not be run on this machine (prior OOM kill)."
  - id: D2
    description: "D-12's cleanup() call in mine-pow.tsx terminates the worker pool on completion, with no lingering threads or double-teardown against stopMiner()"
    requirement: "D-12"
    verification:
      - kind: unit
        ref: "grep -Fc 'cleanup();' and 'stopMiner();' in src/components/pow/mine-pow.tsx, plus a whole-file diff gate on Task 3 capping the change at one line"
        status: pass
      - kind: manual_procedural
        ref: "DevTools -> Sources -> Threads check for lingering Worker threads and console errors after a mining run completes"
        status: unknown
    human_judgment: true
    rationale: "MinePOW has never mounted at runtime before this plan (the render gate was permanently closed), so cleanup()'s runtime behavior has never been exercised. Phase 4's one outstanding human verification remains unproven until a human runs the mining flow in a browser."
  - id: D3
    description: "MinePOW's success screen (\"Found POW\") renders when mined difficulty lands exactly on the target, matching miner.ts's own break condition"
    requirement: "D-12"
    verification:
      - kind: unit
        ref: "grep -Fc 'bestProgress.difficulty >= targetPOW' (1) and 'bestProgress.difficulty > targetPOW' (0) in src/components/pow/mine-pow.tsx"
        status: pass
      - kind: manual_procedural
        ref: "Mining to completion in a running dev server and observing the success screen instead of the progress screen persisting through the successDelay"
        status: unknown
    human_judgment: true
    rationale: "The comparison operator change is type-identical before and after, so pnpm build cannot distinguish correct from incorrect behavior. No test runner exists in this project. Confirming the success screen actually renders on the modal difficulty-reached case requires a browser."

duration: ~15min
completed: 2026-09-17
status: complete
---

# Phase 4 Plan 12: PoW mining render-gate fix Summary

**Hoisted the existing `createDraft(values)` call above the difficulty branch in both PoW composers so the `miningTarget && draft` render gate can finally open, and matched `mine-pow.tsx`'s success check to the worker's `difficulty >= target` break condition — closing the 04-UAT gap without touching D-12's exonerated `cleanup()` call.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- `src/views/new/note/short-text-form.tsx`'s `submit` now creates the draft before branching on `values.difficulty`, inside the existing `try`/`finally`, so `draft` is populated on both the PoW and non-PoW paths
- `src/components/post-modal/index.tsx`'s `submit` gets the identical hoist in a `submit` that has no `try`/`finally` and no loading state; `publishPost(unsigned)` is now `await`ed on the non-PoW path where it was previously a floating promise
- `src/components/pow/mine-pow.tsx`'s success-vs-progress ternary changed from `bestProgress.difficulty > targetPOW` to `>= targetPOW`, matching `miner.ts:25`'s own `difficulty >= target` worker break condition, so the success screen is reachable in the (overwhelmingly common) case of landing exactly on the target
- D-12's `cleanup();` (line 47) and `stopMiner();` (line 46) in `mine-pow.tsx` are confirmed untouched — exonerated during diagnosis, not reverted

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the draft on the PoW path in the new-note form** - `bbfaab649` (fix)
2. **Task 2: Create the draft on the PoW path in the post modal** - `fb55b8cbe` (fix)
3. **Task 3: Match the PoW success check to the worker's break condition** - `8a4d2af4c` (fix)

_Note: this is a worktree-mode execution; the plan-metadata commit (SUMMARY.md) is committed separately per the orchestrator's worktree protocol, and STATE.md/ROADMAP.md are updated centrally by the orchestrator after the wave completes, not by this plan._

## Files Created/Modified

- `src/views/new/note/short-text-form.tsx` - `submit` hoists the existing `createDraft(values)` call above the difficulty branch, inside the existing `try`/`finally`
- `src/components/post-modal/index.tsx` - same hoist, in a `submit` with no `try`/`finally` and no loading state; `publishPost` is now awaited
- `src/components/pow/mine-pow.tsx` - one operator change (`>` to `>=`) in the success/progress ternary

## Decisions Made

- Hoisted the single existing `createDraft(values)` call in each composer rather than adding a second call inside the PoW branch, per the plan's T-04-34 mitigation against finalizing the draft twice per submit
- Left `mine-pow.tsx:47` (`cleanup();`) and `stopMiner();` on the line above untouched — D-12 was positively exonerated during the debug session (it runs only after `onComplete` has already captured the mined draft, and the worker spawn loop never reaches it); reverting it would reintroduce a worker leak
- Changed only the comparison operator in `mine-pow.tsx`'s success ternary, per the plan's instruction not to write a comment quoting the previous strict-`>` form (verified: `grep -Fc 'bestProgress.difficulty > targetPOW'` outputs `0`)

## Deviations from Plan

None - plan executed exactly as written. All measured facts in the plan's `<measured_facts>` section (line numbers for `submit`, `createDraft`, `publishPost`, the render gates, `setDraft` call sites, and the miner.ts break condition at line 25) were re-measured against the live files at execution time and confirmed to match the plan's tables exactly — no documentation gap found, nothing to correct.

## Issues Encountered

None.

## Aislop Verification

Per-file findings held exactly at their plan-stated baselines (`.claude/CLAUDE.md` D-16 — pre-existing findings in touched files were not swept):

| File | Findings before | Findings after | Match |
|---|---|---|---|
| `src/views/new/note/short-text-form.tsx` | 2 | 2 | yes |
| `src/components/post-modal/index.tsx` | 3 | 3 | yes |
| `src/components/pow/mine-pow.tsx` | 0 | 0 | yes |

Repo-wide bars held after the final commit:

- Bucket-C (`eslint/no-unused-vars`, `ai-slop/unused-import`, `import/no-duplicates`, `ai-slop/duplicate-import`, `eslint/no-unused-expressions`, `eslint/no-unreachable`, `ai-slop/unreachable-code`, `ai-slop/empty-function`): `0`
- `ai-slop/swallowed-exception`: `0`
- Error-severity findings excluding `react-hooks/rules-of-hooks` (backlog 999.2 / D-15): `0`

`pnpm build` exited `0` after every task.

## User Setup Required

None - no external service configuration required.

## Unverified Items (human-only)

Per this plan's `<verification>` section, every automated gate here is static or a typecheck, and no automated check can prove the render gate actually opens at runtime. `pnpm dev` was NOT run per the plan's explicit instruction (a prior session on this machine was OOM-killed starting it). The following three items remain **unverified** and must be carried into a follow-up UAT round rather than recorded as closed:

1. **`unverified` — The UAT gap itself.** With a PoW difficulty above 0, mining progress actually appears and the note actually publishes, in both the new-note view and the post modal.
2. **`unverified` — D-12's runtime behaviour.** Phase 4's one outstanding human verification: `cleanup()` really terminates this run's worker pool on completion (no lingering Worker threads in DevTools -> Sources -> Threads, no console errors, no double-teardown against `stopMiner()`'s handling of the previous run). This has never been exercisable before, because `MinePOW` never mounted.
3. **`unverified` — The success screen.** "Found POW" is now reached when difficulty lands on the target, rather than the user watching the progress screen through the 800ms `successDelay`.

## Follow-ups Deferred to a Later Phase

Recorded per this plan's explicit instruction — deliberately out of scope by user decision, not fixed here:

- **`mine-pow.tsx`'s `onProgress` guard is a stale-closure no-op.** The callback passed to `miner()` (around lines 104-108) compares against a `bestProgress` value captured once by `useMount`, so its `if (difficulty > bestProgress.difficulty)` guard never sees updates. Harmless today because both the worker (`miner.ts:20`) and `miner()`'s own `handleMessage` (`mine-pow.tsx:38`) already filter progress messages by best-so-far before this guard runs.
- **`miner.ts` ignores the `startNonce`/`endNonce` range every worker is sent.** `mine-pow.tsx:58` posts `{ draft, target, startNonce, endNonce }` to each worker, but `miner.ts:6` destructures only `{ draft, target }` and every worker starts at `nonce = 0` (`miner.ts:8`). Every worker therefore mines an identical nonce sequence, so multi-threaded mining costs N times the CPU for zero speedup. This is a real performance bug and the more valuable of the two follow-ups.

## Next Phase Readiness

- The 04-UAT gap's diagnosed cause is now fixed in both composers; the runtime claim needs a follow-up UAT round with a browser (not `pnpm dev` on this machine) before the gap can be marked closed
- D-12's outstanding human verification is now reachable for the first time and should be exercised in that same follow-up round
- The two documented follow-ups (stale-closure `onProgress` guard, ignored nonce range in `miner.ts`) are candidates for a later phase, not this one

---
*Phase: 04-dead-code-and-import-hygiene-sweep*
*Completed: 2026-09-17*

## Self-Check: PASSED

- FOUND: `.planning/phases/04-dead-code-and-import-hygiene-sweep/04-12-SUMMARY.md`
- FOUND: `src/views/new/note/short-text-form.tsx`
- FOUND: `src/components/post-modal/index.tsx`
- FOUND: `src/components/pow/mine-pow.tsx`
- FOUND commit: `bbfaab649`
- FOUND commit: `fb55b8cbe`
- FOUND commit: `8a4d2af4c`
- FOUND commit: `0c1516d34`
