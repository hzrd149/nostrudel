---
status: complete
phase: 04-dead-code-and-import-hygiene-sweep
source: [04-VERIFICATION.md]
started: 2026-09-16T01:45:00Z
updated: 2026-09-16T02:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. PoW mining completes and tears down its worker pool (D-12)

expected: In a dev build, sign in, compose a note, set a PoW difficulty target, start mining, and
let it complete. Mining completes, `onComplete` fires with the drafted event, `stopMiner()` runs for
the previous run, and `cleanup()` terminates this run's worker pool (no lingering Worker threads, no
console errors).

result: issue
reported: "anything above 0 PoW never even posts the note from the src/views/new/note/ view and never even shows the mining progress"
severity: major

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

## Summary

total: 1
passed: 0
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "PoW mining runs to completion: progress is visible while mining, onComplete fires with the drafted event, and the note posts"
  status: failed
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
