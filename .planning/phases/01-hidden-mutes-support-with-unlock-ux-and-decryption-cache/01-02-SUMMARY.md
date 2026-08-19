---
phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
plan: 02
subsystem: mute-list
tags: [applesauce, mute-list, nip-51, hidden-tags, react-hooks]

# Dependency graph
requires:
  - phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
    provides: "applesauce-common mute helpers/models already a direct dependency (no new install)"
provides:
  - "getMuteHalf(muteListEvent, pubkey) three-way public/hidden/unknown detector in src/helpers/nostr/mute-list.ts"
  - "useUserMuteActions returning merged isMuted plus muteHalf/canUnmute/unmuting, with half-aware unmute routing"
  - "Half-aware app-wide mute menu item with no conditionally-ordered hooks"
affects: [muted-view-private-section, unlock-side-nav-affordance]

# Actuals (#2632)
actuals:
  tokens: 1518
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Half-aware unmute: detect which half (public/hidden) a mute lives in before writing, never fall through to the wrong branch"
    - "Merged reactive mute state via MutesQuery -> MuteModel (watchEventUpdates) instead of raw event tag inspection"

key-files:
  created: []
  modified:
    - src/helpers/nostr/mute-list.ts
    - src/hooks/use-user-mute-actions.ts
    - src/components/menu/mute-user.tsx

key-decisions:
  - "getMuteHalf checks the public half first, then only consults the hidden half when isHiddenMutesUnlocked is true, so a locked private mute is indistinguishable from absent at the type level (matches D-14)."
  - "Unknown-half unmute throws a descriptive Error instead of falling back to the public path, so useAsyncAction always surfaces a toast rather than silently publishing an unchanged list (D-13)."
  - "Fixed a pre-existing conditional-hook-order bug in MuteUserMenuItem while wiring it to the shared hook (all hooks now run before the early return)."

patterns-established:
  - "Any future unmute surface should call useUserMuteActions rather than re-implementing UnmuteUser/publish wiring — it is now the single half-aware implementation."

requirements-completed: [D-13, D-14, D-15]

coverage:
  - id: D1
    description: "getMuteHalf correctly resolves public/hidden/unknown, consulting the hidden half only when unlocked"
    requirement: "D-14"
    verification:
      - kind: unit
        ref: "pnpm build (tsc type-check + acceptance-criteria greps: export present, helper call sites present, zero deleted lines)"
        status: pass
    human_judgment: false
  - id: D2
    description: "useUserMuteActions reports merged isMuted and routes unmute to the correct half (public helper path vs applesauce UnmuteUser(pubkey, true)), throwing on unknown half"
    requirement: "D-15"
    verification:
      - kind: unit
        ref: "pnpm build (tsc type-check + acceptance-criteria greps for useUserMutes/getMuteHalf/UnmuteUser/pruneExpiredPubkeys call sites, returned-object shape, untouched filter hooks)"
        status: pass
    human_judgment: true
    rationale: "M-9 requires a live account with a real hidden mute entry, unlocking via signer, and observing the menu label flip without reload — needs a live nostr signer/relay session this environment cannot automate."
  - id: D3
    description: "App-wide mute menu item delegates entirely to the shared hook, has no conditionally-ordered hooks, and disables Unmute with an explanatory title when the half is undeterminable"
    requirement: "D-13"
    verification:
      - kind: unit
        ref: "pnpm build (tsc type-check + acceptance-criteria greps: zero UnmuteUser/useActionRunner/usePublishEvent references, canUnmute present, all hook calls precede the early return)"
        status: pass
    human_judgment: true
    rationale: "M-8 part 1 (public unmute regression: published kind-10000 no longer carries the p tag or a stale mute_expiration tag) requires a live account and a real relay publish to inspect the resulting event — needs a live nostr signer/relay session this environment cannot automate."

# Metrics
duration: 20min
completed: 2026-08-19
status: complete
---

# Phase 1 Plan 2: Half-aware unmute correctness Summary

**Unmute now detects which half of the kind-10000 mute list a pubkey lives in and writes to the correct half, and `isMuted` reads merged public+hidden state instead of public tags only.**

