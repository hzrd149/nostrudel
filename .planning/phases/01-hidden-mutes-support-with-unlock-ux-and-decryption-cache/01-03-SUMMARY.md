---
phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
plan: 03
subsystem: services
tags: [rxjs, applesauce, mute-list, decryption-cache, pending-unlock]

# Dependency graph
requires:
  - phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
    provides: "Generic pending-unlock registry (registerPendingUnlockCategory, pendingUnlockState$/Total$, unlockPendingCategories, auto-unlock driver) from plan 01-01"
provides:
  - "Registered pending-unlock category id \"mutes\" (src/services/pending-unlock-mutes.ts), the phase's only mute-list source"
  - "Registered pending-unlock category id \"decryption-cache\" (src/services/pending-unlock-cache.ts), with its own password unlockComponent"
  - "src/components/pending-unlock/cache-unlock-form.tsx, a reusable compact password form for the decryption cache"
  - "Eager registration of both categories at app init via src/index.tsx side-effect imports"
affects: [01-04, 01-05, 01-06]

# Actuals (#2632)
actuals:
  tokens: 4600
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Category registration module: module-scope count$/canUnlock$ observables + async unlock() that throws (never catches), registered via a single registerPendingUnlockCategory call at import time — mirrors the registry's own decryption-cache.ts-inspired RxJS idiom"
    - "watchEventUpdates(eventStore) on a replaceable-event observable is the required pattern for any count$ that must react to symbol-mutation-cached unlock results (applesauce mutates the event object in place; only notifyEventUpdate, surfaced through this operator, produces a re-emission)"

key-files:
  created:
    - src/services/pending-unlock-mutes.ts
    - src/services/pending-unlock-cache.ts
    - src/components/pending-unlock/cache-unlock-form.tsx
  modified:
    - src/index.tsx

key-decisions:
  - "canUnlock$ for the mutes category reports false only for a ReadonlyAccount, never hides the pending count itself — a signer-less account still sees it has locked content (resolves RESEARCH.md Open Question 2 in favor of 'disable, don't hide')."
  - "The decryption-cache category's unlock() is a narrow guard (resolves if already unlocked, otherwise throws) rather than a real unlock path, since unlockComponent excludes it from both the batch and auto-unlock drivers — the password form is the only real entry point."
  - "cache-unlock-form.tsx duplicates require-decryption-cache.tsx's validation/toast logic verbatim rather than extracting a shared hook, per the plan's explicit instruction to leave require-decryption-cache.tsx untouched and treat the duplication as a security-reuse requirement, not a refactor opportunity."

patterns-established:
  - "Any future pending-unlock source (DMs, other HiddenTagsKinds lists) should follow pending-unlock-mutes.ts's shape: count$ via watchEventUpdates, canUnlock$ gating action (not visibility) on signer capability, unlock() that throws."

requirements-completed: [D-01, D-03, D-06, D-07, D-09]

