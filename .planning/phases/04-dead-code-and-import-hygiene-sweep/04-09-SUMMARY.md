---
phase: 04-dead-code-and-import-hygiene-sweep
plan: 09
subsystem: lint-hygiene
tags: [aislop, eslint, unicorn, typescript-eslint, dead-code]

# Dependency graph
requires:
  - phase: 04-dead-code-and-import-hygiene-sweep
    provides: 04-01's whole-repo import-hygiene auto-fix baseline (line numbers in the plan's measured facts are anchored to that commit)
provides:
  - All nine single-instance bucket-C findings resolved (six mechanical + three judgment-call), zero left un-triaged
  - Confirmation that no new Documented Ignores Ledger row is needed from this plan
affects: [04-11 (ledger consolidation — this plan reports zero new rows)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Array.from<R>({ length: n }) preferred over new Array<R>(n) when every index is explicitly assigned before the array is read"
    - "Default-export bindings shadowing a restricted global (e.g. `Infinity`) can be renamed freely once grep confirms zero importers reference the internal name"

key-files:
  created: []
  modified:
    - src/components/gif/gif-picker-modal.tsx
    - src/views/user/tabs/reactions.tsx
    - src/components/charts/relay-distribution-chart.tsx
    - src/classes/preference-subject.ts
    - src/components/icons/infinity.tsx
    - src/providers/global/napplet-shell-provider.tsx
    - src/views/torrents/index.tsx

key-decisions:
  - "All nine findings resolved by genuine fix; zero rule-scoped ignores added (no new Documented Ignores Ledger rows for 04-11)"
  - "napplet-shell-provider.tsx's new Array<R>(n) replaced with Array.from<R>({length:n}) because mapWithConcurrency's while-loop workers explicitly assign every index before Promise.all resolves, so sparse-vs-dense construction is never observable by the caller"
  - "torrents/index.tsx's tags.length > 0 guard removed because tags is always an array (tagsParam.value?.split(',') ?? []), never nullish, and [].some() already returns false"
  - "icons/infinity.tsx's shadowing const renamed Infinity -> InfinityIcon; grep found zero importers and it's a default export, so no ripple to callers"

patterns-established: []

requirements-completed: [D-01, D-08]

coverage:
  - id: D1
    description: "Six mechanical bucket-C findings removed with no behavioural change: redundant double negation, no-op rename, two unnecessary spreads, two redundant parameter-property assignments"
    requirement: "D-01"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq (scoped to 4 files x 4 rules) -> 0"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false
  - id: D2
    description: "Three judgment-call bucket-C findings (sparse-array construction, nullish-guard length check, shadowed-global rename) resolved by genuine fix after checking behavioural safety; zero ignores added"
    requirement: "D-08"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq (scoped to 3 files x 3 rules) -> 0"
        status: pass
      - kind: other
        ref: "grep -c aislop-ignore across the 3 files -> 0 (confirms no ignore directives added)"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false

duration: ~25min
completed: 2026-09-16
status: complete
---

# Phase 4 Plan 09: Long-tail single-instance bucket-C triage Summary

**All nine remaining single-instance bucket-C findings resolved by genuine mechanical fix across seven files — zero rule-scoped ignores required, so this plan contributes no new rows to the Documented Ignores Ledger.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-09-15T23:50:00Z (approx.)
- **Completed:** 2026-09-16T00:16:44Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Collapsed a redundant `!!` double negation in `gif-picker-modal.tsx`'s ternary condition
- Removed a no-op same-name rename (`{ reaction: reaction }` → `{ reaction }`) in `reactions.tsx`
- Removed two unnecessary array spreads around already-fresh `.map()` results in `relay-distribution-chart.tsx`
- Removed two redundant `this.key = key` / `this.fallback = fallback` assignments in `preference-subject.ts` that duplicated TypeScript's automatic parameter-property assignment
- Renamed the restricted-global-shadowing `Infinity` binding to `InfinityIcon` in `icons/infinity.tsx` after confirming zero importers reference it (default export, no named-import ripple)
- Replaced `new Array<R>(items.length)` with `Array.from<R>({ length: items.length })` in `napplet-shell-provider.tsx`'s `mapWithConcurrency`, after confirming every index is explicitly assigned before the result is read (no sparse-array consumer exists)
- Removed a genuinely redundant `tags.length > 0 &&` guard in `torrents/index.tsx`'s event filter — `tags` is always an array, never nullish, so `[].some()` already covers the empty case

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply the six safe mechanical rewrites** - `3fd1aacc8` (fix)
2. **Task 2: Resolve the three findings whose fix could change behaviour** - `dce715e32` (fix)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/components/gif/gif-picker-modal.tsx` - Collapsed redundant `!!searchRelay` to `searchRelay` in ternary
- `src/views/user/tabs/reactions.tsx` - Removed no-op destructure rename `{ reaction: reaction }` → `{ reaction }`
- `src/components/charts/relay-distribution-chart.tsx` - Removed two unnecessary spreads around `.map()` results
- `src/classes/preference-subject.ts` - Removed two redundant parameter-property re-assignments in constructor
- `src/components/icons/infinity.tsx` - Renamed shadowing binding `Infinity` → `InfinityIcon` (internal + default export)
- `src/providers/global/napplet-shell-provider.tsx` - Replaced `new Array<R>(n)` with `Array.from<R>({length:n})` in `mapWithConcurrency`
- `src/views/torrents/index.tsx` - Removed redundant `tags.length > 0 &&` guard before `tags.some(...)`

## Decisions Made

- All nine findings resolved by genuine fix (a real rewrite), per the plan's stated preference that an ignore is the last resort, not the default. None of the three "needs care" sites turned out to require behaviour-preserving compromise once the actual consumers were traced — the correct fix was safe in every case:
  - `mapWithConcurrency`'s sparse-array concern doesn't materialize because every array index is written via explicit assignment (`results[current] = ...`) inside the concurrency loop, and `Promise.all` only resolves after every worker has drained the shared index counter — the array is fully dense by the time it is read or sent.
  - `torrents/index.tsx`'s length check doesn't guard a nullish value — `tags` is derived via `tagsParam.value?.split(",") ?? []`, which always produces an array — so the check was purely redundant, not a nullish guard.
  - `icons/infinity.tsx`'s shadowing binding has zero importers (confirmed via repo-wide grep) and is exported as a default export, so renaming its internal name changes nothing about the module's external surface.
- Because no ignore was added at any of the three judgment sites, this plan produces **zero new Documented Ignores Ledger rows** — 04-VALIDATION.md's existing four-row ledger (D-09/D-10/D-11×2) is unchanged by this plan, and 04-11 has nothing new to collect from this plan's work.

## Deviations from Plan

None — plan executed exactly as written. All nine sites were resolved by fix, matching the plan's stated preference; no architectural changes, no missing functionality, no blocking issues encountered.

## Issues Encountered

**Plan's `<verify>` jq commands had a scoping bug (fixed at execution time, not a deviation from plan intent):** Both task verify blocks and 04-VALIDATION.md's own quick/full-form commands use the pattern `select(["a","b"]|index(.filePath))`, which is invalid jq — piping an array literal into `index(.filePath)` evaluates `.filePath` against the piped array itself (not the original diagnostic object), producing `jq: error ... Cannot index array with string "filePath"` (exit 5) on every invocation, reproduced with a minimal `echo '[{"filePath":"a"}]' | jq` repro. Ran the semantically equivalent, syntactically correct form instead — `select(.filePath as $f | [...] | index($f))` — for both tasks' verification and the final cross-file check; all returned `0` as required. No source file outside the plan's file list was touched to work around this; it is purely a verification-command authoring issue in the plan/validation docs, left for a future plan to correct in 04-VALIDATION.md and 04-09-PLAN.md's own `<verify>` blocks if desired.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All nine single-instance bucket-C findings named in this plan are confirmed at `0` via scoped rescan across all seven files.
- Zero new ignore directives were added anywhere in this plan's files (`grep -c aislop-ignore` returned `0` in all three judgment-site files), so 04-11's ledger-consolidation work has nothing new to pull from 04-09.
- `pnpm build` passed after both tasks with no new errors; two `ai-slop/trivial-comment` warnings pre-existing in `relay-distribution-chart.tsx` (lines 34/54, predating this plan's spread-removal edit) and seven pre-existing findings elsewhere in the 1000+ line `napplet-shell-provider.tsx` (file-too-large, function-too-long, console-leftover, double-type-assertion×2, unsafe-type-assertion×2) were confirmed unrelated to this plan's one-line edits and left untouched per the out-of-scope rule — they belong to backlog phases 999.8/999.9 and Phase 5/6.

---
*Phase: 04-dead-code-and-import-hygiene-sweep*
*Completed: 2026-09-16*
