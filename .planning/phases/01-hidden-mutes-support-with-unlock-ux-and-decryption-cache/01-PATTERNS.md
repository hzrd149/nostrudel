# Phase 1: Hidden mutes support with unlock UX and decryption cache - Pattern Map

**Mapped:** 2026-08-19
**Files analyzed:** 12 (4 new, 8 modified)
**Analogs found:** 12 / 12 (registry service has no direct analog — see "No Analog Found")

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/services/pending-unlock.ts` (NEW) | service | event-driven (RxJS registry) | `src/services/decryption-cache.ts` | partial (shape/idiom match, no direct registry precedent) |
| `src/components/layout/components/pending-unlock-button.tsx` (NEW) | component | request-response (click → async unlock) | `src/components/layout/components/nav-item.tsx` (collapse behavior) + `connections-button.tsx`/`publish-log-button.tsx` (status-button shape) | role-match |
| Mute-list source registration (appended to `pending-unlock.ts` or new `src/services/pending-unlock-mutes.ts`) | service | event-driven | `src/services/decryption-cache.ts` (`autoDecryptMessagesFallback` + `accounts.active`/`accounts.active$` usage) | role-match |
| `src/views/lists/muted/components/private-mutes-section.tsx` (NEW, suggested path) | component | CRUD (read locked/unlocked state, unlock, remove) | `src/views/lists/components/list-history-modal.tsx`'s `HiddenVersions`/`HiddenVersionRow` (locked badge + Unlock) + `src/views/lists/muted/index.tsx`'s `UserCard` (row shape) | exact (for row shape) / role-match (for locked placeholder) |
| `src/components/layout/desktop/side-nav.tsx` (EDIT) | layout/component | request-response | itself (existing file) | exact |
| `src/components/layout/mobile/nav-drawer.tsx` (EDIT) | layout/component | request-response | itself (existing file) | exact |
| `src/views/settings/privacy/index.tsx` (EDIT) | component (settings form) | CRUD (preference read/write) | itself (existing file, `debugApi` `use$`+`Switch` block) | exact |
| `src/services/preferences.ts` (EDIT — new `PreferenceSubject` entries) | config/service | CRUD | itself (existing file, `encryptDecryptionCache`/`autoDecryptMessages` boolean entries + `defaultAuthenticationMode`'s `PreferenceSubject.create<T>` for a typed value) | exact |
| `src/views/lists/muted/index.tsx` (EDIT — add Private section) | component | CRUD + virtualization | itself (existing file) | exact |
| `src/hooks/use-user-mute-actions.ts` (EDIT — merged isMuted, split unmute) | hook | CRUD | itself (existing file) + `src/hooks/use-user-mutes.ts` (merged state source) | exact |
| `src/providers/route/mute-modal-provider.tsx` / `src/components/menu/mute-user.tsx` (EDIT — split unmute) | provider/component | CRUD | `src/components/menu/mute-user.tsx` (existing unconditional `UnmuteUser` call) | exact |
| `src/helpers/nostr/mute-list.ts` (reference only — unchanged, public-tag path stays) | helper | CRUD | itself | exact |
| Cache-lock pending item (in `pending-unlock.ts`, wired to `decryption-cache.ts`) | service | event-driven | `src/providers/route/require-decryption-cache.tsx` (`EncryptedStorage.unlock(password)` UI) | role-match |

## Pattern Assignments

### `src/services/pending-unlock.ts` (NEW service, event-driven registry)

**Analog:** `src/services/decryption-cache.ts` (RxJS singleton-service idiom)

**Imports pattern** (`src/services/decryption-cache.ts:1-25`):
```typescript
import { isPTag } from "applesauce-core/helpers";
import { getLegacyMessageCorrespondent, persistEncryptedContent } from "applesauce-common/helpers";
import { defined } from "applesauce-core/observable";
import { kinds } from "nostr-tools";
import {
  combineLatest, distinctUntilChanged, filter, interval, map,
  Observable, of, pairwise, shareReplay, startWith, switchMap,
} from "rxjs";

