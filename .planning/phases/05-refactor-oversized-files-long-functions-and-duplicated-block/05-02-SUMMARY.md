---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 02
subsystem: code-quality
tags: [aislop, lint, dead-code, nostr, torrents, relay-stats, verify-event]

# Dependency graph
requires:
  - phase: 04-dead-code-and-import-hygiene-sweep
    provides: "the deferred getRTTTag parameter-ignoring bug (04-11-SUMMARY.md:202, 04-REVIEW.md IN-01), flagged but left unfixed because relay-stats.ts was already a named Phase 5 target"
provides:
  - "src/helpers/nostr/torrents.ts: one file-level aislop-ignore-file directive clearing all five code-quality/duplicate-block findings in the static torrentCatagories taxonomy"
  - "src/helpers/nostr/relay-stats.ts: reduced to its three live symbols (MONITOR_STATS_KIND, getNetwork, getSupportedNIPs); MONITOR_METADATA_KIND, getRelayURL, RTTValues, getRTTTag, getRTT deleted"
  - "src/services/verify-event.ts: one aislop-ignore-next-line directive justifying the thin-wrapper as load-bearing late-binding indirection, zero behavioural change"
  - "05-BASELINE.md's D-19 per-rule table updated with this plan's measured after-counts (duplicate-block 21->16, thin-wrapper 2->0)"
affects: [05-03, 05-04, 05-05, 05-06, 05-07, 05-08, 05-09, 05-10, 05-11, 05-12, 05-13, 05-14]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "File-level aislop-ignore-file directive for duplicate-block findings inside static data literals, following the src/sw/client/error-logger.ts precedent"
    - "Next-line aislop-ignore-next-line directive justifying a thin-wrapper indirection whose reason states the late-binding/runtime-strategy-swap requirement, following the src/hooks/timeline/use-timeline-cache-key.ts precedent"

key-files:
  created: []
  modified:
    - src/helpers/nostr/torrents.ts
    - src/helpers/nostr/relay-stats.ts
    - src/services/verify-event.ts
    - .planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md

key-decisions:
  - "torrents.ts's five duplicate-block findings cleared with exactly one file-level ignore (D-06); the taxonomy data itself is byte-identical (1 insertion, 0 deletions)"
  - "relay-stats.ts's five dead symbols (MONITOR_METADATA_KIND, getRelayURL, RTTValues, getRTTTag, getRTT) deleted rather than repaired; none had a consumer outside the file itself (D-13)"
  - "The Phase-4-deferred getRTTTag bug (parameter-ignoring, always matched the 'open' rtt tag) is disposed of by deletion, not re-deferred, per D-18 -- there is nothing left to promote to backlog since the only code it lived in is gone"
  - "verify-event.ts's verifyEvent wrapper is kept and ignored-with-reason, not inlined: it indirects over a module-level method the runtime updater reassigns between wasm/internal/fake strategies, so inlining would break the strategy swap (D-14)"

requirements-completed: []

coverage:
  - id: D1
    description: "torrents.ts's five code-quality/duplicate-block findings cleared by one justified file-level ignore, taxonomy data untouched"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq duplicate-block count for helpers/nostr/torrents -> 0"
        status: pass
      - kind: other
        ref: "git diff --numstat src/helpers/nostr/torrents.ts -> 1 insertion, 0 deletions"
        status: pass
    human_judgment: false
  - id: D2
    description: "relay-stats.ts reduced to its three live symbols; five dead symbols deleted with zero remaining repo-wide references; deferred RTT bug disposed of"
    verification:
      - kind: other
        ref: "pnpm build (typecheck across all consumers) -> exit 0"
        status: pass
      - kind: other
        ref: "grep -rn for each of getRelayURL/getRTTTag/MONITOR_METADATA_KIND/RTTValues/getRTT in src -> no matches"
        status: pass
    human_judgment: false
  - id: D3
    description: "verify-event.ts's ai-slop/thin-wrapper finding cleared by a justified next-line ignore stating the late-binding requirement, zero behavioural change"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq findings for services/verify-event.ts -> thin-wrapper absent (only pre-existing console-leftover remains)"
        status: pass
      - kind: other
        ref: "git diff --numstat src/services/verify-event.ts -> 1 insertion, 0 deletions"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-09-24
