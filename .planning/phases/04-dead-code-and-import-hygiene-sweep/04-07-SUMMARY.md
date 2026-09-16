---
phase: 04-dead-code-and-import-hygiene-sweep
plan: 07
subsystem: lint-hygiene
tags: [aislop, eslint, sqlite, react-hook-form, capacitor]

# Dependency graph
requires:
  - phase: 04-dead-code-and-import-hygiene-sweep
    provides: 04-01's whole-repo import-hygiene auto-fix pass (this plan's directive on magic-textarea.tsx depends on that auto-fixer's existence to justify why the retention expression must be ignored rather than removed)
provides:
  - The phase's four Documented Ignores Ledger rows, each with a why-not-fixed reason
  - Deletion of the one genuinely dead binding (`dbName`) in the sqlite module
affects: [04-11 (phase closeout / before-after report), 04-VALIDATION.md's Documented Ignores Ledger]

# Tech tracking
tech-stack:
  added: []
  patterns: [rule-scoped aislop-ignore directives naming multiple rules on one directive line]

key-files:
  created: []
  modified:
    - src/services/sqlite/index.ts
    - src/components/magic-textarea.tsx
    - src/components/post-modal/index.tsx
    - src/views/new/note/short-text-form.tsx

key-decisions:
  - "src/services/sqlite/index.ts gets one file-level aislop-ignore-file directive naming both eslint/no-unreachable and ai-slop/unreachable-code (D-09); confirmed a single directive can name two space-separated rules by reading aislop's own suppress.ts token parser, so no fallback to two separate directives was needed"
  - "magic-textarea.tsx's [Textarea, Input]; retention expression is ignored (not deleted) via aislop-ignore-next-line eslint/no-unused-expressions (D-10); its previously-unowned unused `data` loading-component parameter is now underscore-prefixed, confirmed contract-bound via the library's own type declaration (Component<{ data: TItem[] | Promise<TItem[]> }>)"
  - "post-modal/index.tsx and short-text-form.tsx each get a distinct-prose aislop-ignore-next-line eslint/no-unused-expressions above their formState.isDirty; read (D-11), since both are react-hook-form getter subscriptions with no type error on removal"
  - "The dead dbName local in sqlite's deleteDatabase was deleted, not exempted, per D-09's explicit carve-out (D-07)"

requirements-completed: [D-06, D-07, D-08, D-09, D-10, D-11]

coverage:
  - id: D1
    description: "sqlite web-guard block (D-09): file-level ignore naming eslint/no-unreachable + ai-slop/unreachable-code; dead dbName binding deleted"
    requirement: "D-09"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq (scoped to src/services/sqlite/index.ts, rules eslint/no-unreachable, ai-slop/unreachable-code, eslint/no-unused-vars Variable) -> 0"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false
  - id: D2
    description: "magic-textarea.tsx import-retention expression ignored (D-10); unused data param underscore-prefixed (D-06)"
    requirement: "D-10"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq (scoped to magic-textarea.tsx/post-modal/index.tsx/short-text-form.tsx, rules eslint/no-unused-expressions, eslint/no-unused-vars Parameter) -> 0"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false
  - id: D3
    description: "post-modal/index.tsx and short-text-form.tsx formState.isDirty; reads ignored with distinct why-not-fixed reasons (D-11)"
    requirement: "D-11"
    verification:
      - kind: other
        ref: "grep for aislop-ignore-next-line eslint/no-unused-expressions in both files -> 1 each, reasons confirmed non-identical by direct comparison"
        status: pass
    human_judgment: true
    rationale: "D-08's bar (does the prose justify why the code could not be fixed instead, not merely that it's deliberate) is a manual review standard aislop's rescan cannot judge — 04-VALIDATION.md's Manual-Only Verifications table names this exact check for phase closeout (04-11)."

# Metrics
duration: ~25min
completed: 2026-09-16
status: complete
---

# Phase 4 Plan 07: Documented ignore exceptions Summary

**Four rule-scoped aislop-ignore directives (sqlite web-guard, import-retention hack, two react-hook-form dirty-state reads) plus one genuine dead-code deletion, closing out the phase's Documented Ignores Ledger**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-09-16
- **Tasks:** 2 completed
- **Files modified:** 4

## Accomplishments
- Added a file-level `aislop-ignore-file eslint/no-unreachable ai-slop/unreachable-code` directive to `src/services/sqlite/index.ts`, covering the jeep-sqlite web-init block that sits below a deliberate guard `throw` (D-09); confirmed the two-rule single-directive syntax works by reading aislop's own suppression-token parser (`suppress.ts`'s `parseDirective`, which splits on whitespace before `--` into a `Set<rule>`) rather than assuming it, so no fallback to two separate directives was needed
- Deleted the genuinely dead `dbName` local inside `deleteDatabase` — explicitly carved out of D-09's exception (D-07)
- Added a distinct `aislop-ignore-next-line eslint/no-unused-expressions` directive above `magic-textarea.tsx`'s `[Textarea, Input];` retention expression (D-10), and underscore-prefixed its unrelated unused `data` loading-component parameter after confirming via the library's own `.d.ts` (`Component<{ data: TItem[] | Promise<TItem[]> }>`) that the parameter is contract-bound, not freely deletable (D-06)
- Added two more `aislop-ignore-next-line eslint/no-unused-expressions` directives, one above each `formState.isDirty;` read in `post-modal/index.tsx` and `short-text-form.tsx` (D-11), each with its own why-not-fixed prose so the two reasons are not identical
- Confirmed rule-scoping is not a blanket suppression: `src/services/sqlite/index.ts` still reports its pre-existing, out-of-scope `ai-slop/trivial-comment` finding after the file-level directive lands

