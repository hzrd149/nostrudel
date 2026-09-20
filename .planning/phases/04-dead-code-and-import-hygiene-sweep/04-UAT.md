---
status: complete
round: 2
phase: 04-dead-code-and-import-hygiene-sweep
source: [04-VERIFICATION.md]
started: 2026-09-16T01:45:00Z
updated: 2026-09-20T00:00:00Z
---

## Current Test

[testing complete]

**Round 2 opened 2026-09-17.** Round 1's single test was blocked by a defect that is now fixed in
code (04-12, then 04-13). Test 1 is unchanged and is retestable for the first time; tests 2-6 are
new, covering the fixes that the closure work itself introduced.

All six need a browser. This project has no test runner (0 test files; no vitest/jest/playwright in
`package.json`), so every automated gate available to 04-12, 04-13 and the re-verification was
either `pnpm build` — a typecheck, and all the edits are type-identical — or a static grep. A grep
proves a line exists and is wired; it cannot prove a state transition, a cancellation, or a cleanup
invariant.

**Round 2 closed 2026-09-20: all 6 tests passed in a browser.** Every item above has now been
observed running, including the three BLOCKER defects from 04-REVIEW-12.md (tests 3, 4, 5) and the
original reported gap (test 2). D-12's `cleanup()` is confirmed live for the first time (test 1).

Note on `pnpm dev`: a prior session on this machine was OOM-killed starting it (recorded in
STATE.md against 03-04). If it will not start reliably, record the affected tests as `skipped` /
accepted residual risk rather than leaving them pending indefinitely, following Phase 3's precedent.

## Tests

### 1. PoW mining completes and tears down its worker pool (D-12)

expected: In a dev build, sign in, compose a note, set a PoW difficulty target, start mining, and
let it complete. Mining completes, `onComplete` fires with the drafted event, `stopMiner()` runs for
the previous run, and `cleanup()` terminates this run's worker pool (no lingering Worker threads, no
console errors).

result: pass

**Why this needs a human:** This is the one edit in Phase 4 that changes runtime behavior — a bare
identifier reference (`cleanup;`, an inert statement) became a real call (`cleanup()`). `pnpm build`
only proves `cleanup` is callable at that point in the type system; it cannot prove the worker pool
actually terminates without leaking or double-firing. `04-VALIDATION.md`'s Manual-Only table already
records this as "Outstanding / unverified" — the dev server responded 200, but the interactive
mining flow was never exercised by any plan or by the closing summary.

**Site:** `src/components/pow/mine-pow.tsx:47` — `cleanup();` with the corrected comment. The
closure itself is defined at lines 61-67 in the same block.

**Context that makes this safe to trust, but not safe to assume:** research established that
`stopMiner` is a *parameter* holding the **previous** run's cleanup (passed as `stopMiner.current`),
while `cleanup` terminates **this** run's workers — so the two are not redundant and `cleanup()` is
not a double-teardown. Independent code review (`04-REVIEW.md`) went further and judged the change a
*positive fix* for a previously-inert teardown call. Both are static analyses; neither ran the miner.

