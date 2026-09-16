---
phase: 04-dead-code-and-import-hygiene-sweep
reviewed: 2026-09-16T01:30:03Z
depth: standard
files_reviewed: 86
files_reviewed_list:
  - src/classes/preference-subject.ts
  - src/components/app-handler-modal/index.tsx
  - src/components/blob-details-modal.tsx
  - src/components/charts/relay-distribution-chart.tsx
  - src/components/compact-note-content.tsx
  - src/components/content/components/gallery.tsx
  - src/components/content/links/image.tsx
  - src/components/content/links/model.tsx
  - src/components/content/transform/bip-notation.ts
  - src/components/content/transform/nip-notation.ts
  - src/components/debug-modal/index.tsx
  - src/components/embed-event/card/embedded-zap-receipt.tsx
  - src/components/event-zap-modal/index.tsx
  - src/components/gif/gif-picker-modal.tsx
  - src/components/icons/infinity.tsx
  - src/components/layout/mobile/nav-drawer.tsx
  - src/components/layout/presets/app-tabs-layout.tsx
  - src/components/lightbox-provider.tsx
  - src/components/magic-textarea.tsx
  - src/components/markdown/markdown.tsx
  - src/components/navigation/apps.ts
  - src/components/note/note-menu.tsx
  - src/components/outbox-relay-selection-modal.tsx
  - src/components/post-modal/index.tsx
  - src/components/pow/mine-pow.tsx
  - src/components/pow/miner.ts
  - src/components/relay-url-input.tsx
  - src/components/timeline/highlight.tsx
  - src/components/timeline/note/components/share-modal.tsx
  - src/components/timeline/note/index.tsx
  - src/components/timeline/note/text-note-contents.tsx
  - src/helpers/nostr/goal.ts
  - src/helpers/nostr/relay-stats.ts
  - src/helpers/request.ts
  - src/hooks/use-dns-identity.ts
  - src/hooks/use-user-contact-relays.ts
  - src/hooks/use-user-pin-list.ts
  - src/providers/global/napplet-shell-provider.tsx
  - src/providers/local/intersection-observer.tsx
  - src/providers/local/thread-provider.tsx
  - src/providers/route/debug-modal-provider.tsx
  - src/providers/route/mute-modal-provider.tsx
  - src/services/accounts.ts
  - src/services/database/index.ts
  - src/services/loaders.ts
  - src/services/notifications/threads.ts
  - src/services/outbox-subscriptions.ts
  - src/services/sqlite/index.ts
  - src/services/sqlite/migrations.ts
  - src/services/wallets.ts
  - src/sw/worker/sw.ts
  - src/views/badges/badge-details.tsx
  - src/views/emojis/pack/index.tsx
  - src/views/feeds/dvm/components/dvm-avatar.tsx
  - src/views/feeds/dvm/components/dvm-params.tsx
  - src/views/feeds/dvm/feed.tsx
  - src/views/feeds/outboxes/outbox-feed.tsx
  - src/views/feeds/relays/index.tsx
  - src/views/lists/components/fallback-list-card.tsx
  - src/views/lists/components/user-card.tsx
  - src/views/lists/list/follow-set.tsx
  - src/views/messages/chat/components/direct-message-form.tsx
  - src/views/messages/components/direct-message-content.tsx
  - src/views/messages/group/components/group-relay-connections.tsx
  - src/views/messages/group/index.tsx
  - src/views/messages/index.tsx
  - src/views/napplets/napplet.tsx
  - src/views/new/note/short-text-form.tsx
  - src/views/notifications/focused-context.ts
  - src/views/pictures/picture/index.tsx
  - src/views/relays/components/relay-card.tsx
  - src/views/relays/map/components/relay-details.tsx
  - src/views/relays/relay/tabs/about.tsx
  - src/views/search/components/search-results.tsx
  - src/views/settings/display/index.tsx
  - src/views/settings/index.tsx
  - src/views/settings/mailboxes/index.tsx
  - src/views/settings/search/index.tsx
  - src/views/streams/stream/components/stream-sats-per-minute.tsx
  - src/views/thread/components/reply-form.tsx
  - src/views/tools/event-console/user-autocomplete.ts
  - src/views/tools/event-publisher/components/event-template-editor/index.tsx
  - src/views/torrents/index.tsx
  - src/views/user/components/user-card.tsx
  - src/views/user/tabs/lists.tsx
  - src/views/user/tabs/reactions.tsx
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-09-16T01:30:03Z
**Depth:** standard
**Files Reviewed:** 86
**Status:** issues_found

