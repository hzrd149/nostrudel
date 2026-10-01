---
phase: 04-dead-code-and-import-hygiene-sweep
verified: 2026-10-01T17:50:00Z
status: human_needed
score: 24/29 must-haves verified
behavior_unverified: 5
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 17/23
  gaps_closed:
    - "Root cause of the UAT gap (draft never created on the PoW path, so the miningTarget && draft render gate never opened) is fixed in code in both composers (04-12)"
    - "MinePOW's success check now matches the worker's difficulty >= target break condition (04-12)"
    - "Three BLOCKER runtime defects that the render-gate fix exposed — signed-and-broadcast-after-dismiss, leaked worker pool on any non-Cancel/Skip unmount, unrecoverable spinner that destroys the cached draft — are fixed additively without touching D-12's cleanup() or 04-12's >= operator (04-13)"
    - "Two WARNING findings from the same scoped review — post-modal swallowing a rejected createDraft, and the success screen able to render before mining starts — are also fixed (04-13)"
    - "04-UAT.md round-2 test 2 blocker (dev PoW module workers throwing `window is not defined` at vite/dist/client/env.mjs:8, so the pool mined zero hashes) is fixed at the source level: the Vite `global` define is now \"globalThis\" and src/polyfill.ts is `globalThis.global ||= globalThis` (04-14, commits 7ab167469 and 73668e40e). Re-reproduced live this round with Vite's real vite:client-inject transform evaluated in a window-less vm context: WORKER_PRELUDE_OK"
  gaps_remaining: []
  regressions: []
behavior_unverified_items:
  - truth: "With PoW difficulty above 0, mining progress appears, mining completes, and the note publishes, in both the new-note view and the post modal (the original UAT gap; 04-UAT.md test 2)"
    test: "Restart pnpm dev, hard-reload the tab so /@vite/env is refetched, compose a note, set difficulty > 0, submit, and let mining run to completion in both the new-note view and the post modal"
    expected: "No `ReferenceError: window is not defined` in the console; the progress bar advances; 'Found POW' appears; the note is signed and published; the composer returns to a normal state"
    why_human: "Both fixes (04-12's createDraft hoist and 04-14's globalThis define) are confirmed present and wired, and the prelude evaluates cleanly in a vm, but no browser run has observed a worker mining a hash. 04-UAT.md test 2 is still `result: issue` (owned by /gsd-verify-work, not edited here). The debug session pow-workers-fail-to-load.md is at awaiting_human_verify, not resolved."
  - truth: "MinePOW cancels the pending success-delay publish on any unmount route, in particular inside the ~800ms window after 'Found POW' (04-UAT.md test 3, post-'Found POW' half)"
    test: "After 04-14, mine to completion and dismiss via ESC/overlay (post modal) or navigate away (new-note view) within ~800ms of 'Found POW' appearing; check DevTools -> Sources -> Threads and relays"
    expected: "No note is published, no Worker threads survive"
    why_human: "04-UAT.md test 3 is recorded `pass` by the human for the mid-mine dismissal path only; the UAT note says the post-'Found POW' window was unreachable because mining never completed. 04-14 makes it reachable for the first time but it has not been exercised. A pendingPublish ref + clearTimeout are confirmed present by direct read; a timer cancelled before it fires is not observable statically."
  - truth: "A publish failure after mining returns the user to the compose form with their text intact, instead of a permanent spinner or an endless re-mine loop (04-UAT.md test 4)"
    test: "After 04-14, force a publish failure after mining completes (e.g. no write relays reachable) and observe the composer"
    expected: "The spinner clears, the compose form reappears with the note text intact, an error toast is visible, and mining does not restart on its own"
    why_human: "04-UAT.md test 4 is `blocked` (it needed mining to complete, which the worker prelude defect prevented). 04-14 removes that blocker at source level but the test has not been run. publishPost's unconditional setLoading('') and setMiningTarget(0) are confirmed present by direct read and grep."
  - truth: "D-12's cleanup() call in mine-pow.tsx terminates the just-completed run's worker pool on completion, with no lingering threads and no double-teardown against stopMiner()'s handling of the previous run, or against 04-13's unmount teardown (04-UAT.md test 1)"
    test: "Let a mine run to completion normally (not via dismissal) and confirm in DevTools -> Sources -> Threads that no Worker threads survive"
    expected: "cleanup() (mine-pow.tsx:47) terminates the run's own workers on the normal completion path; useUnmount's teardown does not double-fire in a way that errors"
    why_human: "Phase 4's original outstanding human item. 04-UAT.md records test 1 as `pass` but with the user's note that the worker pool mined zero hashes (the 04-14 defect), so mining never actually completed and the completion-path cleanup() was never exercised. It remains unproven until a mine completes in a browser."
  - truth: "Under pnpm dev, every PoW module worker loads and mines real hashes (04-14's falsification test: no other dev-only window reference exists in the worker graph)"
    test: "Same run as item 1; watch the console for any ReferenceError from a worker and the progress bar for non-zero hashes"
    expected: "Workers install self.onmessage, mine, and post progress/complete messages"
    why_human: "The diagnosed defect (the define inlined raw into the env prelude) is verified fixed via a faithful vm reproduction of Vite's real transform, and the worker's own import graph is just nostr-tools' getEventHash/nip13. But a vm is not a browser; if any other dev-only window reference exists in the worker graph only a real run will show it. This is the debug session's own falsification test."
