---
phase: 04-dead-code-and-import-hygiene-sweep
verified: 2026-09-15T22:00:00Z
status: human_needed
score: 18/18 must-haves verified
behavior_unverified: 1
overrides_applied: 0
human_verification:
  - test: "In a dev build, sign in, compose a note, set a PoW difficulty target, start mining, and let it complete."
    expected: "Mining completes, onComplete fires with the drafted event, stopMiner() runs for the previous run, and cleanup() actually terminates this run's worker pool (visible via no lingering Worker threads / no console errors) — confirming cleanup; -> cleanup() (D-12) is correct in a live browser, not just under tsc."
    why_human: "This is the one edit in the phase that changes runtime behavior (a bare identifier reference becomes a real call). pnpm build only proves cleanup is callable at that point in the type system; it cannot prove the worker pool actually terminates without leaking or double-firing. Recorded in 04-VALIDATION.md's Manual-Only table as 'Outstanding / unverified' — the dev server responded 200 but the interactive mining flow was never exercised by any prior plan or the closing summary."
---

# Phase 4: Dead code and import hygiene sweep Verification Report

**Phase Goal:** Unused variables, unused and duplicated imports, and unreachable code are gone
from `src/`, with the mechanically auto-fixable share applied in its own reviewable commit and
each deliberate exception (notably the guarded dead code in `services/sqlite/index.ts`) either
documented or removed as an explicit decision.

**Verified:** 2026-09-15T22:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (mapped to the 18 locked decisions, D-01 … D-15)

All commands run live against HEAD `0bb1e4b1a` (this session), not copied from any summary.