import EncryptedStorage from "../classes/encrypted-storage";
import accounts from "./accounts";
import { eventStore } from "./event-store";
import localSettings from "./preferences";
```
Follow the same relative-import style (`../classes/...`, `./accounts`, `./event-store`, `./preferences`) for the new file, and note `accounts.active$`/`accounts.active` (confirmed in `src/services/accounts.ts:59-66`) is the correct accessor — this resolves RESEARCH.md's Assumption A1.

**Core reactive-service pattern** (`src/services/decryption-cache.ts:27-54,74-117`):
```typescript
export const decryptionCache$ = localSettings.enableDecryptionCache.pipe(
  switchMap((enable) => { /* ... build derived state ... */ }),
  shareReplay(1),
);
decryptionCache$.subscribe(); // keep alive as a side effect at module scope

export const decryptionCacheStats$ = localSettings.encryptDecryptionCache.pipe(
  switchMap(() => decryptionCache$),
  defined(),
  switchMap(async (cache) => { /* derive stats object */ }),
  shareReplay(1),
);
```
Mirror this for `pendingUnlockCategories$`/`pendingUnlockTotal$`: a `BehaviorSubject<PendingUnlockCategory[]>` plus `combineLatest`/`switchMap`/`map`/`shareReplay(1)` to derive the aggregate count, exactly as RESEARCH.md's "Pattern 1" code block already specifies. Self-subscribe at module scope the same way `decryptionCache$.subscribe()` does, if the registry needs to stay warm.

**Error handling / fallback-function pattern** (`src/services/decryption-cache.ts:120-139`):
```typescript
async function autoDecryptMessagesFallback(event: NostrEvent) {
  if (localSettings.autoDecryptMessages.value === false || !accounts.active) return;
  const account = accounts.active;
  if (event.kind === kinds.EncryptedDirectMessage && (...)) return unlockLegacyMessage(event, account.pubkey, account);
  if (event.kind === kinds.GiftWrap && (...)) return unlockGiftWrap(event, account);
}
```
Use this shape as the template for the mutes category's `unlock()` — gate on `accounts.active`, let errors propagate (do not catch-and-toast inside the service; per RESEARCH.md's anti-pattern note, `useAsyncAction` at the call site is the single place that toasts).

---

### Mute-list category registration (appended to `pending-unlock.ts` or a sibling module)

**Analog:** `src/services/decryption-cache.ts` (`accounts.active$`/`accounts.active` usage) + `src/models/mutes.ts` / `src/hooks/use-user-mutes.ts` (merged mute-state read path) + `src/views/lists/components/list-history-modal.tsx` (unlock call pattern)

**`accounts` service accessor** (verified, `src/services/accounts.ts:59-66`):
```typescript
merge(fromEvent(window, "focus"), accounts.active$.pipe(skip(1))).subscribe(() => {
  const account = accounts.active;
  ...
});
```
Confirms `accounts.active$: Observable<Account | undefined>` and `accounts.active: Account | undefined` are both valid — use `accounts.active$` for the registry's reactive `count$`, `accounts.active` inside `unlock()`.

**Unlock call pattern** (`src/views/lists/components/list-history-modal.tsx:312-330`):
```typescript
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
For the mutes category's `unlock: () => Promise<void>` in the registry, use `unlockHiddenMutes(event, account)` (applesauce-common) in place of `unlockHiddenTags`/`refresh()` — the registry has no local re-render to force (consumers read `count$` through `MuteModel`'s `watchEventUpdates`, which already re-emits on `notifyEventUpdate`). Let errors throw instead of swallowing (per RESEARCH.md anti-pattern: single-toast-site via `useAsyncAction`).

---

### `src/components/layout/components/pending-unlock-button.tsx` (NEW)

**Analog (collapse-awareness):** `src/components/layout/components/nav-item.tsx:20-36`
```typescript
const collapsed = useContext(CollapsedContext);
if (collapsed)
  return <IconButton as={RouterLink} aria-label={label} icon={<Icon boxSize={5} />} ... />;
else
  return <Button as={RouterLink} leftIcon={<Icon boxSize={5} />} variant="link" ...>{label}</Button>;
```
Use `useContext(CollapsedContext)` from `../context` the same way, but render an `IconButton`+`Badge` (not a route `Button`) since this is a status/action button, not a nav link.