## Summary

This phase was a deletion-heavy import/dead-code hygiene sweep (132 unused imports, 24 unused
catch bindings, 53 unused parameters, 24 dead declarations, 20 residual imports across 86
substantive files). Given that profile, the review weighted "over-eager deletion" as the top risk
and traced every non-trivial deletion back to its call sites before accepting it as safe.

**Deletions verified safe by tracing usage:** `RepairBlobButton` (blob-details-modal.tsx),
`Header` (pictures/picture/index.tsx), `ListFeedButton` (lists/list/follow-set.tsx — its "View
Feed" behavior is already inlined at the call site), `isDirectReply` + the inline
`getCoordinateFromAddressPointer` shim (notifications/threads.ts — only remaining reference is a
comment), `SUGGESTED_MINTS`/`DEFAULT_WALLET_RELAYS` (wallets.ts — duplicate constants live on,
and are used, in `views/wallet/components/create-wallet-modal.tsx`), `locked`
(messages/group/index.tsx), `intent` (napplets/napplet.tsx — the surviving `NappletView` only
forwards raw `searchParams`, never the parsed value), `navigate` (badges/badge-details.tsx),
`setParams`/`loadingProfiles`/`url`/`isSpecialList` and several renamed-to-`_` bindings. None of
these introduced a runtime regression.

**The four behaviour-changing edits** were all verified correct:
- `pow/mine-pow.tsx`: `cleanup;` → `cleanup()` is a genuine (positive) fix — previously the
  worker pool for the just-completed mining run was never terminated on success. `stopMiner()`
  and `cleanup()` are distinct closures (previous-run vs. this-run teardown) and this is not a
  double-teardown.
- `content/components/gallery.tsx` / `content/links/image.tsx`: `!x && show()` → `if (!x) show()`
  is behaviorally identical.
- `content/transform/nip-notation.ts` / `bip-notation.ts` / `helpers/nostr/goal.ts`: the deleted
  `return false;` in each case was unreachable dead code after a try/catch whose every path
  already returns; the in-catch `return false;` / `return false` was correctly left in place.

**The four `aislop-ignore` directives**: two (`post-modal/index.tsx`, `short-text-form.tsx`) are
legitimate — both files have early-return branches (`published`, `loading`, `miningTarget && draft`
in short-text-form.tsx) that skip the JSX which would otherwise read `formState.isDirty`/`.isDirty`
again, so the bare property read genuinely is the only thing keeping react-hook-form's
proxy-based dirty subscription alive on those render paths. The other two
(`services/sqlite/index.ts`, `components/magic-textarea.tsx`) do not meet the bar in AGENTS.md —
see Warnings below.

No source files were modified as part of this review.

## Warnings

### WR-01: `aislop-ignore-file` reason in sqlite/index.ts doesn't justify why the code can't be fixed

**File:** `src/services/sqlite/index.ts:1`
**Issue:** The file-level ignore reads: *"...restructuring it to avoid the unreachable shape was
rejected as a behavior-change risk in a hygiene-only phase."* That's not a valid justification —
the flagged code (lines 10-16, the jeep-sqlite web-init block) sits after an unconditional
`throw new Error(...)` on line 9. Code after an unconditional throw is guaranteed to never
execute; deleting it is definitionally a no-op at runtime and carries zero behavior-change risk.
AGENTS.md's Inline-ignores rule requires the `-- reason` to justify *why the code could not be
fixed*, not merely to assert deliberateness — this reason asserts a risk that doesn't exist.
Separately, the ignore is file-scoped (`aislop-ignore-file`, naming two rules) when only a single
7-line block is implicated, which is broader than necessary per this phase's own review
criteria.
**Fix:** Either delete the unreachable lines 10-16 outright (zero runtime effect, since they can
never run), or — if the team genuinely wants to keep them as a record of the old wiring — move them
into a comment (so they're not live "unreachable code" the linter has to reason about) and use a
narrowly-scoped `aislop-ignore-next-line`/block directive with a reason grounded in an actual
constraint (e.g. "kept as commented historical reference, not live code") rather than a
behavior-change claim that doesn't hold for post-`throw` code:
```typescript
if (CAP_IS_WEB) {
  throw new Error("Do not load the sqlite module on web, it does not work because jeep-sqlite can not be disabled");
  // Historical reference only (unreachable): this is how web sqlite init used to be wired.
  // const { JeepSqlite } = await import("jeep-sqlite/dist/components/jeep-sqlite");
  // ...
}
```

### WR-02: `aislop-ignore-next-line` reason in magic-textarea.tsx is factually wrong — the imports are not at risk

**File:** `src/components/magic-textarea.tsx:24-26`
**Issue:** The ignore claims removing `[Textarea, Input];` "would orphan them and 04-01's
import-hygiene auto-fixer would strip them on its next pass." That's incorrect: both `Textarea`
and `Input` are already referenced later in the same file as real, non-type usages —
`textAreaComponent={Input}` (in `MagicInput`, ~line 181) and `textAreaComponent={Textarea}` (in
`MagicTextArea`, ~line 205). Neither import is at risk of being flagged as unused by any static
analysis, with or without the bare-array statement. The statement is pure dead code, and the
`-- reason` doesn't meet the AGENTS.md bar because the underlying claim is checkable and false.
**Fix:** Delete the dead statement and its stale comment/ignore entirely — the imports remain
safely referenced by their real usages further down the file:
```typescript
// Referencing Textarea and Input so they are not removed from the imports
// aislop-ignore-next-line eslint/no-unused-expressions -- ...
[Textarea, Input];
```
→ remove these 3 lines (lines 24-26).

## Info

### IN-01: Pre-existing bug — `getRTTTag` ignores its `name` parameter (not introduced by this phase)

**File:** `src/helpers/nostr/relay-stats.ts:23`
**Issue:** `getRTTTag(stats, _name)` always filters tags where `t[1] === "open"` regardless of the
`name` argument, so callers requesting `"read"`/`"write"` RTT values silently get duplicates of
the `"open"` RTT values. This phase only renamed the parameter to `_name` (consistent with the
unused-parameter convention) — the bug predates this phase and is unrelated to the rename.
**Fix:** Out of scope for this phase; tracked separately. If addressed, filter on `t[1] === name`
instead of the hardcoded `"open"`.

### IN-02: Pre-existing dead export — `RelayCard` has zero importers (not introduced by this phase)

**File:** `src/views/relays/components/relay-card.tsx:106`
**Issue:** `export default function RelayCard(...)` has no importers anywhere in the codebase.
This phase touched the file only to drop its unused `to` prop; the export itself was already
fully dead before and after this phase's change.
**Fix:** Out of scope for this phase; candidate for a future dead-code pass to delete the whole
export if no consumer materializes.

### IN-03: Pre-existing dead prop — `ZapModal`'s `relays` prop is accepted but never used, and at least one caller relies on it

**File:** `src/components/event-zap-modal/index.tsx:141,153`
**Issue:** `ZapModalProps.relays?: string[]` is destructured (now as `relays: _relays` per this
phase's unused-parameter convention) but never read anywhere in `ZapModal`'s body — only the
separate `additionalRelays` prop feeds the zap-request relay set. `src/views/goals/components/goal-zap-button.tsx:34`
passes `relays={getGoalRelays(goal)}`, apparently expecting the goal's relays to be included in
the zap request; that value is silently dropped. This predates the phase — the prop was already
unused before the `_`-prefix rename, so no regression was introduced here — but it's a real latent
functional gap worth flagging since it surfaced during this review.
**Fix:** Out of scope for this phase. If addressed later: either wire `relays` into the relay set
passed to `getPayRequestForPubkey`/`getPayRequestsForEvent`, or fix the caller to pass its value
via `additionalRelays` instead, then drop the now-genuinely-unused prop.

---

_Reviewed: 2026-09-16T01:30:03Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
