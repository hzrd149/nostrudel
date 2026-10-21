# Roadmap

## Phases

No active phases. Phases 1–8 are complete and their planning artifacts were removed on 2026-10-10.

## Backlog

### Code quality: aislop scan findings (2026-08-02)

These items were catalogued from a single `aislop@0.14.0` scan of `master` @ `d00cfd683`
([`.planning/research/aislop-scan-2026-08-02.md`](./research/aislop-scan-2026-08-02.md)).
Those counts are superseded: Phase 2 landed the adopted config and recorded a fresh whole-repo
baseline at [`.planning/research/aislop-scan-2026-09-11.md`](./research/aislop-scan-2026-09-11.md)
(**score 78/100, 1,196 findings**), which is what any promoted item measures against. The two
scans are not directly comparable — different aislop version, rule set, and scored file set.

Promoted so far: the config/gate item that was 999.11 became **Phase 2**; 999.3, 999.4, 999.9,
999.6, 999.7 and 999.10 became **Phases 3 – 8** (backlog review, 2026-09-12).

Still here: **999.2** (React hook-order violations — the highest-risk bucket in the scan and the
only one aislop classes as confirmed defects at error severity; the roadmap's suggested first
promotion, deliberately left in the backlog at review time), **999.5** (hook dependency arrays)
and **999.8** (comment and console noise). Refresh their counts from the 2026-09-11 baseline when
promoting.

### Phase 999.2: Fix React hook-order violations and missing keys (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

57 findings — **the highest-risk bucket in the scan and the only one aislop classes as
confirmed defects at error severity.** 49 × `react-hooks/rules-of-hooks` (hooks called
conditionally or after early returns → hook-order mismatch between renders, which manifests
as state bleeding between events or crashes on re-render), 6 × `react/jsx-key`,
2 × `react/no-children-prop`.

Concentrations: `views/settings/cache/database/wasm.tsx` (8),
`views/settings/accounts/components/migrate-to-device.tsx` (5),
`simple-signer-backup.tsx` (5), `hooks/use-user-bookmarks-list.ts` (4),
`components/embed-event/card/index.tsx` (3), `components/app-handler-modal/index.tsx` (3).