**Analog (status-button shape + count):** `src/components/layout/components/connections-button.tsx:1-18`
```typescript
import { Button, ButtonProps } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { connections$ } from "../../../services/pool";
import { useTaskManagerContext } from "../../../views/task-manager/provider";

export default function RelayConnectionButton({ ...props }: Omit<ButtonProps, "children" | "onClick">) {
  const { openTaskManager } = useTaskManagerContext();
  const connections = use$(connections$) ?? {};
  const connected = Object.values(connections).reduce((t, s) => (s === "connected" ? t + 1 : t), 0);
  return (
    <Button onClick={() => openTaskManager("/relays")} {...props}>
      Relays ({connected})
    </Button>
  );
}
```
Copy the `use$(observable) ?? default` + derived-count pattern; replace `openTaskManager` with an `onOpen` from a `useDisclosure()` (this button needs its own popover/menu for "unlock now" vs "enable auto-unlock", not a task-manager route). `PublishLogButton` (`publish-log-button.tsx:20-28`) additionally shows the "`if (!entry) return null`" pattern — mirror it as "`if (total === 0) return null`" per D-02 ("renders null when count === 0").

**Async action + loading pattern** (`src/hooks/use-async-action.ts:4-27`):
```typescript
const { loading, run } = useAsyncAction(async () => { /* unlock all pending categories */ }, [categories]);
// <Button onClick={run} isLoading={loading} loadingText="Unlocking...">
```
This is the app's convention for any user-triggered async action with toast-on-error — use directly for the "Unlock now" button action, matching `require-decryption-cache.tsx:47-69`'s `unlockCache = useAsyncAction(...)` usage.

**Batch-unlock loop with cancellation break** (`src/views/messages/components/pending-decryption-alert.tsx:13-27`):
```typescript
const decryptAll = useAsyncAction(async () => {
  if (!account || !locked) return;
  for (const giftWrap of locked) {
    if (isGiftWrapUnlocked(giftWrap)) continue;
    try {
      await unlockGiftWrap(giftWrap, account);
    } catch (error) {
      if (error instanceof Error && error.message.toLocaleLowerCase().includes("user")) break;
      console.error("Failed to decrypt gift wrap:", giftWrap.id, error);
    }
  }
}, [locked, account]);
```
Use this exact "stop the batch loop if the signer-rejection error message mentions 'user'" idiom when the pending-unlock button's "Unlock now" action iterates multiple registered categories — if one category's `unlock()` throws a user-cancellation-shaped error, stop trying the rest rather than spamming further signer prompts (D-08 compliant: toast + stay pending + retryable).

---

### Nav placement edits

**`src/components/layout/desktop/side-nav.tsx`** — current structure (full file, 65 lines, already read in full):
```tsx
<ButtonGroup variant="ghost" role="group" aria-label="Navigation controls">
  <IconButton ... onClick={() => setCollapsed(!collapsed)} .../>
  {!collapsed && (
    <>
      <RelayConnectionButton w="full" aria-label="Manage relay connections" />
      <PublishLogButton flexShrink={0} aria-label="Publish log" />
    </>
  )}
</ButtonGroup>
```
Per RESEARCH.md's "Recommended nav placement" table: add `<PendingUnlockButton />` **outside** the `{!collapsed && (...)}` block (sibling to the collapse-toggle `IconButton`), so — unlike `RelayConnectionButton`/`PublishLogButton` — it stays visible when collapsed (renders icon+badge via its own internal `CollapsedContext` check, per the `pending-unlock-button.tsx` pattern above).

**`src/components/layout/mobile/nav-drawer.tsx`** — current structure (full file, 68 lines, already read in full):
```tsx
<ButtonGroup variant="ghost" onClick={onClose} aria-label="Relay connections">
  <RelayConnectionButton w="full" />
  <PublishLogButton flexShrink={0} />
</ButtonGroup>
```
This `ButtonGroup` is already unconditionally rendered (`CollapsedContext.Provider value={false}` at line 35, confirmed) — add `<PendingUnlockButton w="full" />` alongside the other two, same import style (`import PendingUnlockButton from "../components/pending-unlock-button";`).

---

### `src/services/preferences.ts` (EDIT — new auto-unlock `PreferenceSubject` entries)

**Analog — boolean entry** (`src/services/preferences.ts:102,105-106`):
```typescript
const encryptDecryptionCache = await PreferenceSubject.boolean("encrypt-decryption-cache", true);
const autoDecryptMessages = await PreferenceSubject.boolean("auto-decrypt-messages", true);
```
Use `PreferenceSubject.boolean("auto-unlock-all", false)` for the "unlock all" toggle (D-04).

