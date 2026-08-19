# Phase 1: Hidden mutes support with unlock UX and decryption cache - Research

**Researched:** 2026-08-19
**Domain:** Nostr hidden-content unlock UX (applesauce mute helpers/models/actions) + RxJS service registry + Chakra/react-window UI
**Confidence:** HIGH (applesauce API surface, decryption-cache persistence path, existing UI precedents — all verified by reading the actual installed `node_modules` dist sources) / MEDIUM (registry design, nav placement, virtualization split — these are this phase's genuinely new code, verified against conventions but not pre-existing)

## Summary

Phase 1 has two halves. The **applesauce half** is almost entirely "wire it up" — `unlockHiddenMutes`, `isHiddenMutesUnlocked`, `getHiddenMutedThings`, `getPublicMutedThings`, `mergeMutes`, `matchMutes`, `MuteModel`/`PublicMuteModel`/`HiddenMuteModel`, and `MuteUser`/`UnmuteUser(pubkey, hidden)` all exist today at the exact signatures CONTEXT.md described, in `applesauce-common@6.2.0` and `applesauce-actions@6.2.0`, both already in `package.json`. The decryption-cache persistence claim is **fully verified true**: `persistEncryptedContent` in `applesauce-common/dist/helpers/encrypted-content-cache.js` persists/restores by `event.id` for *any* kind registered in the shared `EventContentEncryptionMethod` map, and kind 10000 gets added to that map as a side effect of importing `applesauce-core/dist/helpers/hidden-tags.js` (which `applesauce-common/helpers/mute.js` imports transitively). No new cache code is needed for Phase 1.

The **new-code half** — the pending-unlock registry, its side-nav affordance, the Privacy-settings preferences, the Muted view's Private section, and the unmute-split write path — has no direct precedent in the codebase, but every building block it needs already exists as a pattern to copy: `src/services/decryption-cache.ts`'s RxJS `combineLatest`/`shareReplay` shape for the registry; `src/views/messages/components/pending-decryption-alert.tsx` for the count+action-button UI and its "stop on user cancellation" loop; `src/views/lists/components/list-history-modal.tsx` for the locked-badge/unlock-button/forced-re-render pattern; `src/components/layout/components/nav-item.tsx` for how side-nav elements should self-adapt to the collapsed desktop rail (not hide, like `RelayConnectionButton`/`PublishLogButton` currently do); and `src/services/preferences.ts`'s `PreferenceSubject.create` with custom encode/decode for a JSON-object preference (the per-category map).

**Primary recommendation:** Build `src/services/pending-unlock.ts` as a small registry service (array of `PendingUnlockCategory` objects, each with a reactive `count$` and an `unlock()` function) using the exact `combineLatest`/`shareReplay` idiom already in `decryption-cache.ts`; register two categories at app init — `mutes` (built on `MuteModel`/`hasHiddenTags`/`isHiddenMutesUnlocked`) and `decryption-cache` (built on the existing `decryptionCacheStats$`/`EncryptedStorage.unlock`) — and drive the side-nav button, Privacy toggles, and Muted-view Private section off that one registry.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hidden mute decryption (signer call) | Browser / Client | — | `unlockHiddenMutes`/`unlockHiddenTags` run in-browser against `window.nostr` / nostr-connect / local signer; no server involved (noStrudel has no backend). |
| Decrypted-content persistence (decryption cache) | Browser / Client (IndexedDB via `localforage`) | — | `persistEncryptedContent` writes to a `localforage` instance (IndexedDB), optionally AES-CBC wrapped by `EncryptedStorage`. Entirely client-side. |
| Pending-unlock registry (count + unlock orchestration) | Browser / Client (RxJS service singleton) | — | New `src/services/pending-unlock.ts`, same tier as `decryption-cache.ts`/`preferences.ts` — in-memory + Capacitor Preferences, no network. |
| Side-nav affordance / Privacy settings UI | Browser / Client (React) | — | Chakra components under `src/components/layout/` and `src/views/settings/privacy/`. |
| Muted view Private section | Browser / Client (React) | — | `src/views/lists/muted/index.tsx`, same tier as the existing public list. |
| Mute list read/write (publish) | Browser / Client, talking to Relay tier | Relay / Storage | Reads via `EventStore`/`eventStore.model(...)`; writes via `usePublishEvent`/`useActionRunner` which push signed events to relays (`applesauce-relay`). No new relay interaction patterns needed — reuses `usePublishEvent`. |
| Preferences persistence | Browser / Client (`@capacitor/preferences`) | — | `PreferenceSubject` already wraps this; auto-unlock prefs are local-only settings, not synced to relays. |

There is no SSR/API/CDN tier in this app (static Vite/PWA build, `README.md` confirms `https://nostrudel.ninja` is served as a static site/Docker image with no application backend) — every capability in this phase lives entirely client-side. `[VERIFIED: .planning/codebase/STACK.md, package.json scripts]`

## User Constraints (from CONTEXT.md)

<user_constraints>

### Locked Decisions

- **D-01:** No silent/automatic signer calls by default. Hidden mutes decrypt only from a deliberate user action. Explicitly rejected: extending `autoDecryptMessagesFallback` in `src/services/decryption-cache.ts` to auto-unlock kind 10000 at startup.
- **D-02:** The unlock affordance is **application-wide and generic**, not mute-specific: an indicator + button in the side nav showing that things (lists, DMs, mutes, etc.) are pending unlock. Pressing it offers two actions — unlock the pending items **once**, or **enable auto-unlock going forward**, saved as a preference.
- **D-03:** Phase 1 delivers the generic mechanism with **mute lists as the only registered source**. The nav count is therefore mutes-only (plus the cache-lock item, D-09) on day one.
- **D-04:** Auto-unlock preferences live in the **Privacy settings section** (`src/views/settings/privacy/index.tsx`): an "unlock all" option, and — when that is unchecked — options for specific categories.
- **D-05:** The per-category list is **registry-driven**: each source registered with the mechanism contributes its own category and preference. This phase registers mutes, so Privacy shows "unlock all" + "Mute lists" only. No placeholder or disabled categories for unwired sources; the settings page grows as sources are registered.
- **D-06:** When the mute list is replaced from another device (new event id → decryption-cache miss → locked again), it simply **returns to locked and waits for the user**. No "has unlocked before" flag, no automatic re-unlock.
- **D-07:** While hidden mutes are locked, timelines **silently under-filter**. No banner, no warning, no gating on timeline views — the side-nav pending indicator is the single signal. (`useClientSideMuteFilter`/`useUserMuteFilter` need no changes; `MuteModel` already merges hidden mutes in the moment the event unlocks.)
- **D-08:** Failed unlock attempts (signer rejection, nostr-connect timeout, undecryptable content) **toast the error and leave the item pending and retryable**. No per-item failure state, no distinction between user cancellation and genuine errors.
- **D-09:** A locked decryption cache is **itself a pending item** in the mechanism, prompting for the cache password from the same place. `encryptDecryptionCache` defaults to `true`, so the cache is an `EncryptedStorage` that starts locked on every app start — and today the password is only ever prompted inside the Messages route via `RequireDecryptionCache`.
- **D-10:** Private mute entries get their **own "Private" section**, separate from the public list — not an inline badge and not tabs.
- **D-11:** While locked, that section renders a **locked placeholder with its own Unlock button**, in addition to the side-nav affordance. The entry count is unknowable while locked — `hasHiddenTags` reveals only that hidden content exists.
- **D-12:** The Private section renders **pubkeys only**, matching the existing public list. Private words/hashtags/threads are not surfaced.
- **D-13:** **Unmute correctness only.** No "mute privately" in this phase. Nothing shown in the Private section may have a Remove button that silently does nothing.
- **D-14:** Unmute **detects which half the pubkey lives in** (`getPublicMutedThings` vs `getHiddenMutedThings`) and acts accordingly: public entries keep today's helper path in `src/helpers/nostr/mute-list.ts` with `mute_expiration` pruning intact; hidden entries go through applesauce's `UnmuteUser(pubkey, true)`. Explicitly rejected: consolidating everything onto applesauce actions, and removing from both halves unconditionally.
- **D-15:** `isMuted` becomes **merged state** (from `MutesQuery`), so a privately-muted user reads as muted once unlocked. While locked it falls back to public-only and may misreport — accepted, consistent with D-07. Pressing Mute on an unknown private mute can add a public duplicate; applesauce's `addUser` dedupes within a half, not across halves.

### Claude's Discretion

None — the user selected a concrete option for every question in discussion. No "you decide" answers were given.

### Deferred Ideas (OUT OF SCOPE)

- Wire direct messages into the mechanism; reconcile `autoDecryptMessages` and `pending-decryption-alert.tsx` with the generic registry.
- Wire the remaining `HiddenTagsKinds` lists (bookmarks, follow sets, interests, public chats, search relays, communities, groups).
- "Mute privately" as a write feature (`MuteUser(pubkey, true)` from the UI).
- Managing muted words, hashtags, and threads in the UI.
- Deduplicating a pubkey muted both publicly and privately.
- Mute expirations for private entries.

</user_constraints>

<phase_requirements>
## Phase Requirements

No `REQUIREMENTS.md` exists for this project; per the orchestrator's instructions, CONTEXT.md's D-01…D-15 decisions are treated as the requirement set for this phase.

| ID | Description | Research Support |
|----|-------------|------------------|
| D-01 | No silent auto-unlock by default | Confirmed no existing code path auto-calls `unlockHiddenMutes`/`unlockHiddenTags`; `autoDecryptMessagesFallback` in `decryption-cache.ts` only handles `EncryptedDirectMessage`/`GiftWrap` kinds — verified by reading the file, kind 10000 is absent. |
| D-02, D-03 | Generic registry, mutes-only source | See "Pending-Unlock Registry Design" below — concrete `PendingUnlockCategory` shape and `registerPendingUnlockCategory` API. |
| D-04, D-05 | Registry-driven Privacy preferences | See "Preferences" section — `PreferenceSubject.create<Record<string,boolean>>` pattern plus where to slot into `privacy/index.tsx`. |
| D-06 | Cross-device replace re-locks | Verified via `PRESERVE_EVENT_SYMBOLS` (only `EncryptedContentSymbol`) and restore-by-`event.id` in `persistEncryptedContent` — a new event id is a cache miss. |
| D-07 | Silent under-filtering, no gating | Verified: `useUserMuteFilter`/`useClientSideMuteFilter` already call `MutesQuery`→`MuteModel`, which resolves to public-only mutes while locked and re-emits via `watchEventUpdates` the instant `notifyEventUpdate` fires on unlock. No code change needed in these two files. |
| D-08 | Toast + retryable, no per-item state | `useAsyncAction` already implements toast-on-`Error`-and-continue; `pending-decryption-alert.tsx`'s `error.message.includes("user")` break pattern is the precedent for stopping a batch loop on user cancellation. |
| D-09 | Cache lock as pending item | See "Cache-Lock Pending Item" section — reuses `decryptionCacheStats$`/`EncryptedStorage.unlock`, needs a small password-prompt UI reachable from the registry, not the full `RequireDecryptionCache` route gate. |
| D-10, D-11, D-12 | Muted view Private section | See "Muted View + Virtualization" section — concrete two-block layout recommendation. |
| D-13, D-14 | Unmute split path | See "Unmute Split Path" section — exact code paths in `use-user-mute-actions.ts`, `mute-user.tsx`, `muted/index.tsx`. |
| D-15 | Merged `isMuted` | See "Unmute Split Path" — `useUserMutes`/`MutesQuery` replaces `isPubkeyInList(muteList, pubkey)` in `use-user-mute-actions.ts`. |

</phase_requirements>

## Standard Stack

### Core

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `applesauce-common` | 6.2.0 `[VERIFIED: node_modules/applesauce-common/package.json]` | `unlockHiddenMutes`, `MuteModel`, `MuteUser`/`UnmuteUser` actions, `MuteListFactory` | Already the project's mute-list library; no alternative under consideration. |
| `applesauce-core` | 6.2.0 `[VERIFIED: node_modules/applesauce-core/package.json]` | `hasHiddenTags`, `isHiddenTagsUnlocked`, `unlockHiddenTags`, `HiddenTagsSymbol`, `HiddenTagsKinds` | Owns the generic hidden-content/hidden-tags primitives every NIP-51 hidden list (including mutes) is built on. |
| `applesauce-actions` | 6.2.0 `[VERIFIED: node_modules/applesauce-actions/package.json]` | `MuteUser(pubkey, hidden)`/`UnmuteUser(pubkey, hidden)` | Already used by `list-history-modal`-adjacent code (`mute-user.tsx`, `muted/index.tsx`) via `useActionRunner`. |
| `applesauce-react` | 6.0.0 `[VERIFIED: package.json]` | `use$`, `useEventModel`, `useActiveAccount`, `useActionRunner` | Existing React binding layer; no change needed. |
| `rxjs` | 7.8.2 `[VERIFIED: package.json]` | Registry service (`combineLatest`/`shareReplay`/`switchMap`) | Matches `decryption-cache.ts`/`preferences.ts` idiom exactly. |
| `react-window` + `react-virtualized-auto-sizer` | 1.8.11 / 1.0.26 `[VERIFIED: package.json]` | Muted view virtualization | Already used by `views/lists/muted/index.tsx`; Private section reuses the same `UserCard`/`MutedRow` components. |

**No new packages are required for this phase.** Every API this phase needs (mute helpers/models/actions, hidden-tags primitives, preferences, encrypted storage, virtualization) is already a direct dependency at a version that ships the exact functions CONTEXT.md described. `[VERIFIED: read from installed dist/*.js and *.d.ts, see Sources]`

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@chakra-ui/react` | 2.10.10 | `Badge`, `Alert`, `IconButton`, `ButtonGroup` for the nav button, locked placeholder, Privacy toggles | Consistent with every existing UI surface touched by this phase. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A dedicated `pending-unlock.ts` RxJS registry | React Context + `useReducer` | DISCUSSION-LOG explicitly flags "RxJS vs React context" as raised-but-undiscussed. RxJS wins: every other cross-cutting reactive state in the app (`decryptionCache$`, `connections$`, `localSettings.*`) is an RxJS observable read via `use$`, and the registry must be readable from both React (nav button) and non-component code (auto-unlock-on-preference-change) — a plain observable does both without a Provider tree. |
| Registry-driven per-category preference object | Individual boolean `PreferenceSubject` per category (e.g. `autoUnlockMutes`) | Individual booleans don't scale to "registry-driven" (D-05) without editing `preferences.ts` for every new source — a `Record<string, boolean>` keyed by category id, added to once via one `PreferenceSubject.create`, matches D-05's "no placeholder categories, list grows as sources register" requirement better. |

**Installation:** None — no new packages.

## Package Legitimacy Audit

**Not applicable.** This phase adds zero new npm dependencies; every function/class used is already present in `package.json` at the versions above. No `package-legitimacy` check was run because there is nothing to check.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ EventStore (existing)                                                │
│  kind 10000 mute-list event for active account                       │
└───────────────┬────────────────────────────────────────────────────┘
                 │ eventStore.model(MuteModel, pubkey)   (existing)
                 ▼
     ┌───────────────────────┐        watchEventUpdates() re-emits
     │ MutesQuery/MuteModel  │◄──────  when notifyEventUpdate() fires
     │ → MutedThings | undef │         (unlock, or cache restore)
     └───────────┬───────────┘
                 │ used by (existing, unchanged)
     ┌───────────┴────────────────────────────┐
     ▼                                         ▼
useUserMuteFilter/useClientSideMuteFilter   useUserMutes (Muted view,
  (timeline filtering — D-07, no change)      user profile tabs)

┌─────────────────────────────────────────────────────────────────────┐
│ NEW: src/services/pending-unlock.ts (registry, RxJS singleton)       │
│                                                                        │
│  registerPendingUnlockCategory({                                     │
│    id: "mutes", label: "Mute lists",                                 │
│    count$: Observable<number>,   ◄── derived from hasHiddenTags() +  │
│    unlock: (signer) => Promise<void>   isHiddenMutesUnlocked() on    │
│  })                                     the active account's list    │
│                                                                        │
│  registerPendingUnlockCategory({                                     │
│    id: "decryption-cache", label: "Message cache",                   │
│    count$: derived from decryptionCacheStats$.isLocked (existing),   │
│    unlock: (password) => EncryptedStorage.unlock(password)           │
│  })                                                                   │
│                                                                        │
│  pendingUnlockTotal$ = combineLatest(categories.count$) → sum        │
└───────────┬───────────────────────────────┬───────────────────────┘
            │ use$(pendingUnlockTotal$)      │ use$(perCategory.count$)
            ▼                                 ▼
  Side-nav PendingUnlockButton      Privacy settings per-category
  (desktop rail + mobile drawer)    toggles (registry-driven list)
            │
            │ button click → "Unlock now" or "Enable auto-unlock"
            ▼
  For each category: category.unlock() → signer round-trip
  (mutes: unlockHiddenMutes(event, signer) → notifyEventUpdate())
  (cache: EncryptedStorage.unlock(password))
  On error: toast + leave pending (D-08), no rethrow needed —
  useAsyncAction already swallows+toasts.

┌─────────────────────────────────────────────────────────────────────┐
│ Muted view (src/views/lists/muted/index.tsx)                         │
│  Public section: existing FixedSizeList over muted.pubkeys           │
│  Private section (NEW): locked placeholder + Unlock button (D-11)    │
│    OR capped-height list of hiddenMuted.pubkeys once unlocked (D-10) │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Unmute write path (D-14/D-15)                                        │
│  use-user-mute-actions.ts / mute-user.tsx / muted/index.tsx          │
│    getPublicMutedThings(muteListEvent).pubkeys.has(pubkey)?          │
│      → yes: existing helper path (mute-list.ts, mute_expiration)     │
│      → no, in hidden half: useActionRunner().exec(UnmuteUser,        │
│         pubkey, true)                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── services/
│   └── pending-unlock.ts          # NEW — registry: categories, count$, unlock()
├── components/layout/
│   ├── components/
│   │   └── pending-unlock-button.tsx   # NEW — nav button, imitates connections-button.tsx shape
│   ├── desktop/side-nav.tsx       # EDIT — add button outside the `{!collapsed && ...}` gate
│   └── mobile/nav-drawer.tsx      # EDIT — add button to the always-rendered ButtonGroup
├── views/settings/privacy/
│   └── index.tsx                  # EDIT — "unlock all" + registry-driven per-category toggles
├── views/lists/muted/
│   └── index.tsx                  # EDIT — add Private section (locked placeholder / capped list)
├── hooks/
│   └── use-user-mute-actions.ts   # EDIT — merged isMuted, split unmute path
├── components/menu/
│   └── mute-user.tsx              # EDIT — split unmute path
└── helpers/nostr/
    └── mute-list.ts                # UNCHANGED — public-tag helper path stays as-is
```

### Pattern 1: Registry service (RxJS singleton, mirrors `decryption-cache.ts`)

**What:** A module-level array of category descriptors plus a derived aggregate observable, exactly like `decryptionCache$`/`decryptionCacheStats$`.
**When to use:** For the pending-unlock registry itself.
**Example (recommended shape, not existing code — designed from the `decryption-cache.ts` precedent):**
```typescript
// src/services/pending-unlock.ts
import { BehaviorSubject, combineLatest, map, shareReplay, Observable } from "rxjs";

export type PendingUnlockCategory = {
  id: string;
  label: string;
  /** Number of locked items in this category for the active account (0 when nothing pending) */
  count$: Observable<number>;
  /** Attempt to unlock everything pending in this category. Must not throw for D-08 —
   *  callers wrap with useAsyncAction, which toasts Error and swallows it. */
  unlock: () => Promise<void>;
};

const categories$ = new BehaviorSubject<PendingUnlockCategory[]>([]);

export function registerPendingUnlockCategory(category: PendingUnlockCategory) {
  categories$.next([...categories$.value, category]);
  return () => categories$.next(categories$.value.filter((c) => c.id !== category.id));
}

export const pendingUnlockCategories$ = categories$.asObservable();

export const pendingUnlockTotal$ = categories$.pipe(
  switchMap((cats) => (cats.length === 0 ? of([]) : combineLatest(cats.map((c) => c.count$)))),
  map((counts) => counts.reduce((sum, n) => sum + n, 0)),
  shareReplay(1),
);
```
Source pattern for `combineLatest`/`switchMap`/`shareReplay` idiom: `src/services/decryption-cache.ts:27-54` (verified read above).

### Pattern 2: Mute-list category registration (built on `MuteModel`)

**What:** A source module (e.g. appended to `src/services/pending-unlock.ts` or a new `src/services/pending-unlock-mutes.ts`) that watches the active account's mute-list event and reports 1 pending item when it `hasHiddenTags` but is not `isHiddenMutesUnlocked`.
**When to use:** Registered once at app init (alongside where `decryptionCache$.subscribe()` self-starts today).
**Example:**
```typescript
import { hasHiddenTags, isHiddenTagsUnlocked } from "applesauce-core/helpers";
import { unlockHiddenMutes } from "applesauce-common/helpers";
import { kinds } from "nostr-tools";
import { map } from "rxjs";
import accounts from "./accounts";
import { eventStore } from "./event-store";

const muteListLocked$ = accounts.active$.pipe(
  switchMap((account) =>
    account
      ? eventStore.replaceable(kinds.Mutelist, account.pubkey).pipe(
          watchEventUpdates(eventStore), // re-emits on notifyEventUpdate (unlock or cache restore)
          map((event) => (event && hasHiddenTags(event) && !isHiddenTagsUnlocked(event) ? 1 : 0)),
        )
      : of(0),
  ),
);

registerPendingUnlockCategory({
  id: "mutes",
  label: "Mute lists",
  count$: muteListLocked$,
  unlock: async () => {
    const account = accounts.active;
    const event = account && (await firstValueFrom(eventStore.replaceable(kinds.Mutelist, account.pubkey)));
    if (event && account) await unlockHiddenMutes(event, account);
  },
});
```
`accounts.active$`/`accounts.active` naming pattern verified against `src/services/decryption-cache.ts:23` (`import accounts from "./accounts"`) and `src/services/accounts.ts` conventions used elsewhere. `[ASSUMED — exact `accounts` service surface (`active$` vs a different observable name) was not independently re-verified in this session; planner should confirm the exact accessor name in `src/services/accounts.ts` before writing this file.]`

### Pattern 3: Locked badge + unlock + forced re-render (existing precedent to copy verbatim)

**What:** `src/views/lists/components/list-history-modal.tsx`'s `HiddenVersions` component is the closest existing precedent for "show Locked badge, Unlock button, call `unlockHiddenTags`, force a re-render because the result is cached via a symbol mutation not a new object identity."
**When to use:** For the Muted view's Private-section unlock button (D-11) if it unlocks independently of the nav button, and as the reference implementation for error handling (swallow-and-log, matching D-08's "toast and stay pending").
**Verified excerpt (`src/views/lists/components/list-history-modal.tsx:305-330`):**
```typescript
// unlockHiddenTags caches the result on the event object (symbol), so force a re-render to reflect it
const [, refresh] = useReducer((x: number) => x + 1, 0);
...
const unlock = useCallback(async (event: NostrEvent) => {
  if (!account || isHiddenTagsUnlocked(event)) return;
  try {
    await unlockHiddenTags(event, account);
    refresh();
  } catch (error) {
    // ignore — the signer was denied or the content could not be decrypted
  }
}, [account]);
```
Note: for the registry-driven design, the Muted view's Private section should **not** duplicate this local unlock; it should read `count$`/locked-state from the registry (single source of truth per D-02) and call the registry's `unlock()`. `useForceUpdate` (`src/hooks/use-force-update.ts`) is available if a local re-render is still needed after `notifyEventUpdate` (in practice `MuteModel`'s `watchEventUpdates` already re-emits through `useEventModel`, so a manual forced re-render should not be necessary for the Muted view specifically — only `list-history-modal.tsx` needs it because it reads bare events outside a model).

### Pattern 4: Collapsed-nav-aware button (use `NavItem`'s pattern, not `RelayConnectionButton`'s)

**What:** `src/components/layout/components/nav-item.tsx` reads `useContext(CollapsedContext)` and renders an icon-only `IconButton` when collapsed, a labeled `Button` when expanded — **the button itself stays visible in both states.**
**When to use:** For the new pending-unlock nav button. This is the concrete resolution to the open placement question (research priority #4).
**Why not copy `RelayConnectionButton`/`PublishLogButton`:** Those are wrapped in `{!collapsed && (...)}` in `side-nav.tsx:54-59`, so they **disappear entirely** when the rail is collapsed. A security/privacy-relevant "you have locked content" indicator should not disappear — it should shrink to an icon+badge, matching `NavItem`'s approach.
**Verified excerpt (`src/components/layout/components/nav-item.tsx:20-36`):**
```typescript
const collapsed = useContext(CollapsedContext);
if (collapsed)
  return <IconButton aria-label={label} icon={<Icon boxSize={5} />} variant="ghost" ... />;
else
  return <Button leftIcon={<Icon boxSize={5} />} variant="link" ...>{label}</Button>;
```

### Recommended nav placement (resolves research priority #4)

| Surface | File | Placement | Behavior |
|---------|------|-----------|----------|
| Desktop expanded | `src/components/layout/desktop/side-nav.tsx` | New `<PendingUnlockButton>` in the bottom `ButtonGroup`, placed **outside** the existing `{!collapsed && (...)}` block (that block only wraps `RelayConnectionButton`/`PublishLogButton`, `side-nav.tsx:46-60`) | Full `Button` with label + count badge (e.g. "2 pending") when `count > 0`; renders `null` when `count === 0`. |
| Desktop collapsed | same file | Same component, same position — because it's outside the `!collapsed` gate it renders in collapsed state too | Icon-only `IconButton` with a small numeric `Badge` overlay, following `NavItem`'s collapsed branch. |
| Mobile | `src/components/layout/mobile/nav-drawer.tsx` | Add to the `ButtonGroup` at line 58-61, which is **already unconditionally rendered** (`CollapsedContext.Provider value={false}` at line 35 means it's never hidden) | Reached via the avatar tap → drawer open (`bottom-nav.tsx:30`); no change to `bottom-nav.tsx`'s fixed 5-icon row needed. |
| Mobile (optional enhancement) | `src/components/layout/mobile/bottom-nav.tsx` | A small `Badge` dot on the avatar `IconButton` (line 30) that opens the drawer | Gives an at-a-glance signal without opening the drawer. Recommended but not required — this specific micro-decision was not part of D-01…D-15 and is squarely "planner's call," unlike the rest of this phase. |

### Anti-Patterns to Avoid

- **Duplicating unlock state per surface:** Don't give the Muted view's Private-section Unlock button its own independent "is this pending" computation. Read from the registry's `count$`/category so the nav badge and the Muted-view placeholder can never disagree (D-02's single mechanism requirement).
- **Re-throwing from `unlock()`:** `useAsyncAction` already toasts `Error` and swallows it (D-08). Category `unlock()` implementations should let errors propagate (throw), not catch-and-toast themselves, so the single `useAsyncAction` wrapper at the call site is the one place that decides UX — don't double-toast.
- **Auto-unlocking on mount:** D-01 forbids silent signer calls. The auto-unlock *preference* (D-04/D-05), once enabled, should still only fire unlock on a deliberate trigger (e.g. app-start/account-switch effect explicitly gated by the preference), never unconditionally in a component render or a `useEffect` with no preference check.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hidden-tag decryption/caching | A custom "unlock and remember" mechanism for kind 10000 | `unlockHiddenMutes`/`unlockHiddenTags` (they already cache on the event via `HiddenTagsSymbol`/`EncryptedContentSymbol` and call `notifyEventUpdate`) + the existing `persistEncryptedContent` subscription in `decryption-cache.ts` | Verified: this is already running for every kind in `EventContentEncryptionMethod`, which includes 10000 once `hidden-tags.js` has been imported (it is, transitively, by `decryption-cache.ts` itself). Writing a second persistence path would double-write and risk desync. |
| Detecting which half a pubkey is muted in | Re-parsing `muteList.tags` / hidden JSON by hand | `getPublicMutedThings(event)` / `getHiddenMutedThings(event)` (both cache their parse via `MutePublicSymbol`/`MuteHiddenSymbol`) | These are the exact functions CONTEXT.md names for D-14; re-implementing tag parsing risks missing `mute_expiration` interactions or the singleton-tag dedupe applesauce already handles. |
| AES encryption for the decryption-cache password | A new crypto wrapper | `src/classes/encrypted-storage.tsx` (`EncryptedKeyValueStore`) — already implements PBKDF2 + AES-CBC + PKCS7 padding with a password-test-value scheme | D-09 only needs a *second place* to prompt for the same password against the same `EncryptedStorage` instance (`decryptionCache$`) — no new crypto code, just a new UI entry point calling `.unlock(password)`. |
| Registry pub/sub | Custom event emitter or React Context | RxJS `BehaviorSubject` + `combineLatest`, matching `decryptionCache$` | Consistency with every other cross-cutting service in `src/services/`; also the only option that's readable from both plain modules (auto-unlock-on-account-switch effects) and components (`use$`). |

**Key insight:** Every "hard part" of this phase (hidden-content crypto, caching, tag parsing, mute-list factory operations) is already solved inside applesauce and already wired into this codebase's `EventStore`/`decryption-cache.ts`. The actual new engineering surface is UI plumbing (registry → nav/settings/Muted-view) and one write-path branch (D-14) — nothing here requires new cryptography, new parsing, or a new persistence layer.

## Runtime State Inventory

Not applicable — this phase adds no rename/refactor/migration. It is new UI/service code plus two small write-path edits to existing helpers; no existing identifiers, storage keys, or external service configuration are renamed.

## Common Pitfalls

### Pitfall 1: Symbol-mutation re-render trap
**What goes wrong:** `unlockHiddenMutes`/`unlockHiddenTags` mutate the event object in place (`Reflect.set(event, HiddenTagsSymbol, tags)`), which does not change object identity — a component holding a reference to the raw event via `useState`/`useMemo` keyed on the event won't re-render.
**Why it happens:** applesauce's caching strategy is deliberately mutation-based for performance (avoid re-parsing tags on every render), relying on `notifyEventUpdate(event)` to tell the `EventStore` "this object changed," which only helps consumers that are subscribed *through the EventStore* (models, `watchEventUpdates`).
**How to avoid:** Always read mute state through `MuteModel`/`MutesQuery`/`useUserMutes` (which pipe through `watchEventUpdates(events)`, confirmed in `applesauce-common/dist/models/mutes.js:11-15,23-27`) rather than holding a raw event reference and calling `getHiddenMutedThings` on it directly in a component. Where a raw event *is* held directly (e.g., a future Private-section unlock button that calls `unlockHiddenTags` on the mute-list event fetched via `useUserMuteList`), follow `list-history-modal.tsx`'s `useForceUpdate`/`useReducer` pattern.
**Warning signs:** Unlock succeeds (no error toast) but the UI still shows the locked placeholder until an unrelated re-render happens.

### Pitfall 2: `PRESERVE_EVENT_SYMBOLS` only preserves `EncryptedContentSymbol`, not `HiddenTagsSymbol`/`MuteHiddenSymbol`
**What goes wrong:** Assuming any cached hidden state survives a factory `modify()` call.
**Why it happens:** `PRESERVE_EVENT_SYMBOLS` (`applesauce-core/dist/helpers/pipeline.js:3`) is `new Set([EncryptedContentSymbol])` — only the raw decrypted plaintext content symbol carries forward into a new draft built via `EventFactory`. This is *sufficient* for D-06's "self-published edits stay unlocked" behavior because `getHiddenTags`/`getHiddenMutedThings` lazily re-derive from `EncryptedContentSymbol` (verified: `getHiddenTags` in `hidden-tags.js:52-73` falls back to `getHiddenContent(event)` → `EncryptedContentSymbol`, then parses+caches `HiddenTagsSymbol` itself). So in practice this is not a bug, but it means: **don't write code that assumes `HiddenTagsSymbol`/`MuteHiddenSymbol` themselves are preserved** — always go through `getHiddenTags`/`getHiddenMutedThings`, never read the raw symbols directly, or a future applesauce version that changes the lazy-fallback could silently break unlock state.
**How to avoid:** Use the public helpers (`getHiddenMutedThings`, `isHiddenMutesUnlocked`), never `Reflect.get(event, MuteHiddenSymbol)` directly.
**Warning signs:** None observed today (the lazy fallback currently covers this) — flagged as a fragility, not a live bug.

### Pitfall 3: `modifyHiddenTags` requires a signer round-trip even for removal
**What goes wrong:** Assuming `UnmuteUser(pubkey, true)` is "free" because the tags are already decrypted in memory.
**Why it happens:** `modifyHiddenTags` (`applesauce-core/dist/operations/tags.js:26-71`) always calls `methods.encrypt(pubkey, plaintext)` after modifying the tag array, to produce the new `.content` — this is a **signer call** (NIP-04 `encrypt`) even when the tags were already unlocked and no *decrypt* round-trip is needed. If the tags are **not yet unlocked** when `UnmuteUser(pubkey, true)` runs, `modifyHiddenTags` will *also* call `unlockHiddenTags` internally first (`tags.js:44-47`) — two signer calls in one action.
**Why this matters for D-14:** In the normal flow (user sees a pubkey in the already-unlocked Private section and clicks Remove), the mute-list event is already unlocked, so `UnmuteUser(pubkey, true)` triggers exactly one signer call (encrypt). This is acceptable and matches the "removing from a half you've already decrypted" cost the user implicitly accepted by unlocking. Flag for the planner: no additional confirmation UI is needed for this signer call beyond the existing `usePublishEvent`/`useActionRunner` flow, since D-13 explicitly wants unmute to actually work (not be gated behind extra confirmation).
**Warning signs:** A second, unexpected signer prompt appears when unmuting a *still-locked* private entry — should not be reachable given D-11 (locked section shows no removable rows), but worth a manual test.

### Pitfall 4: `HiddenContentKinds`/`EventContentEncryptionMethod` are populated by **module import side effects**
**What goes wrong:** Assuming kind 10000 is "always" registered for encrypted content.
**Why it happens:** `canHaveEncryptedContent(10000)` is `false` until `setEncryptedContentEncryptionMethod(kinds.Mutelist, "nip04")` has executed — which happens as a side effect of `applesauce-core/dist/helpers/hidden-tags.js`'s module-level `HiddenTagsKinds = new Set([...])` initializer running (verified: `hidden-tags.js:8-23`). This is transitively imported by `applesauce-common/helpers/mute.js`, which `decryption-cache.ts` already imports (`import { ..., persistEncryptedContent } from "applesauce-common/helpers"`) — so in the current app it is registered essentially at bundle-eval time, before any event reaches `persistEncryptedContent`'s listeners.
**How to avoid:** Do not introduce a code path that imports `applesauce-common/helpers/mute.js` (or any hidden-tags consumer) *lazily* (e.g., dynamic `import()` deferred until a route loads) without first confirming `decryption-cache.ts`'s eager import still runs at app start. If a future refactor makes `decryption-cache.ts` lazy-loaded, kind-10000 persistence would silently stop working until that module loads.
**Warning signs:** Mute-list hidden content fails to restore after reload despite `enableDecryptionCache`/`encryptDecryptionCache` being on and the cache being unlocked — check that `hidden-tags.js` (or anything importing it) has actually executed before the mute-list event was inserted into `eventStore`.

### Pitfall 5: `matchMutes`/`getMutedThings` silently under-filter — by design (D-07), but easy to "fix" accidentally
**What goes wrong:** A well-intentioned future contributor (or this phase's own planner) adds a loading-state check to `useUserMuteFilter`/`useClientSideMuteFilter` to "wait for unlock before filtering."
**Why it happens:** `matchMutes(muted, event)` receives whatever `MutesQuery` currently resolves to — public-only while locked, merged once unlocked. This is D-07's explicit accepted tradeoff.
**How to avoid:** Do not touch `src/hooks/use-user-mute-filter.ts` or `src/hooks/use-client-side-mute-filter.ts` in this phase. CONTEXT.md is explicit that these need no changes.
**Warning signs:** A diff touching either file should be treated as scope creep against D-07 unless it's purely incidental (e.g., an unrelated import reorder).

## Code Examples

### Detecting "which half" a pubkey is muted in (D-14)

```typescript
// Source: applesauce-common/dist/helpers/mute.js (verified read, this session)
import { getPublicMutedThings, getHiddenMutedThings, isHiddenMutesUnlocked } from "applesauce-common/helpers";

function whichHalf(muteListEvent: NostrEvent, pubkey: string): "public" | "hidden" | "unknown" {
  if (getPublicMutedThings(muteListEvent).pubkeys.has(pubkey)) return "public";
  if (isHiddenMutesUnlocked(muteListEvent) && getHiddenMutedThings(muteListEvent).pubkeys.has(pubkey)) return "hidden";
  return "unknown"; // locked and not found in public half — cannot act correctly; see Open Questions
}
```

### Merged `isMuted` (D-15) — recommended edit to `use-user-mute-actions.ts`

```typescript
// Current (src/hooks/use-user-mute-actions.ts:19, verified):
// const isMuted = isPubkeyInList(muteList, pubkey);   // public tags only, always

// Recommended:
import useUserMutes from "./use-user-mutes"; // wraps MutesQuery/MuteModel — already exists
const muted = useUserMutes(account?.pubkey);
const isMuted = muted?.pubkeys.has(pubkey) ?? false; // merged when unlocked, public-only while locked (D-07/D-15)
```
`useUserMutes` verified at `src/hooks/use-user-mutes.ts:6-8` — already wraps `MutesQuery`, no new hook needed.

### Cache-lock pending item (D-09) — reusing existing `EncryptedStorage`/`decryptionCacheStats$`

```typescript
// Source: src/services/decryption-cache.ts (verified) + src/providers/route/require-decryption-cache.tsx (verified)
import { decryptionCache$, decryptionCacheStats$ } from "../../services/decryption-cache";
import EncryptedStorage from "../../classes/encrypted-storage";

// count$ for the registry category:
const cacheLocked$ = decryptionCacheStats$.pipe(map((stats) => (stats.isLocked ? 1 : 0)));

// unlock() needs a password, so this category's "unlock" is UI-driven (opens a small password
// prompt from the registry's action sheet), not a one-shot signer call like the mutes category —
// reuse EncryptedStorage.unlock(password) exactly as RequireDecryptionCache does today
// (require-decryption-cache.tsx:57-68), just from a new, smaller UI surface instead of a full-page gate.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| NIP-51 hidden content encrypted with NIP-04 | NIP-51 spec now recommends NIP-44 for hidden content, keeping NIP-04 only for backward-compat detection (client auto-discovers NIP-04 vs NIP-44 by checking for `"iv"` in the ciphertext) | Ongoing NIP-51 spec evolution — see PR history | `applesauce-core`'s `HiddenTagsKinds` registers kind 10000 (and the other NIP-51 lists) as **`"nip04"`** explicitly (`hidden-tags.js:12`), not NIP-44. This is applesauce's/noStrudel's existing wiring — **out of scope to change in this phase.** Worth flagging to the planner only so nobody "fixes" it as a drive-by; migrating to NIP-44 would be a separate, larger phase (compat with every mute list already published under NIP-04). `[CITED: https://github.com/nostr-protocol/nips/blob/master/51.md]` |

**Deprecated/outdated:** None specific to this phase's new code — all applesauce APIs used are current (6.2.0, latest installed).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `src/services/accounts.ts` exposes an `active$`/`active` accessor with exactly that name/shape, usable the way `decryption-cache.ts` uses `accounts.active` | Pattern 2 (Mute-list category registration) | Low — the planner reads `accounts.ts` directly before writing the registration code; only affects one import line, not the overall design. |
| A2 | A small, dedicated password-prompt UI (reused `EncryptedStorage.unlock` call) is preferable to reusing the full `RequireDecryptionCache` component for D-09's "same place" prompt | Cache-lock pending item / Code Examples | Low-medium — if the planner instead reuses `RequireDecryptionCache` wholesale (e.g., in a modal), it still satisfies D-09's requirement, just with slightly different UI chrome than recommended here. |
| A3 | Private mute lists are typically small enough that a capped-height, non-virtualized list is acceptable for the Muted view's Private section (see "Muted View + Virtualization" below) | Muted View + Virtualization | Medium — if a user has thousands of privately-muted pubkeys, a non-virtualized list would be a real performance problem. No data exists in this codebase about typical private-mute-list sizes; this is an assumption about real-world usage, not a verified fact. |

## Muted View + Virtualization (research priority #5)

**Current state (verified, `src/views/lists/muted/index.tsx`):** A single `SimpleView` → `Flex` → `AutoSizer` → `FixedSizeList` (`itemSize={80}`) over `muted.pubkeys` (currently public-only, since `useUserMutes`/`MutesQuery` already merges — but nothing distinguishes which half a row came from today).

**Problem:** `react-window`'s `FixedSizeList` + `AutoSizer` wants to own 100% of its parent's height (`AutoSizer` measures the parent and both dimensions get passed to `List`). Two `AutoSizer`+`FixedSizeList` pairs cannot both be given `flex: 1` in the same column — the second `AutoSizer` would measure a zero-height parent during layout, or both would fight for space unpredictably.

**Recommended approach — "capped-height Private list, unbounded Public list":**
1. Keep the existing Public section exactly as-is: `Flex direction="column" flex={1}` wrapping `AutoSizer`+`FixedSizeList`, now filtered to only `publicMuted.pubkeys` (via `getPublicMutedThings`/split from the merged `MutedThings`, or simply keep using the full merged set for now if simplicity is preferred and only *add* the Private section below it — planner's call within D-10's "own section" constraint).
2. Add a **Private section below it**, in a sibling `Box` with a bounded height (e.g. `maxH="320px"` with `overflowY="auto"`, no `react-window`), because:
   - Private mute lists are expected to be small relative to public ones (A3 above — flagged as an assumption).
   - This avoids the dual-`AutoSizer` sizing conflict entirely, and reuses the existing `UserCard` component (from `muted/index.tsx:20-47`) directly in a plain `.map()`, no virtualization dependency needed for the smaller list.
3. **Locked state (D-11):** render a placeholder card (icon + "Private mutes are locked" text + an Unlock button calling the registry's mute-list `unlock()`) in place of the list, shown only when `hasHiddenTags(muteListEvent)` is true (i.e., there is hidden content to unlock at all) — verified via `hasHiddenTags` (`applesauce-core/dist/helpers/hidden-tags.js:34-36`). If `hasHiddenTags` is false, don't render the Private section at all (nothing to show, matches "no dead sections").
4. **Unlocked state:** render `hiddenMuted.pubkeys` (from `getHiddenMutedThings(muteListEvent)`, or the hidden half of `useUserMutes`'s merged result if the hook is split to expose both halves) as plain `UserCard` rows in the capped-height box.

**Alternative considered:** A second, independently-sized `FixedSizeList` (e.g., `Box h="240px"` around its own `AutoSizer`+`List`). This works technically (AutoSizer just needs *any* non-zero bounded parent, not specifically `flex:1`) and would be more consistent with the Public section's implementation, at the cost of pulling in `react-window`'s virtualization overhead for what's expected to be a short list. **Recommend the planner pick based on whether A3 holds** — if there's any chance private mute lists get large, use the second `FixedSizeList` instead of a plain `.map()`.

## Unmute Split Path (research priority #7, D-14)

**Surfaces that need the split (all verified by reading the files):**

1. **`src/hooks/use-user-mute-actions.ts`** (`unmute`, lines 27-31) — currently always calls the public-tag helper path (`muteListRemovePubkey`+`pruneExpiredPubkeys`+`publish`). Needs: detect half via the mute-list event (already available via `useUserMuteList`, line 17), branch to `useActionRunner().exec(UnmuteUser, pubkey, true)` for the hidden half.
2. **`src/components/menu/mute-user.tsx`** (lines 21-23) — already calls `actions.exec(UnmuteUser, event.pubkey)` (no `hidden` arg, defaults `false`) unconditionally. Needs the same half-detection before choosing `hidden: true`/`false`/(existing public helper path, for `mute_expiration` pruning parity with `use-user-mute-actions.ts`).
3. **`src/views/lists/muted/index.tsx`**'s `UserCard.remove` (lines 24-26) — same pattern, currently unconditional `UnmuteUser(pubkey)` (public-only, `hidden` defaults `false`). Once the Private section exists, its rows' Remove buttons must pass `hidden: true`.

**Recommended shared helper** (avoids triplicating the branch logic):
```typescript
// e.g. src/helpers/nostr/mute-list.ts or a new src/helpers/nostr/mute-half.ts
import { getPublicMutedThings, getHiddenMutedThings, isHiddenMutesUnlocked } from "applesauce-common/helpers";
import { NostrEvent } from "nostr-tools";

export function getMuteHalf(muteListEvent: NostrEvent | undefined, pubkey: string): "public" | "hidden" | "unknown" {
  if (!muteListEvent) return "unknown";
  if (getPublicMutedThings(muteListEvent).pubkeys.has(pubkey)) return "public";
  if (isHiddenMutesUnlocked(muteListEvent) && getHiddenMutedThings(muteListEvent).pubkeys.has(pubkey)) return "hidden";
  return "unknown";
}
```
Callers then branch: `"public"` → existing `mute-list.ts` helper path (preserves `mute_expiration` pruning per D-14); `"hidden"` → `useActionRunner().exec(UnmuteUser, pubkey, true)`; `"unknown"` → per D-15, this happens when the pubkey is privately muted **and locked** — the row shouldn't be independently removable in that state anyway (D-11's locked placeholder has no per-row Remove buttons), so `"unknown"` should be unreachable from the Private section's UI, but `mute-user.tsx`'s app-wide menu item could theoretically hit it if `isMuted` (merged, D-15) says "muted" while locked but the user is looking at a profile, not the Muted view. **Open question below.**

## Open Questions

1. **What does the app-wide Mute/Unmute menu item (`mute-user.tsx`) do when `isMuted` is `true` (merged state, possibly from a locked hidden entry) but `getMuteHalf` returns `"unknown"` because the list is locked?**
   - What we know: D-15 accepts that `isMuted` "may misreport" while locked, and that pressing Mute on an unknown-private-mute user can add a public duplicate. It does not explicitly say what pressing *Unmute* should do in this exact case (privately muted, still locked, `isMuted` reads `true` from a *previous* unlock this session, list re-locked by D-06's cross-device scenario).
   - What's unclear: Whether `mute-user.tsx` should (a) disable the Unmute menu item when the half can't be determined, (b) fall back to the public-tag helper path (a no-op since the pubkey isn't in the public half — silently does nothing, which D-13 explicitly says must not happen), or (c) surface a toast telling the user to unlock first.
   - Recommendation: Treat this as a narrow edge case (requires an unlock-then-relock-from-another-device sequence within one session) and have the planner pick (a) or (c) — both satisfy D-13's "no silent no-op" requirement; (b) does not and should be avoided.

2. **Account-switch / signer-less account handling for the registry** (flagged in DISCUSSION-LOG as "raised but not discussed").
   - What we know: The registry's mute-list category needs the *active* account's mute list and *that account's* signer to unlock. `ReadonlyAccount` (seen imported in `src/components/layout/components/index.tsx:4`) is an existing concept for accounts without signing capability.
   - What's unclear: Whether the pending-unlock button should hide/disable itself for a `ReadonlyAccount` (no signer to unlock with) or show the pending count but disable the unlock action with an explanatory tooltip.
   - Recommendation: Disable (not hide) the unlock action for signer-less accounts, consistent with `pending-decryption-alert.tsx`'s account-gated pattern (`useActiveAccount()!` implies it's only rendered where an account exists) — but the *locked-content indicator* itself should probably still show (a read-only account can still see they have locked content, useful information even if they can't act on it themselves in this session).

## Environment Availability

Skipped — this phase has no external tool/service dependencies beyond already-installed npm packages. Runtime signer availability (NIP-07 extension, nostr-connect, local key) is an existing account precondition handled by the app's existing signer infrastructure, not a new dependency introduced by this phase.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected `[VERIFIED: .planning/codebase/STACK.md — "Not detected for the web app. No Jest/Vitest/Mocha dependency or root test script exists in package.json"]` |
| Config file | none — see Wave 0 |
| Quick run command | `pnpm build` (runs `tsc --project tsconfig.json`, the fastest available correctness signal — strict mode is on) |
| Full suite command | `pnpm build` (same command also runs `vite build`, which additionally validates the production bundle) |

Do not introduce a test framework as part of this phase's locked scope — Phase 2 ("Adopt a lint config and CI quality gate", `.planning/ROADMAP.md`) is where lint/CI tooling is planned. If a planner judges targeted unit tests valuable for `getMuteHalf`/the registry's pure `count$` derivations, that must be called out explicitly as **optional, additive, out-of-scope-unless-approved** — do not silently add a test runner dependency.

### Phase Requirements → Test Map

Since there is no test runner, every row below is `manual` with a precisely specified verification procedure (per the Nyquist validation constraint for this project).

| Req ID | Behavior | Test Type | Verification Steps | Automatable today? |
|--------|----------|-----------|---------------------|---------------------|
| D-01 | No auto-unlock signer call at startup | manual | Reload the app with a mute list containing hidden entries and the decryption cache empty/locked. Confirm no signer popup/nostr-connect prompt appears without clicking anything. | No — requires a real signer + observing absence of a prompt. |
| D-02/D-03 | Nav shows pending count = 1 (mutes) [+1 if cache also locked, D-09] | manual | With a hidden-mute-containing list and a locked cache, load the app; count badge should read 2. Unlock mutes only; badge should read 1. | No — needs live signer interaction. |
| D-06 | Cross-device replace re-locks | manual | Unlock hidden mutes in session A. From a second client (or by directly publishing a new kind-10000 event with different hidden content), replace the mute list. Confirm session A returns to "locked" (nav count increments again) without any auto re-unlock. | No — needs a second publish path; can be simulated by manually publishing a replacement kind 10000 event via a script/other client. |
| D-07 | Timeline silently under-filters while locked | manual | With a locked hidden mute for pubkey X, view a timeline containing an event from X — it should appear (not filtered). Unlock; reload the timeline; X's events should now be filtered. No banner should appear at any point. | Partially — `tsc` catches type errors in `useUserMuteFilter`/`useClientSideMuteFilter` if touched (they shouldn't be), but the filtering behavior itself needs manual observation. |
| D-08 | Signer rejection → toast, stays pending, retryable | manual | Trigger unlock, then reject/cancel the signer prompt (deny in NIP-07 extension, or timeout a nostr-connect request). Confirm a toast appears, the nav badge count is unchanged (still pending), and clicking Unlock again is possible without a page reload. | No — requires deliberately rejecting a signer prompt. |
| D-09 | Cache-lock reachable outside Messages | manual | With `encryptDecryptionCache` at its default (`true`) and never having visited `/messages`, confirm the pending-unlock mechanism offers a password prompt for the cache and that entering the correct password unlocks it (verify by checking `decryptionCacheStats$.isLocked` becomes `false`, e.g. via `window.localSettings`/`window.noStrudel` debug API if `enableDebugApi` is on, or by then visiting Messages and confirming `RequireDecryptionCache` no longer gates it). | No — needs a real password/localforage state. |
| D-10/D-11/D-12 | Private section, locked placeholder, pubkeys-only | manual | Visit `/lists/muted` with a hidden-mute-containing, locked list: confirm a separate "Private" section with a locked placeholder + its own Unlock button, no count shown. Unlock; confirm it now lists private pubkeys only (no words/hashtags/threads), reusing the same row UI as Public. | Yes, partially — `tsc` verifies component prop types compile; the visual/behavioral check is manual. |
| D-13/D-14 | Unmute correctness across both halves | manual | Mute a pubkey publicly, confirm Unmute removes it (existing behavior, regression check). Mute a pubkey privately (via a raw applesauce action call in the debug console, since "mute privately" has no UI this phase), unlock, confirm the Private-section Remove button (or `mute-user.tsx`'s Unmute) actually removes it from the hidden half (re-check via `getHiddenMutedThings` after publish+reload) — not a silent no-op. | Partially — `tsc` on `getMuteHalf`'s branches; actual publish-and-reload verification is manual. |
| D-15 | Merged `isMuted`, public-only while locked | manual | With a pubkey muted only in the hidden half: while locked, confirm the app-wide Mute menu shows "Mute" (not "Unmute") — the known misreport D-15 accepts. Unlock; confirm it now shows "Unmute". | Manual — behavioral, needs an unlock-state toggle to observe both branches. |

### Sampling Rate
- **Per task commit:** `pnpm build` (tsc strict-mode check — catches the majority of wiring mistakes given this phase is mostly type-checked applesauce API calls).
- **Per wave merge:** `pnpm build` again, plus a manual pass through the "Phase Requirements → Test Map" rows touched by that wave.
- **Phase gate:** Full manual pass through every row above before `/gsd-verify-work`, since no automated suite exists to catch behavioral regressions.

### Wave 0 Gaps
- No test framework exists and none is being added — first "gap" is really: **write the manual verification checklist above into the actual PLAN.md verification steps**, since this project's Nyquist gate depends entirely on precise manual procedures instead of automated tests.
- No `tests/` directory or fixtures exist; if the planner decides `getMuteHalf` (a pure function) is worth a smoke check, the smallest addition would be a scratch script run via `pnpm exec tsx` or similar ad hoc invocation — **do not add a full test runner** as part of this phase without explicit user approval (would conflict with Phase 2's "adopt lint config" being the designated place to introduce quality tooling).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No auth changes — signer identity is existing account infrastructure, untouched by this phase. |
| V3 Session Management | No | No session concept beyond existing account/signer state. |
| V4 Access Control | No | No new authorization boundaries — all data is the active user's own mute list. |
| V5 Input Validation | Marginal | The cache-unlock password field (D-09's new prompt surface) — reuse the existing `require-decryption-cache.tsx` validation behavior (non-empty check, `.trim()`) rather than adding new validation logic. |
| V6 Cryptography | Yes, but hand-off only | This phase must **not** implement any new cryptography. All hidden-content decryption goes through applesauce's `unlockHiddenTags`/`unlockHiddenMutes` (NIP-04 via the signer); all cache-at-rest encryption goes through the existing `EncryptedStorage` (AES-CBC/PBKDF2, `src/classes/encrypted-storage.tsx`). The only "new" crypto-adjacent code is calling `.unlock(password)` from a new UI location — zero new crypto primitives. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Signer prompt fatigue / prompt spoofing (a malicious auto-unlock preference silently triggering many signer decrypt calls) | Information Disclosure (if a user habituates to approving prompts) | D-01/D-08 already mitigate this at the decision level: no silent auto-calls by default, and auto-unlock is an explicit opt-in preference the user must enable themselves (D-02). Planner should ensure the auto-unlock preference, once enabled, only fires on clear triggers (app start / explicit account switch) — not on every mute-list update event — to avoid repeated signer prompts that train the user to blindly approve. |
| Decrypted content persisted in IndexedDB (browser storage) surviving beyond intended session | Information Disclosure | Already mitigated by the existing `EncryptedStorage`/`encryptDecryptionCache` preference (defaults `true`) — this phase does not change that default or add a new unencrypted persistence path; kind-10000 hidden content goes through the same `persistEncryptedContent`/`EncryptedStorage` path as everything else. |
| Cross-device replaced mute list silently trusted as "same as before" | Tampering (a compromised/different device publishing a mute-list edit that removes someone from the hidden mute list without the user noticing) | D-06 already mitigates this — cross-device replacement re-locks and requires explicit user unlock, rather than auto-trusting and silently merging. |

## Sources

### Primary (HIGH confidence — read directly from installed package source in this session)
- `node_modules/applesauce-common/dist/helpers/mute.js` + `.d.ts` — `unlockHiddenMutes`, `isHiddenMutesUnlocked`, `getHiddenMutedThings`, `getPublicMutedThings`, `mergeMutes`, `matchMutes`, `MutePublicSymbol`/`MuteHiddenSymbol`.
- `node_modules/applesauce-common/dist/models/mutes.js` + `.d.ts` — `MuteModel`, `PublicMuteModel`, `HiddenMuteModel`, `watchEventUpdates` wiring.
- `node_modules/applesauce-common/dist/factories/mute-list.js` + `.d.ts`, `node_modules/applesauce-common/dist/factories/list.js` — `MuteListFactory`, `NIP51UserListFactory.addUser`/`removeUser`.
- `node_modules/applesauce-actions/dist/actions/mute.js` + `.d.ts` — `MuteUser`/`UnmuteUser(pubkey, hidden)`.
- `node_modules/applesauce-core/dist/helpers/hidden-tags.js` + `.d.ts` — `hasHiddenTags`, `isHiddenTagsUnlocked`, `unlockHiddenTags`, `HiddenTagsSymbol`, `HiddenTagsKinds` (confirms kind 10000 registered nip04).
- `node_modules/applesauce-core/dist/helpers/hidden-content.js`, `encrypted-content.js` — confirms the module-side-effect registration chain (`EventContentEncryptionMethod`/`HiddenContentKinds`) that makes `canHaveEncryptedContent(10000)` true.
- `node_modules/applesauce-common/dist/helpers/encrypted-content-cache.js` + `.d.ts` — `persistEncryptedContent` full implementation, confirms restore/persist keyed by `event.id`.
- `node_modules/applesauce-core/dist/operations/tags.js` — `modifyHiddenTags` (signer round-trip behavior for D-14).
- `node_modules/applesauce-core/dist/helpers/pipeline.js` — `PRESERVE_EVENT_SYMBOLS` (only `EncryptedContentSymbol`).
- `src/services/decryption-cache.ts`, `src/services/preferences.ts`, `src/classes/preference-subject.ts`, `src/classes/encrypted-storage.tsx`, `src/providers/route/require-decryption-cache.tsx` — full read, existing decryption-cache/preferences/encrypted-storage machinery.
- `src/views/lists/muted/index.tsx`, `src/hooks/use-user-mute-actions.ts`, `src/helpers/nostr/mute-list.ts`, `src/components/menu/mute-user.tsx`, `src/providers/route/mute-modal-provider.tsx`, `src/models/mutes.ts`, `src/hooks/use-user-mutes.ts`, `src/hooks/use-user-mute-list.ts`, `src/hooks/use-user-mute-filter.ts`, `src/hooks/use-client-side-mute-filter.ts` — existing write/read/filter surfaces.
- `src/views/lists/components/list-history-modal.tsx`, `src/views/messages/components/pending-decryption-alert.tsx`, `src/hooks/use-async-action.ts`, `src/hooks/use-force-update.ts` — existing unlock/count/error-handling UI precedents.
- `src/components/layout/desktop/side-nav.tsx`, `src/components/layout/mobile/bottom-nav.tsx`, `src/components/layout/mobile/nav-drawer.tsx`, `src/components/layout/components/index.tsx`, `src/components/layout/components/nav-item.tsx`, `src/components/layout/components/connections-button.tsx`, `src/components/layout/components/publish-log-button.tsx` — nav placement precedents.
- `.planning/codebase/STACK.md`, `.planning/codebase/CONVENTIONS.md`, `package.json` — stack/version/convention confirmation.

### Secondary (MEDIUM confidence)
- [nips/51.md at master · nostr-protocol/nips](https://github.com/nostr-protocol/nips/blob/master/51.md) — NIP-51 spec confirmation (public tags vs. encrypted `.content`, NIP-44-preferred/NIP-04-legacy encryption note).

### Tertiary (LOW confidence / flagged assumptions)
- Exact `src/services/accounts.ts` `active`/`active$` accessor shape (used by analogy from `decryption-cache.ts`'s `import accounts from "./accounts"` + `accounts.active`, not independently re-verified this session) — see Assumptions Log A1.

## Metadata

**Confidence breakdown:**
- Standard stack / applesauce API surface: HIGH — every function signature and behavior claim was verified by reading the actual installed `dist/*.js`/`*.d.ts` source in `node_modules`, not inferred from training data or docs.
- Decryption-cache persistence path (the phase's most consequential technical claim): HIGH — traced the full module-side-effect chain (`hidden-tags.js` → `EventContentEncryptionMethod`/`HiddenContentKinds` registration → `persistEncryptedContent`'s `canHaveEncryptedContent` filter) to confirm kind 10000 is covered with zero new cache code.
- Registry design / nav placement / virtualization split: MEDIUM — these are genuinely new code with no direct precedent; the recommendations are grounded in verified existing conventions (`decryption-cache.ts`'s RxJS shape, `nav-item.tsx`'s collapse-aware pattern) but represent this researcher's synthesis, not verified pre-existing behavior. Flagged accordingly in the Assumptions Log.
- Pitfalls: HIGH for the symbol-mutation and signer-round-trip pitfalls (directly traced through source); MEDIUM for the "module import side effect" pitfall (correct today, but fragile to a future refactor — flagged as such).

**Research date:** 2026-08-19
**Valid until:** ~30 days (applesauce is a fast-moving first-party dependency at 6.2.0; re-verify exact API surface if `package.json` shows a newer `applesauce-*` version before this phase is planned/executed).
