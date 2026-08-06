# Phase 1: Hidden mutes support with unlock UX and decryption cache - Context

**Gathered:** 2026-08-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver support for hidden (encrypted) entries in the user's kind-10000 mute list: reading
them, unlocking them through a deliberate user action, and keeping them unlocked across app
reloads via the existing decryption cache.

During discussion the unlock UX was widened by explicit user direction: instead of a
mute-specific unlock control, this phase builds a **generic, application-wide pending-unlock
mechanism** — a registry of locked things plus an indicator/button in the side nav — with
**mute lists as its only registered source**. Direct messages and the other hidden-tag list
kinds are deliberately NOT wired in this phase; they are follow-up work against a proven
mechanism.

**In scope:**

- Generic pending-unlock registry + side-nav affordance ("unlock now" / "enable auto-unlock")
- Auto-unlock preferences in Privacy settings ("unlock all" + registry-driven per-category)
- Mute lists registered as the first (and only) source
- The decryption-cache lock itself registered as a pending item, so its password prompt is
  reachable outside the Messages route
- Muted view: a separate Private section with a locked placeholder + Unlock button
- Unmute correctness for privately-muted pubkeys, and merged `isMuted` state

**Out of scope:** adding private mutes ("mute privately"), wiring DMs or other hidden-tag
lists into the mechanism, managing muted words/hashtags/threads in the UI.

</domain>

<decisions>
## Implementation Decisions

### Unlock trigger and mechanism

- **D-01:** No silent/automatic signer calls by default. Hidden mutes decrypt only from a
  deliberate user action. Explicitly rejected: extending `autoDecryptMessagesFallback` in
  `src/services/decryption-cache.ts` to auto-unlock kind 10000 at startup.
- **D-02:** The unlock affordance is **application-wide and generic**, not mute-specific: an
  indicator + button in the side nav showing that things (lists, DMs, mutes, etc.) are pending
  unlock. Pressing it offers two actions — unlock the pending items **once**, or **enable
  auto-unlock going forward**, saved as a preference.
- **D-03:** Phase 1 delivers the generic mechanism with **mute lists as the only registered
  source**. The nav count is therefore mutes-only (plus the cache-lock item, D-09) on day one.
- **D-04:** Auto-unlock preferences live in the **Privacy settings section**
  (`src/views/settings/privacy/index.tsx`): an "unlock all" option, and — when that is
  unchecked — options for specific categories.
- **D-05:** The per-category list is **registry-driven**: each source registered with the
  mechanism contributes its own category and preference. This phase registers mutes, so
  Privacy shows "unlock all" + "Mute lists" only. No placeholder or disabled categories for
  unwired sources; the settings page grows as sources are registered.
- **D-06:** When the mute list is replaced from another device (new event id → decryption-cache
  miss → locked again), it simply **returns to locked and waits for the user**. No "has
  unlocked before" flag, no automatic re-unlock.

### Locked-state behavior

- **D-07:** While hidden mutes are locked, timelines **silently under-filter**. No banner, no
  warning, no gating on timeline views — the side-nav pending indicator is the single signal.
  (`useClientSideMuteFilter` / `useUserMuteFilter` need no changes; `MuteModel` already merges
  hidden mutes in the moment the event unlocks.)
- **D-08:** Failed unlock attempts (signer rejection, nostr-connect timeout, undecryptable
  content) **toast the error and leave the item pending and retryable**. No per-item failure
  state, no distinction between user cancellation and genuine errors.
- **D-09:** A locked decryption cache is **itself a pending item** in the mechanism, prompting
  for the cache password from the same place. This matters because `encryptDecryptionCache`
  defaults to `true`, so the cache is an `EncryptedStorage` that starts locked on every app
  start — and today the password is only ever prompted inside the Messages route via
  `RequireDecryptionCache`. Without this, "unlock once, stays unlocked across reloads" does not
  hold on default settings for any user who never opens Messages.

### Muted view presentation

- **D-10:** Private mute entries get their **own "Private" section**, separate from the public
  list — not an inline badge and not tabs.
- **D-11:** While locked, that section renders a **locked placeholder with its own Unlock
  button**, in addition to the side-nav affordance. Note the entry count is unknowable while
  locked — `hasHiddenTags` reveals only that hidden content exists.
- **D-12:** The Private section renders **pubkeys only**, matching the existing public list.
  Private words/hashtags/threads are not surfaced (neither are public ones today).

