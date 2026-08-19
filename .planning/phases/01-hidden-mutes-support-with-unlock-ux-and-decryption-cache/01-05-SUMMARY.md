---
phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
plan: 05
subsystem: ui
tags: [chakra-ui, applesauce, rxjs, preferences, pending-unlock, settings]

# Dependency graph
requires:
  - phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
    provides: "localSettings.autoUnlockAll/autoUnlockCategories preferences and pendingUnlockCategories$/setAutoUnlockCategory registry API from plan 01-01"
  - phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
    provides: "The mutes and decryption-cache category registrations from plan 01-03, which populate pendingUnlockCategories$ with exactly two entries"
provides:
  - "Privacy settings unlock-all auto-unlock switch bound to localSettings.autoUnlockAll"
  - "Registry-driven per-category auto-unlock switches, rendered from pendingUnlockCategories\$, shown only while unlock-all is off"
affects: [01-06]

# Actuals (#2632)
actuals:
  tokens: 698
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Local (non-relay-synced) settings UI bound via use\$(localSettings.X) + X.next(...) sitting alongside the useSettingsForm/register(...) react-hook-form path in the same view, matching the existing 'Enable debug api' block"
    - "Registry-driven settings list: .map() over a live Observable<Category[]> so a settings section grows automatically as new sources register, with zero hardcoded category ids/labels"

key-files:
  created: []
  modified:
    - src/views/settings/privacy/index.tsx

key-decisions:
  - "Per-category rows render conditionally on `!autoUnlockAll` immediately below the unlock-all FormControl, and the .map() naturally produces zero elements (no wrapper, no empty-state text) when the registry is empty, satisfying D-05's 'no placeholder rows' requirement without a separate empty-check branch."
  - "Each per-category Switch id is derived as `autoUnlock-${category.id}` to guarantee uniqueness across an arbitrary number of future registrations, rather than reusing the bare category id as the DOM id."

patterns-established:
  - "Any future settings section that must track a registry (not a fixed enum) should follow this plan's shape: use\$ the registry observable, .map() into FormControls, key on the registry id, and read every label/helper string from the registry entry — never a string literal."

requirements-completed: [D-04, D-05]

coverage:
  - id: D1
    description: "Privacy settings has a persisted unlock-all auto-unlock switch, defaulting off, with helper text stating that enabling it causes signer decrypt requests at app start"
    requirement: "D-04"
    verification:
      - kind: unit
        ref: "pnpm build (tsc + vite build) exits 0; grep -c 'autoUnlockAll' returns 5, grep -c 'localSettings.autoUnlockAll.next' returns 1, grep -c 'register(\"autoUnlock' returns 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "While unlock-all is off, exactly the two registered categories (Mute lists, Message cache) are listed with persisted per-category switches; while it is on, the per-category list renders nothing"
    requirement: "D-05"
    verification:
      - kind: unit
        ref: "pnpm build exits 0; grep -c 'pendingUnlockCategories\$' returns 2, grep -c 'setAutoUnlockCategory' returns 2, grep -c 'autoUnlockCategories' returns 2; source review confirms the block is a .map() over pendingUnlockCategories\$ conditioned on !autoUnlockAll, with every label/helper string a category.property access and zero hardcoded category ids"
        status: pass
    human_judgment: true
    rationale: "The live end-to-end procedure (open Privacy with a hidden mute list, confirm exactly two labelled rows appear, toggle Mute lists then reload and observe a single unprompted signer decrypt, toggle off and reload with a re-locked list and observe no prompt, then toggle unlock-all and confirm the rows disappear) requires a live browser with a configured nostr signer and a real mute-list-bearing account — unavailable in this sandboxed, non-interactive execution environment. Static verification (type-check, all automated grep acceptance criteria, and source review confirming the render logic matches the spec exactly) is complete. Logged as an unrun-verify item in .planning/WINDOWS.md (entry 9) for end-of-phase UAT, consistent with how plans 01-01 and 01-03 handled the same limitation.

duration: ~12min
completed: 2026-08-19
status: complete
---

