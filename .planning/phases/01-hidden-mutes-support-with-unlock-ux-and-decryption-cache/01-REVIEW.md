---
phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
reviewed: 2026-08-19T17:38:10Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - src/components/icons.tsx
  - src/components/layout/components/pending-unlock-button.tsx
  - src/components/layout/desktop/side-nav.tsx
  - src/components/layout/mobile/nav-drawer.tsx
  - src/components/menu/mute-user.tsx
  - src/components/pending-unlock/cache-unlock-form.tsx
  - src/components/pending-unlock/pending-unlock-modal.tsx
  - src/helpers/nostr/mute-list.ts
  - src/hooks/use-pending-unlock-category.ts
  - src/hooks/use-user-mute-actions.ts
  - src/index.tsx
  - src/models/mutes.ts
  - src/services/pending-unlock-cache.ts
  - src/services/pending-unlock-mutes.ts
  - src/services/pending-unlock.ts
  - src/services/preferences.ts
  - src/views/lists/muted/components/muted-user-card.tsx
  - src/views/lists/muted/components/private-mutes-section.tsx
  - src/views/lists/muted/index.tsx
  - src/views/settings/privacy/index.tsx
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-19T17:38:10Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

The pending-unlock registry (`src/services/pending-unlock.ts`), the two registered categories
(`pending-unlock-mutes.ts`, `pending-unlock-cache.ts`), and the UI surfaces that consume them
(nav button/modal, Privacy settings, Muted view) are well structured and match their own design
comments closely. The D-01 "no signer prompt without an opt-in" invariant holds: the only
auto-unlock driver is gated by `isAutoUnlockEnabled()` and defaults to false, and no other code
path in the reviewed files calls `category.unlock()` outside a user click. The `watchEventUpdates`
usage in `pending-unlock-mutes.ts` is correct and necessary given `eventStore.replaceable()` is
consumed directly (verified against `applesauce-common`'s `MuteModel`/`HiddenMuteModel`, which
already bake in `watchEventUpdates` themselves — no double-invalidation bug there).

The one critical finding is a genuine, easily reproducible privacy regression: the `mute()` write
path in `useUserMuteActions` was not updated in lockstep with `unmute()`. `unmute()` was correctly
made half-aware via the new `getMuteHalf()`/`muteHalf` machinery (D-13), but `mute()` still writes
unconditionally to the public half with no awareness of `muteHalf` or lock state. Combined with
`isMuted` now being sourced from the *merged* (unlock-aware) mute model, a user who has an
existing hidden mute that is currently locked (the default state on every app start per D-01) will
see that user as "not muted" and, if they click "Mute" again, will have that pubkey silently added
to the **plaintext** public mute list — permanently publishing to relays a mute the user chose to
keep private. This is exactly the class of leak the phase's own D-13 guard rail was built to
prevent on the unmute side; the mute side needs the same treatment.

## Critical Issues

### CR-01: Muting an already-hidden-muted (but locked) pubkey publishes it publicly, leaking a private mute

**File:** `src/hooks/use-user-mute-actions.ts:28-32`
**Issue:**
```ts
const { run: mute } = useAsyncAction(async () => {
  let draft = muteListAddPubkey(muteList || createEmptyMuteList(), pubkey);
  draft = pruneExpiredPubkeys(draft);
  await publish("Mute", draft, undefined, false);
}, [publish, muteList]);
```
`mute()` never consults `muteHalf` (added a few lines below this in the same file, at line 25) or
the lock state of the hidden half, unlike the now-half-aware `unmute()`. `isMuted` (line 23) is
sourced from `useUserMutes` → `MutesQuery` → applesauce's `MuteModel`, which merges hidden mutes
into the result **only when the hidden half is unlocked** (`getMutedThings` in
`applesauce-common/dist/helpers/mute.js` only merges hidden mutes `if (hidden)` is truthy, i.e.
already decrypted). With the hidden half locked — the default state on every app start per D-01,
since auto-unlock is off by default — a pubkey that is only privately (hidden) muted reports
`isMuted === false`.

Reachable path: `MuteUserMenuItem` (`src/components/menu/mute-user.tsx:20`) renders "Mute User"
(not "Unmute User") for such a pubkey and, on click, opens `MuteModalProvider`'s `MuteModal`,
whose `handleClick` calls `muteListAddPubkey(draft, pubkey, expiration)` unconditionally and
publishes. `muteListAddPubkey` → `listAddPerson` (`src/helpers/nostr/lists.ts:109-124`) only
guards against a duplicate **plaintext** `p` tag (`list.tags.some((t) => t[0] === "p" ...)`) — it
has no way to see the encrypted hidden tags, so it happily adds the pubkey to the public tag list
even though it is already privately muted. The result is a mute list published to relays with the
pubkey now present in **both** halves: the previously-private mute intent is now publicly visible
to anyone who reads the user's kind-10000 event, with no toast, warning, or confirmation.

(Secondary consequence: once this duplicate exists, `getMuteHalf` checks the public half first, so
a subsequent "Unmute" only removes the public copy and silently leaves the hidden copy orphaned —
the user is still privately muting that pubkey without realizing it.)

