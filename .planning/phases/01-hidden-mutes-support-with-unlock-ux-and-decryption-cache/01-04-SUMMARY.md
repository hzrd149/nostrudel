---
phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
plan: 04
subsystem: ui
tags: [chakra-ui, rxjs, applesauce, pending-unlock, side-nav, mobile-drawer]

# Dependency graph
requires:
  - phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
    provides: "Generic pending-unlock registry (pendingUnlockState$/Total$, unlockPendingCategories, autoUnlockAll/autoUnlockCategories preferences) from plan 01-01"
  - phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
    provides: "Registered mutes and decryption-cache pending-unlock categories, including the cache's unlockComponent (CacheUnlockForm), from plan 01-03"
provides:
  - "PendingUnlockModal (src/components/pending-unlock/pending-unlock-modal.tsx) — per-category list plus the two D-02 actions (Unlock now, Enable auto-unlock)"
  - "PendingUnlockButton (src/components/layout/components/pending-unlock-button.tsx) — collapse-aware nav affordance with a count badge"
  - "LockIcon export in src/components/icons.tsx"
  - "Nav wiring: PendingUnlockButton mounted in both the desktop rail and the mobile drawer"
affects: [01-05, 01-06]

# Actuals (#2632)
actuals:
  tokens: 2595
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Status-button-with-popup-modal: a nav button that owns its own useDisclosure() and mounts its modal only while open (following the codebase's `{modal.isOpen && <SomeModal isOpen onClose={modal.onClose} />}` convention), rather than a route-based task-manager button"
    - "Component-owned CollapsedContext branch: instead of the caller gating visibility with `{!collapsed && ...}`, the component itself reads CollapsedContext and renders an icon+badge vs. a labelled button, so it survives collapsing the rail"

key-files:
  created:
    - src/components/pending-unlock/pending-unlock-modal.tsx
    - src/components/layout/components/pending-unlock-button.tsx
  modified:
    - src/components/icons.tsx
    - src/components/layout/desktop/side-nav.tsx
    - src/components/layout/mobile/nav-drawer.tsx

key-decisions:
  - "The unlockComponent row's onUnlocked callback closes the whole modal (not just that row), per the plan's explicit instruction — with only two registered categories today this is the simplest reading of 'the link that puts the decryption-cache password field in the nav.'"
  - "'Unlock now' is disabled only when zero pending rows are batch-eligible (no unlockComponent AND canUnlock); it stays enabled if at least one eligible row exists even when other rows need their own component or lack a signer, so the button always does something when it's clickable."
  - "nav-drawer.tsx wraps PendingUnlockButton in a dedicated Box with onClick={(e) => e.stopPropagation()}, placed above (not inside) the existing ButtonGroup — required because both DrawerBody's delegated handleClickItem and the ButtonGroup's own onClick={onClose} close the drawer on any button click, which would unmount the button and its modal mid-interaction."

patterns-established:
  - "Any future nav status affordance that must remain visible while the rail is collapsed should follow pending-unlock-button.tsx's shape: own CollapsedContext internally, return null only when there is nothing to show, and mount its modal conditionally on useDisclosure().isOpen."

requirements-completed: [D-02, D-03, D-08, D-09]

coverage:
  - id: D1
    description: "PendingUnlockModal lists every pending category (label, description, count) and offers both D-02 actions (Unlock now, Enable auto-unlock) plus each row's own action, rendering a category's registered unlockComponent when it supplies one and disabling the generic Unlock button when canUnlock is false"
    requirement: D-02
    verification:
      - kind: unit
        ref: "pnpm build (tsc type-check + vite build) exits 0; acceptance-criteria greps for pendingUnlockState$ (2), unlockPendingCategories (3), autoUnlockAll (1), unlockComponent (4), canUnlock (4), and zero catch blocks (0) all pass"
        status: pass
    human_judgment: true
    rationale: "Static verification confirms the code path exists and matches the contract (imports, hook usage, both footer actions wired, no local catch). Confirming the modal actually renders correctly with two live pending categories, a real signer, and correct disabled states requires a live browser session with a configured signer — unavailable in this sandboxed, non-interactive environment. Deferred to end-of-phase UAT (WINDOWS.md entries 6-8)."
  - id: D2
    description: "PendingUnlockButton renders as a labelled button in the expanded rail, shrinks to an icon with a count badge in the collapsed rail, and renders nothing when the pending total is zero"
    requirement: D-02
    verification:
      - kind: unit
        ref: "pnpm build exits 0; acceptance-criteria greps for CollapsedContext (3), pendingUnlockTotal$ (2), single 'return null' (1), Badge (3) all pass; hook-call ordering confirmed (use$/useContext/useDisclosure all above the 'return null' line)"
        status: pass
    human_judgment: true
    rationale: "The visual collapse-to-icon-badge transition and the count itself require a live browser with a real signer session (a mute list with hidden entries plus a locked decryption cache) to observe — unavailable here. Deferred to end-of-phase UAT (WINDOWS.md entry 6)."
  - id: D3
    description: "The affordance is mounted outside the collapsed gate in the desktop rail and, in the mobile drawer, isolated from the drawer's click-to-close behavior via a stopPropagation wrapper; bottom-nav.tsx and require-decryption-cache.tsx are left untouched"
    requirement: D-02
    verification:
      - kind: unit
        ref: "Line-number grep confirms the PendingUnlockButton usage in side-nav.tsx (line 55) precedes the '{!collapsed &&' gate (line 56); grep confirms exactly one stopPropagation wrapper in nav-drawer.tsx; git status --porcelain on bottom-nav.tsx and require-decryption-cache.tsx returns empty"
        status: pass
    human_judgment: false
  - id: D4
    description: "The decryption-cache password prompt is reachable from the side-nav modal without ever visiting the Messages route, via the category's own registered unlockComponent (CacheUnlockForm from plan 01-03) rather than a second password implementation"
    requirement: D-09
    verification:
      - kind: unit
        ref: "Source review: pending-unlock-modal.tsx renders <category.unlockComponent onUnlocked={onClose} /> when category.unlockComponent is defined, with no new password-field or crypto code added in this plan"
        status: pass
    human_judgment: true
    rationale: "Confirming the password field actually appears in the nav modal and successfully unlocks the cache, from a profile that has never visited /messages, requires a live browser session with a real signer and a locked cache — unavailable here. Deferred to end-of-phase UAT (WINDOWS.md entry 8)."
  - id: D5
    description: "A rejected signer prompt toasts the error, leaves the pending count unchanged, and the item is immediately retryable with no reload"
    requirement: D-08
    verification:
      - kind: unit
        ref: "grep confirms zero catch blocks added in pending-unlock-modal.tsx, so useAsyncAction (the codebase's single toast site) is the only place any thrown error from category.unlock()/unlockPendingCategories() is handled; no per-row failure state or retry counter was added"
        status: pass
    human_judgment: true
    rationale: "Observing the actual toast, the unchanged count, and an immediate successful retry requires a live browser session with a signer that can be made to reject a prompt — unavailable here. Deferred to end-of-phase UAT (WINDOWS.md entry 7)."

duration: ~15min
completed: 2026-08-19
status: complete
---

# Phase 1 Plan 4: Application-wide pending-unlock nav affordance Summary

**Collapse-aware side-nav button plus a modal listing every pending-unlock category (mutes, decryption-cache) with per-category actions and the two D-02 unlock choices, wired into both the desktop rail and the mobile drawer.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-19T18:01Z (approx, first commit)
- **Completed:** 2026-08-19T18:04Z
- **Tasks:** 3
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- Exported `LockIcon` (alias of the existing `lock-01` icon) from `src/components/icons.tsx`, next to the existing `UnlockIcon` alias.
- Built `src/components/pending-unlock/pending-unlock-modal.tsx`: reads `pendingUnlockState$`, renders one row per category with `count > 0` (label, description, count), renders a category's own `unlockComponent` when it defines one (the link that puts the decryption-cache password field in the nav, D-09), otherwise a per-row Unlock button disabled with an explanatory title when `canUnlock` is false. Footer offers the two D-02 actions: "Unlock now" (`unlockPendingCategories()`, disabled when nothing is batch-eligible) and "Enable auto-unlock" (sets `localSettings.autoUnlockAll` then immediately unlocks what's pending). No catch block anywhere in the component — `useAsyncAction` remains the single toast site (D-08).
- Built `src/components/layout/components/pending-unlock-button.tsx`: reads `pendingUnlockTotal$`, returns `null` when zero, and otherwise renders a labelled `Button` (expanded rail / mobile drawer) or an `IconButton` + count `Badge` inside a `Box position="relative"` (collapsed rail) — owning its own `CollapsedContext` branch instead of being hidden by the caller, so the indicator survives collapsing the rail (unlike `RelayConnectionButton`/`PublishLogButton`). Opens `PendingUnlockModal` via `useDisclosure()`, mounted only while open.
- Mounted `<PendingUnlockButton />` in `side-nav.tsx` as a sibling of the collapse-toggle `IconButton`, strictly outside the `{!collapsed && (...)}` fragment. Mounted `<PendingUnlockButton w="full" />` in `nav-drawer.tsx` inside a `Box` with `onClick={(e) => e.stopPropagation()}`, placed above the existing `ButtonGroup`, so opening the modal doesn't trigger the drawer's click-to-close behavior (`DrawerBody`'s `handleClickItem` and the `ButtonGroup`'s own `onClick={onClose}` both close on any button click). `bottom-nav.tsx` and `require-decryption-cache.tsx` left untouched.

