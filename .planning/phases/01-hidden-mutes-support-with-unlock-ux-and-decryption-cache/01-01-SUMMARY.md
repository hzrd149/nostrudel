---
phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
plan: 01
subsystem: services
tags: [rxjs, preferences, applesauce, mute-list, decryption, pending-unlock]

# Dependency graph
requires: []
provides:
  - "Generic pending-unlock registry service (registerPendingUnlockCategory, pendingUnlockCategories$, pendingUnlockState$, pendingUnlockTotal$)"
  - "Per-category auto-unlock helpers (autoUnlockEnabled$, isAutoUnlockEnabled, setAutoUnlockCategory) and batch unlock (unlockPendingCategories)"
  - "Preference-gated auto-unlock driver (app-start / explicit-account-switch triggers only)"
  - "localSettings.autoUnlockAll and localSettings.autoUnlockCategories preferences"
affects: [01-02, 01-03, 01-04, 01-05, 01-06]

# Actuals (#2632)
actuals:
  tokens: 2479
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RxJS singleton registry service: BehaviorSubject<Category[]> + combineLatest/switchMap/shareReplay(1), module-scope self-subscribe to stay warm"
    - "Preference-gated auto-unlock driver keyed by an attempted-set of `${accountId}:${categoryId}` pairs, reset only on distinct-account emissions"

key-files:
  created: [src/services/pending-unlock.ts]
  modified: [src/services/preferences.ts]

key-decisions:
  - "unlockPendingCategories rethrows a signer-refusal error (message contains \"user\", mirroring pending-decryption-alert.tsx) immediately to stop the batch; other errors are logged and looped past, with the first-seen failure thrown after the loop for useAsyncAction to toast (D-08 single-toast-site)"
  - "Auto-unlock driver never calls unlock() unless isAutoUnlockEnabled(category.id) is true AND the accountId:categoryId key is not already in the session's attempted set; the set is cleared only on accounts.active$ distinct-account emissions (app start counts as the first one), never on pendingUnlockState$ updates — this is what makes D-06's cross-device-relock-and-wait behavior hold"

patterns-established:
  - "PendingUnlockCategory descriptor shape: id, label, description?, count$, canUnlock$, unlock(), unlockComponent? — the contract every future category registration (mutes, decryption-cache, and later DMs) must implement"

requirements-completed: [D-01, D-02, D-05, D-08]

coverage:
  - id: D1
    description: "Generic pending-unlock registry: registerPendingUnlockCategory + pendingUnlockCategories$/pendingUnlockState$/pendingUnlockTotal$, with pendingUnlockTotal$ correctly emitting 0 when no categories are registered"
    requirement: "D-02"
    verification:
      - kind: other
        ref: "pnpm build (tsc --project tsconfig.json && vite build) — type-checks pending-unlock.ts; grep-verified all 10 required exports present, shareReplay used twice, zero toast/chakra references"
        status: pass
    human_judgment: false
  - id: D2
    description: "autoUnlockAll (default false) and autoUnlockCategories (default {}) preferences wired into localSettings via PreferenceSubject"
    requirement: "D-01"
    verification:
      - kind: other
        ref: "pnpm build; grep-verified storage keys and localSettings members; git diff --stat shows insertions only"
        status: pass
    human_judgment: false
  - id: D3
    description: "unlockPendingCategories propagates a failing category's Error to the caller instead of catching/toasting internally, so useAsyncAction remains the single toast site"
    requirement: "D-08"
    verification:
      - kind: other
        ref: "src/services/pending-unlock.ts unlockPendingCategories — source review confirms no catch-and-toast; grep confirms zero useToast/@chakra-ui references in the file"
        status: pass
    human_judgment: false
  - id: D4
    description: "With both auto-unlock preferences at their defaults, the auto-unlock driver never calls category.unlock(); once enabled it attempts each eligible category at most once per account per app session"
    requirement: "D-01"
    verification:
      - kind: manual_procedural
        ref: "Plan 01-01 Task 3 M-1: reload the app with a locked hidden mute list and default preferences, confirm zero NIP-07/nostr-connect prompts"
        status: unknown
    human_judgment: true
    rationale: "M-1 requires a live browser with a configured signer and an account whose kind-10000 mute list has hidden entries — unavailable in this sandboxed, non-interactive execution. Static verification passed: pnpm build (including tsc type-check) succeeded, and source review confirms `category.unlock()` is reachable in the driver only after the `isAutoUnlockEnabled(row.category.id)` guard, with the guard reading defaults of `autoUnlockAll: false` / `autoUnlockCategories: {}`. The live-signer-prompt observation is deferred to end-of-phase UAT (logged in .planning/WINDOWS.md)."

duration: ~15min
completed: 2026-08-19
status: complete
---

# Phase 1 Plan 1: Pending-Unlock Registry & Auto-Unlock Preferences Summary