**Fix:** Gate `mute()` the same way `unmute()` was gated — bail out (or block with the same
"unlock first" error) when the pubkey is already muted via the hidden half or when the hidden half
is locked and could plausibly already contain this pubkey:
```ts
const { run: mute } = useAsyncAction(async () => {
  if (muteHalf === "hidden") return; // already muted privately, nothing to publish
  if (muteHalf === "unknown" && muteList && hasHiddenTags(muteList) && !isHiddenMutesUnlocked(muteList)) {
    throw new Error("Unlock your private mute list before muting this user");
  }
  let draft = muteListAddPubkey(muteList || createEmptyMuteList(), pubkey);
  draft = pruneExpiredPubkeys(draft);
  await publish("Mute", draft, undefined, false);
}, [publish, muteList, muteHalf]);
```
(`hasHiddenTags`/`isHiddenMutesUnlocked` are already imported elsewhere in this phase's diff, e.g.
`src/helpers/nostr/mute-list.ts` and `src/views/lists/muted/components/private-mutes-section.tsx`.)
At minimum, disable the "Mute User" menu item / require an explicit unlock before allowing a
"mute" write whenever the list has locked hidden content, mirroring the `canUnmute` treatment
already applied to unmute.

## Warnings

### WR-01: Overly broad substring match for detecting signer refusal can misclassify unrelated errors

**File:** `src/services/pending-unlock.ts:23,133`
**Issue:**
```ts
const SIGNER_REFUSAL_SUBSTRING = "user";
...
if (error instanceof Error && error.message.toLowerCase().includes(SIGNER_REFUSAL_SUBSTRING)) {
  throw error;
}
```
Any error whose lowercased message merely contains the substring `"user"` — not necessarily a
signer-rejection — is treated as a user-cancelled decrypt and immediately rethrown, aborting
`unlockPendingCategories()`'s batch loop for every remaining eligible category rather than logging
and continuing. Plausible unrelated matches include relay/network errors, validation errors, or
future category error messages that happen to mention "user" (e.g. "invalid user pubkey",
"user profile not found"). This mirrors an existing pattern in
`src/views/messages/components/pending-decryption-alert.tsx`, so it's not a new technique, but as
this phase generalizes it into the shared multi-category batch/auto-unlock driver the blast radius
of a false-positive match grows (it now stops *every* remaining category's unlock attempt, not
just one feature's).
**Fix:** Match on a more specific signal where available (e.g. a typed/coded rejection from the
signer, or a documented, narrower phrase such as `"rejected"`/`"denied"`/`"user rejected"`) instead
of the bare substring `"user"`.

### WR-02: `unlock()` on the decryption-cache category is unreachable dead code that could mask a real regression

**File:** `src/services/pending-unlock-cache.ts:26-30`
**Issue:**
```ts
async function unlock(): Promise<void> {
  const stats = await firstValueFrom(decryptionCacheStats$);
  if (!stats.isLocked) return;
  throw new Error("The message cache password is required to unlock it");
}
```
This function can never be invoked through any code path in the reviewed files:
`unlockPendingCategories()` filters out any row with `unlockComponent !== undefined`
(`pending-unlock.ts:125`), the auto-unlock driver does the same (`pending-unlock.ts:169`), and
`PendingUnlockRow` in the modal only calls `category.unlock()` when `category.unlockComponent` is
falsy (`pending-unlock-modal.tsx:45-62`) — otherwise it renders `category.unlockComponent`
directly. Since `PendingUnlockCategory.unlock` is a required field, some implementation is
unavoidable, but the current one silently no-ops or throws in a way no caller will ever observe.
If a future refactor changes the "categories with `unlockComponent` are excluded from
batch/auto-unlock" invariant (the very thing this function's doc comment relies on), this function
would start being called for the first time with no test coverage exercising it.
**Fix:** Either make the body genuinely inert and self-documenting (e.g.
`async function unlock(): Promise<void> { /* no-op: this category only unlocks via its unlockComponent */ }`)
or add a runtime assertion/comment pointing back at the two filter sites so a future change to
either filter is forced to reconsider this function.

## Info

### IN-01: `autoUnlockCategories` preference decoder accepts non-Record JSON (e.g. arrays) as valid

**File:** `src/services/preferences.ts:117-124`
**Issue:**
```ts
decode: (raw) => {
  const value = safeParse<Record<string, boolean>>(raw);
  if (value && typeof value === "object") return value;
  else return {};
},
```
`typeof value === "object"` is also true for arrays (`typeof [] === "object"`), so a malformed or
externally-tampered stored value like `["mutes"]` would pass validation and be used directly as
the `Record<string, boolean>`, rather than falling back to `{}`. Downstream usage
(`categories[id] === true` in `autoUnlockEnabled$`/`isAutoUnlockEnabled`) degrades gracefully
(array index lookups by string id just return `undefined`), so this isn't currently exploitable,
but it's a latent type-safety gap in input validation for a security-relevant preference (it gates
automatic signer decrypt calls).
**Fix:** `if (value && typeof value === "object" && !Array.isArray(value)) return value;`

### IN-02: Deprecated `onKeyPress` handler

**File:** `src/components/pending-unlock/cache-unlock-form.tsx:53`
**Issue:** `onKeyPress={(e) => e.key === "Enter" && !unlock.loading && unlock.run()}` uses React's
deprecated `onKeyPress` event (removed from newer React typings/behavior in favor of `onKeyDown`).
Functionally it still works in this React version, but it's an anti-pattern for new code and will
need to be migrated eventually.
**Fix:** `onKeyDown={(e) => e.key === "Enter" && !unlock.loading && unlock.run()}`

---

_Reviewed: 2026-08-19T17:38:10Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
