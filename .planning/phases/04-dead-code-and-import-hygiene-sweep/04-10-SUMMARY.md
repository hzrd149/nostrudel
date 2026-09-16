---
phase: 04-dead-code-and-import-hygiene-sweep
plan: 10
subsystem: code-quality
tags: [eslint, import-hygiene, aislop, typescript]

# Dependency graph
requires:
  - phase: 04-dead-code-and-import-hygiene-sweep
    provides: "Waves 2 and 3's dead-code deletions, which this plan sweeps for orphaned imports"
provides:
  - "Zero unused imports and zero duplicate imports anywhere in src/ (bucket-C import findings)"
  - "A measured, execution-time-derived list of every residual unused-import site the auto-fixer could not reach"
affects: [04-11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Duplicate-import merges collapse into the earlier occurrence only, never reordering or regrouping other imports (CONVENTIONS.md § Import Organization)"

key-files:
  created: []
  modified:
    - src/components/embed-event/card/embedded-zap-receipt.tsx
    - src/components/layout/presets/app-tabs-layout.tsx
    - src/components/timeline/highlight.tsx
    - src/views/badges/badge-details.tsx
    - src/components/app-handler-modal/index.tsx
    - src/components/content/components/nip.tsx
    - src/components/embed-event/card/embedded-dvm.tsx
    - src/components/outbox-relay-selection-modal.tsx
    - src/services/notifications/threads.ts
    - src/services/notifications/zaps.ts
    - src/views/articles/components/article-tags.tsx
    - src/views/emojis/pack/index.tsx
    - src/views/feeds/dvm/index.tsx
    - src/views/feeds/outboxes/outbox-feed.tsx
    - src/views/feeds/relays/relay-feed.tsx
    - src/views/home/index.tsx
    - src/views/messages/components/inboxes-status-section.tsx
    - src/views/messages/inbox/components/locked-messages.tsx
    - src/views/settings/outbox-selection/components/relay-count-row.tsx
    - src/views/settings/profile/components/profile-edit-form.tsx
    - src/views/settings/relays/components/relay-control.tsx
    - src/views/support/components/other-zap.tsx
    - src/views/thread/components/tabs/zaps.tsx
    - src/views/torrents/components/torrent-menu.tsx

key-decisions:
  - "All four residual duplicate imports were resolved by merging into the earlier occurrence (option a) — none required a rule-scoped aislop-ignore. No new Documented Ignores Ledger row was created."
  - "threads.ts's declared-but-unused getCoordinateFromAddressPointer const (plus its explanatory comment) was removed alongside the import findings, since it is the plan's measured 21st eslint/no-unused-vars finding and the task's acceptance criteria requires the rule's total count to be 0, not just the imported-but-never-used subset."

patterns-established: []

requirements-completed: [D-01, D-02a]

coverage:
  - id: D1
    description: "Merge the four duplicate imports that survive aislop fix --safe because they straddle a group boundary (embedded-zap-receipt.tsx, app-tabs-layout.tsx, timeline/highlight.tsx, badge-details.tsx)"
    requirement: "D-01"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq '[.diagnostics[]|select(.rule==\"import/no-duplicates\" or .rule==\"ai-slop/duplicate-import\")]|length' == 0"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq '[.diagnostics[]|select(.filePath==\"src/components/layout/presets/app-tabs-layout.tsx\")|select(.rule==\"react-hooks/rules-of-hooks\")]|length' == 2 (unchanged)"
        status: pass
      - kind: other
        ref: "pnpm build (tsc --noEmit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Remove every remaining unused import (20 findings, 18 identifier + 2 type-only) plus one orphaned unused-variable finding across 20 files, derived at execution time rather than trusted from the plan's nine named survivors"
    requirement: "D-02a"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq '[.diagnostics[]|select(.rule==\"ai-slop/unused-import\" or (.rule==\"eslint/no-unused-vars\" and (.message|test(\"imported but never used\"))))]|length' == 0"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq '[.diagnostics[]|select(.rule==\"eslint/no-unused-vars\")]|length' == 0"
        status: pass
      - kind: other
        ref: "git status --short src/lib/ | wc -l == 0 (no vendored path touched)"
        status: pass
      - kind: other
        ref: "pnpm build (tsc --noEmit)"
        status: pass
    human_judgment: false

# Metrics
duration: ~25min
completed: 2026-09-16
status: complete
---

# Phase 04 Plan 10: Import Hygiene Sweep Summary

**Merged the four duplicate imports the auto-fixer structurally could not collapse, then removed twenty unused import specifiers and one orphaned dead-code const — the residue left behind after `aislop fix --safe` and after waves 2–3's deletions — bringing `eslint/no-unused-vars` and `import/no-duplicates` to zero in `src/`.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-09-16
- **Tasks:** 2
- **Files modified:** 24

## Accomplishments

- Merged all four duplicate-import survivors into their earlier occurrence, with no other import in any of the four files reordered or regrouped
- Derived the true residual unused-import set at execution time (20 findings across 20 files) rather than trusting the plan's nine named survivors, since waves 2–3 orphaned 11 additional imports the plan could not have known about at plan time
- Removed one additional `eslint/no-unused-vars` finding outside the import category — a dead `getCoordinateFromAddressPointer` const in `threads.ts`, orphaned by an earlier wave, matching the plan's measured 21st bucket-C finding
- Confirmed `src/components/app-handler-modal/index.tsx`'s pre-existing `react-hooks/rules-of-hooks` errors (backlog 999.2) remain untouched — only its unused `Link` import was removed
- `pnpm build` (tsc + vite) passed after both tasks

## Task Commits

Each task was committed atomically:

1. **Task 1: Merge the four duplicate imports that straddle the group boundary** - `7825bf304` (fix)
2. **Task 2: Remove every remaining unused import, including those orphaned by earlier waves** - `8b8627ed2` (fix)

**Plan metadata:** (final docs commit follows this SUMMARY)

## Files Created/Modified

**Task 1 — duplicate-import merges:**
- `src/components/embed-event/card/embedded-zap-receipt.tsx` — merged two adjacent `applesauce-common/helpers` import statements into one
- `src/components/layout/presets/app-tabs-layout.tsx` — merged two `@chakra-ui/react` import statements into the top-block occurrence
- `src/components/timeline/highlight.tsx` — merged two adjacent `applesauce-common/helpers/highlight` import statements into one, alphabetized
- `src/views/badges/badge-details.tsx` — merged the stray `useDisclosure` `@chakra-ui/react` import into the top-block chakra import

**Task 2 — unused-import and orphaned-variable removal (20 files):**
- `src/components/app-handler-modal/index.tsx` — removed unused `Link`
- `src/components/content/components/nip.tsx` — removed unused `Link`
- `src/components/embed-event/card/embedded-dvm.tsx` — removed unused `AddressPointer` (whole statement deleted, sole specifier)
- `src/components/outbox-relay-selection-modal.tsx` — removed unused `Badge`
- `src/services/notifications/threads.ts` — removed unused `getCoordinateFromAddressPointer` const and its comment (dead code, not an import)
- `src/services/notifications/zaps.ts` — removed unused type-only `AddressPointer` and `EventPointer`
- `src/views/articles/components/article-tags.tsx` — removed unused `Tag`
- `src/views/emojis/pack/index.tsx` — removed unused `Tag`
- `src/views/feeds/dvm/index.tsx` — removed unused `AddressPointer`
- `src/views/feeds/outboxes/outbox-feed.tsx` — removed unused `kinds` (a same-named object property key remains, unrelated to the import)
- `src/views/feeds/relays/relay-feed.tsx` — removed unused `kinds` (same pattern as above)
- `src/views/home/index.tsx` — removed unused `Filter`
- `src/views/messages/components/inboxes-status-section.tsx` — removed unused `Link`
- `src/views/messages/inbox/components/locked-messages.tsx` — removed unused `use$`
- `src/views/settings/outbox-selection/components/relay-count-row.tsx` — removed unused default import `UserAvatar` (whole statement deleted, sole specifier)
- `src/views/settings/profile/components/profile-edit-form.tsx` — removed unused `useForm`
- `src/views/settings/relays/components/relay-control.tsx` — removed unused `Link`
- `src/views/support/components/other-zap.tsx` — removed unused `Text`
- `src/views/thread/components/tabs/zaps.tsx` — removed unused `Text`
- `src/views/torrents/components/torrent-menu.tsx` — removed unused `MenuItem` (whole statement deleted, sole specifier)

## Decisions Made

- **All four duplicate imports resolved by merging (option a), zero new ignore-ledger rows.** Per the plan's explicit tension ("merge if the duplication is accidental, or add a rule-scoped ignore if merging would violate import grouping"), each of the four was inspected directly:
  - `embedded-zap-receipt.tsx`: both `applesauce-common/helpers` statements were already immediately adjacent in the same top external-library block — no boundary crossed by merging.
  - `timeline/highlight.tsx`: both `applesauce-common/helpers/highlight` statements were already immediately adjacent, in their own external sub-block below the Chakra/nostr-tools/react block — merging kept them at that same position, crossing nothing.
  - `app-tabs-layout.tsx`: the second `@chakra-ui/react` statement sat in a second, lower block (mixed with relative imports) — but it is still an external-library specifier, so lifting it into the top external block is a correct merge, not a grouping violation; nothing else in the file was reordered.
  - `badge-details.tsx`: the stray `useDisclosure` sat in the second block alongside `applesauce-core/helpers` and relative imports — lifting it into the top `@chakra-ui/react` block is likewise a correct merge; the surrounding second-block imports (`applesauce-core/helpers`, relative components) were left untouched and unreordered.
  In every case the accidental-duplication read was correct and no grouping violation results, so an ignore was never the right tool — merging is not a last resort here, it is the genuinely correct fix.
- **Derived the unused-import list from a live scan rather than the plan's nine named survivors.** The scan found 20 unused-import findings (18 identifier + 2 type-only) across 20 files — 8 files/9 findings matched the plan's named survivors exactly, and 11 more files were newly identified, consistent with the plan's own prediction that the full set depends on what waves 2–3 orphaned and "is not knowable at plan time."
- **Removed `threads.ts`'s orphaned `getCoordinateFromAddressPointer` const even though it is not an import.** The plan's `<action>` text for Task 2 describes deriving the list from "imported but never used" messages, but the plan's `critical_plan_specifics` explicitly measured 21 total `eslint/no-unused-vars` findings including "1 Variable declared but never used," and the task's own acceptance criteria requires the rule's *total* count to reach 0 ("every catch, parameter, variable and import case is now closed"). Removing this dead declaration (and its now-orphaned explanatory comment) was necessary to satisfy that explicit criterion; it was confirmed unreferenced anywhere else in the file via grep before deletion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug/dead code] Removed threads.ts's orphaned `getCoordinateFromAddressPointer` const**
- **Found during:** Task 2
- **Issue:** `eslint/no-unused-vars` reported this module-scope const (and the comment explaining why it exists) as declared but never used anywhere in the file — it is not an import, so it falls outside Task 2's literal `<action>` text, but the plan's own measured facts and acceptance criteria (rule count must reach exactly 0) require it
- **Fix:** Deleted both the const declaration and its preceding explanatory comment; confirmed via `grep` that no other reference to the symbol exists in the file, and via `git diff` that no other line in the file changed
- **Files modified:** `src/services/notifications/threads.ts`
- **Verification:** `pnpm exec aislop scan --json . | jq '[.diagnostics[]|select(.rule=="eslint/no-unused-vars")]|length'` returns `0`; `pnpm build` passes
- **Committed in:** `8b8627ed2` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — dead code removal required by the plan's own explicit acceptance criteria)
**Impact on plan:** Necessary to satisfy the plan's stated Task 2 acceptance bar. No scope creep — the symbol was genuinely dead code orphaned by an earlier wave, not a functional change.

## Issues Encountered

- Two post-edit hook findings in `zaps.ts` (3 trivial-comment warnings) and `threads.ts` (4 trivial-comment warnings) initially looked like new findings introduced by this plan's edits. Confirmed via `git diff` on each file that only import/declaration lines were removed and no comment text was added or changed — the hook's line-based diffing simply reported the same pre-existing comments at their new (shifted) line numbers. Left untouched per the out-of-scope rule (backlog 999.8, comment noise); not a regression.
- `src/views/feeds/outboxes/outbox-feed.tsx` and `src/views/feeds/relays/relay-feed.tsx` each contain an unrelated object property literally named `kinds:` (e.g. `{ kinds: GENERIC_TIMELINE_KINDS }`). Confirmed via `grep` that this is a plain object key, not a reference to the imported `kinds` from `nostr-tools` — the import was genuinely unused and safely removed in both files.

## Next Phase Readiness

- `src/` now has zero `eslint/no-unused-vars` and zero `import/no-duplicates` findings — the phase's import-hygiene bar (D-01/D-02a) is fully closed.
- No new Documented Ignores Ledger row was created by this plan (all four duplicate-import survivors were merged, none suppressed) — 04-11 has nothing new to collect from this plan on that front.
- `app-handler-modal/index.tsx`'s pre-existing `react-hooks/rules-of-hooks` errors remain, tracked under backlog 999.2, unaffected by this plan's edit.

---
*Phase: 04-dead-code-and-import-hygiene-sweep*
*Completed: 2026-09-16*

## Self-Check: PASSED

- All 24 files listed under Files Created/Modified confirmed present on disk (`[ -f ... ]` checked individually).
- Both task commit hashes (`7825bf304`, `8b8627ed2`) confirmed present in `git log --oneline -5`.
- Plan-wide acceptance criteria re-verified after both tasks: `import/no-duplicates`/`ai-slop/duplicate-import` = 0, unused-import findings = 0, `eslint/no-unused-vars` total = 0, `src/lib/` untouched, `app-tabs-layout.tsx` `react-hooks/rules-of-hooks` count unchanged at 2, `pnpm build` (tsc + vite) passed.
