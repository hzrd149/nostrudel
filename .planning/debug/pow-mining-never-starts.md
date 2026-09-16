---
status: diagnosed
trigger: "anything above 0 PoW never even posts the note from the src/views/new/note/ view and never even shows the mining progress"
created: 2026-09-16
updated: 2026-09-16
---

## Current Focus

hypothesis: CONFIRMED - short-text-form.tsx:146 sets the mining target without ever creating the draft; the render gate at line 176 (`miningTarget && draft`) is therefore permanently falsy, so <MinePOW> never mounts.
test: Traced the single writer of `draft` state (setDraft, line 119, inside createDraft) and its single call site (line 149, inside the difficulty===0 else-branch). Confirmed against pre-Phase-4 snapshot and pickaxe history.
expecting: n/a - root cause confirmed, diagnose-only mode.
next_action: Report to caller. Do NOT fix (goal: find_root_cause_only).

## Symptoms

expected: With targetPOW > 0, the MinePOW component renders mining progress, finds a hash, and the note publishes.
actual: No mining progress UI ever appears AND the note never publishes. targetPOW == 0 (no mining) works.
errors: none reported by user - the failure is silent
reproduction: src/views/new/note/ -> compose note -> More Options -> POW Difficulty slider > 0 -> Post
started: Reported after Phase 4 dead-code sweep landed on `next`, but see Eliminated - actually broken since 2025-06-02.

## Eliminated

- hypothesis: PRIME SUSPECT - mine-pow.tsx:47 `cleanup;` -> `cleanup()` (D-12) terminates the worker pool immediately at mining start
  evidence: Line 47 is lexically inside `handleMessage`, within the `else if (msg.type === "complete")` branch (lines 43-48). It executes ONLY after a worker posts a "complete" message, and only after `onComplete(msg.draft)` (line 45) has already fired. The worker spawn loop is lines 51-59 and never reaches line 47. Terminating workers at that point is correct. Moreover, since MinePOW never mounts at all, `miner()` is never invoked and line 47 is unreachable in this scenario.
  timestamp: 2026-09-16

- hypothesis: D-07 (b24e97beb) removal of `bestHash` from miner.ts broke progress reporting
  evidence: `bestHash` was write-only. miner.ts:22 posts `postMessage({ type: "progress", hash: newDraft.id, difficulty })` - it reads `newDraft.id`, never `bestHash`. `bestDifficulty` gating (line 20) is untouched. Removal is behaviour-neutral.
  timestamp: 2026-09-16

- hypothesis: Some other Phase 4 commit altered the publish path in short-text-form.tsx
  evidence: Only two Phase 4 commits touch the file. 138c3f45e (04-01) merged `useActiveAccount` into the existing `applesauce-react/hooks` import line. cfa629341 (04-07) added one `aislop-ignore-next-line` comment above `formState.isDirty;`. Neither touches submit/createDraft/the render gate. Verified by `git show` on both.
  timestamp: 2026-09-16

## Evidence

- timestamp: 2026-09-16
  checked: src/components/pow/mine-pow.tsx full read
  found: `cleanup()` at line 47 sits inside the "complete" message branch. `cleanup` is a `const` declared at line 61 (after the spawn loop) but referenced only from the async onmessage handler, so no TDZ hit.
  implication: D-12 cannot prevent mining from starting. Prime hypothesis refuted.

- timestamp: 2026-09-16
  checked: src/views/new/note/short-text-form.tsx lines 108-188
  found: `setDraft` has exactly ONE call site - line 119, inside `createDraft`. `createDraft` has exactly ONE call site - line 149, inside the `else` (difficulty === 0) branch of submit. The PoW branch (line 146) calls only `setMiningTarget(values.difficulty)`. The render gate at line 176 is `if (miningTarget && draft)`.
  implication: ROOT CAUSE. On the PoW path `draft` stays `undefined`, the gate is falsy forever, MinePOW never mounts.

- timestamp: 2026-09-16
  checked: git show 606166eab~1:src/views/new/note/short-text-form.tsx (pre-Phase-4 snapshot)
  found: Byte-identical submit logic at identical line numbers - 146 `if (values.difficulty > 0) setMiningTarget(values.difficulty);`, 149 `const unsigned = await createDraft(values);`, 176 `if (miningTarget && draft)`.
  implication: NOT a Phase 4 regression. The bug predates the sweep.

- timestamp: 2026-09-16
  checked: git show 124345b25 (2025-06-02, "Fix new note view spamming `getPublicKey`")
  found: That commit DELETED `const throttleValues = useThrottle(getValues(), 500); const { value: preview } = useAsync(() => getDraft(), [throttleValues]);`. Verified at 124345b25~1 that `getDraft()` called `setDraft(unsigned)`. It also narrowed `publishPost(unsigned?)` - which had the fallback `unsigned = unsigned || draft || (await getDraft())` - into `publishPost(unsigned: UnsignedEvent)` with a mandatory arg.
  implication: BUG INTRODUCED HERE. The throttled useAsync was the only thing populating `draft` on the PoW path (it re-ran every 500ms as the user typed). Removing it to stop getPublicKey spam left `draft` permanently undefined, and narrowing publishPost removed the second safety net. PoW posting has been broken since 2025-06-02, ~15 months before Phase 4.

- timestamp: 2026-09-16
  checked: src/components/post-modal/index.tsx lines 112-172
  found: Identical defect. `setDraft` only at line 123 inside `createDraft`; `createDraft` called only at line 147 in the `else` branch; gate at line 166 is `miningTarget && draft`. Its `preview` is also a plain `useThrottle` of the content string, so nothing else populates `draft`.
  implication: The same bug affects the post modal. Any fix should cover both call sites.

- timestamp: 2026-09-16
  checked: src/components/pow/miner.ts lines 5-8, 58 of mine-pow.tsx
  found: mine-pow.tsx:58 posts `{ draft, target, startNonce, endNonce }` but miner.ts:6 destructures only `const { draft, target } = event.data;` and starts at `let nonce = 0`. startNonce/endNonce are ignored.
  implication: SECONDARY (pre-existing, unrelated to the reported symptom) - all N workers mine the identical nonce sequence, so "multi-threaded" mining gives no speedup at N x CPU cost.

## Resolution

root_cause: src/views/new/note/short-text-form.tsx:146 - the PoW branch of `submit` sets `miningTarget` but never calls `createDraft()`, so the `draft` state (sole writer: setDraft at line 119, reachable only from line 149 in the difficulty===0 branch) stays undefined and the render gate `if (miningTarget && draft)` at line 176 never opens, so <MinePOW> never mounts. Introduced 2025-06-02 in commit 124345b25, which deleted the throttled `useAsync(() => getDraft())` that had been incidentally populating `draft`.
fix: NOT APPLIED (diagnose-only mode). Minimal fix is to hoist `createDraft(values)` above the difficulty branch in short-text-form.tsx:144-155 and in post-modal/index.tsx:146-148. Do NOT revert D-12.
verification: not performed - diagnose-only
files_changed: []