### Write path

- **D-13:** **Unmute correctness only.** No "mute privately" in this phase. Nothing shown in
  the Private section may have a Remove button that silently does nothing.
- **D-14:** Unmute **detects which half the pubkey lives in** (`getPublicMutedThings` vs
  `getHiddenMutedThings`) and acts accordingly: public entries keep today's helper path in
  `src/helpers/nostr/mute-list.ts` with its `mute_expiration` pruning intact; hidden entries go
  through applesauce's `UnmuteUser(pubkey, true)`. Explicitly rejected: consolidating every
  surface onto applesauce actions (would lose the noStrudel-specific `mute_expiration` scheme
  unless re-expressed as a tag operation), and removing from both halves unconditionally
  (forces a decrypt + re-encrypt signer round-trip on every unmute).
- **D-15:** `isMuted` becomes **merged state** (from `MutesQuery`), so a privately-muted user
  reads as muted once unlocked. While locked it falls back to public-only and may misreport —
  accepted, consistent with D-07. Pressing Mute on an unknown private mute can therefore add a
  public duplicate; applesauce's `addUser` dedupes within a half, not across halves.

### Claude's Discretion

None — the user selected a concrete option for every question. No "you decide" answers.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs, ADRs, or design docs exist for this phase — ROADMAP.md carries no
`Canonical refs:` line for Phase 1, and `.planning/` has no PROJECT.md or REQUIREMENTS.md.
Requirements are fully captured in the decisions above.

### Phase source
- `.planning/ROADMAP.md` — Phase 1 entry (goal statement; note it predates the app-wide
  widening in D-02/D-03)

