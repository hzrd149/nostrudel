---
phase: 04-dead-code-and-import-hygiene-sweep
verified: 2026-09-17T00:00:00Z
status: human_needed
score: 17/23 must-haves verified
behavior_unverified: 6
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 17/18
  gaps_closed:
    - "Root cause of the UAT gap (draft never created on the PoW path, so the miningTarget && draft render gate never opened) is fixed in code in both composers (04-12)"
    - "MinePOW's success check now matches the worker's difficulty >= target break condition (04-12)"
    - "Three BLOCKER runtime defects that the render-gate fix exposed — signed-and-broadcast-after-dismiss, leaked worker pool on any non-Cancel/Skip unmount, unrecoverable spinner that destroys the cached draft — are fixed additively without touching D-12's cleanup() or 04-12's >= operator (04-13)"
    - "Two WARNING findings from the same scoped review — post-modal swallowing a rejected createDraft, and the success screen able to render before mining starts — are also fixed (04-13)"
  gaps_remaining: []
  regressions: []
behavior_unverified_items:
  - truth: "With PoW difficulty above 0, mining progress appears and the note publishes, in both the new-note view and the post modal (the original UAT gap)"
    test: "pnpm dev, sign in, compose a note, set difficulty > 0, submit, and let mining run to completion in both the new-note view and the post modal"
    expected: "MinePOW mounts and shows progress; on completion the note is signed and published; the composer returns to a normal (non-stuck) state either way"
    why_human: "The fix (hoisting createDraft above the difficulty branch) is confirmed present and wired by direct file read and line-order grep, and pnpm build passes, but this project has no test runner and pnpm dev was never run this session (or in 04-12/04-13's). No test exercises the render gate opening at runtime."
  - truth: "MinePOW cancels the pending success-delay publish and terminates its worker pool on any unmount route (ESC, overlay click, route change, ErrorBoundary trip) — not just Cancel/Skip"
    test: "Start a mine, then dismiss via ESC/overlay (post modal) or navigate away (new-note view) mid-mine and again inside the 800ms post-'Found POW' window; check DevTools -> Sources -> Threads for surviving Workers and confirm no note appears on any relay"
    expected: "No lingering Worker threads, CPU returns to idle, and no note is published after the user dismissed the composer"
    why_human: "useUnmount + a pendingPublish ref + clearTimeout are confirmed present in mine-pow.tsx by direct read and grep; pnpm build passes since the change is type-identical. No test can prove the timer is actually cancelled before it fires, or that DevTools shows zero surviving threads."
  - truth: "A publish failure after mining returns the user to the compose form with their text intact, instead of a permanent spinner or an endless re-mine loop"
    test: "Force a publish failure after mining completes (e.g. no write relays reachable) and observe the composer"
    expected: "The spinner clears, the compose form reappears with the note text intact, an error toast is visible, and mining does not restart on its own"
    why_human: "publishPost's unconditional setLoading(\"\") and setMiningTarget(0) on failure are confirmed present by direct read and grep count; pnpm build passes (type-identical edit). No test can trigger publishEvent's swallowed failure path or observe the toast/spinner at runtime."
  - truth: "MinePOW's progress screen (with Cancel/Skip) renders from the moment it mounts, regardless of the pre-mining hash's difficulty — the 'Found POW' screen never appears before mining starts"
    test: "Mine at difficulty 1 several times and confirm the progress screen with Cancel/Skip always renders first"
    expected: "Progress screen with abort controls renders on every mount; 'Found POW' only appears after the worker actually reports difficulty >= target"
    why_human: "bestProgress seeded at the literal 0 (not the pre-mining hash's own difficulty) is confirmed present by direct read; pnpm build passes. No test can exercise the React render path to confirm the probabilistic premature-success case (up to 50% at difficulty 1 under the prior code) no longer occurs."
  - truth: "A rejected createDraft in the post modal raises a toast instead of the Post button silently doing nothing"
    test: "Trigger a createDraft rejection in the post modal (e.g. sign out mid-compose) and observe the Post button"
    expected: "An error toast appears with the rejection's message; the modal does not just sit there with no feedback"
    why_human: "submit is confirmed wrapped in useAsyncAction (imported from src/hooks/use-async-action.ts) by direct read and grep count; pnpm build passes. No test can trigger the rejection path or observe the toast at runtime."
  - truth: "D-12's cleanup() call in mine-pow.tsx terminates the just-completed run's worker pool on completion, with no lingering threads and no double-teardown against stopMiner()'s handling of the previous run, or against 04-13's new unmount teardown"
    test: "Let a mine run to completion normally (not via dismissal) and confirm in DevTools -> Sources -> Threads that no Worker threads survive"
    expected: "cleanup() (line 47) terminates the run's own workers on the normal completion path; useUnmount's teardown (line 123-128) does not double-fire in a way that errors, since Worker.terminate() and clearTimeout are no-ops when already fired"
    why_human: "This is Phase 4's original outstanding human item (unchanged from the previous verification round) and remains unproven — MinePOW could not mount at runtime until 04-12's fix, so this call has still never executed in a browser. Both 04-12 and 04-13's summaries independently flag this as unresolved."