Spot-checked as genuine: `use-user-bookmarks-list.ts` exports `userUserBookmarksList` — a
typo that both breaks the lint rule's hook detection and hides four real violations;
`embed-event/card/index.tsx:107-113` calls `useSingleEvent`/`useReplaceableEvent` inside
conditionals.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.5: Resolve React hook dependency arrays (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

201 × `react-hooks/exhaustive-deps`. Kept as its own item because it cannot be batch-fixed —
blanket-adding dependencies causes render loops. Each site needs a per-case decision: add the
dep, memoize the value, or annotate the suppression with why.

Concentrations: `views/torrents/index.tsx` (7), `views/notifications/components/notification-counts.tsx` (6),
`components/lightbox-provider.tsx` (6), `providers/route/debug-modal-provider.tsx` (6),
`hooks/use-route-state-value.ts` (6), `hooks/use-timeline-loader.ts` (5).

Worth scoping down to the shared hooks and providers first (`hooks/`, `providers/`) — a stale
closure there propagates to every consumer.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.8: Strip comment and console noise (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

273 findings, **270 of them auto-fixable** — the largest score gain per unit of effort in the
whole scan. 219 × `trivial-comment`, 26 × `console-leftover`, 25 × `narrative-comment`
(decorative separators), 3 × `meta-comment`.

Concentrations: `sw/worker/cache.ts` (15), `sw/client/error-logger.ts` (11),
`classes/encrypted-storage.tsx` (10), `components/webxdc/webxdc.tsx` (9),
`sw/worker/error-handler.ts` (9), `sw/worker/sw.ts` (9), `services/event-cache/native-sqlite.ts` (8).

Caveat: the 11 consoles in `sw/client/error-logger.ts` are that module's entire purpose —
exclude it rather than stripping them. Review the `aislop fix` diff before committing; this
is a large mechanical change and belongs in its own commit so it doesn't bury real fixes.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.12: Add an event menu to highlight timeline items (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

Not part of the aislop scan catalogue above — a UI gap reported directly.

Highlight events in the timeline have no event menu, so the user has no way to delete or share
them and no "view raw" option. `src/components/timeline/highlight.tsx` renders only a footer
`ButtonGroup` (reply / share / quote / zap) and no menu at all, unlike every other kind:
`src/components/timeline/note/index.tsx:130` and `src/components/timeline/share.tsx:45` both
render `NoteMenu`.

What the missing menu contains (`src/components/note/note-menu.tsx`): Open in app, Share link,
Copy embed code, Mute user, **Delete event**, Broadcast, Pin event, and `DebugEventMenuItem` —
the raw-event view.

Action: render `NoteMenu` on the highlight card (header or footer, matching the other kinds) so
highlights get the same delete / share / raw options as the rest of the timeline.

Numbering note: 999.1 – 999.11 have all been issued at least once (999.1 → Phase 1,
999.11 → Phase 2, 999.3/4/6/7/9/10 → Phases 3 – 8), so this item takes the first never-used
number rather than reusing a vacated slot.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.13: Support NIP-22 comments in kind 1 threads (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

Not part of the aislop scan catalogue above — a protocol/UX capability reported directly.

NIP-22 comments (kind 1111) need to be shown and supported under standard kind 1 threads. Other
clients are starting to let users reply to a thread with either kind, so a thread whose replies
are split across both currently renders incomplete here.

Reply-kind rules the capture specifies:

- Replying to a **NIP-22 comment MUST produce a NIP-22 reply** — not negotiable, not a preference.
- Replying to a **kind 1 NIP-10 note** is the user's choice: a new setting selects whether the
  client publishes a NIP-10 kind 1 reply or a NIP-22 comment.

Current state found while capturing:

- **NIP-22 is already implemented in the app, just not in threads.** `CommentFactory.create`
  (`applesauce-common/factories`), `CommentsModel` and `COMMENT_KIND` are used by
  `src/views/pictures/picture/media-post-comment-form.tsx` and `picture-comments.tsx`, and comment
  UI exists for articles, files, links, badges, webxdc and the app store. This is an integration
  job, not a from-scratch implementation.

- **Thread reading is NIP-10 only.** `src/helpers/nostr/event.ts` resolves replies through
  `getNip10References` and `isReply()` only inspects the NIP-10 reply marker, so kind 1111 events
  never enter the thread tree (`src/views/thread/`).

- **The write seam already exists but is dead.** `src/views/thread/components/reply-form.tsx`
  declares `replyKind?: number` defaulting to `kinds.ShortTextNote`, and then ignores it — `submit`
  unconditionally calls `NoteFactory.reply(event, …)` and publishes as `"Reply"`. Wiring this prop
  up is likely the smallest part of the work. (Note for the dead-code sweep: this unused parameter
  should be wired up here rather than deleted there.)

- **Settings home:** `src/views/settings/post/index.tsx`, which already mixes `useSettingsForm`
  (synced app settings) with `localSettings` via `use$`; a new preference would follow
  `PreferenceSubject` in `src/services/preferences.ts`.

- `src/services/notifications/threads.ts` already branches on kind 1111 for notification grouping,
  so notifications may partly work once threads do.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.14: Pin the app store to the nav in place of "All Apps" (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

Not part of the aislop scan catalogue above — a navigation/direction change reported directly.

**Nav swap landed (2026-10-21, 8608fce27):** `index.tsx:51` now reads
`<NavItem to="/app/store" icon={Package} label="App Store" />`, in both the desktop side nav and
the mobile drawer. Nothing links to `/other-stuff` any more; the route still resolves. What
remains is the open question below and migrating `internalTools` into napplets. The full store
build-out is 999.19–999.23.

The app store button should be pinned to the side nav in the slot the "All Apps" link currently
occupies. Rationale from the capture: the forward direction is to migrate the tools and the
smaller internal views into napplets, so the store — not a static index of built-in views —
becomes the way users find functionality.

Current state found while capturing:

- The nav item to replace is `src/components/layout/components/index.tsx:51`:
  `<NavItem to="/other-stuff" icon={Package} label="All Apps" />`.

- **This is one edit that changes two surfaces.** `NavItems` is rendered by both
  `src/components/layout/desktop/side-nav.tsx:46` and
  `src/components/layout/mobile/nav-drawer.tsx:59`. `mobile/bottom-nav.tsx` has no nav items and
  is unaffected. Whether the mobile drawer should match the desktop pin is worth an explicit
  decision rather than an accident of the shared component.

- **The store already exists as a nav destination, just not a pinned one.** `internalApps` in
  `src/components/navigation/apps.ts` contains
  `{ title: "Store", description: "Discover and manage NIP-5D apps", id: "napplets", to: "/app/store" }`,
  so it can already appear via the favourites list (`useFavoriteInternalIds("apps", "app")`) or
  recents. "Pinning" means promoting it to a fixed `NavItem` alongside Create new / Support /
  Settings, so it no longer competes for a favourites slot. The route is registered at
  `src/app.tsx:107` (`app/store` → `views/app/store.tsx`).

Open question this raises:

- **Removing "All Apps" removes the only fixed route to the full index.** `/other-stuff`
  (`src/views/other-stuff`) is what lists every internal app and tool, and `/tools` is already
  just a redirect into it (`src/views/tools/index.tsx` → `/other-stuff?tab=tools`). If the link
  goes, the index is reachable only by URL or by whatever the store surfaces. Decide whether
  "All Apps" moves into the store view, stays as a secondary entry, or is dropped deliberately as
  the migration progresses.

Related: the migration target set is `internalTools` in `src/components/navigation/apps.ts`
(Event Console, Event Publisher, and the other small views) — the things intended to become
napplets.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.15: Split the zap flow into hooks with a separate signing step (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

Promoted from Phase 8's bucket-I TODO triage (D-07); the code comments in
`src/components/event-zap-modal/index.tsx` now name this item.

`getPayRequestForPubkey` in `src/components/event-zap-modal/index.tsx` does the profile metadata
lookup, the LNURL fetch, relay selection, zap request construction, signing
(`account.signEvent(zapRequest)`) and the invoice callback fetch in one async function. The two
former TODOs (near lines 36 and 108 at capture) asked for it to be broken into parts or hooks and
for signing to move into a separate step so the user chooses when to sign.

- **Suggested direction:** hooks for LNURL metadata and relay selection, and a user-triggered sign
  step before the invoice request.

- **Related files:** `input-step.tsx` and `pay-step.tsx` in the same directory.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.16: Persist File and Blob values in the form cache (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

Promoted from Phase 8's bucket-I TODO triage (D-07); the code comments in
`src/hooks/use-cache-form.ts` and `src/views/new/picture/picture-post-form.tsx` now name this item.

`src/hooks/use-cache-form.ts` saves `JSON.stringify(getValues())` to `localStorage`, so `File` and
`Blob` values serialize to empty objects and are lost on restore. The visible victim is the `media`
field of `src/views/new/picture/picture-post-form.tsx` (`useCacheForm("new-media-post", …)`). Restored
`media` entries keep `file: {}`: the form's `instanceof File` filter hides them, but
`src/views/new/picture/index.tsx` still passes them to `uploadFile.run`, and the dirty form writes them back
to the cache on unmount.

- **Suggested approach (from the former TODO):** move the store to `localforage` (already a
  dependency, `^1.10.0`), which can hold Blobs. Phase 8 deleted the commented-out
  `localforage.createInstance` line that sat beside the TODO.

- **Open question:** storage size and cleanup for cached media.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.17: Merge hidden tags when merging a list version (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

Promoted from Phase 8's bucket-I TODO triage (D-07); the JSDoc in
`src/helpers/nostr/list-history.ts` now names this item.

`mergeVersionIntoList` in `src/helpers/nostr/list-history.ts` merges a historical version's public
tags into the current list but keeps the current list's encrypted `content` unchanged, so hidden
(private) tags from the version are not merged. `restoreListVersion` copies a version wholesale and
is not affected.

- **Approach (from the former TODO):** decrypt both events' content with the signer (applesauce
  `unlockHiddenTags` / `getHiddenTags`), union the private tags with the same dedup rules as
  `getTagsAddedByMerge`, then re-encrypt the merged set into the draft content.

- **Open question:** behaviour when the version's hidden tags cannot be unlocked.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.18: Make the composer a real form (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

Promoted from Phase 8's bucket-I TODO triage (D-07, D-08); the code comments in
`src/components/post-modal/index.tsx` and `src/views/new/note/short-text-form.tsx` now name this
item.

The composer bodies, `ComposerBody` in `src/components/post-modal/index.tsx` and the form in
`src/views/new/note/short-text-form.tsx`, are not `<form>` elements. Per D-08 they were promoted
rather than resolved in Phase 8: a real form makes Enter in any single-line input submit it, so the
advanced-option inputs (content-warning reason, PoW difficulty, zap split) would submit the post.
An `as="form"` with Enter guards was rejected for Phase 8.

- **Needs:** a design decision on which inputs may submit, plus manual UAT of both composers.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Napplet store build-out (captured 2026-10-21)

The goal is a full-featured store for browsing, discovering and installing NIP-5D napplets.
Review sources: applesauce v7 (`applesauce-common` napplet helpers/casts/factories, NIP-78
app-data, NIP-89 recommendations) and the applesauce `napplet/store` example, compared against
`src/views/app/store.tsx`, `store-detail.tsx`, `src/services/installed-napplets.ts` and
`src/services/napplet-shell/*`.

Decisions (2026-10-21):

- **Installed apps sync through NIP-78 app data** (kind 30078) using applesauce's
  `applesauce-common/helpers/app-data` (`getAppDataContent`, `unlockAppData`,
  `getAppDataEncryption`), `AppDataFactory` and the `UpdateAppData(identifier, data)` action.
  No custom list kind. noStrudel already stores settings in kind 30078 (`src/models/app-settings.ts`).
- **Napplets only.** No Zapstore / NIP-82 support; those are a different kind of app.
- **Reactions and NIP-22 comments are the social signal.** No ratings kind for now.

Suggested order: 999.19 (done) → 999.20 (done) → 999.21 → 999.22 → 999.23.

### Phase 999.19: Fix napplet store and launch bugs, adopt applesauce napplet APIs (DONE)

**Landed:** 39870d773 (2026-10-21), done directly without promotion. Applesauce adoption is
partial by design: applesauce reads archetypes from `z` tags, while noStrudel derives them from
`i` intent tags through kehto, so only the getters with matching semantics were swapped (icon,
servers, source, snapshot parent pointer).

- **Intents broken for apps opened at `/app/...`.** Only `NappletView`
  (`src/views/napplets/napplet.tsx:99`) calls `setIntentNavigator`, and that view redirects to
  `/app/...` immediately and clears it on unmount. `AppView` (`src/views/app/index.tsx`) never sets
  one, so `invoke` returns "napplet frame is not available" (`intent-service.ts:93,130`).
- **Wrong app can launch.** `getInstalledNappletPath` builds the path from the first archetype
  (`installed-napplets.ts:104-107`); two installed apps that share an archetype collide and the
  most recently opened wins.
- **Profile tab installed badge.** `src/views/user/tabs/napplets.tsx:49` hard-codes
  `installed={false}`.
- **Dead code:** `src/services/recent-napplets.ts`, `napplet-app-tile.tsx`.
- Replace the custom manifest parsing in `src/helpers/nostr/napplets.ts` with applesauce's
  `helpers/napplet` getters and `Napplet` casts where they cover it; keep custom code only where
  the parser is deliberately more permissive.
- Make the installed-apps store observable instead of synchronous localStorage re-reads
  (`store.tsx:370-371`). Keep the active store tab in the URL.

### Phase 999.20: Sync installed napplets with NIP-78 app data (DONE)

**Landed:** 887a6194c, ddf318892, 64049c172 (2026-10-21), done directly without promotion.

- Encrypted (NIP-44) kind 30078, `d=nostrudel-napplets`, holding installs and default handlers.
  Built with `AppDataFactory(...).as(signer).encryptedContent(...)` because applesauce's
  `AppDataFactory.data(data, true)` / `UpdateAppData` do not pass the signer to `setContent` and
  throw for encrypted content.
- Per-account local lists (`nostrudel:napplet:installed:<pubkey>`), seeded from the device list the
  first time an account is used; three-way merge against the last synced state
  (`nostrudel:napplet:synced:<pubkey>`). Locked lists register as the `napplets` pending-unlock
  category; changes made while locked prompt the signer when they publish.
- `getNappUpdateBehavior: "banner"` turned out to be unused by kehto; the update notice is
  noStrudel's own (`openedVersion` per device).
- Not done: re-consent when a manifest's `R`/`O` tags change without a new aggregate hash.

- Store the installed list (and default intent handlers, `nostrudel:napplet:intent-handlers`) in a
  kind 30078 event via `AppDataFactory` / `UpdateAppData`. Decide the `d` identifier and whether
  to encrypt (applesauce supports encrypted app data; an install list is private by nature).
- localStorage stays as the offline cache and the anonymous-user store; migrate existing
  `nostrudel:napplet:installed` entries on first sign-in.
- Refresh stored manifest metadata when a newer manifest arrives and surface the update
  (`getNappUpdateBehavior: "banner"` is already set in `adapter.ts:117` but unused).
- Show capabilities at install time, not only on first launch. Add a permissions page to revoke
  "Always allow" grants (`permissions.ts:272-306`; flagged in `.planning/codebase/CONCERNS.md`).

### Phase 999.21: Store discovery: categories, search, sort, filters (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

- Categories from archetypes (`z` tags) with relay-side `#z` filters.
- NIP-50 relay search alongside the current local matchSorter search (`store.tsx:321-329`).
- Sort: newest, recently updated, popular with follows (reaction counts).
- Filters: from people I follow, by required capability (`#R`).
- Replace "Featured" (currently `timeline[0]`, duplicated in the grid, `store.tsx:298-304`).
- Reference: applesauce example `napplet/store`.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.22: Store social signals: reactions and comments (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

- Reaction and comment counts on store cards, via the `Napplet` cast's `reactions$` / `comments$`.
- Comments presented as reviews on the detail page.
- "Liked by people you follow" as a discovery row and sort key.
- No ratings kind (decision 2026-10-21).

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.23: Store detail page and publisher profiles (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

- Version history on the detail page from `snapshots$` / `lineage$` (today only in the in-frame
  drawer, `napplet-info-drawer.tsx`, `use-napplet-versions.ts`).
- Show the source link (parsed at `napplets.ts:116`, never rendered).
- Publisher card with all of the author's napplets (`user.napplets$`), replacing the 6-item
  "More by this author".
- Screenshots need a manifest tag convention agreed upstream with NIP-5D / kehto; out of scope
  until then.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)