coverage:
  - id: D1
    description: "Registry reports one pending mutes item when the active account's kind-10000 list has locked hidden entries, zero once unlocked by either a deliberate unlock or a decryption-cache restore — no manual refresh needed"
    requirement: "D-03"
    verification:
      - kind: unit
        ref: "pnpm build (tsc type-check); grep-verified watchEventUpdates piped into count$'s map, registerPendingUnlockCategory called with id \"mutes\""
        status: pass
    human_judgment: true
    rationale: "The live behavior (count reaching zero on both unlock paths without a manual refresh) requires a real signer session with a hidden mute list and cannot be exercised in this sandboxed, non-interactive environment. Static verification (type-check, source review confirming watchEventUpdates(eventStore) is piped before the count-deriving map, and confirming unlockHiddenMutes/notifyEventUpdate is the only path that mutates the event) is complete; the live reload-restore observation is deferred to end-of-phase UAT (logged in .planning/WINDOWS.md, entries 3-4)."
  - id: D2
    description: "Timelines silently under-filter while hidden mutes are locked — no banner, alert, or warning anywhere (D-07); use-user-mute-filter.ts and use-client-side-mute-filter.ts left untouched"
    requirement: "D-07"
    verification:
      - kind: unit
        ref: "git status --porcelain src/hooks/use-user-mute-filter.ts src/hooks/use-client-side-mute-filter.ts returns empty (zero diff, confirmed both before and after all three tasks)"
        status: pass
    human_judgment: true
    rationale: "M-4's full assertion (event visible while locked, no banner appears anywhere on the page, event filtered after unlock+reload) requires visually inspecting a live timeline with a real signer session — unavailable here. The structural guarantee (zero changes to either filter hook, so their existing under-filtering behavior is provably unchanged) is verified; the live visual check is deferred to end-of-phase UAT (WINDOWS.md entry 3)."
  - id: D3
    description: "A cross-device mute-list replacement returns the mutes category to pending and stays there until the user acts — no auto re-unlock (D-06)"
    requirement: "D-06"
    verification:
      - kind: unit
        ref: "Source review: pending-unlock-mutes.ts adds no unlocked-before flag; count$ re-derives purely from the current replaceable event's hasHiddenTags/isHiddenMutesUnlocked on every watchEventUpdates emission, so a new event id (new content, locked) always recomputes to 1. The registry's existing auto-unlock driver (01-01) only fires on distinct-account emissions, never on a mute-list update, so a mid-session replacement is never auto-unlocked."
        status: pass
    human_judgment: true
    rationale: "The end-to-end cross-device scenario (publish a replacement from a second client, observe the count return to 1 with no signer prompt in session A) requires two live signer sessions and cannot be exercised here. The code-level guarantee is structurally verified by source review; the live observation is deferred to end-of-phase UAT (WINDOWS.md entry 4)."
  - id: D4
    description: "The decryption-cache lock is a pending item at default encryptDecryptionCache=true, reachable outside the Messages route, dropping to zero after the correct password (D-09)"
    requirement: "D-09"
    verification:
      - kind: unit
        ref: "pnpm build; grep-verified decryptionCacheStats$.isLocked drives count$, unlockComponent set to the new form, zero new crypto call sites (grep for crypto./subtle/pbkdf2/PBKDF2/createCipher across both new files returns 0)"
        status: pass
    human_judgment: true
    rationale: "Confirming the pending count is visible via the debug console and drops to zero after entering the real password requires a live browser session with enableDebugApi on — unavailable here. Static verification (type-check, source review confirming count$ derives from the existing isLocked field with no new persistence/crypto path, and that the form calls the same EncryptedStorage.unlock(password)) is complete; the live console observation is deferred to end-of-phase UAT (WINDOWS.md entry 5)."
  - id: D5
    description: "A read-only account still sees the pending mute indicator but cannot trigger the unlock"
    requirement: "D-01"
    verification:
      - kind: unit
        ref: "Source review: canUnlock$ maps ReadonlyAccount to false while count$ is independent of canUnlock$ (derived solely from accounts.active$ and the mute-list event) — an account being ReadonlyAccount never routes through the of(0) branch, so the count still reports 1 while canUnlock$ reports false. unlock() also throws an explicit descriptive error if called anyway (defense in depth against a UI that doesn't check canUnlock$)."
        status: pass
    human_judgment: false

duration: ~18min
completed: 2026-08-19
status: complete
---

# Phase 1 Plan 3: Mute-list and decryption-cache pending-unlock registrations Summary

