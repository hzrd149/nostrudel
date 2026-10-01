---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
reviewed: 2026-10-01T00:00:00Z
depth: standard
files_reviewed: 38
files_reviewed_list:
  - src/components/content/links/code.tsx
  - src/components/content/links/youtube.tsx
  - src/components/magic-textarea.tsx
  - src/components/napplets/consent-modal.tsx
  - src/components/napplets/intent-choice-modal.tsx
  - src/components/post-modal/index.tsx
  - src/components/webxdc/webxdc.tsx
  - src/helpers/nostr/relay-stats.ts
  - src/helpers/nostr/torrents.ts
  - src/hooks/use-webxdc.ts
  - src/providers/global/napplet-shell-provider.tsx
  - src/services/napplet-shell/adapter.ts
  - src/services/napplet-shell/common-actions.ts
  - src/services/napplet-shell/intent-service.ts
  - src/services/napplet-shell/permissions.test.ts
  - src/services/napplet-shell/permissions.ts
  - src/services/napplet-shell/relay-tiers.ts
  - src/services/napplet-shell/resource-service.ts
  - src/services/napplet-shell/upload-service.ts
  - src/services/notifications/common.ts
  - src/services/verify-event.ts
  - src/services/wallets/index.ts
  - src/services/wallets/nutwallet.ts
  - src/services/wallets/nwc.test.ts
  - src/services/wallets/nwc.ts
  - src/services/wallets/types.ts
  - src/services/wallets/webln.ts
  - src/sw/client/error-logger.ts
  - src/views/articles/components/article-reader.tsx
  - src/views/groups/index.tsx
  - src/views/lists/components/list-history-modal.tsx
  - src/views/messages/chat/components/direct-message-form.tsx
  - src/views/new/poll/poll-form.tsx
  - src/views/notifications/index.tsx
  - src/views/relays/relay/tabs/about.tsx
  - src/views/settings/background-worker/cached-files-card.tsx
  - src/views/settings/background-worker/service-worker-status-card.tsx
  - src/views/tools/event-publisher/index.tsx
findings:
  critical: 0
  warning: 3
  info: 8
  total: 11
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-10-01
**Depth:** standard
**Files Reviewed:** 38
**Status:** issues_found

## Summary

I reviewed the 38 files against `git diff 333e4aaab^..HEAD`. Most of the review went to the two large moves: the 1,163-line `napplet-shell-provider.tsx` split into `src/services/napplet-shell/*`, and the 591-line `services/wallets.ts` split into `services/wallets/*`. I diffed both against their originals function by function.

**Moves verified as faithful:**
- **Permission gates.** `identityKey`, `hasApprovedCapability`, `grantCapabilities` (it still replaces the recorded set and does not merge into it), the deny-path `revokeCapabilities`, and the always-allow localStorage handling all behave as before. The resource-fetch allow gate (`hasApprovedCapability(identity, "resource:fetch") || blossomOrigins.includes(origin)`) is unchanged.
- **Resource limits.** The scheme check, the 25 MiB cap, the 16-URL limit and the concurrency of 4 are unchanged.
- **Intent and common-action services.** Handler selection, the convention check and Report/Reaction/Follow drafting are unchanged.
- **Provider wiring.** The `useMemo`/`useCallback` dependency arrays in the provider (`[toast, getIntentNavigator, chooseIntentHandler, upload.enabled]`, `[bridge]`, `[bridge, consent]`, `[intentChoice]`) match the originals exactly.
- **Wallets.** Module side-effect order is preserved: `WalletConnect.pool` is set before any backend is constructed, and the reconcile/sync subscriptions are still registered last.

**Checks run:**
- `tsc --noEmit` passes.
- `vitest run` passes (2 files, 17 tests).
- The removed `relay-stats.ts` exports (`getRTT`, `MONITOR_METADATA_KIND`, `getRelayURL`) have no remaining consumers.

**Result:** no blockers. The regressions I found are in the smaller UI extractions:
- The notification badge extraction changed what `SimpleNavBox` renders at zero count.
- The `useAsyncAction` conversions in the service-worker settings cards dropped the specific error toasts.
- The wallet split couples the NWC backend to the WebLN module.

## Warnings

### WR-01: `NotificationCountBadge` makes `SimpleNavBox` render an empty metadata Box at zero count