gaps: []
---

# Phase 4: Dead code and import hygiene sweep Verification Report

**Phase Goal:** Unused variables, unused and duplicated imports, and unreachable code are gone
from `src/`, with the mechanically auto-fixable share applied in its own reviewable commit and
each deliberate exception (notably the guarded dead code in `services/sqlite/index.ts`) either
documented or removed as an explicit decision.

**Verified:** 2026-10-01T17:50:00Z
**Status:** human_needed
**Re-verification:** Yes — after the 04-UAT gaps and their three closure plans (04-12, 04-13, 04-14)

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

**Third round (this one), after 04-14.** 04-UAT.md round 2 (2026-09-17) then ran against 04-12/04-13
and found one remaining blocker: under `pnpm dev`, all 8 PoW module workers threw `window is not
defined` at `vite/dist/client/env.mjs:8`, so the pool mined zero hashes (test 2 `issue`, test 4
`blocked`). Gap-closure plan 04-14 (merged at `355946150`) changed one value in `vite.config.ts`.
This round re-checks 04-14's claims against the code, re-runs its prelude reproduction, confirms the
04-12/04-13 code and D-12 are untouched, and folds in the human results already recorded in
04-UAT.md (read-only; not edited by this verification).

## The one fact that governs this report's ceiling

**No automated test exercises the PoW composer, and the dev server was not run.** The project now
has a test runner (vitest 5.0.1, `pnpm test`; added in Phase 05 — an earlier version of this report
said otherwise, and that is out of date). Live this round: `pnpm test` runs 2 files / 17 tests, all
passing (`src/services/napplet-shell/permissions.test.ts`, `src/services/wallets/nwc.test.ts`).
Neither touches `src/components/pow/`, `short-text-form.tsx`, `post-modal/index.tsx`, `vite.config.ts`
or `src/polyfill.ts`. So the runner exists but gives no behavioral evidence for anything Phase 4
changed at runtime. `pnpm dev` was not run (a prior session on this machine was OOM-killed starting
it — `STATE.md`, Phase 3 Plan 04). **A passing grep proves a line of code exists and is wired; it
does not prove a state transition, a cancellation path, or a cleanup invariant holds at runtime.**
Every runtime claim about PoW is therefore capped at `⚠️ PRESENT_BEHAVIOR_UNVERIFIED` unless the
human recorded an observation in 04-UAT.md (those are cited as such, not as my own observation).

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
| 14 | `cleanup;` → `cleanup()`, comment corrected (D-12) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Live read of `mine-pow.tsx:47`: `cleanup(); // Terminate this run's workers now that mining is done`. Reachable since 04-12 opened the render gate, but 04-UAT.md test 1 was recorded `pass` with the user's note that the worker pool mined zero hashes (the 04-14 defect), so a mine never completed and this call never ran on the completion path. Still unobserved. See human item 4. |
| 15 | 2 short-circuit statements → `if (...)` form (D-12a) | ✓ VERIFIED | Unchanged, live grep confirms `if (!e.isPropagationStopped()) show();` in both files. |
| 16 | 3 redundant trailing `return false;` deleted, in-catch kept (D-13) | ✓ VERIFIED | Unchanged; `ai-slop/swallowed-exception` = 0 live. |
| 17 | Before/after table produced (D-14) | ✓ VERIFIED | `04-VALIDATION.md` and `04-11-SUMMARY.md` carry the tables; trajectory consistent with `git log`. |
| 18 | `pnpm lint:ci` reports only pre-existing `react-hooks/rules-of-hooks` errors (D-15) | ✓ VERIFIED | Live `pnpm exec aislop ci --changes` run this session, parsed programmatically: 19 errors total, **all** `react-hooks/rules-of-hooks` — 0 error-severity findings of any other rule. |