## Performance

- **Duration:** 20 min
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added `getMuteHalf(muteListEvent, pubkey)` — a pure, additive helper in `src/helpers/nostr/mute-list.ts` that returns `"public" | "hidden" | "unknown"`, consulting the hidden half only when `isHiddenMutesUnlocked` is true.
- Reworked `useUserMuteActions` to be the single half-aware unmute implementation for the whole app: `isMuted` now reads merged state from `useUserMutes` (`MutesQuery` → `MuteModel`), and `unmute` branches on `muteHalf` — public entries keep the existing `mute_expiration`-pruning helper path, hidden entries go through applesauce's `UnmuteUser(pubkey, true)`, and an undeterminable half throws a descriptive `Error` instead of publishing an unchanged list. Added `muteHalf`, `canUnmute`, and `unmuting` to the hook's return value while keeping `isMuted`, `expiration`, `mute`, `unmute` unchanged for the three other existing consumers.
- Rewrote `MuteUserMenuItem` (`src/components/menu/mute-user.tsx`) to delegate entirely to `useUserMuteActions` instead of running its own `useActionRunner`/`usePublishEvent`/`UnmuteUser` call, disabling the Unmute affordance with an explanatory `title` when the half cannot be determined, and moving every hook call above the early return — fixing a pre-existing conditional-hook-order violation in the same pass.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the getMuteHalf helper** - `2e07bb5bd` (feat)
2. **Task 2: Make useUserMuteActions merged-state aware and half-aware** - `ec18f5ace` (feat)
3. **Task 3: Route the app-wide mute menu item through the half-aware hook** - `79ce9cb96` (refactor)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/helpers/nostr/mute-list.ts` - Added `getMuteHalf`; existing public-tag helpers (`muteListAddPubkey`, `muteListRemovePubkey`, `pruneExpiredPubkeys`, `getPubkeyExpiration`) left byte-identical, zero deleted lines in the diff.
- `src/hooks/use-user-mute-actions.ts` - Merged `isMuted`, half-aware `unmute`, new `muteHalf`/`canUnmute`/`unmuting` fields.
- `src/components/menu/mute-user.tsx` - Delegates to the shared hook; no direct `UnmuteUser` call; hooks reordered above the early return.

## Decisions Made
- See `key-decisions` in frontmatter.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `pnpm build` (which runs `tsc --project tsconfig.json && vite build`) passed after every task, and every automated acceptance-criteria grep from the plan passed as written.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `getMuteHalf`, the half-aware hook, and the app-wide menu item are ready for the Private mute-list section (D-10/D-11/D-12) and the pending-unlock side-nav affordance (D-02/D-03) planned in 01-04/01-05.
- Manual verifications M-8 part 1 (public unmute regression) and M-9 (merged `isMuted` flips on unlock without reload) are unrun in this environment — no live nostr signer/relay session available. Both are auto-mode-approved per this run's config (`workflow._auto_chain_active: false`, standard checkpoint protocol did not surface a manual gate for these `<manual>` verify blocks since the plan carries no `checkpoint:human-verify` tasks); recommend a human spot-check before shipping this phase, tracked below.

## Self-Check: PASSED

- `src/helpers/nostr/mute-list.ts` FOUND, `getMuteHalf` export present (grep -c = 1).
- `src/hooks/use-user-mute-actions.ts` FOUND, contains `muteHalf`, `canUnmute`, `unmuting` in the returned object.
- `src/components/menu/mute-user.tsx` FOUND, zero `UnmuteUser`/`useActionRunner`/`usePublishEvent` references, all hooks precede `return null`.
- Commits `2e07bb5bd`, `ec18f5ace`, `79ce9cb96` all present in `git log --oneline`.
- `pnpm build` exits 0 (final run, all three files together).
- `git status --porcelain src/hooks/use-user-mute-filter.ts src/hooks/use-client-side-mute-filter.ts src/providers/route/mute-modal-provider.tsx` prints nothing.

---
*Phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache*
*Completed: 2026-08-19*
