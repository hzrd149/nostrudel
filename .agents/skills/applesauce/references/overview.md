# Applesauce Overview

Applesauce is a modular Nostr SDK for TypeScript and JavaScript. It is built on RxJS observables and centered on a reactive in-memory event store. Every package is tree-shakeable; pick only what you need.

## Architecture

```
            ┌─ Loaders ─────────────────┐                ┌─ Factories ─┐
            │  createEventLoader        │                │  EventFactory│
            │  createAddressLoader      │                │  NoteBlueprint│
            │  createTimelineLoader     ▼                │  CommentBlueprint│
   Relays ─►│  …                   ┌────────────┐        │  WrappedMessageBlueprint│
            └─►  RelayPool ───────►│ EventStore │◄───────│  …           │
                                   │            │        └──────┬───────┘
                                   │ Models ◄───┤               │
                                   │ Casts  ◄───┤        ┌──────▼──────┐
                                   └────────────┘        │   Signer    │
                                          ▲              │  (NIP-07/   │
                                          │              │   NIP-46/   │
                                          │              │   NIP-49/…) │
                              ┌───────────┴────────┐     └──────┬──────┘
                              │ React (use$, …)    │            │
                              │ Casts (note.author │            ▼
                              │   .profile$.…)     │       pool.publish
                              └────────────────────┘
                                          ▲
                                          │ ActionRunner ───► run(FollowUser, …)
                                          └─────────────────►  (reads store +
                                                                writes through
                                                                signer + pool)
```

Layers, in plain English:

- **EventStore** (`applesauce-core`) — the single in-memory event database. Every event the app cares about flows through `eventStore.add(...)`. Models, casts, helper subscriptions, and React hooks all derive from it.
- **Models** (`applesauce-core/models`, `applesauce-common/models`) — RxJS observables over the EventStore that emit parsed, deduped, kept-up-to-date data. Base set in core (`ProfileModel`, `ContactsModel`, `MailboxesModel`, `OutboxModel`, `EncryptedContentModel`); NIP-specific set in common (`ThreadModel`, `CommentsModel`, `ReactionsModel`, `ZapsModel`, …). `applesauce-common/models` re-exports core, so importing from common is a safe default.
- **Casts** (`applesauce-core/casts`, `applesauce-common/casts`) — `castEvent(event, Note, eventStore)` returns a typed `Note` (or `Article`, `Profile`, `Zap`, `Reaction`, `Comment`, `User`, …) whose properties are **chainable observables**: `note.author.profile$.displayName.$first(5000, "Anonymous")` walks the graph and resolves to a Promise. `castEventStream` and `castTimelineStream` are pipe operators that lift an event/timeline observable into a cast/cast-timeline observable. This is the primary UI consumption pattern in v6 — most rendering code never touches raw events directly.
- **RelayPool** (`applesauce-relay`) — manages relay sockets, dedupes subscriptions, handles NIP-11 metadata, NIP-42 auth, NIP-45 COUNT, NIP-77 negentropy. Surface: `pool.relay(url)`, `pool.group(urls)`, `pool.subscription(urls, filters)`, `pool.req(urls, filters)`, `pool.request(urls, filters)`, `pool.publish(urls, event)`, `pool.event(urls, event)`, `pool.outboxSubscription(...)`, `pool.count(...)`, `pool.sync(...)`. Pair with operators from `applesauce-relay/operators` (`onlyEvents`, `completeOnEose`, `storeEvents`, `markFromRelay`) and liveness from `applesauce-relay/operators/liveness` (`RelayLiveness`, `ignoreUnhealthyRelays*`).
- **Loaders** (`applesauce-loaders/loaders`) — composable functions that fetch specific event shapes. The recommended setup is `createEventLoaderForStore(eventStore, pool, opts)` which wires `eventStore.eventLoader` so `eventStore.event(pointer)` / `eventStore.replaceable(...)` will lazily fetch missing events. Other loaders: `createEventLoader` (by id), `createAddressLoader` (replaceable/addressable), `createTimelineLoader`, `createOutboxTimelineLoader`, `createTagValueLoader`, `createReactionsLoader`, `createZapsLoader`, `createUserListsLoader`, `createSocialGraphLoader`, `createUnifiedEventLoader`. Every loader returns a cold `Observable` — no request fires until you `.subscribe()` or `firstValueFrom`.
- **EventFactory + factories** — `EventFactory` (base in `applesauce-core/factories`) is a chainable builder. Typed blueprints live in `applesauce-common/factories` (43 of them: `NoteBlueprint`, `ReactionBlueprint`, `CommentBlueprint`, `ShareBlueprint`, `WrappedMessageBlueprint`, `ZapRequestBlueprint`, `BookmarkListBlueprint`, `FollowSetBlueprint`, calendar/poll/highlight/badge factories, …). The pattern: `EventFactory.fromKind(1).content(text).sign(signer)` or `NoteBlueprint.create(text).addHashtag("applesauce").sign(signer)`. Custom factories subclass `EventFactory<K>` and define `static create / modify`.
- **Signers** (`applesauce-signers`) — uniform `ISigner` interface (also exported as the alias `Nip07Interface`) over `ExtensionSigner` (NIP-07), `NostrConnectSigner` (NIP-46 client) and `NostrConnectProvider` (NIP-46 host), `PasswordSigner` (NIP-49), `PrivateKeySigner` (`SimpleSigner` is a deprecated alias — use `PrivateKeySigner` in new code), `ReadonlySigner`, `SerialPortSigner`, `AmberClipboardSigner`.
- **Accounts** (`applesauce-accounts`) — `AccountManager` wraps signer flow with persistence (`toJSON`/`fromJSON` against any storage), an `active$` reactive state, and a `manager.signer` proxy that always points at the active account. Account classes mirror the signer classes.
- **Actions** (`applesauce-actions`) — `ActionRunner(events, signer, publishMethod)` plus a library of pre-built actions that handle the **read-modify-publish** cycle for list/set/profile/metadata mutations and DMs (`FollowUser`, `MuteUser`, `UpdateProfile`, `BookmarkEvent`, `PinNote`, `CreateComment`, `AddInboxRelay`, `SendLegacyMessage`, `SendWrappedMessage`, …). `.run(Action, ...args)` auto-publishes (throws if no `publishMethod`); `.exec(...)` returns the events without publishing. **There is no generic `PublishNote` / `Reaction` action** — publish notes/articles/reactions via factory + signer + pool directly.