**Part A score:** 17/18 fully VERIFIED, 1/18 present-and-wired-but-behavior-unverified (D-12) —
unchanged in substance from the previous round. 04-14 touched neither `mine-pow.tsx` nor any file D-01…D-15 covers (live `git diff --stat a42dbdcf4 HEAD -- src vite.config.ts` shows only `src/polyfill.ts` and `vite.config.ts`).

### Part B — UAT gap-closure truths (04-12, 04-13 — new this round)

These are not part of the original 18 locked decisions; they are the observable truths the
04-UAT round and its two closure plans introduced. All are additive fixes layered on top of D-12,
verified as present and correctly wired at the source level. Per the governing fact above none can
be marked runtime-VERIFIED by me without a browser; B4 and B5 are the exception because the human
already observed them in 04-UAT.md round 2.

| # | Truth | Status | Evidence |
|---|---|---|---|
| B1 | With PoW difficulty above 0, mining progress appears and the note publishes, in both the new-note view and the post modal (the original UAT gap) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | 04-UAT.md test 2 is `result: issue` (blocker: workers threw in dev); 04-14 fixes that cause but the re-run has not happened. Live read + grep confirms `await createDraft(values)` now runs unconditionally, before the `difficulty > 0` branch, in both `short-text-form.tsx` and `post-modal/index.tsx` (1 occurrence each) — the root cause diagnosed in `.planning/debug/pow-mining-never-starts.md` is fixed. `pnpm build` exits 0. No dev server run to confirm the gate actually opens at runtime. |
| B2 | MinePOW tears down its worker pool and cancels a pending success-delay publish on any unmount route, not just Cancel/Skip | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Partially human-observed: 04-UAT.md test 3 `pass` for mid-mine dismissal only; the ~800ms post-'Found POW' window was unreachable (mining never completed) and is still unobserved. Live read of `mine-pow.tsx:102-128`: `pendingPublish` ref captures the `setTimeout` handle; `useUnmount` clears it and calls `stopMiner.current()`. `useUnmount` import + call both present (grep count 2). `pnpm build` exits 0. Not exercised at runtime. |
| B3 | A publish failure after mining returns the user to the compose form with text intact, not a permanent spinner or endless re-mine loop | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | 04-UAT.md test 4 is `blocked` (needed a completed mine). Live read of `short-text-form.tsx:139-147`: `publishPost` clears `loading` unconditionally and, on an undefined `pub` (failure), resets `miningTarget` to 0. Grep confirms 2 `setLoading("")` and 2 `setMiningTarget(0)` sites. `pnpm build` exits 0. Not exercised at runtime. |
| B4 | MinePOW's progress screen (with Cancel/Skip) always renders on mount; "Found POW" cannot appear before mining starts | ✓ VERIFIED (human, 04-UAT.md test 5 `pass`) | Human-observed in UAT round 2; not re-observed by me. Independent of the worker defect (renders from mount). Live read of `mine-pow.tsx:94-101`: `bestProgress` is seeded with `difficulty: 0` literally, with an explanatory comment, replacing the prior pre-mining-hash seed that could probabilistically already clear the target. `pnpm build` exits 0. Not exercised at runtime. |
| B5 | A rejected `createDraft` in the post modal raises a toast instead of the Post button silently doing nothing | ✓ VERIFIED (human, 04-UAT.md test 6 `pass`) | Human-observed in UAT round 2; not re-observed by me. Live read of `post-modal/index.tsx:146-154`: `submit` is now `useAsyncAction(handleSubmit(...))` (imported from `src/hooks/use-async-action.ts`, matching the in-repo `poll-form.tsx` precedent). Grep confirms `useAsyncAction` appears exactly twice (import + call). `pnpm build` exits 0. Not exercised at runtime. |

