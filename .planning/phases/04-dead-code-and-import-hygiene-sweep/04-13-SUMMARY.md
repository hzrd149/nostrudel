---
phase: 04-dead-code-and-import-hygiene-sweep
plan: 13
subsystem: ui
tags: [react, react-use, react-hook-form, nostr, pow-mining, useAsyncAction]

# Dependency graph
requires:
  - phase: 04-dead-code-and-import-hygiene-sweep
    provides: "04-12's createDraft hoist and >= operator fix that made the PoW code path live"
provides:
  - "MinePOW registers real unmount teardown (useUnmount) that cancels the pending success-delay publish and terminates the worker pool on any dismissal route, not just Cancel/Skip"
  - "short-text-form's publishPost unconditionally clears its own loading state and resets the mining target on publish failure, so a failed publish returns the user to the compose form instead of a permanent spinner or an endless re-mine loop"
  - "MinePOW seeds bestProgress.difficulty at a literal 0 so the progress screen (with Cancel/Skip) always renders on mount, instead of a button-less success screen when the pre-mining hash happens to already clear the target"
  - "post-modal's submit is wrapped in useAsyncAction, so a rejected createDraft toasts an error instead of the Post button silently doing nothing"
affects: [04-dead-code-and-import-hygiene-sweep, phase-04-uat, phase-04-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useUnmount from react-use registered alongside useMount for components that need real teardown (useMount/useEffectOnce discards its callback's return value and cannot register cleanup on its own)"
    - "useAsyncAction wraps a component's submit handler rather than hand-rolled try/catch, per AGENTS.md's required shape"

key-files:
  created: []
  modified:
    - src/components/pow/mine-pow.tsx
    - src/views/new/note/short-text-form.tsx
    - src/components/post-modal/index.tsx

key-decisions:
  - "Task 2 resets miningTarget to 0 on publish failure, not just loading — a loading-only fix (the review's own proposed remedy) would drop the user through the miningTarget && draft gate with both operands still truthy, remounting MinePOW into an endless re-mine-and-republish loop"
  - "Task 3 seeds bestProgress.difficulty at the literal 0 rather than adopting the review's suggested `complete` state-flag remedy, because that flag would delete 04-12's >= operator and reopen the Skip double-publish race it closes"
  - "Task 4 uses useAsyncAction per AGENTS.md's required shape rather than a hand-rolled try/catch, matching the poll-form.tsx in-repo precedent"
  - "WR-03 (useCacheForm's teardown condition) and IN-01 (missing shouldDirty on the post-modal difficulty slider) are deferred, not fixed — see Deviations/Deferred below"

patterns-established:
  - "useUnmount alongside useMount, imported from the same react-use module, for components whose mount effect starts a resource (worker pool, timer) that must be torn down on any unmount route"

requirements-completed: [D-12]

coverage:
  - id: D1
    description: "MinePOW cancels the pending success-delay publish and terminates the worker pool on any unmount route (ESC, overlay click, route change, ErrorBoundary), not just Cancel/Skip (CR-02, CR-03)"
    requirement: "D-12"
    verification:
      - kind: other
        ref: "grep gate: useUnmount count=2, setTimeout return value assigned, clearTimeout( present, stopMiner.current(); count=3; pnpm build exit 0"
        status: pass
    human_judgment: true
    rationale: "pnpm build only typechecks; this project has no test runner. A grep can prove the clearTimeout/stopMiner calls exist in source but cannot prove they execute before the publish fires or that DevTools shows zero surviving Worker threads. Routed to follow-up UAT items 1-2."
  - id: D2
    description: "A publish failure after mining returns the user to the compose form with their text intact, instead of a permanent spinner or an endless re-mine loop (CR-01)"
    requirement: "D-12"
    verification:
      - kind: other
        ref: "grep gate: setLoading(\"\") count=2, setMiningTarget(0) count=2, publish call shape unchanged (2 args); pnpm build exit 0"
        status: pass
    human_judgment: true
    rationale: "No test runner and no dev server run (per plan's do-not-run-pnpm-dev constraint). Cannot observe the spinner clearing or the toast rendering. Routed to follow-up UAT item 3."
  - id: D3
    description: "MinePOW renders the progress screen with Cancel/Skip from the moment it mounts, regardless of the pre-mining hash's difficulty (WR-02)"
    requirement: "D-12"
    verification:
      - kind: other
        ref: "grep gate: nip13.getPow count=1 (miner() only), getEventHash(draft) count=2, difficulty: 0 literal present, >= operator unchanged; pnpm build exit 0"
        status: pass
    human_judgment: true
    rationale: "Cannot exercise the React render path without a dev server. Routed to follow-up UAT item 4."
  - id: D4
    description: "A rejected createDraft in the post modal raises a toast instead of the Post button silently doing nothing (WR-01)"
    requirement: "D-12"
    verification:
      - kind: other
        ref: "grep gate: useAsyncAction count=2, createDraft/gate/target unchanged; aislop scan post-modal/index.tsx findings=3 (unchanged); pnpm build exit 0"
        status: pass
    human_judgment: true
    rationale: "Cannot trigger a createDraft rejection or observe the toast without a running app. Routed to follow-up UAT item 5."

duration: ~35min
completed: 2026-09-17
status: complete
---

# Phase 04 Plan 13: Close the three PoW BLOCKER findings from 04-REVIEW-12 Summary

**MinePOW now tears down its worker pool and pending publish on any unmount route, publishPost owns its own loading/mining-gate lifecycle on failure, the progress screen's abort controls render from mount, and the post modal surfaces draft failures via useAsyncAction — four surgical, additive fixes, four atomic commits, zero reverts of D-12 or 04-12.**

## Performance

- **Duration:** ~35 min (estimate; no precise start timestamp captured for this session)
- **Completed:** 2026-09-17T16:44:31Z
- **Tasks:** 4
- **Files modified:** 3

## Accomplishments

- **CR-03/CR-02 (most severe finding in the phase) fixed:** `mine-pow.tsx` now imports `useUnmount` alongside `useMount`, captures the success-delay `setTimeout` handle in a `pendingPublish` ref instead of discarding it, and registers a `useUnmount` callback that clears that timer and calls `stopMiner.current()`. Dismissing the composer during the 800ms success delay can no longer sign-and-broadcast a note the user backed out of, and any unmount route (not just Cancel/Skip) now terminates the worker pool.
- **CR-01 fixed, beyond the review's own proposed remedy:** `short-text-form.tsx`'s `publishPost` now clears `loading` unconditionally after the publish call (it is the only thing that can release the spinner on the PoW path, since it runs after `submit`'s own `finally`) and, on failure, resets `miningTarget` to 0. The plan's own correction to the review's proposal — resetting the mining target, not just clearing loading — prevents an endless re-mine-and-republish loop that a loading-only fix would have introduced.
- **WR-02 fixed by a different remedy than the review proposed:** `mine-pow.tsx`'s `bestProgress` initializer now seeds `difficulty` at the literal `0` instead of the pre-mining hash's own PoW difficulty (a value unrelated to mining progress, since `miner.ts` appends a nonce tag before hashing a different event). The success branch — which has no Cancel/Skip — can no longer render before mining starts. The review's suggested `complete`-flag remedy was rejected because it would have deleted 04-12's `>=` operator and reopened the Skip double-publish race that operator closes; seeding at zero achieves the same fix without touching the operator.
- **WR-01 fixed:** `post-modal/index.tsx`'s `submit` is now wrapped in `useAsyncAction` (imported from `src/hooks/use-async-action.ts`, the AGENTS.md-mandated shape), so a rejected `createDraft` toasts `e.message` instead of dropping as an unhandled rejection with the Post button doing nothing.
- **Every protected line confirmed untouched after all four commits:** `cleanup();` (1), `stopMiner();` (1), `bestProgress.difficulty >= targetPOW` (1), both composers' hoisted `await createDraft(values)` (1 each), and both D-11 `aislop-ignore-next-line` directives (1 each) — verified via the plan's exact grep gates after every task, including the two later mine-pow.tsx commits re-confirming the two earlier ones.

## Task Commits

Each task was committed atomically:

1. **Task 1: Register unmount teardown in MinePOW — cancel the pending publish and stop the workers** - `f4fa32c8c` (fix)
2. **Task 2: Make publishPost own its loading state and release the mining gate on failure** - `f5c1622b3` (fix)
3. **Task 3: Seed mining progress at zero so Cancel and Skip are reachable from mount** - `cd22f3579` (fix)
4. **Task 4: Give the post modal an error surface when the draft cannot be built** - `9bd51ed99` (fix)

**Plan metadata:** (this commit, made after this SUMMARY)

## Files Created/Modified

- `src/components/pow/mine-pow.tsx` - Added `useUnmount` teardown (Task 1) and zero-seeded `bestProgress.difficulty` (Task 3); two separate commits
- `src/views/new/note/short-text-form.tsx` - `publishPost` clears loading unconditionally and resets `miningTarget` on failure (Task 2)
- `src/components/post-modal/index.tsx` - `submit` wrapped in `useAsyncAction` (Task 4)

## Decisions Made

- Reset `miningTarget` to 0 on publish failure in Task 2 (not just `loading`), per the plan's explicit correction to the review's own proposed fix — a loading-only fix leaves both operands of `miningTarget && draft` truthy, remounting MinePOW into an endless re-mine loop.
- Seeded `bestProgress.difficulty` at the literal `0` in Task 3 rather than the review's suggested `complete`-flag remedy, to avoid deleting 04-12's `>=` operator and reopening the Skip double-publish race it closes.
- Used `useAsyncAction` in Task 4 per `AGENTS.md`'s required shape (no hand-rolled `try`/`catch`), matching the `poll-form.tsx:176-188`/`:358` in-repo precedent.
- Kept the exact `if (pub) setPublished(pub);` one-liner form in Task 2 rather than restructuring into an explicit two-branch if/else, since the plan's own acceptance-criteria fallback permits this shape when `setPublished` still appears exactly once as a call and an else-branch resets the mining target (both true here). The literal string `if (pub) setPublished(pub);` was therefore not removed, only preceded by an unconditional `setLoading("")` and followed by an `else setMiningTarget(0);` clause with an explanatory comment.

## Deviations from Plan

None — plan executed exactly as written. One transient aislop finding surfaced and self-resolved within Task 1's own edit sequence (see below), and one commentary wording had to be adjusted mid-task to satisfy a plan's own literal-count gate.

### Notes on gate mechanics (not deviations from the plan's substance)

**1. Task 1 — transient `ai-slop/unused-import` finding, self-resolved.** Adding the `useUnmount` import before adding its call site produced a one-edit-window `ai-slop/unused-import` warning on `mine-pow.tsx` line 2. The very next edit in the same task (adding the `useUnmount(...)` call) resolved it; the post-edit hook confirmed 0 findings before the task's own verification gate ran. No fix action was needed beyond completing the planned edit sequence.

**2. Task 4 — reworded an explanatory comment to satisfy the plan's own literal-string gate.** The plan's acceptance criteria assert `grep -Fc 'useAsyncAction' src/components/post-modal/index.tsx` equals exactly `2` (the import and the call). My first draft of the explanatory comment above the `useAsyncAction(...)` call itself contained the word "useAsyncAction," bringing the count to 3 and failing the plan's own gate. Reworded the comment to describe the behavior without repeating the hook's name; the gate then passed at exactly 2. No code behavior changed — this was a comment-wording adjustment to satisfy a grep-based verification script, not a deviation from the plan's intended fix.

**Total deviations:** 0 auto-fixed. Both notes above are gate-mechanics adjustments within the planned edit, not unplanned work.
**Impact on plan:** None. All four fixes match the plan's action sections verbatim in substance.

## Deferred Items (per plan's explicit disposition table)

- **WR-03 (deferred, residual risk recorded):** `useCacheForm`'s teardown condition removes a cached draft when `isSubmitted.current` is true, which flips at mining start. Changing that teardown condition would affect all 8 of its consumer forms (reply-form, two group-message-forms, direct-message-form, picture-post-form, generic-comment-form, and both PoW composers), and the plausible regression — drafts retained after a successful publish and reappearing in the next compose — would be silent and unvalidatable without a dev server on this machine. Not touched in this plan. CR-01's fix (Task 2) materially shrinks the exposure window by returning the user to the form with their text intact instead of stranding them, but the window during a long mine remains.
- **IN-01 (deferred):** `post-modal/index.tsx:251`'s difficulty slider omits `shouldDirty`, so a difficulty-only change is not persisted by `useCacheForm`. Real but bounded (loses a slider setting, not a note). Not folded into Task 4 to keep that commit single-concern. One-line fix, left as a named follow-up.
- Also inherited from 04-12's summary and unchanged by this plan: `mine-pow.tsx`'s stale-closure `onProgress` guard, and `miner.ts` ignoring the `startNonce`/`endNonce` range it is sent (every worker mines an identical sequence).

## Issues Encountered

None beyond the two gate-mechanics notes above.

## Static Verification Performed (what was actually proven)

- All four tasks' automated grep gates passed exactly as specified in the plan (`TEARDOWN_OK`, `RECOVERY_OK`, `SEED_OK`, `SURFACE_OK`).
- `pnpm build` (`tsc --project tsconfig.json && vite build`, plus the service-worker build) exited 0 after every one of the four tasks and again after the final commit — confirmed by direct inspection of the full build log, not just tail output.
- aislop baselines held exactly as measured in the plan: `mine-pow.tsx` 0 findings (both after Task 1 and after Task 3), `short-text-form.tsx` 2 findings (unchanged), `post-modal/index.tsx` 3 findings (unchanged; same three rules — `react/incompatible-library`, `complexity/function-too-long` on `renderBody`, `ai-slop/todo-stub` — with only line numbers shifted).
- Repo-wide bars all confirmed at 0 after the final commit: bucket-C (`eslint/no-unused-vars`, `ai-slop/unused-import`, `import/no-duplicates`, `ai-slop/duplicate-import`, `eslint/no-unused-expressions`, `eslint/no-unreachable`, `ai-slop/unreachable-code`, `ai-slop/empty-function`), `ai-slop/swallowed-exception`, and error-severity findings excluding `react-hooks/rules-of-hooks` (the 48 pre-existing hook-order errors, backlog 999.2/D-15, untouched).
- All protected lines (`cleanup();`, `stopMiner();`, `bestProgress.difficulty >= targetPOW`, both composers' `await createDraft(values)`, both D-11 directives) confirmed present exactly once after every relevant commit, including cumulative re-checks after the second mine-pow.tsx commit (Task 3).

## Human-Only Verification — Outstanding, Routed to Follow-up UAT

**This project has no test runner (0 test files; no vitest/jest/playwright in package.json). Every gate above is either a typecheck (`pnpm build`) or a static grep assertion over source text. `pnpm dev` was NOT run in this session (a prior session on this machine was OOM-killed starting it, recorded in STATE.md against 03-04).** None of the following eight items can be marked verified or assumed covered by the static checks above. All eight are recorded here as `unverified`, per the Phase 3 precedent, for the follow-up UAT round to close:

1. **`unverified` — CR-03, the cancelled publish.** Start a mine, wait for "Found POW", and dismiss the modal with ESC or an overlay click inside the 800ms success delay. No note should appear on any relay.
2. **`unverified` — CR-02, worker teardown on unmount.** Start a mine at a high difficulty, dismiss via ESC/overlay (post modal) or navigate away (new-note view), and confirm in DevTools → Sources → Threads that no Worker threads survive and CPU returns to idle.
3. **`unverified` — CR-01, publish failure recovery.** Force a publish failure after mining (e.g. no write relays reachable). The spinner should clear, the compose form should return with the note text intact, the provider's error toast should be visible, and mining should not restart on its own.
4. **`unverified` — WR-02, abort controls at mount.** Mine at difficulty 1 several times. The progress screen with Cancel and Skip should render every time; the "Found POW" screen should never appear before mining starts.
5. **`unverified` — WR-01, the draft error surface.** Trigger a `createDraft` rejection in the post modal (signing out mid-compose is the easiest route) and confirm an error toast appears instead of the Post button doing nothing.
6. **`unverified` — the original UAT gap (carried forward from 04-12, not closed by this plan).** With difficulty above 0, mining progress appears and the note publishes, in both the new-note view and the post modal.
7. **`unverified` — D-12's runtime behaviour (carried forward from 04-12, not closed by this plan).** `cleanup()` really terminates the run's worker pool on completion, with no lingering threads, no console errors, and no double-teardown conflict against this plan's new unmount teardown. (Both are safe to run redundantly by spec — `Worker.terminate()` and `clearTimeout` are no-ops when already fired/terminated — but that reasoning is static and still wants one live confirmation.)
8. **`unverified` — the success screen (carried forward from 04-12, not closed by this plan).** "Found POW" is reached when difficulty lands on the target.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three BLOCKER findings (CR-01, CR-02, CR-03) and both warnings (WR-01, WR-02) from `04-REVIEW-12.md` are dispositioned and fixed, additively, with D-12 and 04-12's fixes provably untouched.
- WR-03 and IN-01 remain deferred with named follow-ups; neither blocks phase closure per the plan's own disposition table.
- Eight runtime claims are outstanding and MUST be exercised in the follow-up UAT round before Phase 04 is verified — see the Human-Only Verification section above. Phase-level verification should surface these explicitly rather than assume coverage.
- No new dependency, no new test infrastructure, and no dev-server run occurred in this session.

---
*Phase: 04-dead-code-and-import-hygiene-sweep*
*Completed: 2026-09-17*