**File:** `src/views/notifications/index.tsx:19-42, 80, 89, 98, 107, 116, 125` (consumer: `src/components/layout/box-layout/simple-nav-box.tsx:60`)
**Issue:** Before this phase each slot passed `metadata={counts.x === 0 ? null : (<Flex>…</Flex>)}`. Now every slot passes `metadata={<NotificationCountBadge … />}`. A React element is always truthy, even if the component then returns `null`. `SimpleNavBox` gates its wrapper with `{metadata && <Box>{metadata}</Box>}`, so all six nav boxes now render an empty `<Box>` when the count is zero. That Box is a child of a `Flex direction="column" gap="2"`, so each zero-count row gains an extra 8px gap under the description. The layout changes, and this phase was meant to be behaviour-preserving. 05-05-SUMMARY says the "zero-count `return null` guard" was preserved. It runs, but it no longer has the effect it had before.
**Fix:** Put the zero check back at the call site, or make the helper return a node instead of being a component:
```tsx
function renderCountBadge(count: number, timeRange: TimeRange, timeRangeLabel: string) {
  if (count === 0) return null;
  return (
    <Flex alignItems="center" gap="2">
      <Badge colorScheme="primary" fontSize="sm">{count}</Badge>
      {timeRange !== "all" && <Text fontSize="xs" color="GrayText">{timeRangeLabel}</Text>}
    </Flex>
  );
}
// ...
metadata={renderCountBadge(counts.replies, timeRange, timeRangeLabel)}
```

### WR-02: Moving to `useAsyncAction` dropped the specific error toasts in the service-worker settings cards

**File:** `src/views/settings/background-worker/cached-files-card.tsx:64-109`, `src/views/settings/background-worker/service-worker-status-card.tsx:38-71`
**Issue:** Each of the four handlers used to catch its own errors and show a toast written for that action:
- "Failed to clear cache" / `Could not clear cache "<name>"`
- "Failed to clear all caches"
- "Failed to update offline cache" / "Could not refresh the offline cache. Check if app is built for production."
- "Update check failed"

They now rely on `useAsyncAction` (`src/hooks/use-async-action.ts:19-22`). On failure that hook shows only `{ description: e.message, status: "error" }`: no title, no mention of which cache or action failed, and no "built for production" hint. That hint was the useful diagnostic for the common dev-build failure of `cache.refresh`. If the rejection value is not an `Error`, the user sees nothing at all; the hook only calls `console.log`. AGENTS.md does tell you to use `useAsyncAction`, so the conversion follows convention, but the user-visible error messages still regressed. The phase summaries do not mention this change.
**Fix:** To keep the context, rethrow with a descriptive message inside the action so the hook's toast carries it. For example:
```ts
const cachedFiles = await refreshOfflineCache().catch((e) => {
  throw new Error(`Could not refresh the offline cache (is this a production build?): ${e instanceof Error ? e.message : e}`);
});
```
Alternatively, record the reduced error detail as an accepted change in the phase ledger.

### WR-03: The NWC backend imports its abort helper from the WebLN backend module

**File:** `src/services/wallets/nwc.ts:8`, `src/services/wallets/webln.ts:9-10`
**Issue:** `abortError` was a module-private helper in the old `wallets.ts`. It now lives in `webln.ts` and is exported from there ("Shared by every backend…"), and `nwc.ts` imports it with `import { abortError } from "./webln"`. That makes the NWC backend depend on the WebLN backend module. That module touches `window.webln`, and it is not a natural owner of a shared utility. If WebLN is removed, made lazy, or gets heavier import-time side effects, NWC breaks or picks them up. It also forced `nwc.test.ts` to load `webln.ts` transitively.
**Fix:** Move `abortError` into a neutral shared module, either `src/services/wallets/types.ts` or a new `src/services/wallets/abort.ts`, and import it from there in both `nwc.ts` and `webln.ts`.

## Info

### IN-01: The `verify-event.ts` ignore justification names a consumer that no longer imports it

**File:** `src/services/verify-event.ts:32`
**Issue:** The `aislop-ignore-next-line ai-slop/thin-wrapper` reason lists its consumers as "services/event-store.ts, providers/global/napplet-shell-provider.tsx". After 05-11, the provider does not import `verifyEvent`. The actual consumers are `src/services/event-store.ts` and `src/services/napplet-shell/adapter.ts`. Inline-ignore reasons (D-12) are what the next maintainer will rely on, and this one is out of date.
**Fix:** Change the consumer list to `services/event-store.ts, services/napplet-shell/adapter.ts`.