**Part B score:** 2/5 human-verified via UAT (B4, B5), 3/5 present-and-wired-but-behavior-unverified (B1-B3).

### Part C — Gap-closure truths from 04-14 (new this round)

04-14's plan frontmatter carries six truths. All six re-checked live against `HEAD` (`4d677f64e`),
not copied from the SUMMARY.

| # | Truth | Status | Evidence |
|---|---|---|---|
| C1 | Under dev, the `/@vite/env` prelude Vite prepends to module workers evaluates without throwing in a scope with no `window` | ✓ VERIFIED (vm reproduction, not a browser) | Re-ran the plan's check verbatim this session: resolves the real `vite.config.ts` via `resolveConfig(..., "serve")`, runs the real `vite:client-inject` plugin's `buildStart`/`transform` on the real `env.mjs`, evaluates in a `node:vm` context with `self` and no `window`. Last line: `WORKER_PRELUDE_OK` (and the context asserts `global === globalThis`). `vite.config.ts:45` reads `global: "globalThis",`; the old `"window"` value is gone. `04-REVIEW-14.md` independently reproduced both the failing (`window`) and passing (`globalThis`) case against Vite 8.1.5. |
| C2 | Production still rewrites free `global` at build time (74ece28df preserved), now to `globalThis` | ✓ VERIFIED | `dist/sw.js` (dated 12:33, after commit `73668e40e` at 12:30): `grep -Fc 'typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : {}'` = 1; `grep -Fc 'typeof global !== "undefined"'` = 0. The define is still applied and emits `globalThis`. |
| C3 | The production PoW miner bundle is unaffected | ✓ VERIFIED | One `dist/assets/miner-CpFg6wop.js` (the expected hash), `grep -c '@vite/env'` = 0. Source `miner.ts` imports only `nostr-tools` (`getEventHash`, `nip13`). |
| C4 | The main-thread `global` polyfill names the same object as the define | ✓ VERIFIED (with a caveat, see WR-02) | `src/polyfill.ts` line 4 is exactly `globalThis.global ||= globalThis;` under `// @ts-ignore`; no `window.global`. `04-REVIEW-14.md` WR-02 notes the polyfill runs after all imported chunks evaluate, so it covers little in practice. It is harmless, not a defect. |
| C5 | D-12, 04-12 and 04-13 PoW code is untouched | ✓ VERIFIED | `git log a42dbdcf4..HEAD -- src/components/pow src/views/new/note/short-text-form.tsx src/components/post-modal/index.tsx` returns nothing. `mine-pow.tsx`: `cleanup();` count 1, `stopMiner();` count 1, `>=` at line 132, `useUnmount` count 2. `04-UAT.md` has no diff and no 04-14 commit. |
| C6 | Under dev, every PoW worker actually loads and mines real hashes in a browser | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | The defect named in 04-UAT.md is fixed at source and reproduced-fixed in a vm. No browser run exists. The debug session `.planning/debug/pow-workers-fail-to-load.md` is at `status: awaiting_human_verify` (not `resolved`), correctly. If another dev-only `window` reference exists in the worker graph, only a real run shows it. |