## Canonical wiring

The minimal app:

```ts
import { EventStore } from "applesauce-core";
import { RelayPool, onlyEvents } from "applesauce-relay";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";

// 1. One EventStore for the whole app
const eventStore = new EventStore();

// 2. One pool
const pool = new RelayPool();

// 3. Wire a loader so eventStore.event(pointer) / .replaceable(...) auto-fetch
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
  extraRelays: ["wss://relay.damus.io", "wss://nos.lol"],
});

// 4. Pump events from any open relay subscription into the store
pool
  .subscription(["wss://relay.damus.io", "wss://nos.lol"], { kinds: [1], limit: 50 })
  .pipe(onlyEvents())
  .subscribe((event) => eventStore.add(event));

// 5. Read reactively — e.g. as typed Notes
import { castTimelineStream } from "applesauce-common/observable";
import { Note } from "applesauce-common/casts";

const notes$ = eventStore.timeline({ kinds: [1] }).pipe(castTimelineStream(Note, eventStore));

notes$.subscribe((notes) => {
  // notes: Note[] — sorted, deduped, kept up to date
  // notes[0].author.profile$.displayName.$first(5000) → Promise<string>
});
```

For a pool-side variant, use `mapEventsToStore(eventStore)` from `applesauce-core/observable` (equivalent to the `.subscribe(e => eventStore.add(e))` line above, but composes into a longer pipe).

## When to reach for which package

| You want to...                                                       | Read                                                                                                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Store and react to events                                            | `packages/core.md`                                                                                                                          |
| NIP-10 threads, NIP-22 comments, NIP-57 zaps, NIP-58 badges, etc.    | `packages/common.md`                                                                                                                        |
| Connect to relays                                                    | `packages/relay.md`                                                                                                                         |
| Sign events                                                          | `packages/signers.md`                                                                                                                       |
| Manage user accounts and active session                              | `packages/accounts.md`                                                                                                                      |
| Load events on demand                                                | `packages/loaders.md`                                                                                                                       |
| Mutate lists / sets / profile (follow, mute, bookmark, pin, profile) | `packages/actions.md`                                                                                                                       |
| Send NIP-04 / NIP-17 / NIP-59 messages                               | `packages/actions.md` (`SendLegacyMessage`, `SendWrappedMessage`)                                                                           |
| Publish a note / article / reaction / share                          | `packages/common.md` (factory blueprints) + `packages/signers.md` + `packages/relay.md` (`pool.publish`) — there is **no** action for these |
| Build typed event drafts                                             | `packages/core.md` (`EventFactory`) + `packages/common.md` (NIP blueprints)                                                                 |
| Render note content (text, mentions, embeds, hashtags, media)        | `packages/content.md`                                                                                                                       |
| Persist events between sessions (server / desktop / WASM browser)    | `packages/sqlite.md`                                                                                                                        |
| Cache events in the browser (IndexedDB / worker-relay)               | `examples/cache/nostr-idb.md` + `packages/loaders.md` (`cacheRequest`)                                                                      |
| Use from React                                                       | `packages/react.md`                                                                                                                         |
| NIP-60 wallet                                                        | `packages/wallet.md`                                                                                                                        |
| NIP-47 wallet-connect (client or service)                            | `packages/wallet-connect.md`                                                                                                                |
| Primal cache search or Vertex reputation                             | `packages/extra.md`                                                                                                                         |

## Two non-negotiable rules

1. **One `EventStore` per app.** Models cache per-store and the store's `insert$`/`update$`/`remove$` streams are instance-scoped. A second store will silently fail to receive writes from the first.
2. **Every event must go through `eventStore.add(...)`.** Bypass it and no model, cast, or hook will see the update.
