---
phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
plan: 06
subsystem: ui
tags: [applesauce, mute-list, react, chakra, react-window, pending-unlock]

# Dependency graph
requires:
  - phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
    provides: "Generic pending-unlock registry + mutes category registration (01-01, 01-03)"
  - phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
    provides: "getMuteHalf and half-aware useUserMuteActions (01-02)"
provides:
  - "PublicMutesQuery/HiddenMutesQuery model factories in src/models/mutes.ts"
  - "usePendingUnlockCategory(id) registry-reading hook"
  - "MutedUserCard, the shared row component with an explicit hidden prop"
  - "PrivateMutesSection: locked placeholder / bounded pubkey list for the Muted view"
  - "Muted view public list sourced from PublicMutesQuery, hosting PrivateMutesSection"
affects: []

# Actuals (#2632)
actuals:
  tokens: 3241
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Section-scoped mute data sources (PublicMutesQuery/HiddenMutesQuery) make each row's half known by construction, eliminating the need for getMuteHalf detection at render sites that already know which half they're rendering"
    - "Registry-driven locked-state UI: PrivateMutesSection reads usePendingUnlockCategory('mutes') for both the locked/unlocked branch and the Unlock action, never recomputing state locally"

key-files:
  created:
    - src/hooks/use-pending-unlock-category.ts
    - src/views/lists/muted/components/muted-user-card.tsx
    - src/views/lists/muted/components/private-mutes-section.tsx
  modified:
    - src/models/mutes.ts
    - src/views/lists/muted/index.tsx

key-decisions:
  - "PrivateMutesSection derives locked=row.count>0 from the registry row rather than isHiddenMutesUnlocked(event) directly, per the plan's explicit instruction — the registry is the single source of truth so this section and the side-nav badge can never disagree."
  - "The Private section's bounded pubkey list (maxH=320px, overflowY=auto, no AutoSizer/react-window) is deliberately unvirtualized, per RESEARCH.md Assumption A3 (private lists expected small, no real-world size data exists); a code comment above the container documents the swap-to-virtualized escape hatch if that assumption fails."
  - "MutedUserCard does not import getMuteHalf — the hidden flag is passed by the caller (MutedRow passes false, PrivateMutesSection passes true) because each section's data source already fixes the half by construction, resolving the third getMuteHalf call site PATTERNS.md flagged as unnecessary here."

patterns-established:
  - "Any future Muted-view row consumer should reuse MutedUserCard with an explicit hidden prop rather than re-implementing the UnmuteUser call or detecting the half at render time."

requirements-completed: [D-10, D-11, D-12, D-13, D-14]