status: complete
---

# Phase 5 Plan 2: Torrents ignore, relay-stats dead-code deletion, verify-event justification Summary

**Cleared 7 bucket-H findings (33 -> 26): one file-level duplicate-block ignore over a static taxonomy, deletion of relay-stats.ts's dead RTT half (disposing of a Phase-4-deferred bug), and a justified thin-wrapper ignore on the load-bearing verify-event indirection.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-09-24T22:21:37Z
- **Tasks:** 3
- **Files modified:** 4 (3 source files + 1 shared baseline doc)

## Accomplishments
- `src/helpers/nostr/torrents.ts`'s five `code-quality/duplicate-block` findings cleared by a single `aislop-ignore-file` directive; the `torrentCatagories` static taxonomy data is byte-identical (git diff shows exactly 1 insertion, 0 deletions)
- `src/helpers/nostr/relay-stats.ts` reduced from 43 to 12 lines: `MONITOR_METADATA_KIND`, `getRelayURL`, `RTTValues`, `getRTTTag`, and `getRTT` deleted (none had a consumer outside the file); `MONITOR_STATS_KIND`, `getNetwork`, `getSupportedNIPs` kept unchanged, all three confirmed still consumed by `nip66-relay-discovery.ts`, `relay-status-loader.ts`, `hooks/use-relay-stats.ts`, `relay-card.tsx`, and `relay/tabs/about.tsx`
- The Phase-4-deferred `getRTTTag` bug (ignored its `name` parameter, always matched the `"open"` rtt tag, so `getRTT`'s `read`/`write` were silent duplicates of `open`) is disposed of by deletion, per D-18 — nothing left to promote to backlog since the only code it lived in is gone
- `src/services/verify-event.ts`'s `verifyEvent` wrapper kept and justified with a next-line ignore stating the late-binding requirement: it indirects over the module-level `verifyEventMethod`, which `updateVerifyMethod` reassigns at runtime between wasm/internal/fake strategies as the user's preference changes; inlining would break the strategy swap. Diff is exactly 1 insertion, 0 deletions
- Whole-repo bucket-H total fell exactly as predicted, from 33 to 26 (`code-quality/duplicate-block` 21->16, `ai-slop/thin-wrapper` 2->0, the other two rules unchanged); `05-BASELINE.md`'s D-19 per-rule table updated with these measured after-counts
- `pnpm build` exited 0 after every task

## Task Commits

Each task was committed atomically:

1. **Task 1: Annotate the torrent taxonomy with one file-level ignore (D-06)** - `c78e705da` (docs)
2. **Task 2: Delete the dead half of relay-stats and dispose of the deferred RTT bug (D-13, D-18)** - `5ac9e7443` (fix)
3. **Task 3: Justify the load-bearing verify-event wrapper (D-14)** - `f1edd5a7c` (docs)

**Plan metadata:** committed alongside this SUMMARY (see below)

## Files Created/Modified
- `src/helpers/nostr/torrents.ts` - one `aislop-ignore-file code-quality/duplicate-block` directive added above the imports; no other change
- `src/helpers/nostr/relay-stats.ts` - `MONITOR_METADATA_KIND`, `getRelayURL`, `RTTValues`, `getRTTTag`, `getRTT` deleted; `getReplaceableIdentifier` import dropped (no longer referenced); `MONITOR_STATS_KIND`, `getNetwork`, `getSupportedNIPs`, and the `getTagValue`/`NostrEvent` imports kept
- `src/services/verify-event.ts` - one `aislop-ignore-next-line ai-slop/thin-wrapper` directive added immediately above the default export; no behavioural change
- `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md` - D-19 per-rule table's After/Delta cells filled in for `code-quality/duplicate-block` and `ai-slop/thin-wrapper` (this plan's rules); the other two rules left `TBD` for later plans