**Analog — typed/JSON `PreferenceSubject.create<T>` entry** (`src/services/preferences.ts:72-77` and `93-101`):
```typescript
const defaultAuthenticationMode = await PreferenceSubject.create<RelayAuthMode>("default-authentication-mode", "ask");
// and, for a more complex encode/decode:
const encryptionSalt = await PreferenceSubject.create<Uint8Array>(
  "encryption-salt", crypto.getRandomValues(new Uint8Array(48)),
  { decode: (raw) => hexToBytes(raw), encode: (key) => bytesToHex(key), saveDefault: true },
);
```
Use `PreferenceSubject.create<Record<string, boolean>>("auto-unlock-categories", {}, { decode: (raw) => safeParse(raw) ?? {}, encode: (v) => JSON.stringify(v) })` (or reuse the ready-made `PreferenceSubject.array`-style JSON codec already used for `relayAuthenticationMode`) for the per-category map (D-05's "registry-driven list").

**Export-object wiring pattern** (`src/services/preferences.ts:119-182`): add the two new consts to both the top-level `const X = await PreferenceSubject...` declarations block and the `localSettings = { ... }` object literal (grouped under a new `// Pending unlock` comment section, matching the existing `// Decryption cache` / `// Direct messages` grouping style at lines 92,104).

---

### `src/views/settings/privacy/index.tsx` (EDIT — auto-unlock preferences)

**Analog — local `use$` preference read + `Switch` write, bypassing the `useSettingsForm`/react-hook-form path** (`src/views/settings/privacy/index.tsx:50,239-249`, already the file being edited):
```tsx
const debugApi = use$(localSettings.enableDebugApi);
...
<FormControl>
  <Flex alignItems="center">
    <FormLabel htmlFor="debugApi" mb="0">Enable debug api</FormLabel>
    <Switch id="debugApi" isChecked={debugApi} onChange={(e) => localSettings.enableDebugApi.next(e.currentTarget.checked)} />
  </Flex>
  <FormHelperText>...</FormHelperText>
</FormControl>
```
This is CONTEXT.md's confirmed pattern ("Auto-unlock prefs are local and should follow the `use$` path", not `useSettingsForm`) — copy verbatim for the "unlock all" `Switch`, then render the registry-driven per-category `Switch` list (one per `pendingUnlockCategories$` entry, disabled/hidden when "unlock all" is checked) directly below it, each bound to `localSettings["auto-unlock-categories"]`'s map via the same `use$`+`.next()` idiom.

---

### `src/views/lists/muted/index.tsx` (EDIT — add Private section) + new `private-mutes-section.tsx`

**Analog — existing file structure** (full file, 96 lines, already read in full): single `SimpleView` → `Flex flex={1}` → `AutoSizer` → `FixedSizeList` over `muted.pubkeys`, with `UserCard` (lines 20-47) as the reusable row and `remove = useAsyncAction(...)` calling `hub.exec(UnmuteUser, pubkey).forEach((e) => publish(...))` (lines 24-26). Add a sibling `Box`/section below the existing `Flex` for Private mutes (per RESEARCH.md's "capped-height Private list" recommendation), reusing `UserCard` for rows.

**Analog — locked badge + Unlock button** (`src/views/lists/components/list-history-modal.tsx:257-289`, `HiddenVersionRow`):
```tsx
{unlocked ? (
  <Text color="GrayText" fontSize="sm">({hidden.length} hidden tag{hidden.length === 1 ? "" : "s"})</Text>
) : (
  <Badge colorScheme="orange" flexShrink={0} fontSize="xs">Locked</Badge>
)}
...
{!unlocked && (
  <Button variant="ghost" colorScheme="primary" isLoading={unlocking} onClick={() => onUnlock(version)}>Unlock</Button>
)}
```
Use this Badge+Button pairing for the Private section's locked placeholder (D-11), but drive `unlocked`/`unlocking` from the registry (`use$(mutesCategory.count$)`/`useAsyncAction(mutesCategory.unlock)`), not local state — per RESEARCH.md's explicit anti-pattern warning against duplicating unlock state per surface.

**Row shape to reuse directly** (`src/views/lists/muted/index.tsx:20-47`, `UserCard`) — pass `hidden: true` through to `UnmuteUser` for Private-section rows (see unmute split below) instead of the current unconditional `hub.exec(UnmuteUser, pubkey)`.

---

### Unmute split path (D-14/D-15)

**Files to edit, current unconditional-public-half code (all verified, full reads above):**

1. `src/hooks/use-user-mute-actions.ts:14-34` — currently:
```typescript
const isMuted = isPubkeyInList(muteList, pubkey);
...
const { run: unmute } = useAsyncAction(async () => {
  let draft = muteListRemovePubkey(muteList || createEmptyMuteList(), pubkey);
  draft = pruneExpiredPubkeys(draft);
  await publish("Unmute", draft, undefined, false);
}, [publish, muteList]);
```
Replace `isMuted` with `useUserMutes(account?.pubkey)?.pubkeys.has(pubkey) ?? false` (merged state, D-15 — `src/hooks/use-user-mutes.ts:6-8` already wraps `MutesQuery`/`MuteModel`). Branch `unmute` on `getMuteHalf(muteList, pubkey)` (new helper, see RESEARCH.md "Unmute Split Path" code block) — `"public"` keeps this exact existing block (preserves `mute_expiration` pruning); `"hidden"` calls `useActionRunner().exec(UnmuteUser, pubkey, true)` instead.

2. `src/components/menu/mute-user.tsx:12-35` — currently:
```typescript
const unmute = useAsyncAction(async () => {
  await actions.exec(UnmuteUser, event.pubkey).forEach((e) => publish("Unmute", e));
});
```
Same `getMuteHalf` branch needed here — currently always calls `UnmuteUser(pubkey)` (hidden defaults `false`), so hidden-half unmutes from this app-wide menu are currently silent no-ops (the exact D-13 violation this phase must fix).

3. `src/views/lists/muted/index.tsx:24-26` (`UserCard.remove`) — same unconditional `UnmuteUser(pubkey)` call; once the Private section exists its rows must pass `hidden: true` explicitly (they're known-hidden by construction, so no `getMuteHalf` detection needed there — only the Public section's rows and the app-wide `mute-user.tsx` menu need the branch).

**`getMuteHalf` helper — recommended location:** `src/helpers/nostr/mute-list.ts` (existing helper-file convention: "event parsing lives in helpers, not components") or a new sibling `src/helpers/nostr/mute-half.ts`, using:
```typescript
import { getPublicMutedThings, getHiddenMutedThings, isHiddenMutesUnlocked } from "applesauce-common/helpers";
export function getMuteHalf(muteListEvent: NostrEvent | undefined, pubkey: string): "public" | "hidden" | "unknown" {
  if (!muteListEvent) return "unknown";
  if (getPublicMutedThings(muteListEvent).pubkeys.has(pubkey)) return "public";
  if (isHiddenMutesUnlocked(muteListEvent) && getHiddenMutedThings(muteListEvent).pubkeys.has(pubkey)) return "hidden";
  return "unknown";
}
```
Do **not** modify `muteListAddPubkey`/`muteListRemovePubkey`/`pruneExpiredPubkeys` in `src/helpers/nostr/mute-list.ts` (lines 47-92) — they remain the public-half write path exactly as-is (D-14).

---

### Cache-lock pending item (D-09)

**Analog:** `src/providers/route/require-decryption-cache.tsx:37-69` (password state + `unlockCache` async action + `EncryptedStorage.unlock`)
```typescript
const stats = use$(decryptionCacheStats$);
const cache = use$(decryptionCache$);
const [password, setPassword] = useState("");
const unlockCache = useAsyncAction(async () => {
  if (!password.trim()) { toast({...}); return; }
  if (cache instanceof EncryptedStorage) {
    const success = await cache.unlock(password);
    if (success) setPassword("");
    else toast({ title: "Incorrect password", ... });
  }
}, [password, cache, toast]);
```
Register a `decryption-cache` category in `pending-unlock.ts` whose `count$` is `decryptionCacheStats$.pipe(map((stats) => (stats.isLocked ? 1 : 0)))` (exact expression already given in RESEARCH.md), and whose `unlock` opens a small password-prompt surface reusing this component's `Input type="password"` + `unlockCache.run` logic — not the full-page `RequireDecryptionCache` gate, per RESEARCH.md Assumption A2. The full component (`require-decryption-cache.tsx`) remains unchanged and continues to gate `/messages`; this phase adds a second, smaller entry point to the same `EncryptedStorage.unlock(password)` call.

## Shared Patterns

### RxJS singleton-service idiom
**Source:** `src/services/decryption-cache.ts:27-54,74-117`
**Apply to:** `pending-unlock.ts`'s registry, mute-list category, cache-lock category — `combineLatest`/`switchMap`/`map`/`shareReplay(1)`, module-scope `.subscribe()` to stay warm.

### `use$` + Chakra `Switch`/`Button` binding
**Source:** `src/views/settings/privacy/index.tsx:50,239-249` (existing `debugApi` toggle) and `src/components/layout/components/connections-button.tsx:10-16`
**Apply to:** Privacy settings toggles, side-nav button's count display.

### `useAsyncAction` for all user-triggered unlock/unmute actions
**Source:** `src/hooks/use-async-action.ts:4-27`
**Apply to:** pending-unlock button's "Unlock now", Private-section Unlock button, unmute calls in `use-user-mute-actions.ts`/`mute-user.tsx`/`muted/index.tsx`. Category `unlock()` implementations themselves should **throw**, not catch-and-toast, so this hook is the single toast site (D-08).

### Collapse-aware nav element (`CollapsedContext`)
**Source:** `src/components/layout/components/nav-item.tsx:20-36`, `src/components/layout/context.tsx` (`CollapsedContext`)
**Apply to:** `pending-unlock-button.tsx` — must not disappear when the desktop rail collapses (unlike `RelayConnectionButton`/`PublishLogButton`, which are gated by `{!collapsed && ...}` in `side-nav.tsx:54-59`).

### Merged mute state via `MuteModel`/`MutesQuery`
**Source:** `src/hooks/use-user-mutes.ts:6-8`, `src/models/mutes.ts:6-9`
**Apply to:** Any component/hook needing `isMuted` (D-15) — never read a raw mute-list event's tags directly for merged state; always go through `useUserMutes`/`MutesQuery`, which pipes through `watchEventUpdates` and re-emits on unlock.

### Symbol-mutation re-render awareness
**Source:** `src/views/lists/components/list-history-modal.tsx:305-330` (`useReducer`-based `refresh()`), `src/hooks/use-force-update.ts`
**Apply to:** Any code that reads a raw mute-list `NostrEvent` directly (not through a model) and calls `unlockHiddenMutes`/`unlockHiddenTags` on it — must force a re-render since the unlock result is cached via symbol mutation, not new object identity. Components reading through `MuteModel`/`useUserMutes` do **not** need this (they already re-emit via `watchEventUpdates`).

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/services/pending-unlock.ts` (the registry itself — `registerPendingUnlockCategory` API surface) | service | event-driven | No existing "pluggable registry of reactive categories" exists in the codebase. Nearest partial match is `src/services/decryption-cache.ts` for the RxJS *idiom* (BehaviorSubject/combineLatest/shareReplay), but nothing in the codebase today models "an array of registered sources each contributing a `count$`+`unlock()`." Build from RESEARCH.md's "Pattern 1" code block (already verified as sound and consistent with codebase RxJS conventions), not from a copied file. |

## Metadata

**Analog search scope:** `src/services/`, `src/components/layout/`, `src/views/settings/privacy/`, `src/views/lists/`, `src/views/messages/components/`, `src/hooks/`, `src/helpers/nostr/`, `src/providers/route/`, `src/classes/`, `src/models/`
**Files scanned:** 18 read in full (decryption-cache.ts, preferences.ts, preference-subject.ts, accounts.ts, use-async-action.ts, use-force-update.ts, require-decryption-cache.tsx, pending-decryption-alert.tsx, list-history-modal.tsx, connections-button.tsx, publish-log-button.tsx, nav-item.tsx, side-nav.tsx, nav-drawer.tsx, privacy/index.tsx, muted/index.tsx, use-user-mute-actions.ts, mute-list.ts, mute-user.tsx, use-user-mutes.ts, use-user-mute-list.ts, models/mutes.ts)
**Pattern extraction date:** 2026-08-19