### Protocol
- NIP-51 (lists / hidden tags) — mute list is kind 10000 with hidden entries in nip04-encrypted
  `content`. Available via the `nostr` MCP server (`read_nip`), not vendored in-repo.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/services/decryption-cache.ts` — already runs
  `persistEncryptedContent(eventStore, cache, autoDecryptMessagesFallback)`, which persists and
  restores decrypted content for **any** kind registered with an encryption method, keyed by
  `event.id`. Kind 10000 is registered nip04 by applesauce
  (`applesauce-core/dist/helpers/hidden-tags.js:12`), so **mute-list persistence is already wired
  — no new cache code is needed**. Restore-by-event-id is exactly why a republished list
  re-locks (D-06).
- `applesauce-common/helpers/mute.js` — `unlockHiddenMutes(event, signer)`,
  `isHiddenMutesUnlocked`, `getHiddenMutedThings`, `getPublicMutedThings`, `mergeMutes`,
  `matchMutes`.
- `applesauce-common/models/mutes.js` — `MuteModel` (merges public + hidden, uses
  `watchEventUpdates` so unlocking propagates), plus `PublicMuteModel` and `HiddenMuteModel`,
  which are what the split Private section (D-10) should be built on.
- `applesauce-actions/actions/mute.js` — `MuteUser`/`UnmuteUser`/`MuteThread`/`MuteWord`/
  `MuteHashtag` all already take a `hidden` flag.
- `src/views/messages/components/pending-decryption-alert.tsx` — closest precedent for a
  count + "Decrypt All" affordance, including how it breaks out of a loop when the signer
  error mentions "user".
- `src/views/lists/components/list-history-modal.tsx` — precedent for per-item Locked badge +
  Unlock button using `hasHiddenTags` / `isHiddenTagsUnlocked` / `unlockHiddenTags`, and for
  forcing a re-render after unlock (the result is cached on the event via a symbol).
- `src/providers/route/require-decryption-cache.tsx` — existing cache password/unlock UI,
  including `EncryptedStorage.unlock(password)` and the disable-cache / disable-encryption
  escape hatches. Relevant to D-09.
- `src/components/layout/components/connections-button.tsx` and `publish-log-button.tsx` —
  the shape of a side-nav status button.
- `src/hooks/use-async-action.ts` — the app's convention for loading state on user actions.

### Established Patterns

- **Preferences:** `PreferenceSubject` in `src/services/preferences.ts` (`autoDecryptMessages`,
  `enableDecryptionCache`, `encryptDecryptionCache`) — new auto-unlock preferences belong here,
  not in `useAppSettings`. Note `src/views/settings/privacy/index.tsx` mixes both systems: a
  `useSettingsForm`/`useAppSettings` react-hook-form for synced settings, plus `use$(localSettings.…)`
  for local ones. Auto-unlock prefs are local and should follow the `use$` path.
- **Reactive service state:** RxJS observables in `src/services/*` exposed to React through
  `use$` — the natural shape for the pending-unlock registry.
- **Event parsing lives in helpers**, not components (`src/helpers/nostr/mute-list.ts`).
- Symbols set on events (`HiddenTagsSymbol`, `EncryptedContentSymbol`) are mutations, not
  new object identities — UI must be driven by `watchEventUpdates`/`notifyEventUpdate` or a
  forced re-render, as `list-history-modal.tsx` does.

### Integration Points

- `src/components/layout/desktop/side-nav.tsx` — the bottom `ButtonGroup` where the pending-unlock
  button goes. **Caveat:** that group only renders `RelayConnectionButton`/`PublishLogButton`
  when `!collapsed`, and mobile uses `src/components/layout/mobile/bottom-nav.tsx` and
  `nav-drawer.tsx` instead. Mobile/collapsed placement was not decided in discussion — planner
  should resolve it.
- `src/views/settings/privacy/index.tsx` — new auto-unlock preference controls.
- `src/views/lists/muted/index.tsx` — the Muted view; currently a single `react-window`
  `FixedSizeList` over `muted.pubkeys`. The Private section (D-10) has to coexist with that
  fixed-height virtualization. This view already uses applesauce's `UnmuteUser`.
- `src/hooks/use-user-mute-actions.ts`, `src/providers/route/mute-modal-provider.tsx` — the
  surfaces that today edit **public tags only** via `src/helpers/nostr/mute-list.ts`; targets
  for D-14 and D-15.
- `src/services/decryption-cache.ts` — where a mute-list source registers, and where the
  cache-lock pending item (D-09) is observable via `decryptionCacheStats$` (`isLocked`).

### Constraints found while scouting

- `EncryptedContentSymbol` is in `PRESERVE_EVENT_SYMBOLS`
  (`applesauce-core/dist/helpers/pipeline.js:3`), so an event the user republishes carries its
  plaintext forward and stays unlocked. Re-locking only happens for edits arriving from another
  device — which is what D-06 governs.
- `modifyHiddenTags` (`applesauce-core/dist/operations/tags.js:26`) unlocks existing hidden tags
  before modifying, so hidden writes never silently destroy existing private entries — but they
  do require a signer decrypt first.
- The repo has **no test framework** for the web app (see `.planning/codebase/STACK.md`), and
  no lint config (Phase 2). Verification will be manual.

</code_context>

<specifics>
## Specific Ideas

Verbatim user direction on the unlock UX (the pivot that widened this phase):

> "The unlocking behaviour should be application wide and a generic toggle and opt-in button in
> the side nav. this way users when opening the app can see that things (lists, DMs, mutes, etc)
> are pending an unlock and can then click the button to either unlock the pending items once or
> enable auto-unlock going forward (saved as a preference)"

And on the preferences:

> "we should add new preferences to the privacy section for generally what kind of events can be
> auto unlocked, there should be an option to unlock all or if thats unchecked then there are
> options for specific categories"

</specifics>

<deferred>
## Deferred Ideas

- **Wire direct messages into the mechanism** — register gift-wrapped and legacy DMs as a
  source, and reconcile the existing `autoDecryptMessages` preference plus
  `pending-decryption-alert.tsx` with the generic registry. Deliberately excluded from Phase 1
  (D-03).
- **Wire the remaining `HiddenTagsKinds` lists** — bookmarks, follow sets, interests, public
  chats, search relays, communities, groups. Same mechanism, additional registrations.
- **"Mute privately" as a write feature** — an explicit hidden option in the mute modal/menu via
  `MuteUser(pubkey, true)`. Excluded by D-13.
- **Managing muted words, hashtags, and threads in the UI** — the Muted view renders pubkeys
  only for both halves (D-12); surfacing the other three `MutedThings` kinds is a broader
  mute-management feature.
- **Deduplicating a pubkey muted both publicly and privately** — possible after D-15 lets a
  duplicate be created while locked. Not addressed this phase.
- **Mute expirations for private entries** — `mute_expiration` is a noStrudel-specific public-tag
  scheme; how (or whether) it applies to hidden entries was not decided.

</deferred>

---

*Phase: 1-hidden-mutes-support-with-unlock-ux-and-decryption-cache*
*Context gathered: 2026-08-06*