## Task Commits

Each task was committed atomically:

1. **Task 1: Export a lock icon and build the pending-unlock modal** - `cee897ee0` (feat)
2. **Task 2: Build the collapse-aware nav button** - `6131593cc` (feat)
3. **Task 3: Mount the affordance in the desktop rail and the mobile drawer** - `1215e3e34` (feat)

**Plan metadata:** (pending — this commit)

## Files Created/Modified
- `src/components/pending-unlock/pending-unlock-modal.tsx` - New: lists every pending category with its own action, plus the two D-02 footer actions.
- `src/components/layout/components/pending-unlock-button.tsx` - New: collapse-aware nav status button with a count badge, opens the modal.
- `src/components/icons.tsx` - Added `LockIcon` export (alias of `lock-01`), 2 lines inserted.
- `src/components/layout/desktop/side-nav.tsx` - Added `PendingUnlockButton` import + usage outside the collapsed gate, 2 lines inserted.
- `src/components/layout/mobile/nav-drawer.tsx` - Added `PendingUnlockButton` import + a `stopPropagation`-wrapped usage above the existing `ButtonGroup`, 5 lines inserted.

## Decisions Made
See `key-decisions` in frontmatter.

## Deviations from Plan

None - plan executed exactly as written. All three tasks' automated acceptance criteria (grep counts, hook-ordering line-number check, `pnpm build` exit 0, scope isolation on `bottom-nav.tsx`/`require-decryption-cache.tsx`) were verified and passed without needing any Rule 1-3 auto-fixes.