coverage:
  - id: D1
    description: "PublicMutesQuery/HiddenMutesQuery model factories and usePendingUnlockCategory hook — the data-layer foundation the two UI deliverables below are built on"
    verification:
      - kind: other
        ref: "pnpm build (tsc type-check + vite build); acceptance-criteria greps: both exports present, MutesQuery unchanged (function body byte-identical, only the shared import line necessarily changed to add the two new model imports), pendingUnlockState$ read twice in the hook"
        status: pass
    human_judgment: false
  - id: D2
    description: "Private section: renders nothing with no hidden content, a countless locked placeholder with its own registry-driven Unlock button while locked (D-11), and a bounded-height pubkeys-only list once unlocked (D-10/D-12)"
    requirement: "D-10"
    verification:
      - kind: other
        ref: "pnpm build; acceptance-criteria greps: no helpers/nostr/mute-list import, usePendingUnlockCategory/category.unlock/hasHiddenTags/HiddenMutesQuery/maxH all present at required counts, zero virtualization imports, only .pubkeys field read from the resolved hidden value"
        status: pass
    human_judgment: true
    rationale: "M-7 (visit /lists/muted with a locked private mute list, verify the Locked badge/no-count placeholder, press Unlock, confirm the section replaces the placeholder with pubkey rows without reload and the side-nav count drops in step, confirm no duplication with the public list, and confirm no Private section for an account with no hidden content) requires a live browser session with a configured nostr signer and an account whose kind-10000 mute list has hidden entries — unavailable in this sandboxed, non-interactive execution environment. Static verification (type-check, source review, all acceptance-criteria greps) is complete and passing. Logged as an unrun-verify item in .planning/WINDOWS.md (entry 10) for end-of-phase UAT, consistent with how plans 01-01 through 01-05 handled the same limitation."
  - id: D3
    description: "Muted view hosts both sections: public list re-sourced from PublicMutesQuery (so no row's Remove path can mismatch its half, D-13), PrivateMutesSection rendered beneath it, and hidden-half Remove publishes a real change via UnmuteUser(pubkey, true) (D-14)"
    requirement: "D-13"
    verification:
      - kind: other
        ref: "pnpm build; acceptance-criteria greps: PublicMutesQuery imported and used, hooks/use-user-mutes no longer referenced, PrivateMutesSection and MutedUserCard each imported and used exactly once, minH={0} present, AutoSizer still present (public list stays virtualized), no tab component imported, PrivateMutesSection JSX line number greater than AutoSizer's; plan-level git status --porcelain confirms use-user-mute-filter.ts/use-client-side-mute-filter.ts/use-user-mutes.ts untouched (D-07 scope isolation)"
        status: pass
    human_judgment: true
    rationale: "M-8 part 2 (with the hidden half unlocked, press Remove on a Private-section row, approve the signer request, confirm the row disappears, a replacement kind-10000 publishes, and after reload+re-unlock the pubkey is genuinely absent from getHiddenMutedThings rather than a silent no-op) requires a live browser session with a configured nostr signer and a seeded private mute entry (via MuteUser(pubkey, true) from the debug console, since this phase deliberately ships no mute-privately UI). Unavailable in this sandboxed, non-interactive execution environment. Static verification (type-check, source review confirming MutedUserCard forwards hidden through to UnmuteUser(pubkey, hidden), all acceptance-criteria greps) is complete and passing. Logged as an unrun-verify item in .planning/WINDOWS.md (entry 11) for end-of-phase UAT."

duration: ~15min
completed: 2026-08-19
status: complete
---

# Phase 1 Plan 6: Muted view Private section Summary

