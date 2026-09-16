---
phase: 04-dead-code-and-import-hygiene-sweep
plan: 01
subsystem: infra
tags: [aislop, eslint, imports, dead-code, typescript]

# Dependency graph
requires:
  - phase: 02-aislop-adoption
    provides: aislop 0.16.1 pinned devDependency, .aislop/config.yml rule policy, CI gate
provides:
  - "97-file mechanical import-cleanup commit (85 unused-import + 47 duplicate-import bucket-C findings)"
  - "wallets.ts duplicate-import merge as a separate hand-applied commit"
  - "Measured wave-1 bucket-C baseline (417) and post-fix total (155), reconciled per rule"
  - "Lists of surviving import/no-duplicates and unused-vars-import files for 04-10"
affects: [04-02, 04-03, 04-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "aislop fix --safe . run, then every out-of-scope change (vendored src/lib/, the 6 narrative-comment files) reverted with git checkout -- before staging, so the fixer's own scope creep never lands"
    - "Duplicate-import merges verified against pnpm exec tsc --noEmit rather than trusted blindly — the fixer's merge logic can drop a still-used specifier"

key-files:
  created: []
  modified:
    - "97 files across src/**/*.ts, src/**/*.tsx (import-line changes only, see Task Commits)"
    - "src/services/wallets.ts (hand-applied duplicate-import merge)"

key-decisions:
  - "Reverted 4 additional duplicate-import merges the fixer produced incorrectly (not just the plan's named wallets.ts case) after pnpm exec tsc --noEmit surfaced them as the only build breaks from the fixer run"
  - "ConnectionState in outbox-relay-selection-modal.tsx confirmed genuinely unused pre-fixer via git show HEAD; only that specifier was dropped, connections$ was restored since it is used at two call sites"

patterns-established:
  - "Verify aislop fix --safe output with a full pnpm exec tsc --noEmit pass before committing, not just the scoped jq rescan — the scoped rescan cannot detect a merge that silently drops a used specifier"

requirements-completed: [D-02, D-02a, D-03, D-04, D-04a]

coverage:
  - id: D1
    description: "132 auto-fixable bucket-C findings (85 unused imports, 47 duplicate imports) applied as one reviewable commit touching import lines only"
    requirement: "D-04"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq bucket-C unused-import/duplicate-import counts both 0; git diff -U0 reviewed for non-import hunks"
        status: pass
    human_judgment: false
  - id: D2
    description: "No vendored file under src/lib/ modified, despite the fixer ignoring the config exclude list"
    requirement: "D-03"
    verification:
      - kind: other
        ref: "git status --short src/lib/ | wc -l -> 0 after every fixer run"
        status: pass
    human_judgment: false
  - id: D3
    description: "No narrative-comment finding swept in; backlog 999.8 untouched at 21 findings"
    requirement: "D-03"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq ai-slop/narrative-comment count -> 21 (unchanged from pre-fixer baseline)"
        status: pass
    human_judgment: false
  - id: D4
    description: "wallets.ts duplicate applesauce-common/helpers import merged by hand in its own commit, 6 banner comments preserved"
    requirement: "D-04"
    verification:
      - kind: other
        ref: "jq scoped to wallets.ts: import/no-duplicates + ai-slop/duplicate-import + ai-slop/unused-import -> 0; narrative-comment -> 6; git diff HEAD~1 confined to import block"
        status: pass
    human_judgment: false
  - id: D5
    description: "Bucket-C baseline re-measured at execution time (417) rather than trusted from ROADMAP; post-fix total (155) recorded with per-rule reconciliation"
    requirement: "D-02, D-02a"
    verification:
      - kind: other
        ref: "Quick-run jq count before (417) and after (155) both captured this session; per-rule table below sums to both"
        status: pass
    human_judgment: false
  - id: D6
    description: "Unsafe aislop fix plan never run"
    requirement: "D-04a"
    verification:
      - kind: other
        ref: "Only `pnpm exec aislop fix --safe .` invoked this session; transcript contains no bare `aislop fix`"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-09-16
status: complete
---

# Phase 04 Plan 01: Bucket-C Auto-Fix Sweep Summary

**Applied aislop's safe auto-fixer for 85 unused-import and 47 duplicate-import bucket-C findings across 97 files, reverting every out-of-scope edit (vendored src/lib/, 6 narrative-comment files) and hand-fixing 4 build-breaking duplicate-import merges the fixer got wrong before either commit landed.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-09-15T23:47:25Z
- **Completed:** 2026-09-16T00:00:13Z
- **Tasks:** 3
- **Files modified:** 98 (97 in the mechanical commit + wallets.ts in the follow-up)

## Accomplishments
- Ran `pnpm exec aislop fix --safe .`, then reverted vendored `src/lib/qrcodegen.ts` and all six narrative-comment-contaminated files (`webxdc.tsx`, `game-controls.tsx`, `signin/connect/index.tsx`, `webxdc-player.tsx`, `pending-unlock.ts`, `wallets.ts`) before staging anything, per D-03/D-04
- Discovered and fixed 4 duplicate-import merges the fixer applied incorrectly — dropping a still-used specifier instead of keeping both — confirmed as the only build breaks via `pnpm exec tsc --noEmit`, and fixed inline (Rule 1 — auto-fix bug) so the commit does not land broken
- Re-applied wallets.ts's one legitimate duplicate-import fix by hand in a separate commit, preserving its 6 banner comments and 2 dead constants untouched
- Measured and recorded the full fifteen-row bucket-C before/after table; post-fix total (155) matches research's prediction exactly

## Task Commits

1. **Task 1: Run the safe auto-fix and revert everything outside bucket C** - `138c3f45e` (fix)
2. **Task 2: Re-apply the wallets.ts duplicate-import merge by hand** - `63b756dc4` (fix)
3. **Task 3: Record the wave-1 per-rule before/after measurement** - no commit (measurement only, no source edits per plan instruction)

**Plan metadata:** (this SUMMARY commit)

## Files Created/Modified
- 97 files across `src/**/*.ts` / `src/**/*.tsx` — import-line-only changes (unused-import removal, duplicate-import merge) from `aislop fix --safe .`
- `src/services/wallets.ts` — hand-merged `parseBolt11`, `parseLNURLOrAddress`, and `type EncryptedContentCache` into one `applesauce-common/helpers` import statement

## Decisions Made
- Task 1's revert list (6 named files + `src/lib/`) was treated as a floor, not a closed set, per the plan's explicit instruction — reviewing the full `git diff -U0` after reverting confirmed no seventh contaminated file existed (no comment-only hunks survived in any of the remaining 97 files)
- Rather than trusting the scoped jq bucket-C rescan alone (which cannot detect a merge that silently drops a used specifier), ran a full `pnpm exec tsc --project tsconfig.json --noEmit` after the fixer run and before committing — this is what surfaced the 4 broken merges
- `ConnectionState` in `outbox-relay-selection-modal.tsx` was confirmed genuinely unused via `git show HEAD` (i.e., unused even before the fixer touched the file) — only that specifier was dropped from the restored import; `connections$` was kept since it is called at two call sites in the file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 4 duplicate-import merges that dropped a still-used specifier**
- **Found during:** Task 1 (running the safe auto-fix)
- **Issue:** The plan named `wallets.ts` as the one file where the fixer's duplicate-import merge needed hand re-application after a wholesale revert. During verification, `pnpm exec tsc --noEmit` surfaced 13 compile errors across 4 additional files where the fixer's merge of two `applesauce-react/hooks` imports (or, in one case, a full deletion of a `../services/pool` import) dropped a specifier that is genuinely used elsewhere in the file:
  - `src/views/feeds/outboxes/outbox-feed.tsx` — merge of `useActiveAccount`/`use$` dropped `use$` (used twice)
  - `src/views/new/note/short-text-form.tsx` — same pattern, `use$` used once
  - `src/views/settings/post/index.tsx` — same pattern, `use$` used twice
  - `src/components/outbox-relay-selection-modal.tsx` — the fixer deleted the entire `import { connections$, ConnectionState } from "../services/pool";` line as "unused"; `connections$` is used at two call sites, only `ConnectionState` (confirmed via `git show HEAD`) was genuinely unused
- **Fix:** Restored the dropped-but-used specifier in each of the 4 files, keeping the correctly-removed specifier (`ConnectionState`, `Text` in outbox-feed.tsx) gone
- **Files modified:** `src/views/feeds/outboxes/outbox-feed.tsx`, `src/views/new/note/short-text-form.tsx`, `src/views/settings/post/index.tsx`, `src/components/outbox-relay-selection-modal.tsx` (all within Task 1's 97-file commit)
- **Verification:** `pnpm exec tsc --project tsconfig.json --noEmit` and `pnpm build` both exit 0 after the fix; re-confirmed `ai-slop/unused-import` and `ai-slop/duplicate-import` both still read 0
- **Committed in:** `138c3f45e` (part of Task 1's commit — these fixes landed in the same commit since they correct the fixer's own output before it was ever staged)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug), covering 4 files
**Impact on plan:** Necessary for correctness — without this fix the mechanical commit would have shipped a broken build. No scope creep: all 4 fixes are strictly import-line corrections within files the fixer had already touched, not new files brought into scope.

## Issues Encountered
None beyond the deviation above.

## Wave 1 Before/After Measurement (Task 3)

Baseline captured before running the fixer; post-fix measured after both Task 1 and Task 2 committed. Scan re-run live this session at `aislop@0.16.1`.

| Rule | Before | After |
|------|-------:|------:|
| `eslint/no-unused-vars` | 208 | 125 |
| `ai-slop/unused-import` | 85 | 0 |
| `import/no-duplicates` | 51 | 4 |
| `ai-slop/duplicate-import` | 47 | 0 |
| `eslint/no-unreachable` | 9 | 9 |
| `eslint/no-unused-expressions` | 6 | 6 |
| `unicorn/no-useless-spread` | 2 | 2 |
| `typescript/no-unnecessary-parameter-property-assignment` | 2 | 2 |
| `ai-slop/unreachable-code` | 1 | 1 |
| `ai-slop/empty-function` | 1 | 1 |
| `eslint/no-extra-boolean-cast` | 1 | 1 |
| `eslint/no-shadow-restricted-names` | 1 | 1 |
| `eslint/no-useless-rename` | 1 | 1 |
| `unicorn/no-new-array` | 1 | 1 |
| `unicorn/no-useless-length-check` | 1 | 1 |
| **Total (bucket-C)** | **417** | **155** |

The measured post-fix total is **155**, exactly matching 04-RESEARCH.md's prediction. Both `ai-slop/unused-import` and `ai-slop/duplicate-import` dropped to 0 as expected; `eslint/no-unused-vars` dropped by 83 (208 → 125) rather than the full 85, and `import/no-duplicates` dropped by 47 (51 → 4) rather than the full 51 — the overlap between these ESLint rules and the two `ai-slop/*` rules means the same line can satisfy more than one rule, so the drop is not a simple 1:1 subtraction (D-02a). This is not a defect.

`ai-slop/swallowed-exception` confirmed still `0` at every severity — Phase 3's bar remains intact.

**Files still reporting `import/no-duplicates`** (the 4 straddling the external/internal import boundary, 04-10's work):
- `src/components/embed-event/card/embedded-zap-receipt.tsx`
- `src/components/layout/presets/app-tabs-layout.tsx`
- `src/components/timeline/highlight.tsx`
- `src/views/badges/badge-details.tsx`

**Files still reporting an `eslint/no-unused-vars` finding whose message references an unused import** (20 files, 04-10's work):
- `src/components/app-handler-modal/index.tsx`
- `src/components/content/components/nip.tsx`
- `src/components/embed-event/card/embedded-dvm.tsx`
- `src/components/outbox-relay-selection-modal.tsx`
- `src/services/notifications/zaps.ts`
- `src/views/articles/components/article-tags.tsx`
- `src/views/emojis/pack/index.tsx`
- `src/views/feeds/dvm/index.tsx`
- `src/views/feeds/outboxes/outbox-feed.tsx`
- `src/views/feeds/relays/relay-feed.tsx`
- `src/views/home/index.tsx`
- `src/views/messages/components/inboxes-status-section.tsx`
- `src/views/messages/inbox/components/locked-messages.tsx`
- `src/views/settings/outbox-selection/components/relay-count-row.tsx`
- `src/views/settings/profile/components/profile-edit-form.tsx`
- `src/views/settings/relays/components/relay-control.tsx`
- `src/views/support/components/other-zap.tsx`
- `src/views/thread/components/tabs/zaps.tsx`
- `src/views/torrents/components/torrent-menu.tsx`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Wave 1's post-fix tree (155 bucket-C findings remaining) is the verified starting point for every later wave in this phase, including 04-10's residual `import/no-duplicates` and unused-import cleanup
- `pnpm build` and `pnpm exec tsc --noEmit` both pass cleanly on the current tree
- No blockers for 04-02/04-03

---
*Phase: 04-dead-code-and-import-hygiene-sweep*
*Completed: 2026-09-16*