| # | Truth (Req) | Status | Evidence |
|---|---|---|---|
| 1 | Bucket-C count is 0 or every survivor is ledgered (D-01) | ✓ VERIFIED | `pnpm exec aislop scan --json . 2>/dev/null \| jq '[.diagnostics[] \| select(.rule as $r \| [15 bucket-C rules] \| index($r))] \| length'` → **0**, run live this session. 5 `aislop-ignore` directives exist in `src/`; exactly 3 map to this phase's ledger (sqlite/index.ts, post-modal/index.tsx, short-text-form.tsx) and 2 are pre-existing (Phase 2's error-logger.ts, Phase 3's use-timeline-cache-key.ts) — confirmed by live `grep -rn aislop-ignore src/`. |
| 2 | Starting point re-measured as 417, not ROADMAP's 445 (D-02) | ✓ VERIFIED | 04-CONTEXT.md's own table documents the re-measurement; 04-01-SUMMARY and orchestrator's trajectory (417→155→78→25→0) are internally consistent with the per-plan commits inspected below. |
| 3 | Overlap between `no-unused-vars`/`unused-import` recorded, not treated as error (D-02a) | ✓ VERIFIED | 04-CONTEXT.md documents the 58-site identical-line overlap measurement; final bucket-C=0 makes the overlap question moot at phase close. |
| 4 | Auto-fix applies exactly 3 steps (imports, duplicates, narrative comments), narrative-comment hunks reverted before staging, backlog 999.8 untouched (D-03) | ✓ VERIFIED | `ai-slop/narrative-comment` reads **21** live (unchanged from the 21 baseline in D-03/D-02). Commit `138c3f45e` message documents the revert of narrative-comment hunks and vendored `src/lib/qrcodegen.ts` before staging. |
| 5 | Auto-fix lands in its own commit (D-04) | ✓ VERIFIED | `138c3f45e` "fix(04-01): apply aislop safe auto-fix for bucket-C imports" is a standalone commit, 97 files, import-line-only diff per its own message; all manual work is in separate `fix(04-0X)` commits that follow it in `git log`. |
| 6 | Non-safe `aislop fix` never run (D-04a) | ✓ VERIFIED | No commit message or diff shows the "Dead code & comments"/"Unused declarations"/"Lint fixes" non-safe categories; all deletions are hand-authored fix commits (`fix(04-03)`, `fix(04-04)`, etc.) with per-site rationale in their messages. |
| 7 | 24 unused catch bindings → bare `catch {` (D-05) | ✓ VERIFIED | `ai-slop/swallowed-exception` reads **0** live (CI-gating bar from Phase 3 held). Dedicated commits `fix(04-02)` (3 commits: helpers/classes/services, components/providers, views) all titled "bare catch ... (D-05)". |
| 8 | 57 unused params `_`-prefixed or deleted per contract-bound rule (D-06) | ✓ VERIFIED | Bucket C (which includes `eslint/no-unused-vars`) reads 0 live. Spot-checked `reply-form.tsx`: `replyKind: _replyKind = kinds.ShortTextNote` — contract-bound param kept and prefixed, not deleted, matching the 999.13 write-seam warning. `relay-stats.ts`'s `getRTTTag(stats, _name)` also confirms the prefix convention applied even where doing so exposed IN-01's pre-existing bug (correctly left unfixed as out-of-scope). |
| 9 | 24 dead declarations deleted, nothing orphaned (D-07) | ✓ VERIFIED | Live grep: `RepairBlobButton`, `ListFeedButton`, `SUGGESTED_MINTS`, `DEFAULT_WALLET_RELAYS` — all absent from their files. `isDirectReply` — only remaining trace is inside a comment (`// if (replyPointer && isDirectReply(...))`), not a live call/declaration. `Header` in `pictures/picture/index.tsx` absent. `pnpm build` exits 0 (run live), confirming no orphaned reference. |
| 10 | Every ignore rule-scoped with a why-not-fixed reason (D-08) | ✓ VERIFIED (post-amendment) | All 3 surviving directives (sqlite/index.ts, post-modal/index.tsx, short-text-form.tsx) name their rule(s) and end `-- reason`, confirmed live via grep. The 4th (`magic-textarea.tsx`) that failed this bar under independent code review (WR-02) was deleted, not reworded — confirmed via `git show 0bb1e4b1a` and live file read (no `[Textarea, Input];`, no ignore, both imports still used at L177/L201). |
| 11 | sqlite guarded region kept + ignored; `dbName` local deleted (D-09) | ✓ VERIFIED | Live read of `sqlite/index.ts`: file-level ignore present (line 1) naming both rules with a reason now stating the *actual* rationale (kept as in-file record of web-sqlite wiring) rather than the disproven "behavior-change risk" claim WR-01 flagged — corrected in commit `0bb1e4b1a`. `deleteDatabase()` (lines 41-49) has no `dbName` local; only the function parameter `dbName: string` at `openConnection` remains, which is used, not dead. `eslint/no-unreachable` and `ai-slop/unreachable-code` both read 0 repo-wide, confirming the directive still parses/suppresses. |
| 12 | `[Textarea, Input];` removed as redundant, imports survive (D-10, amended) | ✓ VERIFIED | Live file read confirms the statement, comment, and ignore directive are gone (`git show 0bb1e4b1a` diff matches disk state exactly). `textAreaComponent={Input}` (L177) and `textAreaComponent={Textarea}` (L201) confirmed live — both imports remain genuinely used. `pnpm build` exits 0. |
| 13 | Both `formState.isDirty;` kept + ignored (D-11) | ✓ VERIFIED | Both `post-modal/index.tsx:101` and `short-text-form.tsx:97` carry `aislop-ignore-next-line eslint/no-unused-expressions` with distinct, substantive reasons — confirmed live via grep. Code review (04-REVIEW.md) independently traced both files' early-return branches and confirmed the bare read is load-bearing on those paths — matches the bar. |
| 14 | `cleanup;` → `cleanup()`, comment corrected (D-12) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Live read of `mine-pow.tsx:47`: `cleanup();  // Terminate this run's workers now that mining is done` — the call fix and comment correction are both present and `cleanup` is a real closure returned from the same block (line 61-67), so it is callable at that point. `pnpm build` passes. However this is the phase's one runtime-behavior-changing edit and the interactive mining spot-check (compose note, set difficulty, observe completion + worker teardown) was never performed — 04-VALIDATION.md's own Manual-Only table records this as "Outstanding / unverified." Presence + wiring is confirmed; the behavior itself is not exercised by any test. Routed to human verification below. |
| 15 | 2 short-circuit statements → `if (...)` form (D-12a) | ✓ VERIFIED | Live grep: both `gallery.tsx:23` and `image.tsx:67` read `if (!e.isPropagationStopped()) show();` — no bare `&&` short-circuit statement remains. `eslint/no-unused-expressions` is part of bucket C, which reads 0. |
| 16 | 3 redundant trailing `return false;` deleted, in-catch `return false` kept (D-13) | ✓ VERIFIED | Live grep of `nip-notation.ts`, `bip-notation.ts`, `goal.ts`: each file now has exactly one `return false;` per branch (guard + in-catch), no trailing duplicate after the try/catch. `ai-slop/swallowed-exception` still reads 0 (Phase 3's CI bar held, confirmed live). |
| 17 | Before/after table produced (D-14) | ✓ VERIFIED | 04-VALIDATION.md and 04-11-SUMMARY.md carry the per-rule/per-file before/after tables; orchestrator-measured trajectory (417→155→78→25→0) is consistent with the wave commit sequence found in `git log`. |
| 18 | `pnpm lint:ci` reports only pre-existing `react-hooks/rules-of-hooks` errors, no new error-severity rule (D-15, extended scope) | ✓ VERIFIED | Live `pnpm lint:ci` run: 19 errors total, all `react-hooks/rules-of-hooks` (confirmed via live scan: error-severity findings excluding that rule = **0**). `git diff` at merge-base `77032fc00f8` for a spot-checked file (`app-handler-modal/index.tsx`) touches only an unrelated import and a catch clause well away from the hook-order lines (53/55/57) — matches 04-VALIDATION.md's extended 10-file/19-error table. |

**Score:** 17/18 truths fully VERIFIED, 1/18 present-and-wired-but-behavior-unverified (D-12).

### Backlog Fences (must read delta 0 vs. phase-start baseline — checked live)

| Rule | Live count | Baseline | Delta | Status |
|---|---|---|---|---|
| `react-hooks/rules-of-hooks` | 48 | 48 | 0 | ✓ fenced |
| `react-hooks/exhaustive-deps` | 174 | 174 | 0 | ✓ fenced |
| `ai-slop/narrative-comment` | 21 | 21 | 0 | ✓ fenced |
| `console-leftover` | 15 | 15 | 0 | ✓ fenced |
| `meta-comment` | 3 | 3 | 0 | ✓ fenced |
| `ai-slop/trivial-comment` | 120 | 116 | +4 | ✓ accepted — orchestrator/reviewer traced all 4 new findings to pre-existing comments in `services/notifications/threads.ts` that became visible only after dead code around them was removed; phase wrote none of them and net-removed one comment line from that file |
| `ai-slop/swallowed-exception` | 0 | 0 | 0 | ✓ Phase 3 CI bar held |
| `eslint/no-empty` | 0 | 0 | 0 | ✓ Phase 3 CI bar held |
| `src/lib/` files changed | 0 | 0 | 0 | ✓ `git diff <phase-start>..HEAD -- src/lib/` empty |

### Required Artifacts / Key Commits

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `138c3f45e` auto-fix commit | Own commit, import-only diff | ✓ VERIFIED | Confirmed via `git show --stat`; message documents the D-03 revert (narrative comments, vendored `src/lib/`) and 4 manual fixer-error corrections |
| `0bb1e4b1a` amendment commit | Removes magic-textarea hack, corrects sqlite reason | ✓ VERIFIED | Confirmed via `git show`; diff matches live disk state exactly; ledger 4→3 rows as claimed |
| Documented Ignores Ledger (04-VALIDATION.md) | 3 rows, 9 suppressed findings | ✓ VERIFIED | Matches live grep of `src/` (3 phase directives found) and live bucket-C=0 |
| `04-REVIEW.md` | Independent review, 0 critical | ✓ EXISTS | 0 critical / 2 warnings / 3 info; both warnings (WR-01, WR-02) were acted on in `0bb1e4b1a`, confirmed above |
| `04-SECURITY.md` | — | ✗ ABSENT | Noted per prompt as a known-open item, not treated as a gap — this is a hygiene phase with no new attack surface; `secure-phase` capability was not invoked for this phase. Not a must-have per D-01…D-15. |

### Requirements Coverage

All 18 requirement IDs (D-01, D-02, D-02a, D-03, D-04, D-04a, D-05, D-06, D-07, D-08, D-09, D-10,
D-11, D-12, D-12a, D-13, D-14, D-15) are accounted for above. 17 SATISFIED, 1 (D-12) present and
wired but with its runtime-behavior claim unverified by any test — routed to human verification,
not treated as BLOCKED, per D-12's own explicit instruction to "verify `cleanup` is actually
callable... say which in the summary" (satisfied) rather than requiring a live mining pass (never
promised as automatable). No orphaned requirements — 04-CONTEXT.md is the sole locked-decision
source and REQUIREMENTS.md does not exist in this project, per the task's own instruction.