**How to test:**
1. `pnpm dev` (note: a prior session hit an OOM kill starting the dev server on this machine — if it
   will not start reliably, record this test as `skipped` / accepted residual risk rather than
   leaving it pending, following Phase 3's precedent for its native-scanner item).
2. Sign in with any account that can publish.
3. Compose a note and set a PoW difficulty target (a low target is fine — the point is completion,
   not difficulty).
4. Start mining and let it run to completion.
5. Confirm: the note completes and is drafted; no console errors; no Worker threads left running
   (DevTools → Sources → Threads, or Performance/Memory panel).

**Round 2 status (2026-09-17):** reopened as `pending`. The blocker that made this untestable —
MinePOW never mounting — is fixed, so `cleanup()` is reachable at runtime for the first time in
~15 months. The round-1 `result: issue` above is the historical record of why it could not be run,
not a current verdict. Test 5 below now also covers a second teardown path that did not exist
during round 1, so run both and compare.

### 2. PoW mining actually works end to end, in both composers (the original gap)

expected: With difficulty above 0, MinePOW mounts and shows progress; on completion the note is
signed and published; the composer returns to a normal (non-stuck) state either way.

result: pass

**Why this needs a human:** the fix — hoisting `createDraft` above the difficulty branch so the
`miningTarget && draft` render gate can open — is confirmed present and wired by direct file read
and a line-order grep, and `pnpm build` passes. But no test exercises the gate opening at runtime.
This is the exact symptom you originally reported, so it is the test that decides whether the gap
is genuinely closed.

**Sites:** `src/views/new/note/short-text-form.tsx`, `src/components/post-modal/index.tsx`

**How to test:** compose a note, set difficulty > 0, submit. Do it in **both** the new-note view
and the post modal — they are separate code paths that received the same fix.

### 3. Dismissing mid-mine does not publish the note, and does not leak workers

expected: No lingering Worker threads, CPU returns to idle, and no note is published after the
composer was dismissed.

result: pass

**Why this needs a human:** this is the most severe defect found in the whole phase. Before the
fix, dismissing the composer inside the 800ms success delay still fired the publish — signing and
broadcasting a note the user had backed out of, irretractably. `useUnmount`, a `pendingPublish`
ref, and `clearTimeout` are confirmed present by direct read, but no test can prove the timer is
actually cancelled *before* it fires.

**Site:** `src/components/pow/mine-pow.tsx` (useUnmount teardown)

**How to test:** start a mine, then dismiss via ESC and via overlay-click in the post modal, and by
navigating away in the new-note view. Do it twice: once mid-mine, and once **inside the ~800ms
window right after "Found POW" appears** — that second case is the dangerous one. Then check
DevTools → Sources → Threads for surviving Workers, and confirm no note appeared on any relay.

### 4. A publish failure after mining returns you to the form, not a dead spinner

expected: The spinner clears, the compose form reappears with the note text intact, an error toast
is visible, and mining does not restart on its own.

result: pass

**Why this needs a human:** before the fix this stranded a permanent spinner with no Cancel and no
retry — and worse, the cached draft was already deleted, so leaving the page destroyed the note.
`publishEvent` swallows the failure into a toast by default, so the failure path is invisible to
static analysis. Watch specifically that mining does **not** restart: an earlier proposed fix would
have caused an endless re-mine-and-republish loop.

**Site:** `src/views/new/note/short-text-form.tsx` (`publishPost`)

**How to test:** force a publish failure after mining completes — e.g. remove/disable all write
relays, or go offline at the moment mining finishes — and watch the composer.

### 5. The progress screen with Cancel/Skip always renders on mount

expected: The progress screen and its abort controls render on every mount; "Found POW" only
appears after the worker actually reports difficulty >= target.

result: pass

**Why this needs a human:** previously the initial state was seeded from the *unmined* hash, which
at difficulty 1 had roughly a 50% chance of already clearing the target — rendering the button-less
success screen before mining even started, with no way to cancel. It is probabilistic, so a single
run proves nothing.

**Site:** `src/components/pow/mine-pow.tsx` (`bestProgress` initializer)

**How to test:** mine at difficulty 1 **several times** and confirm the progress screen with
Cancel/Skip renders first every single time.

### 6. A failed draft in the post modal shows an error instead of nothing

expected: An error toast appears with the rejection's message; the modal does not sit there with no
feedback.

result: pass

**Why this needs a human:** the Post button previously did nothing at all on a rejected
`createDraft` — the rejection dropped as an unhandled promise with no user-visible signal.

**Site:** `src/components/post-modal/index.tsx` (`submit` wrapped in `useAsyncAction`)

**How to test:** trigger a `createDraft` rejection — e.g. sign out mid-compose, or deny the signer
prompt — and watch for a toast.

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

_Round 1 recorded 1 issue (test 1). Its fix has been applied in code but not confirmed at runtime,
so it is carried here as `pending` rather than counted as resolved. The round-1 gap entry below is
retained with its original `status: failed` for the same reason._

## Gaps

- truth: "PoW mining runs to completion: progress is visible while mining, onComplete fires with the drafted event, and the note posts"
  status: resolved
  resolved: "2026-09-20 — round-2 tests 1 and 2 both passed. A human observed MinePOW mounting, progress rendering, the note publishing, and the worker pool tearing down. This is the runtime confirmation the gap was held open for."
  reason: "User reported: anything above 0 PoW never even posts the note from the src/views/new/note/ view and never even shows the mining progress"
  severity: major
  test: 1
  root_cause: |
    src/views/new/note/short-text-form.tsx:146 — the PoW branch of `submit` sets the mining target
    but never creates the draft. `draft` has exactly one writer (setDraft, inside createDraft) and
    createDraft has exactly one caller (line 149, in the `difficulty === 0` branch). On the PoW path
    `draft` stays undefined, so the render gate at line 176 (`if (miningTarget && draft)`) never
    opens and <MinePOW> never mounts. MinePOW is both the sole renderer of progress UI and the sole
    caller of publishPost on the PoW path, so one cause produces both halves of the symptom.
    The identical bug exists at src/components/post-modal/index.tsx:146.
  origin: |
    PRE-EXISTING, not a Phase 4 regression. Introduced 2025-06-02 in 124345b25 ("Fix new note view
    spamming getPublicKey"), which deleted the throttled `useAsync(() => getDraft())` that was the
    only thing populating `draft` on the PoW path, and simultaneously narrowed publishPost's
    `unsigned || draft || await getDraft()` fallback into a mandatory-arg signature. Evidence:
    (1) the pre-Phase-4 snapshot of short-text-form.tsx is byte-identical at the same line numbers;
    (2) Phase 4 touched the file twice, both cosmetic (138c3f45e import merge, cfa629341 ignore
    comment); (3) an inert `cleanup;` would have leaked workers after a successful mine, never
    blocked one. Routed to Phase 4 gap closure by user decision despite pre-existing origin.
  d12_status: |
    D-12 (mine-pow.tsx:47 `cleanup;` → `cleanup()`) is EXONERATED and must NOT be reverted. Line 47
    sits lexically inside handleMessage, in the `msg.type === "complete"` branch, running only after
    onComplete(msg.draft) has captured the mined draft. The spawn loop (51-59) never reaches it.
    It remains live-unverified only because MinePOW never mounts; verifying it is downstream of
    this fix.
  artifacts:
    - src/views/new/note/short-text-form.tsx:144-155
    - src/components/post-modal/index.tsx:146-148
    - src/components/pow/mine-pow.tsx:120
    - .planning/debug/pow-mining-never-starts.md
  missing:
    - "createDraft() called on the PoW path in short-text-form.tsx so the MinePOW gate can open"
    - "createDraft() called on the PoW path in post-modal/index.tsx (same bug, same fix)"
    - "mine-pow.tsx:120 success check uses >= not >, matching the worker's break condition in miner.ts:25"
  fix_applied: |
    2026-09-17 — all three `missing` items implemented and confirmed present at the source level.
    2026-09-20 — runtime confirmation obtained: round-2 tests 1 and 2 both passed, so the gap moved
    from `failed` to `resolved`. The hold for a human observation is satisfied.

    04-12 (bbfaab649, fb55b8cbe, 8a4d2af4c): hoisted the existing `createDraft(values)` call above
    the difficulty branch in both composers, and changed mine-pow.tsx's success check to `>=`.

    A scoped review of that change (04-REVIEW-12.md) then found that opening this ~15-month-dormant
    path exposed three BLOCKER defects in the code it made reachable — a note signed and broadcast
    after the user dismissed the composer, a leaked worker pool on any non-Cancel/Skip unmount, and
    an unrecoverable spinner that also destroyed the cached draft.

    04-13 (f4fa32c8c, f5c1622b3, cd22f3579, 9bd51ed99): fixed all three additively, plus two
    WARNING findings, without reverting D-12's cleanup() or 04-12's `>=` operator. Those fixes are
    round-2 tests 3-6.

    Deferred with recorded rationale, not fixed: WR-03 (changing `useCacheForm`'s teardown condition
    affects 8 consumer forms; the regression would be silent and unvalidatable without a dev server)
    and IN-01. See 04-13-SUMMARY.md.