**The Muted view now has a separate Private section — a countless locked placeholder with its own registry-driven Unlock button while locked, and a bounded-height pubkeys-only list once unlocked — with the public list re-sourced from PublicMutesQuery so no row's Remove button can silently no-op.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-19 (approx, first commit 2026-08-19T18:20:42+01:00)
- **Completed:** 2026-08-19T18:23:24+01:00
- **Tasks:** 3
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments
- Added `PublicMutesQuery`/`HiddenMutesQuery` model factories to `src/models/mutes.ts`, mirroring `MutesQuery`'s exact wrapper shape and leaving `MutesQuery` itself byte-identical (only the shared `applesauce-common/models` import line changed to add the two new model names).
- Created `src/hooks/use-pending-unlock-category.ts`, a one-line-purpose hook that reads a single registered category's live state from `pendingUnlockState$` by id, so any UI surface (this section, the side-nav badge) reads the same registry rather than recomputing locked state.
- Extracted `MutedUserCard` (`src/views/lists/muted/components/muted-user-card.tsx`) from the view's former local `UserCard`, adding a required `hidden: boolean` prop forwarded as `UnmuteUser(pubkey, hidden)`'s second argument — the half is passed by the caller, never detected here.
- Built `PrivateMutesSection` (`src/views/lists/muted/components/private-mutes-section.tsx`): renders nothing when the mute list has no hidden content; while locked, a Private heading, an orange Locked badge, explanatory text, and a registry-driven Unlock button (disabled with a title when the account has no signer) — no count, no placeholder rows; once unlocked, a bounded (`maxH="320px"`, `overflowY="auto"`) scrolling list of `MutedUserCard` rows for hidden pubkeys, or a "no privately muted users" line when the hidden half holds only words/hashtags/threads.
- Reworked `src/views/lists/muted/index.tsx`: the public list now reads from `PublicMutesQuery` instead of the merged `useUserMutes`, `MutedRow` renders `MutedUserCard` with `hidden={false}`, the wrapping `Flex` gained `minH={0}` so the virtualized list can shrink, and `PrivateMutesSection` renders as a sibling beneath it inside the same `SimpleView` column.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the public and hidden mute models and a registry-category hook** - `bc2f8fd08` (feat)
2. **Task 2: Extract the row component and build the Private section** - `82fefe8eb` (feat)
3. **Task 3: Rework the Muted view to host both sections** - `f9e3bb239` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/models/mutes.ts` - Added `PublicMutesQuery`/`HiddenMutesQuery`; `MutesQuery` unchanged.
- `src/hooks/use-pending-unlock-category.ts` - New: `usePendingUnlockCategory(id)` reads one registry row by id.
- `src/views/lists/muted/components/muted-user-card.tsx` - New: extracted row with required `hidden` prop.
- `src/views/lists/muted/components/private-mutes-section.tsx` - New: locked placeholder / bounded pubkey list.
- `src/views/lists/muted/index.tsx` - Public list re-sourced from `PublicMutesQuery`; hosts `PrivateMutesSection`.

## Decisions Made
See `key-decisions` in frontmatter.

## Deviations from Plan

None - plan executed exactly as written. All three tasks' automated acceptance criteria (grep counts, `pnpm build` exit 0, scope isolation) were verified and passed without needing any Rule 1-3 auto-fixes.

## Issues Encountered

- **Manual verification blocks not executed.** Task 3's `<verify><manual>` block covers M-7 (D-10/D-11/D-12: Private section locked placeholder, Unlock, and re-render without reload) and M-8 part 2 (D-13/D-14: hidden-half Remove is a real, non-no-op publish surviving reload+re-unlock). Both require a live browser session with a configured nostr signer, and M-8 part 2 additionally requires seeding a private mute via the debug console's `MuteUser(pubkey, true)` since this phase ships no mute-privately UI. Neither is available in this sandboxed, non-interactive execution environment. Static verification (type-check via `pnpm build`, source review, and every automated acceptance-criteria grep from all three tasks) passed. Logged as two unrun-verify items in `.planning/WINDOWS.md` (entries 10 and 11) for end-of-phase UAT, consistent with how plans 01-01 through 01-05 handled the same limitation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

This is the last plan in Phase 1. `src/models/mutes.ts`, the extracted `MutedUserCard`, and `PrivateMutesSection` complete the phase's D-10 through D-14 UI requirements on top of the registry (01-01), the mutes/decryption-cache registrations (01-03), the half-aware unmute hook (01-02), and the nav affordance/Privacy settings (01-04/01-05). No blockers for downstream work. Eleven unrun-verify items now sit in `.planning/WINDOWS.md` across the whole phase (all requiring a live signer/relay session unavailable in this sandbox) — recommend a full manual UAT pass against that ledger before shipping the phase.

---
*Phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache*
*Completed: 2026-08-19*

## Self-Check: PASSED

- FOUND: src/models/mutes.ts (PublicMutesQuery, HiddenMutesQuery present)
- FOUND: src/hooks/use-pending-unlock-category.ts
- FOUND: src/views/lists/muted/components/muted-user-card.tsx
- FOUND: src/views/lists/muted/components/private-mutes-section.tsx
- FOUND: src/views/lists/muted/index.tsx modified
- FOUND commit: bc2f8fd08 (Task 1)
- FOUND commit: 82fefe8eb (Task 2)
- FOUND commit: f9e3bb239 (Task 3)
- Re-ran all automated acceptance criteria from all three tasks: all PASS (see per-task grep output in execution log; `pnpm build` exits 0 on final state)
- Scope isolation: `git status --porcelain src/hooks/use-user-mutes.ts src/hooks/use-user-mute-filter.ts src/hooks/use-client-side-mute-filter.ts` returned empty