# Phase 1 Plan 5: Privacy Settings Auto-Unlock Preferences Summary

**Adds a persisted unlock-all switch plus a registry-driven per-category switch list (Mute lists, Message cache) to `src/views/settings/privacy/index.tsx`, mirroring the existing `use$`/`.next(...)` local-settings pattern.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-08-19T17:00Z (approx, first commit)
- **Completed:** 2026-08-19T17:12Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added a persisted `autoUnlockAll` switch (id `autoUnlockAll`) to Privacy settings, read via `use$(localSettings.autoUnlockAll)` and written via `.next(e.currentTarget.checked)`, with helper text that plainly states enabling it triggers signer decrypt requests at app start — the counterweight to D-01's silent-by-default guarantee.
- Added a registry-driven list of per-category switches, rendered by `.map()`-ing `use$(pendingUnlockCategories$) ?? []`, visible only while `autoUnlockAll` is false. Each row's label/helper text comes exclusively from the category descriptor (`category.label`/`category.description`), with an `autoUnlock-${category.id}` DOM id and `setAutoUnlockCategory(category.id, checked)` on change — no hardcoded category ids or labels anywhere in the file.
- Confirmed the row disappears entirely (no wrapper, no empty-state text) when the registry is empty or unlock-all is on, satisfying D-05's "no placeholder rows" requirement structurally rather than via a special-cased branch.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the unlock-all auto-unlock switch to Privacy settings** - `2b26b929d` (feat)
2. **Task 2: Add the registry-driven per-category auto-unlock switches** - `b098f8814` (feat)

**Plan metadata:** (pending — this commit)

## Files Created/Modified
- `src/views/settings/privacy/index.tsx` - New auto-unlock settings group: unlock-all switch (Task 1) plus a registry-driven per-category switch list (Task 2), inserted immediately before the existing "Enable debug api" block.

## Decisions Made
See `key-decisions` in frontmatter.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' automated acceptance criteria (grep counts, `pnpm build` exit 0, line-order check, diff-stat scope check) were verified and passed without needing any Rule 1-3 auto-fixes.

## Issues Encountered

- **Manual D-04/D-05 UAT procedure not executed.** Task 2's `<verify><manual>` block requires a live browser with a configured nostr signer and an account whose kind-10000 mute list has hidden entries, then observing signer-prompt behavior across two reload cycles. This sandboxed, non-interactive execution environment has no such session available. Mitigated by static verification (`pnpm build` passing the full type-check, all automated grep acceptance criteria passing, and source review confirming the render logic exactly matches the D-04/D-05 spec: conditional on `!autoUnlockAll`, driven by `.map()` over the live registry, zero hardcoded categories). Logged as an unrun-verify item in `.planning/WINDOWS.md` (entry 9) for end-of-phase UAT to close out, consistent with plans 01-01 and 01-03's handling of the same limitation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `src/views/settings/privacy/index.tsx` now exposes both auto-unlock preferences (`autoUnlockAll`, per-category `autoUnlockCategories`) to the user, closing the loop that plan 01-01's driver reads and plan 01-04's nav button's "enable auto-unlock" action writes to.
- Blocker for downstream plans: none. Plan 01-06 (Muted view Private section) touches a different file (`src/views/lists/muted/index.tsx`) and has no dependency on this plan's UI.
- The deferred manual D-04/D-05 procedure (WINDOWS.md entry 9) does not block further work — it verifies end-to-end UX already provable by source review — but should be re-run together with the phase's other deferred UAT items (WINDOWS.md entries 1-8) once a live signer/relay environment is available.

---
*Phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache*
*Completed: 2026-08-19*

## Self-Check: PASSED

- FOUND: src/views/settings/privacy/index.tsx (modified, verified via git diff)
- FOUND commit: 2b26b929d (Task 1)
- FOUND commit: b098f8814 (Task 2)
- Re-ran all automated acceptance criteria from both tasks: all PASS (grep counts and `pnpm build` exit 0 confirmed above)
- Scope isolation: `git status --porcelain src/ | grep -v 'views/settings/privacy/index.tsx'` returned empty (no files outside plan scope touched)
