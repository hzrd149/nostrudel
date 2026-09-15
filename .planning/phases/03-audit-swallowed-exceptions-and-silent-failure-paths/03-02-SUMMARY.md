---
phase: 03-audit-swallowed-exceptions-and-silent-failure-paths
plan: 02
subsystem: code-quality
tags: [aislop, error-handling, swallowed-exception, parse-guards, typescript]

# Dependency graph
requires:
  - phase: 03-01
    provides: Wave-1 decryption/signer remedies establishing the log-vs-return-explicit conventions this plan builds on
provides:
  - Thirteen parse/filter/loop catch sites rewritten to the D-05 default remedy (bare catch + reason comment + explicit exit statement)
  - Confirmation that all thirteen sites carry zero error-severity ai-slop/swallowed-exception or ai-slop/silent-recovery findings
affects: [03-03, 03-04, 03-05, 03-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-05 parse-guard remedy: bare `catch {}` (D-06, drops unused binding) + reason comment naming what failed and what the caller does with the absent value (D-08) + an exit statement (return/continue) that reproduces the exact value the site's fall-through already produced"
    - "Reducer callbacks must return the accumulator (not `undefined`) from a catch to avoid a DoS-class crash on the next iteration (T-03-06)"

key-files:
  created: []
  modified:
    - src/helpers/parse.ts
    - src/helpers/nip19.ts
    - src/components/content/transform/bip-notation.ts
    - src/components/content/transform/nip-notation.ts
    - src/helpers/nostr/goal.ts
    - src/hooks/use-open-graph-data.ts
    - src/views/tools/event-publisher/index.tsx
    - src/views/wallet/components/receive-token-modal.tsx
    - src/views/streams/stream/components/stream-top-zappers.tsx
    - src/components/app-handler-modal/index.tsx
    - src/components/relay-url-input.tsx
    - src/views/lists/components/list-history-modal.tsx
    - src/views/settings/cache/database/components/import-events-button.tsx

key-decisions:
  - "All thirteen sites use the exact exit statement from the plan's remedy table; no site added logging (pure parse/filter guards don't warrant it per D-05 default)"
  - "stream-top-zappers.tsx reduce catch returns `dir` (the accumulator), not a bare `return;`, per T-03-06 mitigation — verified by an acceptance-criteria grep count"
  - "import-events-button.tsx's `Imported ${events.length} events` alert text was left unchanged; making the skipped-line count honest is an explicitly deferred idea in CONTEXT.md, not this plan's scope"
  - "relay-url-input.tsx's existing reason comment ('Ignore invalid URLs, let form validation handle them') was kept verbatim and only the exit statement was added — this was the site research flagged as the trap case (a good comment alone does not clear the rule)"
  - "list-history-modal.tsx's existing reason comment was extended to also state the row stays locked, satisfying D-08's 'what the caller does with the absent value' half; its finally block (clears unlockingIds) is unchanged and still runs on the new explicit return"

patterns-established: []

requirements-completed: [D-01, D-05, D-06, D-08]

coverage:
  - id: D1
    description: "Six parse guards in helpers/hooks/content-transforms (parse.ts, nip19.ts, bip-notation.ts, nip-notation.ts, goal.ts, use-open-graph-data.ts) rewritten to bare catch + reason comment + explicit exit statement matching their prior fall-through value"
    requirement: "D-05"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq filter on the six file paths for ai-slop/swallowed-exception|ai-slop/silent-recovery error severity — returns 0"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false
  - id: D2
    description: "Seven filter/loop guards in views/components (event-publisher, receive-token-modal, stream-top-zappers, app-handler-modal, relay-url-input, list-history-modal, import-events-button) rewritten to bare catch + reason comment + explicit exit statement, preserving reducer accumulator semantics, loop continuation, and finally-block cleanup"
    requirement: "D-06"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq filter on the seven file paths for ai-slop/swallowed-exception|ai-slop/silent-recovery error severity — returns 0"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-09-15
status: complete
---

# Phase 03 Plan 02: Parse/filter guard remedies for thirteen catch sites Summary

**Thirteen parse/filter/loop catch blocks converted to bare `catch {}` with a D-08 reason comment plus an explicit exit statement reproducing the pre-edit fall-through value — zero behavior change, zero new error-severity findings.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-09-15T14:29:43Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Applied the D-05 default parse-guard remedy (bare `catch {}` + reason comment + explicit exit) to all thirteen sites named in the plan's remedy table, exactly as specified
- `stream-top-zappers.tsx`'s reduce accumulator returns `dir` from the catch (not `undefined`), avoiding the DoS-class crash the plan's threat register (T-03-06) called out
- `import-events-button.tsx`'s per-line JSON parse guard now `continue`s the loop explicitly, without touching the deferred "honest skipped-line count" idea
- `list-history-modal.tsx`'s unlock catch adds an explicit `return;` while its `finally` block (clearing `unlockingIds`) is left untouched and still executes
- `relay-url-input.tsx` — the plan's flagged "trap case" (a good reason comment alone did not clear the rule) — kept its existing comment and gained the missing `return;`
- Confirmed via `pnpm exec aislop scan --json .` that all thirteen files contribute zero error-severity `ai-slop/swallowed-exception`/`ai-slop/silent-recovery` findings, and `pnpm build` passed after each task

## Task Commits

1. **Task 1: Parse guards in helpers, content transforms and hooks (6 files)** - `b188fe526` (fix)
2. **Task 2: Filter and loop guards in views and components (7 files)** - `fb3d77f59` (fix)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/helpers/parse.ts` — `safeUrl` bare-catch, `return undefined;`
- `src/helpers/nip19.ts` — `safeDecode` bare-catch, `return undefined;`
- `src/components/content/transform/bip-notation.ts` — transformer catch, `return false;`
- `src/components/content/transform/nip-notation.ts` — transformer catch, `return false;`
- `src/helpers/nostr/goal.ts` — `safeValidateGoal` catch, `return false;`
- `src/hooks/use-open-graph-data.ts` — fetch/parse catch, `return null;`
- `src/views/tools/event-publisher/index.tsx` — `useEffect` catch, `return;`
- `src/views/wallet/components/receive-token-modal.tsx` — `normalizeToken` catch, `return trimmed;`
- `src/views/streams/stream/components/stream-top-zappers.tsx` — reduce catch, `return dir;` (accumulator)
- `src/components/app-handler-modal/index.tsx` — filter catch, `return false;`
- `src/components/relay-url-input.tsx` — `normalizeValue` catch, `return;` (kept existing comment)
- `src/views/lists/components/list-history-modal.tsx` — `unlock` catch, `return;` (finally block preserved)
- `src/views/settings/cache/database/components/import-events-button.tsx` — per-line JSON parse catch, `continue;`

## D-04 remedy table (exit statement landed at each site)

| File | Catch site | Exit statement landed |
|------|-----------|------------------------|
| src/helpers/parse.ts | `safeUrl` | `return undefined;` |
| src/helpers/nip19.ts | `safeDecode` | `return undefined;` |
| src/components/content/transform/bip-notation.ts | transformer callback | `return false;` |
| src/components/content/transform/nip-notation.ts | transformer callback | `return false;` |
| src/helpers/nostr/goal.ts | `safeValidateGoal` | `return false;` |
| src/hooks/use-open-graph-data.ts | fetch/parse callback | `return null;` |
| src/views/tools/event-publisher/index.tsx | `useEffect` body | `return;` |
| src/views/wallet/components/receive-token-modal.tsx | `normalizeToken` | `return trimmed;` |
| src/views/streams/stream/components/stream-top-zappers.tsx | `reduce` callback | `return dir;` (accumulator) |
| src/components/app-handler-modal/index.tsx | `.filter()` callback | `return false;` |
| src/components/relay-url-input.tsx | `normalizeValue` | `return;` |
| src/views/lists/components/list-history-modal.tsx | `unlock` useCallback | `return;` (finally still runs) |
| src/views/settings/cache/database/components/import-events-button.tsx | per-line JSON.parse loop | `continue;` |

## Decisions Made

- Used the plan's exact remedy table for every exit statement — no discretion needed since the plan fully specified each site's correct value.
- Did not add logging to any of the thirteen sites; the plan explicitly calls these pure parse/filter guards where an explicit return is the D-05 default and a log is not warranted.
- Left `bip-notation.ts`/`nip-notation.ts` as two separate near-identical files rather than merging them — deduplication is explicitly Phase 5's concern, not this plan's.

## Deviations from Plan

None - plan executed exactly as written. Three pre-existing aislop findings surfaced by the PostToolUse hook after edits (`complexity/function-too-long` in `event-publisher/index.tsx`, `ai-slop/unused-import` for `ExternalLinkIcon` in `app-handler-modal/index.tsx`, `code-quality/duplicate-block` in `list-history-modal.tsx`) were confirmed via a stash-and-rescan comparison to already exist before this plan's edits (line counts/detail matched pre-edit state, e.g. `EventPublisherPage` was already 213 lines against the same 160-line threshold before this plan added 3 lines). Per `.claude/CLAUDE.md`, hook findings not introduced by this plan's own changes are out of scope and belong to backlog phases 999.2–999.10 — left untouched.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- This plan's 13 files each contribute zero error-severity bucket-B findings; combined with 03-01's five files, 18 of the 31 whole-repo errors are now cleared (exact current whole-repo total not re-measured here per the plan's explicit instruction not to assert on it, since 03-03/03-04/03-05 run concurrently).
- Plan 03-06 can cite this SUMMARY's remedy table directly for its D-04 aggregation.
- No blockers for sibling wave-2 plans (03-03, 03-04, 03-05); this plan touched only its own thirteen files.

---
*Phase: 03-audit-swallowed-exceptions-and-silent-failure-paths*
*Completed: 2026-09-15*

## Self-Check: PASSED

All 13 modified files confirmed present on disk. All 2 task commits (`b188fe526`, `fb3d77f59`) plus the SUMMARY docs commit (`2f385a24c`) confirmed present in git log.