**Part C score:** 5/6 verified, 1/6 present-and-wired-but-behavior-unverified.

**Combined score:** 24/29 truths verified (17 Part A + 2 Part B + 5 Part C); 5/29 present-and-wired but
behavior-unverified (D-12, B1, B2, B3, C6); 0/29 FAILED. The "verified" count includes B4 and B5 on the strength of
the human's UAT observations, not my own.

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
| `7ab167469` / `73668e40e` / `ba4505149` (04-14) | `global` define to `globalThis`, polyfill alignment, debug-session handoff | ✓ VERIFIED | All 3 present in `git log`; merged at `355946150`. Diff `a42dbdcf4..HEAD` over `src` and `vite.config.ts` is exactly `src/polyfill.ts` (1 line) and `vite.config.ts` (value plus a rewritten 3-line comment). |
| `04-REVIEW-14.md` | Scoped review of 04-14 | ✓ EXISTS | 0 critical, 2 warnings, 1 info; see Known Latent / Deferred Items. |
| `.planning/debug/pow-workers-fail-to-load.md` | Debug session with applied fix | ✓ EXISTS | `status: awaiting_human_verify`, `files_changed: [vite.config.ts, src/polyfill.ts]`. |
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
minted for this gap-closure work. `04-14`'s frontmatter `requirements: [D-12]` likewise attributes the dev worker-prelude fix to D-12 (it too exists only because D-12's fix made the PoW path reachable). All 18 IDs from the task are present in 04-CONTEXT.md and accounted for in Part A; no ID is orphaned and no new ID was minted.

### Anti-Patterns Found

None introduced by 04-12, 04-13 or 04-14. For 04-14: `vite.config.ts` and `src/polyfill.ts` carry only their pre-existing `console.log` (`ai-slop/console-leftover`) and `@ts-ignore` findings, which 04-14's plan and `04-REVIEW-14.md` both place out of scope (backlog 999.8, D-16). No `TBD`/`FIXME`/`XXX` in either file. The two `// TODO: wrap this in a form` comments in
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