## Task Commits

1. **Task 1: Ignore the sqlite web-guard block and delete its dead dbName binding** - `bec32eca1` (fix)
2. **Task 2: Ignore the import-retention hack and the two form-subscription reads** - `cfa629341` (fix)

**Plan metadata:** committed in the orchestrator's post-wave shared-file commit (this plan ran in worktree isolation; STATE.md/ROADMAP.md are not touched here)

## Files Created/Modified
- `src/services/sqlite/index.ts` - file-level ignore directive (D-09) on the jeep-sqlite web-init block; deleted the dead `dbName` local (D-07)
- `src/components/magic-textarea.tsx` - next-line ignore directive (D-10) above `[Textarea, Input];`; `data` param underscore-prefixed (D-06)
- `src/components/post-modal/index.tsx` - next-line ignore directive (D-11) above `formState.isDirty;`
- `src/views/new/note/short-text-form.tsx` - next-line ignore directive (D-11) above `formState.isDirty;`

## Decisions Made
- Verified the two-rule file-level directive syntax empirically (via source read of aislop's `suppress.ts`, then confirmed live with a rescan) instead of assuming it from the plan's measured-facts — both `eslint/no-unreachable` and `ai-slop/unreachable-code` are suppressed by one directive line, so the six-line six-comment fallback described in the plan's action text was never needed.
- `magic-textarea.tsx`'s unused `data` parameter was underscore-prefixed rather than deleted, since the library's `loadingComponent` prop type (`Component<{ data: TItem[] | Promise<TItem[]> }>`) is a single-field object — the parameter cannot be dropped from the destructure without breaking the signature contract (D-06's contract-bound case).
- Line numbers in the plan's measured-facts (sqlite lines 9-15, magic-textarea line 25, post-modal line 102, short-text-form line 98) had already shifted by execution time (post-modal to 101, short-text-form to 97) from earlier phase edits — located every site by its code shape, exactly as the plan's measured-facts section instructed, not by line number.

## Deviations from Plan

None - plan executed exactly as written. No fifth ignore site was discovered; the four ledger rows match the plan's Documented Ignores Ledger exactly.

## Issues Encountered

The worktree had no `node_modules` installed at spawn time (this worktree was created fresh, isolated from the main checkout's install). Ran `pnpm install --frozen-lockfile` before any verification step — it resolved instantly against the shared pnpm content-addressable store, so this added no meaningful time and produced no lockfile changes. `node_modules/` remains gitignored and untouched in git status throughout.

The PostToolUse aislop hook's per-edit feedback lagged behind the on-disk suppression state twice during Task 1 (it reported `ai-slop/unreachable-code` at line 10 as a live finding immediately after the file-level ignore directive was added, and again after the `dbName` deletion). Both times a direct `pnpm exec aislop scan --json .` rescan confirmed the finding was actually suppressed — the hook's feedback is a same-turn heuristic, not the ledger's authoritative signal, so the plan's own `<verify>` jq commands (run directly, not via the hook) were used as the actual gate, per 04-VALIDATION.md's pitfall about not trusting anything but a real rescan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All four Documented Ignores Ledger rows in `04-VALIDATION.md` now exist in code with reasons meeting D-08's why-not-fixed bar. 04-11 (phase closeout) can cross-check these four sites' prose against the bar and build the phase's before/after bucket-C count — this plan's sites are load-bearing exceptions, not additional zero-count progress, and should be excluded from any "findings fixed" tally.

---
*Phase: 04-dead-code-and-import-hygiene-sweep*
*Completed: 2026-09-16*