## Decisions Made
- torrents.ts: one file-level ignore, not five line-scoped directives, per D-06 (the flagged lines sit deep inside a nested object literal where line-comment placement is fragile) — followed the `src/sw/client/error-logger.ts` file-level precedent exactly
- relay-stats.ts: delete-not-repair for all five dead symbols per D-13 — fixing unverifiable, zero-consumer code would re-introduce dead code Phase 4 just swept
- verify-event.ts: ignore-with-reason, not inline, per D-14 — the reason states the late-binding requirement (why the fix couldn't be applied instead of just asserting intent), satisfying D-08's justification bar
- Kept `getTagValue` and the `nostr-tools` `NostrEvent` import in relay-stats.ts since the two surviving functions still use them; only `getReplaceableIdentifier` (used solely by the deleted `getRelayURL`) was dropped, avoiding a fresh unused-import finding in a file this plan touches

## Deviations from Plan

None — plan executed exactly as written. Two measured-fact discrepancies in the plan's own acceptance-criteria commands were found and are recorded here as documentation gaps (not regressions), per the project's re-measure-don't-trust-written-counts convention (D-02 from Phase 4):

1. **[Documentation gap] `grep -c 'getTagValue' src/helpers/nostr/relay-stats.ts` returns 2, not the plan's predicted 1.** The string legitimately appears on two lines — the import statement and the one usage inside `getNetwork` — both expected and correct. The companion assertion (`getReplaceableIdentifier` returns 0) passed exactly as predicted.
2. **[Documentation gap] The plan's consumer-grep pattern `from "./verify-event"\|from "../services/verify-event"` does not match the napplet shell provider's actual import path.** `providers/global/napplet-shell-provider.tsx` is two directory levels deep and imports via `from "../../services/verify-event"`, which the plan's regex doesn't cover. Confirmed by direct grep that the import is present and unchanged; `pnpm build`'s successful typecheck independently proves this consumer still resolves. `services/event-store.ts`'s import matched the plan's pattern exactly.

Neither discrepancy affected any file change, any deletion, or the pass/fail outcome of any acceptance criterion's actual intent — both are grep-pattern/prediction gaps in the plan text, not bugs in the code.

## Issues Encountered
The PostToolUse aislop hook's feedback after Task 3's edit initially listed `ai-slop/thin-wrapper` as a finding on the newly-edited line, which looked like the ignore directive wasn't taking effect. A direct `pnpm exec aislop scan --json .` run immediately after confirmed the finding was actually cleared (only the pre-existing, out-of-scope `ai-slop/console-leftover` on line 61 remained) — the hook's snapshot was stale relative to the final file state. No code change was needed; this is noted here so a future executor isn't misled by the same transient hook output.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Wave 1's remaining low-risk items (the D-05 borderline duplicate-block/function-too-long ignores in 05-03) and Wave 2's small extractions can proceed independently — this plan had no dependencies and none of its deletions or ignores touch files any later plan modifies. `05-BASELINE.md`'s per-rule table now carries real after-counts for `code-quality/duplicate-block` and `ai-slop/thin-wrapper`; `complexity/function-too-long` and `complexity/file-too-large` remain `TBD` for the plans that touch those rules (05-07 through 05-12).

---
*Phase: 05-refactor-oversized-files-long-functions-and-duplicated-block*
*Completed: 2026-09-24*

## Self-Check: PASSED

- FOUND: `src/helpers/nostr/torrents.ts`
- FOUND: `src/helpers/nostr/relay-stats.ts`
- FOUND: `src/services/verify-event.ts`
- FOUND: `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-02-SUMMARY.md`
- FOUND commit `c78e705da` (Task 1)
- FOUND commit `5ac9e7443` (Task 2)
- FOUND commit `f1edd5a7c` (Task 3)