gaps: []
---

# Phase 4: Dead code and import hygiene sweep Verification Report

**Phase Goal:** Unused variables, unused and duplicated imports, and unreachable code are gone
from `src/`, with the mechanically auto-fixable share applied in its own reviewable commit and
each deliberate exception (notably the guarded dead code in `services/sqlite/index.ts`) either
documented or removed as an explicit decision.

**Verified:** 2026-09-17T00:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after the 04-UAT gap and its two closure plans (04-12, 04-13)

## Correction to my brief, applied

The task brief I was given initially truncated Phase 4's requirement list to 13 IDs and directed
me at a `.planning/REQUIREMENTS.md` that does not exist. The coordinator corrected both errors
mid-task. Per the correction, the traceability check below covers the full 18-ID set from
ROADMAP.md (D-01, D-02, D-02a, D-03, D-04, D-04a, D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-12,
D-12a, D-13, D-14, D-15), cross-referenced against the locked decisions in `04-CONTEXT.md` (the
project's documented substitute for a requirements file — ROADMAP.md states this explicitly under
the Phase 4 requirements line). `04-13`'s `requirements: [D-12]` is correct and is not a
discrepancy.

## Why this is a re-verification, not a fresh one

A prior `04-VERIFICATION.md` (timestamp `2026-09-15T22:00:00Z`, status `human_needed`, score
17/18) already covered the phase's original 18 locked decisions and correctly identified D-12's
`cleanup();` → `cleanup()` fix as present-and-wired but behaviorally unverified. That report did
not carry a YAML `gaps:` block (its status was `human_needed`, not `gaps_found`), so this round
does not mechanically qualify as the frontmatter-triggered "re-verification mode" in the strict
sense — but a `04-UAT.md` round subsequently ran, found the same D-12 area's downstream code
completely broken (mining silently did nothing above difficulty 0), and two gap-closure plans
(`04-12`, `04-13`) executed against that finding. This report re-verifies the whole phase against
its full requirement set with that new evidence folded in, and treats the UAT gap and its closure
as the primary new material to check.

## The one fact that governs this report's ceiling

**This project has no test runner.** Confirmed live: `grep -iE "vitest|jest|playwright|testing-library" package.json` returns nothing; `find src -iname "*.test.*" -o -iname "*.spec.*"` returns nothing. `pnpm dev`
was never run in this session, in 04-12's session, or in 04-13's session (a prior session on this
machine was OOM-killed starting it — recorded in `STATE.md` against Phase 3 Plan 04). Every
automated gate available to 04-12, 04-13, and this verification is either `pnpm build` (a
typecheck) or a static grep/read over source text. **A passing grep proves a line of code exists
and is wired; it does not prove a state transition, a cancellation path, or a cleanup invariant
holds at runtime.** Every runtime claim below is therefore capped at
`⚠️ PRESENT_BEHAVIOR_UNVERIFIED`, never `✓ VERIFIED`, no matter how clean the static evidence is —
consistent with 04-12-SUMMARY.md and 04-13-SUMMARY.md's own `human_judgment: true` /
`status: unknown` coverage entries, which this report does not stretch into runtime coverage.

## Goal Achievement

### Part A — Observable Truths (the 18 original locked decisions, D-01 … D-15)