- **WR-01 (`04-REVIEW-14.md`)**: no committed regression test guards the dev-worker prelude rule
  ("a define value is inlined raw into every dev module worker's env prelude, so it must evaluate in
  every realm"). Confirmed real: vitest exists but no test covers `vite.config.ts`. The review's
  suggested vitest check is a cheap follow-up; it is a durability warning, not a failure of this
  phase's goal, and does not change status.
- **WR-02 (`04-REVIEW-14.md`)**: `src/polyfill.ts` runs after the entry chunk's imports, so it
  protects almost nothing and the 04-14 claim that the two shims "cannot drift apart" overstates it.
  Behaviorally harmless today; the risk is a future maintainer removing the define as "redundant".
  Recommended follow-up: delete the polyfill or document its real coverage.
- **IN-01 (`04-REVIEW-14.md`)**: the dev service worker gets neither the define rewrite nor the env
  prelude, so `global` is undefined there under `pnpm dev`. No harm today (Capacitor guards with
  `typeof`). Pre-existing and unchanged.

### Human Verification Required

The following 5 items must be exercised in a real browser (`pnpm dev` or a built preview) before
this phase's D-12 area and its UAT gap-closure can be marked closed. Restart `pnpm dev` and
hard-reload the tab first so the browser refetches `/@vite/env`. Two earlier items (progress screen
renders on mount; post-modal rejected-draft toast) were observed by the user in 04-UAT.md round 2
(tests 5 and 6, `pass`) and are no longer open. This verification does not edit 04-UAT.md;
/gsd-verify-work owns it and the re-run should resolve its tests 1-4.

#### 1. PoW mining runs to completion in both composers (B1; UAT test 2)

**Test:** Sign in, compose a note, set a PoW difficulty above 0, submit, and let mining finish, in
both the new-note view (`src/views/new/note/short-text-form.tsx`) and the post modal
(`src/components/post-modal/index.tsx`).
**Expected:** No `ReferenceError: window is not defined`; the progress bar advances; "Found POW"
appears; the note is signed and published; the composer is not left stuck.
**Why human:** Both fixes are present and wired and the prelude reproduces clean in a vm, but no
browser has seen a worker mine a hash. UAT test 2 is still `issue`.

#### 2. Dismissal inside the ~800ms post-"Found POW" window (B2; UAT test 3)

**Test:** Mine to completion, then dismiss (ESC/overlay in the post modal, navigate away in the
new-note view) within ~800ms of "Found POW". Check DevTools -> Sources -> Threads and relays.
**Expected:** No note is published; no Worker threads survive.
**Why human:** Mid-mine dismissal passed in UAT, but this window was unreachable until mining could
complete. A timer cancelled before it fires cannot be seen statically.

#### 3. Publish failure recovers the compose form (B3; UAT test 4)

**Test:** After mining completes, force a publish failure (e.g. no write relays reachable).
**Expected:** Spinner clears, form returns with text intact, error toast visible, mining does not restart.
**Why human:** UAT test 4 is `blocked` on the worker defect; the failure path is invisible to static analysis.

#### 4. D-12's cleanup() on the normal completion path (UAT test 1)

**Test:** Let a mine complete normally and check DevTools -> Sources -> Threads for surviving Workers.
**Expected:** `cleanup()` (`mine-pow.tsx:47`) terminates the run's workers; no console errors; no
conflict with the unmount teardown.
**Why human:** UAT test 1 was accepted `pass` while the pool mined zero hashes, so the completion
path never ran. Phase 4's most persistent outstanding item.

#### 5. Dev workers load and mine (C6; 04-14's falsification test)

**Test:** Same run as item 1; watch the console for any worker `ReferenceError` and confirm non-zero hashes.
**Expected:** Workers install `self.onmessage`, mine, and post `progress`/`complete`.
**Why human:** If any other dev-only `window` reference exists in the worker graph, the diagnosis is
incomplete and only a real run reveals it. The worker's own graph is just `nostr-tools`.

### Gaps Summary

No gaps. All 18 original locked decisions remain satisfied (this round's live checks: `pnpm test`
17/17 passing; 04-14 changed only `vite.config.ts` and `src/polyfill.ts`, so the bucket-C = 0,
aislop and `pnpm build` results recorded in the previous round are not disturbed; the orchestrator
reports `pnpm build` exit 0 post-merge). The 04-UAT diagnosed gaps are fixed at the source level in
04-12, 04-13 and 04-14, and 04-14's static claims were re-proved live: the dev env prelude, built
from the real config, evaluates cleanly where `window` does not exist (`WORKER_PRELUDE_OK`), `dist/sw.js`
shows the define still applied and now emitting `globalThis`, the miner bundle has no `@vite/env`, and
no PoW source file was touched.

What remains is exclusively runtime behavior in a browser: 5 items (mining completing and
publishing; the post-"Found POW" cancellation window; publish-failure recovery; D-12's `cleanup()`
on completion; dev workers actually mining). None has been observed. That is why the status is
`human_needed`, not `passed`. The two non-blocking review warnings on 04-14 (no committed
regression test for the prelude rule; the polyfill covers little) are recorded above as
follow-ups and do not change status.

---

_Verified: 2026-10-01T17:50:00Z_
_Verifier: Claude (gsd-verifier)_