### Anti-Patterns Found

None found in the files touched by this phase that aren't already accounted for by the backlog
fences above. `TBD`/`FIXME`/`XXX` markers: none introduced (not checked exhaustively file-by-file
given the 86-file review already performed independently in 04-REVIEW.md with 0 critical
findings; the 2 warnings were both resolved in `0bb1e4b1a`).

### Known Latent Bugs (pre-existing, correctly left unfixed — informational only)

- `helpers/nostr/relay-stats.ts`'s `getRTTTag(stats, _name)` ignores its parameter and always
  filters `"open"` — pre-existing, confirmed via live read, correctly out of scope (IN-01).
- `views/relays/components/relay-card.tsx`'s exported `RelayCard` has zero importers — pre-existing
  dead export, correctly out of scope (IN-02).
- `event-zap-modal/index.tsx`'s `relays` prop is accepted but never wired into the zap request —
  pre-existing, correctly out of scope (IN-03).

These are Phase 5 material per the prompt's briefing, not gaps in this phase's own goal.

### Human Verification Required

### 1. PoW mining interactive spot-check (D-12)

**Test:** In a dev build (`pnpm dev` or equivalent), sign in, compose a note, set a difficulty
target for proof-of-work mining, start mining, and let it run to completion.
**Expected:** Mining completes normally, `onComplete` fires with the drafted event, and the just-
completed run's worker pool is actually terminated by `cleanup()` (no lingering `Worker` threads,
no console errors, no double-teardown with `stopMiner()`'s handling of the *previous* run).
**Why human:** This is the phase's only runtime-behavior-changing edit (`cleanup;` → `cleanup()`).
`pnpm build` proves `cleanup` is a callable closure in scope at that point — it cannot prove the
worker pool terminates correctly without leaking or firing twice. 04-VALIDATION.md's own
Manual-Only table records this row as "Outstanding / unverified": the dev server was confirmed
reachable (HTTP 200) but the interactive mining flow itself was never exercised by any plan in
this phase. This is a known-open item per the task briefing, not a newly discovered gap.