## Issues Encountered

- **Manual verification blocks not executed.** The plan's Task 3 `<verify><manual>` block requires M-2 (D-02/D-03/D-09: nav pending count including the collapsed rail and the mobile drawer), M-5 (D-08: signer rejection toasts and stays retryable), and M-6 (D-09: cache unlock reachable outside Messages) — all of which require a live browser with a configured nostr signer (NIP-07 extension or nostr-connect) and, for M-2, an account whose kind-10000 mute list has hidden entries. This sandboxed, non-interactive execution environment has no browser/signer/test account available. Mitigated by static verification: `pnpm build` (including the `tsc` type-check) passed for all three tasks, and every automated acceptance-criteria grep/line-number check passed. Logged as three unrun-verify items in `.planning/WINDOWS.md` (entries 6-8) for end-of-phase UAT to close out, consistent with how plans 01-01 and 01-03 handled the same limitation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The application-wide pending-unlock affordance is now live in both nav surfaces, giving plans 01-05 (Privacy settings) and 01-06 (Muted view Private section) a proven UI pattern (modal + per-category row) to reference, though neither plan is required to reuse this modal directly.
- `src/components/pending-unlock/pending-unlock-modal.tsx` and `src/components/layout/components/pending-unlock-button.tsx` are the two new artifacts this plan contributes to the phase's `<artifacts>` list; both are self-contained and import only from the existing `pending-unlock.ts`/`preferences.ts` registry and `use-async-action.ts`.
- Blocker for downstream plans: none. The three deferred manual checks (WINDOWS.md entries 6-8) do not block building Privacy settings or the Muted view's Private section on top of this UI — they verify end-to-end UX that only becomes fully observable once a live signer/relay environment is available for the whole phase's UAT pass.

---
*Phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache*
*Completed: 2026-08-19*

## Self-Check: PASSED

- FOUND: src/components/pending-unlock/pending-unlock-modal.tsx
- FOUND: src/components/layout/components/pending-unlock-button.tsx
- FOUND: src/components/icons.tsx modified (LockIcon export present)
- FOUND: src/components/layout/desktop/side-nav.tsx modified
- FOUND: src/components/layout/mobile/nav-drawer.tsx modified
- FOUND commit: cee897ee0 (Task 1)
- FOUND commit: 6131593cc (Task 2)
- FOUND commit: 1215e3e34 (Task 3)
- Re-ran all automated acceptance criteria from all three tasks: all PASS (see per-task grep/line-number output above; `pnpm build` exits 0 on final state)
- Scope isolation: `git status --porcelain src/components/layout/mobile/bottom-nav.tsx src/providers/route/require-decryption-cache.tsx` returned empty (no files outside plan scope touched)