**Two new pending-unlock category registrations — `mutes` and `decryption-cache` — wired into the plan 01-01 registry with zero new crypto, persistence, or timeline-filter changes.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-08-19T16:46Z (approx, first commit)
- **Completed:** 2026-08-19T16:57Z
- **Tasks:** 3
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments
- Created `src/services/pending-unlock-mutes.ts`, registering category id `mutes` (label "Mute lists"). `count$` follows `accounts.active$` into `eventStore.replaceable(kinds.Mutelist, pubkey)` piped through `watchEventUpdates(eventStore)`, reporting 1 whenever the list `hasHiddenTags` and is not `isHiddenMutesUnlocked`. `canUnlock$` disables (but does not hide) the unlock action for `ReadonlyAccount`s. `unlock()` reads the account and list synchronously, no-ops if already unlocked, otherwise awaits `unlockHiddenMutes` — every error propagates to the caller's `useAsyncAction`.
- Created `src/components/pending-unlock/cache-unlock-form.tsx`, a self-contained password form (`FormControl` + `Input` + `Unlock` button, nothing else) that reuses `require-decryption-cache.tsx`'s exact validation and toast behavior — empty-password warning, `EncryptedStorage.unlock(password)` call, incorrect-password toast, Enter-key submit — with an `onUnlocked` callback prop and zero new crypto.
- Created `src/services/pending-unlock-cache.ts`, registering category id `decryption-cache` (label "Message cache"). `count$` maps `decryptionCacheStats$.isLocked` to 1/0. `canUnlock$` is a constant `true` (the password isn't account-bound). `unlockComponent` is set to the new form, which is what excludes this category from the batch and auto-unlock drivers. `unlock()` is a narrow guard that resolves only when already unlocked/unencrypted, otherwise throws — it is unreachable through the normal UI since `unlockComponent` is set.
- Added two static side-effect imports to `src/index.tsx`, immediately after `./services/decryption-cache`, so both categories register before any UI reads `pendingUnlockTotal$` and after the cache singleton/`persistEncryptedContent` subscription is already established.

## Task Commits

Each task was committed atomically:

1. **Task 1: Register the mute-list pending-unlock category** - `c2cfac78d` (feat)
2. **Task 2: Build the cache password form and register the decryption-cache category** - `33a11ee53` (feat)
3. **Task 3: Register both categories at app init** - `1a4f05493` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/services/pending-unlock-mutes.ts` - Registers pending-unlock category `mutes`; count$/canUnlock$/unlock() built entirely on applesauce's existing `hasHiddenTags`/`isHiddenMutesUnlocked`/`unlockHiddenMutes` helpers, no new decryption/tag-parsing/persistence code.
- `src/services/pending-unlock-cache.ts` - Registers pending-unlock category `decryption-cache`; count$ reuses `decryptionCacheStats$.isLocked`, unlockComponent set to the new form.
- `src/components/pending-unlock/cache-unlock-form.tsx` - Compact password form for the decryption cache, reusing `EncryptedStorage.unlock(password)` and `require-decryption-cache.tsx`'s validation verbatim.
- `src/index.tsx` - Two new static side-effect imports (2 lines inserted, 0 deleted), placed after `./services/decryption-cache`.

## Decisions Made
See `key-decisions` in frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed a duplicate `unlockComponent` mention from a source comment**
- **Found during:** Task 2 acceptance-criteria verification
- **Issue:** The plan's acceptance criteria require `grep -c 'unlockComponent' src/services/pending-unlock-cache.ts` to return exactly 1. My first draft's JSDoc comment on `unlock()` referenced `unlockComponent` by name, bringing the count to 2 (comment + the actual field in the registration call).
- **Fix:** Reworded the comment to describe the exclusion mechanism ("the category descriptor below defines a self-contained unlock UI") without repeating the literal identifier.
- **Files modified:** `src/services/pending-unlock-cache.ts`
- **Verification:** `grep -c 'unlockComponent' src/services/pending-unlock-cache.ts` now returns 1; `pnpm build` still exits 0.
- **Committed in:** `33a11ee53` (Task 2 commit — fixed before commit, not a follow-up)

---

**Total deviations:** 1 auto-fixed (1 bug — a self-inflicted acceptance-criteria miss caught and fixed before committing).
**Impact on plan:** None on scope or behavior; purely a comment wording fix to satisfy an automated grep check.

## Issues Encountered

- **Manual verification blocks not executed.** All three tasks' `<verify><manual>` blocks (M-4/D-07 timeline under-filtering, M-3/D-06 cross-device replace-and-relock, M-6-mechanism/D-09 debug-console pending count) require a live browser with a configured nostr signer and, for M-3, a second client session — none of which are available in this sandboxed, non-interactive execution environment. Static verification (type-check via `pnpm build`, source review, and every automated acceptance-criteria grep) passed for all three. Logged as three unrun-verify items in `.planning/WINDOWS.md` (entries 3, 4, 5) for end-of-phase UAT to close out, consistent with how plans 01-01 and 01-02 handled the same limitation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Two live category registrations (`mutes`, `decryption-cache`) now exist in the registry alongside plan 01-01's mechanism, giving plans 01-04/01-05/01-06 (side-nav button, Privacy settings toggles, Muted view Private section) real categories to render instead of an empty registry.
- `src/components/pending-unlock/cache-unlock-form.tsx` is directly reusable as-is wherever the decryption-cache category's `unlockComponent` needs to be rendered (e.g. inside the nav button's popover in plan 01-04).
- Blocker for downstream plans: none. The three deferred manual checks (WINDOWS.md entries 3-5) do not block building the nav/settings/Muted-view UI on top of these registrations — they verify end-to-end UX that only becomes observable once that UI exists — but should be re-run together with the phase's other deferred UAT items once a live signer/relay environment is available.

---
*Phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache*
*Completed: 2026-08-19*

## Self-Check: PASSED

- FOUND: src/services/pending-unlock-mutes.ts
- FOUND: src/services/pending-unlock-cache.ts
- FOUND: src/components/pending-unlock/cache-unlock-form.tsx
- FOUND: src/index.tsx modified (git diff --stat shows 2 insertions, 0 deletions)
- FOUND commit: c2cfac78d (Task 1)
- FOUND commit: 33a11ee53 (Task 2)
- FOUND commit: 1a4f05493 (Task 3)
- Re-ran all automated acceptance criteria from all three tasks: all PASS (see per-task grep output above; `pnpm build` exits 0 on final state)
- Scope isolation: `git status --porcelain src/services/decryption-cache.ts src/providers/route/require-decryption-cache.tsx src/hooks/use-user-mute-filter.ts src/hooks/use-client-side-mute-filter.ts` returned empty (no files outside plan scope touched)