### IN-02: Four files created or edited in this phase are not Prettier-formatted

**File:** `src/components/napplets/intent-choice-modal.tsx:1`, `src/services/napplet-shell/resource-service.ts:225-226`, `src/services/wallets/index.ts:19`, `src/views/messages/chat/components/direct-message-form.tsx:238`
**Issue:** `prettier --check` fails on all four (long import and re-export lines not wrapped, an `if` split badly). The pre-phase version of `direct-message-form.tsx` passed the check.
**Fix:** `pnpm prettier -w` on the four files.

### IN-03: Comments describe refactor history instead of the code, so they will go stale

**File:** `src/services/napplet-shell/resource-service.ts:62-65, 94-96, 178-180`; `src/services/napplet-shell/permissions.ts:58-63`; `src/hooks/use-webxdc.ts:17-19, 128-132`
**Issue:** Several comments describe how the code was moved rather than what it does, for example:
- "moved verbatim, same two operands, neither inverted"
- "Split out of createResourceService's factory … (D-12); behaviour is unchanged from the pre-split version"
- "matching the deny path's previous direct `approvedCapabilities.delete(...)` behaviour exactly"
- "this is the sixth callback in the hook … the largest at 68 lines … neither half … left over the plain-function budget"

These are narrative/process comments, the pattern the project's aislop config is meant to remove. They will be wrong after the next edit.
**Fix:** Keep the parts that describe the invariant (for example, "allowed if resource:fetch was approved or the origin is a user Blossom server"). Move the refactor history to the commit messages and SUMMARY files.

### IN-04: `useWebxdcStateUpdates` returns `updates`, which its only caller ignores

**File:** `src/hooks/use-webxdc.ts:122, 243`
**Issue:** The hook returns `{ updates, setUpdateListener, getAllUpdates }`, but `useWebxdc` only destructures `setUpdateListener` and `getAllUpdates`. `updates` is a dead return value.
**Fix:** Remove `updates` from the returned object.

### IN-05: `relay-tiers.ts` now writes a debug log on every relay-tier lookup

**File:** `src/services/napplet-shell/relay-tiers.ts:7-17`
**Issue:** `getReadRelays` and `getWriteRelays` used to be pure getters. They now call `log(...)` every time they run, and they run on every napplet relay subscription (`selectRelayTier`), every publish, every `getRelayConfig` call, and every common-action publish. When debug logging is enabled, the output fills with relay arrays. This is new behaviour the refactor did not need.
**Fix:** Remove the log calls from these getters, or log only at the call sites that make routing decisions.

### IN-06: The service-layer `adapter.ts` depends on a React/Chakra hook type

**File:** `src/services/napplet-shell/adapter.ts:1, 65`
**Issue:** `createAdapter(toast: ReturnType<typeof useToast>, …)` brings `@chakra-ui/react` into `src/services/`. The adapter only calls `toast({ status, title, description })`. Now that the module has moved out of `providers/`, it would be cleaner to take a minimal callback type.
**Fix:** `type Notify = (opts: { status: "info" | "error"; title?: string; description?: string }) => void;` and pass `toast` in from the provider.

### IN-07 (pre-existing): `resource.cancel` cannot cancel any item of a `resource.bytesMany` batch

**File:** `src/services/napplet-shell/resource-service.ts:213, 238-241`
**Issue:** Batch items are tracked under `${windowId}:${id}:${url}`, but `resource.cancel` only looks up `${windowId}:${id}`. Cancelling a `bytesMany` request id does nothing, and the batch keeps fetching until it finishes or the window is destroyed. The move did not change this; I'm noting it because the code has just been relocated and is easy to fix now.
**Fix:** On cancel, also abort every key that starts with `${windowId}:${id}:`, or keep a per-batch `AbortController` keyed by the batch id.

### IN-08 (pre-existing): `publishCommonEvent` never uses its `label` parameter

**File:** `src/services/napplet-shell/common-actions.ts:100`
**Issue:** `label` is passed at every call site ("Follow user", "Reaction", "Report") but never read. It carried over unchanged from the provider.
**Fix:** Remove the parameter, or pass it to the publish log or service.

---

_Reviewed: 2026-10-01_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