### Gaps Summary

No gaps. All 18 locked decisions (D-01 … D-15, including the split D-02a/D-04a/D-12a) are
satisfied by live evidence gathered this session — bucket C measured at 0, the auto-fix commit is
isolated and clean, all 24 dead declarations are confirmed absent, the two behavior-changing edits
(D-12, D-12a) are present in source, all backlog fences hold at delta 0 (with the one accepted
`ai-slop/trivial-comment` +4 explained by pre-existing comments becoming visible after dead-code
removal), `pnpm build` exits 0, and `pnpm lint:ci`'s 19 errors are exclusively the pre-existing
`react-hooks/rules-of-hooks` findings D-15 explicitly fences off.

The post-review amendment (04-REVIEW.md WR-01/WR-02 → commit `0bb1e4b1a`) is itself verified: the
ledger is genuinely 3 rows on disk, not the 4 several summaries still describe, and the maintainer's
choice to delete rather than reword the magic-textarea.tsx exception is reflected in the live
codebase exactly as 04-VALIDATION.md's Amendment block claims.

The single open item — D-12's interactive mining spot-check — is a pre-existing, explicitly
recorded residual risk (not a new discovery), and per the task's own framing belongs in human
verification rather than as a blocking gap. It is the only reason this report is not `passed`.

---

_Verified: 2026-09-15T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