**Generic RxJS pending-unlock registry (`src/services/pending-unlock.ts`) plus two new `auto-unlock-all`/`auto-unlock-categories` preferences, with a preference-gated driver that fires at most once per account per app session.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-19T17:30Z (approx, first commit)
- **Completed:** 2026-08-19T17:37Z
- **Tasks:** 3
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments
- Added `localSettings.autoUnlockAll` (boolean, default `false`) and `localSettings.autoUnlockCategories` (`Record<string, boolean>`, default `{}`) to `src/services/preferences.ts`, following the existing `PreferenceSubject.boolean`/`PreferenceSubject.create` conventions and grouping.
- Created `src/services/pending-unlock.ts`, a module-scope RxJS registry singleton mirroring `decryption-cache.ts`'s idiom: `registerPendingUnlockCategory`, `pendingUnlockCategories$`, `pendingUnlockState$` (guards the empty-array `combineLatest` trap with `of([])`), `pendingUnlockTotal$`, `autoUnlockEnabled$`, `isAutoUnlockEnabled`, `setAutoUnlockCategory`, and `unlockPendingCategories` (sequential batch unlock that rethrows signer-refusal errors immediately and the first other failure after the loop).
- Appended the preference-gated auto-unlock driver: drives off `accounts.active$` (distinct by account id), resets its per-account attempted set only on app start / explicit account switch, and calls `category.unlock()` at most once per `${accountId}:${categoryId}` pair, only when `isAutoUnlockEnabled` is true.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the auto-unlock preferences to the preferences service** - `102528a85` (feat)
2. **Task 2: Create the pending-unlock registry service** - `88176172a` (feat)
3. **Task 3: Add the preference-gated auto-unlock driver** - `98070e947` (feat)

**Plan metadata:** (pending — this commit)

## Files Created/Modified
- `src/services/pending-unlock.ts` - New registry service: category descriptor type, registration API, derived aggregate observables, batch unlock, and the auto-unlock driver.
- `src/services/preferences.ts` - New `// Pending unlock` preference group (`autoUnlockAll`, `autoUnlockCategories`) inserted between the existing `// Decryption cache` and `// Direct messages` groups; added `safeParse` import.

## Decisions Made
- Kept `unlockPendingCategories`'s error policy exactly as specified: signer-refusal errors (lowercased message contains `"user"`) stop the batch immediately (mirrors `pending-decryption-alert.tsx`); any other error is logged and the loop continues, with the first-seen non-refusal failure thrown after the loop so `useAsyncAction` can toast it.
- The auto-unlock driver carries `{ account, rows }` through a single `switchMap` (rather than reading `accounts.active` synchronously inside the `subscribe` callback) so the attempted-set key always reflects the account that produced the emission, avoiding a race if the active account changes between the `switchMap` and the `subscribe` callback running.

## Deviations from Plan

None - plan executed exactly as written. All three tasks' automated acceptance criteria (grep counts, `pnpm build` exit 0, scope isolation) were verified and passed without needing any Rule 1-3 auto-fixes.

## Issues Encountered

- **Task 3 manual check M-1 not executed.** The plan's `<verify><manual>` block for Task 3 requires reloading the running app with a live signer (NIP-07 extension or nostr-connect) and an account whose kind-10000 mute list has hidden entries, then confirming zero signer prompts appear. This sandboxed, non-interactive execution environment has no configured browser/signer/test account, so the live observation could not be performed. Mitigated by static verification: `pnpm build` (which runs `tsc --project tsconfig.json`) passed, confirming the file type-checks; and source review confirms `category.unlock()` in the driver is reachable only after `isAutoUnlockEnabled(row.category.id)` returns true, which reads `autoUnlockAll.value` (default `false`) and `autoUnlockCategories.value[id]` (default `{}`, so always `undefined`/falsy) — so by construction the driver cannot call `unlock()` at default settings. Logged as an unrun-verify item in `.planning/WINDOWS.md` for end-of-phase UAT to close out.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `src/services/pending-unlock.ts` exports the full registry API (`PendingUnlockCategory`, `PendingUnlockState`, `registerPendingUnlockCategory`, `pendingUnlockCategories$`, `pendingUnlockState$`, `pendingUnlockTotal$`, `autoUnlockEnabled$`, `isAutoUnlockEnabled`, `setAutoUnlockCategory`, `unlockPendingCategories`) that plans 01-02 through 01-06 (side-nav button, Privacy settings toggles, mute-list category, decryption-cache category, Muted view Private section) are expected to import.
- `localSettings.autoUnlockAll`/`localSettings.autoUnlockCategories` persist through `PreferenceSubject` and are ready for the Privacy settings UI (plan 01-04 per ROADMAP) to bind to via `use$`.
- Blocker for downstream plans: none. The one open item is the deferred M-1 live-signer verification, which does not block building on top of the registry (the code path is statically proven safe at default settings) but should be re-run once a UAT environment with a real signer is available.

---
*Phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache*
*Completed: 2026-08-19*

## Self-Check: PASSED

- FOUND: src/services/pending-unlock.ts
- FOUND: src/services/preferences.ts
- FOUND commit: 102528a85 (Task 1)
- FOUND commit: 88176172a (Task 2)
- FOUND commit: 98070e947 (Task 3)
- Scope isolation: `git status --porcelain src/ | grep -v 'pending-unlock.ts\|preferences.ts'` returned empty (no files outside plan scope touched)
