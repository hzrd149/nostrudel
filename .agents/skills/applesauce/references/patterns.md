# Applesauce Patterns — Core

Idioms and compositions beyond what any single example demonstrates. Read this after `overview.md`. Specialised topics live in sibling files so you can read only what's relevant:

- Reading typed/relational data off events and users (`Note`, `User`, `Profile`, …) → `references/casts.md`
- React UI integration → `references/react.md`
- Persistence (SQLite, browser cache) → `references/persistence.md`
- Encrypted content (NIP-04/44) and hidden tags → `references/encryption.md`
- NIP-65 outbox publishing → `references/outbox.md`

The patterns below are universal — they apply to **any** Applesauce app regardless of UI framework or persistence layer.

## Subscriptions

Every reactive entry point in Applesauce returns an RxJS `Observable`. Nothing happens until you subscribe.

```ts
const sub = eventStore.timeline({ kinds: [1] }).subscribe((notes) => {
  // ...
});

sub.unsubscribe(); // tear down when the consumer is gone
```

Model observables auto-clean after ~60 seconds of zero subscribers (`share({ resetOnComplete: timer(60_000), resetOnRefCountZero: timer(60_000) })`), so short-lived leaks are bounded — but **relay** subscriptions (`pool.subscription`, `pool.req`) are cold and must be torn down explicitly.

In React, prefer `applesauce-react` hooks — they handle subscription lifetime for you. See `references/react.md`.

## Pump relay events into the store

Wrong (subscribe a renderer directly to a relay):

```ts
pool
  .relay(url)
  .subscription(filter)
  .subscribe((evt) => render(evt));
```

Right:

```ts
import { onlyEvents } from "applesauce-relay";

pool
  .subscription(["wss://relay.damus.io", "wss://nos.lol"], filter)
  .pipe(onlyEvents())
  .subscribe((evt) => eventStore.add(evt));
```

Or, if you want to compose it into a longer pipeline:

```ts
import { mapEventsToStore } from "applesauce-core/observable";

pool.subscription(relays, filter).pipe(onlyEvents(), mapEventsToStore(eventStore)).subscribe();
```

Pumping through the store guarantees deduplication, ordering, replaceable resolution, delete handling, and that **every** model/cast/hook sees every event exactly once.

## Casting events for typed UI

Raw events have stringly-typed tags; casts give you a typed object whose properties are either parsed values or chainable observables that walk the event graph.

```ts
import { castEvent } from "applesauce-core";
import { Note } from "applesauce-common/casts";

const note = castEvent(event, Note, eventStore);
const displayName = await note.author.profile$.displayName.$first(5000, "Anonymous");
```

```ts
import { castTimelineStream } from "applesauce-common/observable";

const notes$ = eventStore.timeline({ kinds: [1] }).pipe(castTimelineStream(Note, eventStore));
```

**Most rendering code should never touch raw events** — go through a cast. The full surface (`User` relational properties, chainable observables, `castEventStream` vs `castTimelineStream`, writing a custom cast) lives in `references/casts.md`.

## Loaders — load X once

Need a specific event (profile, thread root, reaction summary, etc.)? Use a loader rather than an open-ended relay subscription. Loaders dedupe in-flight requests, batch where possible, and complete once data arrives.

The recommended setup wires the loader into the store so `eventStore.event(pointer)` / `eventStore.replaceable(...)` fetches lazily:

```ts
import { createEventLoaderForStore } from "applesauce-loaders/loaders";

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
  extraRelays: ["wss://relay.damus.io"],
  followRelayHints: true,
  bufferTime: 1000,
});

// later — eventStore.event will fetch what it does not have
const event = await firstValueFrom(eventStore.event({ id: "...", relays: [...] }));
```

For one-off fetches without the store:

```ts
import { createEventLoader } from "applesauce-loaders/loaders";
import { firstValueFrom } from "rxjs";

const loadEvent = createEventLoader(pool, { eventStore });
const event = await firstValueFrom(loadEvent({ id: "...", relays: ["wss://..."] }));
```

**Every loader returns a cold `Observable`.** No request fires until you subscribe (or call `firstValueFrom` / `lastValueFrom`). This is by far the most common loader bug.

Loader inventory (`applesauce-loaders/loaders`): `createEventLoader`, `createAddressLoader`, `createUnifiedEventLoader`, `createEventLoaderForStore`, `createTimelineLoader`, `createOutboxTimelineLoader`, `createTagValueLoader`, `createReactionsLoader`, `createZapsLoader`, `createUserListsLoader`, `createSocialGraphLoader`, `dnsIdentityLoader`. There is no profile-specific loader — load kind 0 via `createAddressLoader`.