All commands re-run live against current `HEAD` (`4e491e77a`) this session, not copied from any
summary.

| # | Truth (Req) | Status | Evidence |
|---|---|---|---|
| 1 | Bucket-C count is 0 or every survivor is ledgered (D-01) | ✓ VERIFIED | Live `pnpm exec aislop scan --json .` parsed programmatically: bucket-C (8 rules) count = **0**. 5 `aislop-ignore` directives exist in `src/` (live grep): 3 map to this phase's ledger (`sqlite/index.ts`, `post-modal/index.tsx`, `short-text-form.tsx`), 2 are pre-existing (Phase 2's `error-logger.ts`, Phase 3's `use-timeline-cache-key.ts`). |
| 2 | Starting point re-measured as 417, not ROADMAP's 445 (D-02) | ✓ VERIFIED | Unchanged from prior verification — `04-CONTEXT.md`'s own re-measurement table, internally consistent with the wave trajectory. |
| 3 | Overlap between `no-unused-vars`/`unused-import` recorded, not treated as error (D-02a) | ✓ VERIFIED | `04-CONTEXT.md` documents the 58-site overlap; bucket-C=0 at close makes it moot. |
| 4 | Auto-fix applies exactly 3 steps, narrative-comment hunks reverted, backlog 999.8 untouched (D-03) | ✓ VERIFIED | `ai-slop/narrative-comment` reads unchanged from its D-02/D-03 baseline (21) — confirmed no drift since the last verification round; nothing in 04-12/04-13 touched this rule. |
| 5 | Auto-fix lands in its own commit (D-04) | ✓ VERIFIED | `138c3f45e` remains a standalone, import-line-only commit; unaffected by 04-12/04-13. |
| 6 | Non-safe `aislop fix` never run (D-04a) | ✓ VERIFIED | No commit in the full `git log` (including 04-12/04-13) shows non-safe fixer categories. |
| 7 | 24 unused catch bindings → bare `catch {` (D-05) | ✓ VERIFIED | Live: `ai-slop/swallowed-exception` = **0** repo-wide. |
| 8 | 57 unused params `_`-prefixed or deleted per contract-bound rule (D-06) | ✓ VERIFIED | Bucket C (includes `eslint/no-unused-vars`) = 0 live; `relay-stats.ts`'s `getRTTTag(stats, _name)` confirmed still prefixed, not deleted, consistent with prior verification. |
| 9 | 24 dead declarations deleted, nothing orphaned (D-07) | ✓ VERIFIED | `pnpm build` exits 0 live (fresh run this session); unaffected by 04-12/04-13's edits, which are additive to already-live code paths. |
| 10 | Every ignore rule-scoped with a why-not-fixed reason (D-08) | ✓ VERIFIED | Live grep of all 5 `aislop-ignore` directives in `src/`: all 3 phase-owned ones name their rule(s) and end `-- reason`. |
| 11 | sqlite guarded region kept + ignored; `dbName` local deleted (D-09) | ✓ VERIFIED | Live read of `sqlite/index.ts:1` confirms the corrected reason ("kept as the in-file record of how web sqlite was wired up") is what's actually on disk — the disproven "behavior-change risk" wording from the original review draft is gone. `eslint/no-unreachable`/`ai-slop/unreachable-code` = 0 repo-wide. |
| 12 | `[Textarea, Input];` removed as redundant, imports survive (D-10, amended) | ✓ VERIFIED | Live grep of `src/components/magic-textarea.tsx`: no `aislop-ignore` directive and no bare `[Textarea, Input];` statement exist in the file at all — fully removed, not just reworded. `pnpm build` exits 0. |
| 13 | Both `formState.isDirty;` kept + ignored (D-11) | ✓ VERIFIED | Both `post-modal/index.tsx:103` and `short-text-form.tsx:98` carry the directive with a substantive reason, confirmed live. |
| 14 | `cleanup;` → `cleanup()`, comment corrected (D-12) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Live read of `mine-pow.tsx:47`: `cleanup(); // Terminate this run's workers now that mining is done`. Now *reachable* for the first time (04-12 opened the render gate that gates `MinePOW`'s mount), but still never exercised in a browser. See behavior-unverified item 6 below — this is the same open item as the previous verification round, now downstream-reachable but not yet run. |
| 15 | 2 short-circuit statements → `if (...)` form (D-12a) | ✓ VERIFIED | Unchanged, live grep confirms `if (!e.isPropagationStopped()) show();` in both files. |
| 16 | 3 redundant trailing `return false;` deleted, in-catch kept (D-13) | ✓ VERIFIED | Unchanged; `ai-slop/swallowed-exception` = 0 live. |
| 17 | Before/after table produced (D-14) | ✓ VERIFIED | `04-VALIDATION.md` and `04-11-SUMMARY.md` carry the tables; trajectory consistent with `git log`. |
| 18 | `pnpm lint:ci` reports only pre-existing `react-hooks/rules-of-hooks` errors (D-15) | ✓ VERIFIED | Live `pnpm exec aislop ci --changes` run this session, parsed programmatically: 19 errors total, **all** `react-hooks/rules-of-hooks` — 0 error-severity findings of any other rule. |

**Part A score:** 17/18 fully VERIFIED, 1/18 present-and-wired-but-behavior-unverified (D-12) —
unchanged in substance from the previous verification round, now downstream-reachable.

### Part B — UAT gap-closure truths (04-12, 04-13 — new this round)

These are not part of the original 18 locked decisions; they are the observable truths the
04-UAT round and its two closure plans introduced. All are additive fixes layered on top of D-12,
verified as present and correctly wired at the source level, but — per the governing fact above —
none can be marked runtime-VERIFIED without a browser.

| # | Truth | Status | Evidence |
|---|---|---|---|
| B1 | With PoW difficulty above 0, mining progress appears and the note publishes, in both the new-note view and the post modal (the original UAT gap) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Live read + grep confirms `await createDraft(values)` now runs unconditionally, before the `difficulty > 0` branch, in both `short-text-form.tsx` and `post-modal/index.tsx` (1 occurrence each) — the root cause diagnosed in `.planning/debug/pow-mining-never-starts.md` is fixed. `pnpm build` exits 0. No dev server run to confirm the gate actually opens at runtime. |
| B2 | MinePOW tears down its worker pool and cancels a pending success-delay publish on any unmount route, not just Cancel/Skip | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Live read of `mine-pow.tsx:102-128`: `pendingPublish` ref captures the `setTimeout` handle; `useUnmount` clears it and calls `stopMiner.current()`. `useUnmount` import + call both present (grep count 2). `pnpm build` exits 0. Not exercised at runtime. |
| B3 | A publish failure after mining returns the user to the compose form with text intact, not a permanent spinner or endless re-mine loop | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Live read of `short-text-form.tsx:139-147`: `publishPost` clears `loading` unconditionally and, on an undefined `pub` (failure), resets `miningTarget` to 0. Grep confirms 2 `setLoading("")` and 2 `setMiningTarget(0)` sites. `pnpm build` exits 0. Not exercised at runtime. |
| B4 | MinePOW's progress screen (with Cancel/Skip) always renders on mount; "Found POW" cannot appear before mining starts | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Live read of `mine-pow.tsx:94-101`: `bestProgress` is seeded with `difficulty: 0` literally, with an explanatory comment, replacing the prior pre-mining-hash seed that could probabilistically already clear the target. `pnpm build` exits 0. Not exercised at runtime. |
| B5 | A rejected `createDraft` in the post modal raises a toast instead of the Post button silently doing nothing | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Live read of `post-modal/index.tsx:146-154`: `submit` is now `useAsyncAction(handleSubmit(...))` (imported from `src/hooks/use-async-action.ts`, matching the in-repo `poll-form.tsx` precedent). Grep confirms `useAsyncAction` appears exactly twice (import + call). `pnpm build` exits 0. Not exercised at runtime. |

**Part B score:** 0/5 runtime-VERIFIED, 5/5 present-and-wired-but-behavior-unverified.

**Combined score:** 17/23 truths fully verified; 6/23 present-and-wired but behavior-unverified
(D-12 plus B1-B5); 0/23 FAILED.

### Correction applied to a claim in my original brief

My brief characterized `04-REVIEW.md`'s 5 findings (WR-01, WR-02, IN-01…IN-03) as "still open and
never addressed." Direct codebase evidence contradicts this for **2 of the 5**: `git log` shows
commit `0bb1e4b1a` ("fix(04): remove redundant import-retention hack, correct sqlite ignore
rationale"), and live file reads confirm both fixes are on disk — `magic-textarea.tsx` no longer
has the dead `[Textarea, Input];` statement or its ignore directive at all (WR-02, fully removed),
and `sqlite/index.ts:1`'s ignore reason now states the actual "in-file record of web-sqlite
wiring" rationale rather than the disproven "behavior-change risk" claim the review flagged
(WR-01, reworded not deleted, since the code itself is a ROADMAP-sanctioned keep). This matches
what the *previous* `04-VERIFICATION.md` already recorded. Only `04-REVIEW.md`'s 3 **info**-severity
findings remain genuinely open — and they are correctly out of scope (pre-existing, Phase 5
material), not gaps:

- `helpers/nostr/relay-stats.ts`'s `getRTTTag(stats, _name)` still ignores its parameter (IN-01) —
  confirmed live, unfixed, correctly deferred.
- `views/relays/components/relay-card.tsx`'s `RelayCard` export still has zero importers (IN-02) —
  confirmed live via repo-wide grep (only sibling `relay-card.tsx` modules with similar names are
  imported elsewhere; the default export itself is unused).
- `event-zap-modal/index.tsx`'s `relays` prop is still destructured as `_relays` and never wired
  into the zap request (IN-03) — confirmed live.

I flag this because the task instructions require verifying against the actual codebase rather
than trusting any prior characterization — including one handed to me in this task's own briefing.

### Backlog Fences (delta vs. phase-start baseline — checked live this session)

| Rule | Live count | Baseline | Delta | Status |
|---|---|---|---|---|
| `react-hooks/rules-of-hooks` (repo-wide) | confirmed unchanged | 48 | 0 | ✓ fenced (not independently re-counted repo-wide this round; scoped `lint:ci` count of 19/19-all-hooks matches the prior fence) |
| `ai-slop/swallowed-exception` | 0 | 0 | 0 | ✓ held |
| Bucket-C | 0 | 0 | 0 | ✓ held |
| `src/lib/` files changed | 0 (04-12/04-13 touched only `mine-pow.tsx`, `short-text-form.tsx`, `post-modal/index.tsx`) | 0 | 0 | ✓ untouched |

### Required Artifacts / Key Commits

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `138c3f45e` auto-fix commit | Own commit, import-only diff | ✓ VERIFIED | Unaffected by this round. |
| `0bb1e4b1a` amendment commit | Removes magic-textarea hack, corrects sqlite reason | ✓ VERIFIED | Confirmed live on disk (see correction above). |
| `bbfaab649` / `fb55b8cbe` / `8a4d2af4c` (04-12) | Hoist `createDraft`, match success operator | ✓ VERIFIED | All 3 present in `git log`; diffs match `04-12-SUMMARY.md`'s claims exactly (confirmed via live grep gates above). |
| `f4fa32c8c` / `f5c1622b3` / `cd22f3579` / `9bd51ed99` (04-13) | Unmount teardown, publish-failure recovery, zero-seed progress, post-modal error surface | ✓ VERIFIED | All 4 present in `git log`; diffs match `04-13-SUMMARY.md`'s claims exactly. |
| `04-REVIEW-12.md` | Scoped review of 04-12, finds 3 BLOCKER + 3 WARNING + 1 INFO | ✓ EXISTS, findings addressed | All 3 CR-* BLOCKERs and 2 of 3 WR-* warnings are fixed in 04-13 (confirmed above); WR-03 and IN-01 (this review's own numbering) are explicitly deferred with recorded rationale, not silently dropped. |
| `.planning/debug/pow-mining-never-starts.md` | Root-cause diagnosis referenced by 04-UAT.md's gap | ✓ EXISTS | Referenced consistently across 04-UAT.md, 04-12-PLAN.md, 04-12-SUMMARY.md. |

### Requirements Coverage

All 18 requirement IDs (D-01, D-02, D-02a, D-03, D-04, D-04a, D-05, D-06, D-07, D-08, D-09, D-10,
D-11, D-12, D-12a, D-13, D-14, D-15) are accounted for in Part A above, cross-referenced against
`04-CONTEXT.md`'s locked decisions (this project has no `REQUIREMENTS.md`; ROADMAP.md documents
this explicitly under the Phase 4 requirements line — its absence is a known, correct project
condition, not a finding). 17 SATISFIED, 1 (D-12) present-and-wired with its runtime claim
routed to human verification, matching the prior round. `04-13`'s frontmatter `requirements:
[D-12]` correctly attributes its four fixes to D-12 — they exist only because D-12's fix made the
`MinePOW` code path reachable for the first time in ~15 months, and no new requirement ID was
minted for this gap-closure work. No orphaned requirements.

### Anti-Patterns Found

None introduced by 04-12 or 04-13. The two `// TODO: wrap this in a form` comments in
`short-text-form.tsx:197` and `post-modal/index.tsx:186` are pre-existing (`git blame`: 2025-01-07
and 2023-12-07 respectively, both years before this phase), untouched by either plan's diff, and
carry no debt-marker gate violation since they predate this phase entirely. No `TBD`/`FIXME`/`XXX`
markers found in any file touched by 04-12/04-13. aislop per-file baselines for all three touched
files held exactly at their pre-plan counts (confirmed via 04-12/04-13's own before/after tables,
consistent with `.claude/CLAUDE.md` D-16's no-sweep rule).

### Known Latent / Deferred Items (pre-existing or explicitly deferred — informational, not gaps)

- IN-01/IN-02/IN-03 from `04-REVIEW.md` (see correction above) — pre-existing, correctly
  out-of-scope, Phase 5 material.
- **WR-03** (`04-REVIEW-12.md`'s numbering): `useCacheForm`'s teardown condition treats
  `isSubmitted` as "safely persisted," which for a long PoW mine means the cached draft is
  discarded the moment mining starts, not when the note actually publishes. Deferred with
  recorded rationale — fixing it touches all 8 consumer forms and the regression would be silent
  and unvalidatable without a dev server. CR-01's fix (04-13) shrinks but does not close this
  window.
- **IN-01** (`04-REVIEW-12.md`'s own numbering, distinct from `04-REVIEW.md`'s IN-01): the post
  modal's difficulty slider omits `shouldDirty`, so a difficulty-only change is not cached.
  Confirmed still present live (`post-modal/index.tsx:256`: `onChange={(v) =>
  setValue("difficulty", v)}`, no options object). Deferred, one-line fix, named follow-up.
- `mine-pow.tsx`'s `onProgress` stale-closure guard and `miner.ts`'s ignored `startNonce`/
  `endNonce` range (every worker mines an identical sequence) — both inherited from 04-12,
  unchanged by 04-13, recorded as candidates for a later phase.

### Human Verification Required

The following 6 items must be exercised in a real browser (`pnpm dev` or a built preview) before
this phase's D-12 area and its UAT gap-closure can be marked closed. None of these can be
programmatically verified in this project — there is no test runner, and every static check
available (typecheck + grep) has already been run and is reflected in the evidence above.

#### 1. The original UAT gap: PoW mining runs to completion (B1)

**Test:** Sign in, compose a note, set a PoW difficulty target above 0, submit, and let mining run
to completion — in both the new-note view (`src/views/new/note/short-text-form.tsx`) and the post
modal (`src/components/post-modal/index.tsx`).
**Expected:** Mining progress appears (the `MinePOW` component mounts and shows the progress bar),
and on completion the note is signed and published.
**Why human:** The root-cause fix (hoisting `createDraft` above the difficulty branch) is
confirmed present and wired; `pnpm build` only proves it's type-correct. No test can prove the
render gate actually opens at runtime.

#### 2. Worker pool and pending-publish teardown on any unmount route (B2, supersedes CR-02/CR-03)

**Test:** Start a mine at a high difficulty; dismiss via ESC or overlay click (post modal) or
navigate away (new-note view), including once inside the ~800ms window right after "Found POW"
would appear. Check DevTools → Sources → Threads.
**Expected:** No lingering Worker threads, CPU returns to idle, and no note is published to any
relay after the dismissal.
**Why human:** `useUnmount` + the `pendingPublish` ref + `clearTimeout` are confirmed present by
direct read; this is a cancellation/cleanup invariant that cannot be observed without a running
browser and DevTools.

#### 3. Publish failure recovers the compose form (B3, supersedes CR-01)

**Test:** Force a publish failure after mining completes (e.g. temporarily disable write relays)
and observe the composer.
**Expected:** The spinner clears, the compose form reappears with the note text intact, an error
toast is visible, and mining does not restart on its own.
**Why human:** The fix is confirmed present by direct read and grep; the failure path itself
(publishEvent's swallowed-error toast, the spinner clearing, the text surviving) can only be
observed live.

#### 4. Progress screen with abort controls always renders on mount (B4, supersedes WR-02)

**Test:** Mine at difficulty 1 several times in a row.
**Expected:** The progress screen with Cancel and Skip renders every time; "Found POW" never
appears before a hash has actually been mined.
**Why human:** The zero-seed fix is confirmed present by direct read; the probabilistic
premature-render bug it targets (up to 50% of the time at difficulty 1 under the old code) can
only be confirmed absent by repeated live observation.

#### 5. Post-modal error surface on a rejected draft (B5, supersedes WR-01)

**Test:** Trigger a `createDraft` rejection in the post modal (e.g. sign out mid-compose) and
observe the Post button.
**Expected:** An error toast appears with the rejection's message.
**Why human:** `useAsyncAction` wrapping is confirmed present by direct read and grep; the
rejection path and toast can only be triggered and observed live.

#### 6. D-12's cleanup() on the normal completion path (unchanged from the previous verification round)

**Test:** Let a mine run to completion normally (not via dismissal) and confirm in DevTools →
Sources → Threads that no Worker threads survive, with no console errors and no double-teardown
conflict against 04-13's new unmount handler.
**Expected:** `cleanup()` (line 47) terminates the run's own workers; no error or duplicate signal
occurs even though `useUnmount`'s teardown and `cleanup()` are both reachable in adjacent code
paths (both `Worker.terminate()` and `clearTimeout` are documented no-ops when already fired, but
that reasoning is static, not observed).
**Why human:** Phase 4's single most persistent outstanding item — flagged in the original
verification round, again in 04-12's summary, and again in 04-13's summary. It has never been
exercised in a browser because `MinePOW` could not mount until 04-12's fix.

### Gaps Summary

No gaps. All 18 original locked decisions remain satisfied by live evidence gathered this session
(bucket-C = 0, `pnpm build` exits 0, `pnpm exec aislop ci` shows only pre-existing
`react-hooks/rules-of-hooks` errors, all deletions and ignores confirmed present or absent exactly
as decided). The 04-UAT round's diagnosed gap is fixed at the source level in both composers, and
the three BLOCKER defects that opening that 15-month-dormant path exposed are also fixed,
additively, without reverting D-12 or 04-12's own changes — all confirmed by direct file reads and
grep gates matching 04-12-SUMMARY.md and 04-13-SUMMARY.md's own claims exactly.

What remains is exclusively **runtime behavior that this project has no mechanism to verify
automatically**: 6 items, all state-transition or cleanup/cancellation invariants (mining actually
completing and publishing; workers and pending timers actually being cancelled on unmount; a
publish failure actually recovering the form; the progress screen actually always rendering first;
a draft rejection actually surfacing a toast; `cleanup()` actually running clean on the normal
completion path). None of these were reachable to test before this round's fixes — they are newly
testable, not newly discovered risk. This is why the status is `human_needed`, not `passed`:
per the verification methodology, a truth whose correctness depends on an unexercised state
transition or cleanup invariant cannot be marked VERIFIED on static presence alone, no matter how
clean the grep/build evidence is.

I also corrected two things I was told in this task's own briefing that conflicted with direct
codebase evidence: (1) 2 of `04-REVIEW.md`'s 5 findings (WR-01, WR-02) were in fact fixed in
commit `0bb1e4b1a`, not left open — only its 3 info-severity findings remain open, correctly out
of scope; (2) the coordinator separately corrected mid-task that the full Phase 4 requirement set
is 18 IDs (not the 13 I was first given) and that `.planning/REQUIREMENTS.md` does not exist by
design — both are reflected above.

---

_Verified: 2026-09-17T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
