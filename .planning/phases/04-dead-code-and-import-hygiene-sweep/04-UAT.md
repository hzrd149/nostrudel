---
status: testing
phase: 04-dead-code-and-import-hygiene-sweep
source: [04-VERIFICATION.md]
started: 2026-09-16T01:45:00Z
updated: 2026-09-16T01:45:00Z
---

## Current Test

number: 1
name: PoW mining completes and tears down its worker pool (D-12)
expected: |
  Mining completes, `onComplete` fires with the drafted event, `stopMiner()` runs for the previous
  run, and `cleanup()` actually terminates this run's worker pool — visible as no lingering Worker
  threads and no console errors. This confirms `cleanup;` → `cleanup()` (D-12) is correct in a live
  browser, not just under `tsc`.
awaiting: user response

## Tests

### 1. PoW mining completes and tears down its worker pool (D-12)

expected: In a dev build, sign in, compose a note, set a PoW difficulty target, start mining, and
let it complete. Mining completes, `onComplete` fires with the drafted event, `stopMiner()` runs for
the previous run, and `cleanup()` terminates this run's worker pool (no lingering Worker threads, no
console errors).

result: [pending]

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
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