## Writes — two routes

### Route 1: a pre-built action (lists, sets, profile, mutes, bookmarks, DMs)

```ts
import { ActionRunner } from "applesauce-actions";
import { FollowUser, MuteUser } from "applesauce-actions/actions";

const runner = new ActionRunner(eventStore, signer, (event, relays) => pool.publish(relays, event));

await runner.run(FollowUser, "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d");
await runner.run(MuteUser, otherPubkey);
```

Actions handle read-modify-publish in one call: they look up the existing replaceable list (contacts, mute list, etc.), modify it, sign, publish to the right outboxes, and write the signed event back into the store so the UI updates without a round trip. If you forget the `publishMethod`, `.run()` throws — use `.exec()` if you want the events without publishing.

The actions package covers **list/set/profile/metadata management and DMs only** (`FollowUser`, `UnfollowUser`, `MuteUser`/`MuteWord`/`MuteHashtag`/`MuteThread` and their unmutes, `UpdateProfile`/`CreateProfile`, `BookmarkEvent`/`UnbookmarkEvent`, `PinNote`/`UnpinNote`, `CreateComment`, `AddInboxRelay`/`AddOutboxRelay`, `SendLegacyMessage`/`ReplyToLegacyMessage`, `SendWrappedMessage`/`ReplyToWrappedMessage`/`GiftWrapMessageToParticipants`, blossom/search/relay-set/app-data actions, …). **There is no `PublishNote` / `Reply` / `Reaction` / `Share` action** — use Route 2.

### Route 2: factory + signer + pool (notes, articles, reactions, shares, custom kinds)

```ts
import { NoteFactory } from "applesauce-common/factories";

const signed = await NoteFactory.create("Hello #nostr").addHashtag("applesauce").sign(signer);

await pool.publish(myOutboxes, signed);
eventStore.add(signed); // optimistic UI
```

Other common factories in `applesauce-common/factories`: `ReactionFactory`, `CommentFactory`, `ShareFactory`, `ArticleFactory` (long-form NIP-23), `WrappedMessageFactory`, `GiftWrapFactory`, `ZapRequestFactory`, `LegacyMessageFactory`, `BookmarkListFactory`, `FollowSetFactory`, `MuteListFactory`, `PinListFactory`, calendar/poll/highlight/badge/git/file/picture-post factories — 43 in total.

Replies to a note use `NoteFactory.reply(parentEvent, content)` (validates parent is kind 1).

For custom kinds, subclass `EventFactory<K>`. See `references/packages/core.md` for the base class API.

For publishing to the _right_ relays (the author's outboxes, recipients' inboxes), see `references/outbox.md`.

## Bridging observables to Promises

```ts
import { firstValueFrom, lastValueFrom } from "rxjs";

// First emission (one-shot fetches)
const event = await firstValueFrom(loader({ id, relays }));

// Last emission (after the stream completes — e.g. timeline loaders that EOSE)
const allEvents = await lastValueFrom(timelineLoader());
```

`firstValueFrom` subscribes, waits for the first `next`, then unsubscribes. `lastValueFrom` waits for `complete`. If the stream never completes (a live relay subscription), `lastValueFrom` hangs — pair with `takeUntil(timer(ms))` or `take(n)`.

For chainable observables on a cast, the same idea is one method: `note.author.profile$.displayName.$first(5000, fallback)`.

## RxJS gotchas

- **Cold vs hot:** Raw relay sockets are cold (each subscribe opens a new REQ). But `pool.subscription(...)` is internally deduped — multiple subscribers to the same `(relays, filters)` tuple share one REQ. If you compose your own stream on top, add `share()` / `shareReplay(1)` to fan out.
- **Dynamic filters:** if you build filters from a state stream (`BehaviorSubject` / `ReplaySubject`), use `shareReplay(1)` on the filter stream so reconnects/resubscribes get the latest filter — without it, retries can see an empty initial value.
- **`takeUntil` for teardown:** compose long-lived observables with a `destroy$` `Subject` and `takeUntil(destroy$)` so one `next()` cleans them all up. In React, fire that subject from a `useEffect` cleanup.
- **`combineLatest` patterns:** `combineLatestByValue`, `combineLatestByKey`, `combineLatestByIndex` (all from `applesauce-core/observable`) handle the "I have N observables of related things" case without boilerplate. See `examples/rx-views/friends-of-friends.md`.

## Composing filters

Use the helpers in `applesauce-core/helpers` (general) and `applesauce-common/helpers` (NIP-specific) instead of building tag arrays by hand. They handle replaceable addresses, empty values, NIP-19 decoding, and consistent edge cases.
