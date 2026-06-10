# Casts — Typed Reactive Views over Events and Pubkeys

Read this when you have events in the store (or a pubkey you want to read about) and need to display, traverse, or react to _derived_ and _relational_ data — author profiles, reply chains, reactions, zaps, contacts, outboxes, bookmarks, etc.

## What casts are (and why)

The relay pool + event store handle **ingestion** (subscribe, dedup, persist, sort). Casts handle **consumption**: they wrap a raw `NostrEvent` (or a `pubkey`) in a typed class whose properties are either _parsed values_ or _chainable observables_ that walk the event graph for you.

> **Most rendering code should never touch raw events.** Cast first, then read.

A `Note` knows it's a `kind: 1`. A `Profile` exposes `displayName`, `picture`, `lightningAddress`. A `User` exposes `profile$`, `contacts$`, `outboxes$`, `bookmarks$`. A `Zap` exposes `sender`, `recipient`, `amount`, `event$`. The properties end in `$` when they're reactive observables — that's the convention you'll see everywhere.

## The two base classes

Applesauce ships two cast base classes (both in `applesauce-core/casts`, re-exported by `applesauce-common/casts`):

- **`EventCast<T>`** — wraps a `NostrEvent`. The cast is cached _on the event itself_ (via a `Symbol`), so `castEvent(event, Note)` returns the same `Note` instance every time. Instances: `Note`, `Article`, `Profile`, `Reaction`, `Comment`, `Share`, `Zap`, `Mutes`, `BookmarksList`, `BadgeAward`, `Stream`, `Report`, `Torrent`, `RelayMonitor`, … (full list: `packages/common.md`).
- **`PubkeyCast`** — wraps a `ProfilePointer` (`{pubkey, relays?}`). The cast is cached _per pubkey_ in a static `Map` on the subclass. Instances: `User` (the only one applesauce ships, but you can subclass for domain-specific pubkey views).

Both classes:

- Accept `(event_or_pointer, store: CastRefEventStore)` in their constructor.
- Expose a `.store` reference so derived observables can query the store.
- Provide a `$$ref(key, builder)` helper to cache lazy observables per-instance per-property.

## Factory functions

You don't `new Note(event, store)` directly — use the factory functions so cached instances are reused:

```ts
import { castEvent, castUser, castPubkey } from "applesauce-core";
// (also re-exported from "applesauce-common/casts")
import { Note } from "applesauce-common/casts";

const note = castEvent(event, Note, eventStore);
// later — same event, same Note instance:
const same = castEvent(event, Note, eventStore); // === note

const user = castUser(pubkey, eventStore);
// castUser also accepts a NostrEvent (uses event.pubkey) or a ProfilePointer
const user2 = castUser({ pubkey, relays: ["wss://..."] }, eventStore); // includes relay hints
```

If `event` was added to a store, you can omit the third argument — `castEvent` will read the parent store from the event symbol. In practice, **always pass the store** for clarity; it's required for any cast that walks the graph.

If the event doesn't match the cast's expected kind, the constructor **throws**. `castEventStream` and `castTimelineStream` (below) catch and silently skip those — so feeding a mixed-kind stream through `castTimelineStream(Note, store)` just filters to valid notes.

## Synchronous vs reactive properties

Casts mix both:

```ts
// Synchronous — direct on the event
note.id; // string
note.kind; // 1
note.createdAt; // Date
note.uid; // string (replaceable address or event id)
note.isReply; // boolean
note.references; // NIP-10 root/reply pointers
note.author; // User (cached via castUser)

// Reactive — chainable observables (end in `$`)
note.author.profile$; // ChainableObservable<Profile | undefined>
note.replyingTo$; // ChainableObservable<NostrEvent | undefined>
note.replies$; // ChainableObservable<Note[]>
note.reactions$; // ChainableObservable<Reaction[]>
note.comments$; // ChainableObservable<Comment[]>
note.zaps$; // ChainableObservable<Zap[]>
note.shares$; // ChainableObservable<Share[]>
```

The `$`-suffix rule is consistent across the entire surface — if you see it, it's an observable. Memorise it.

## The `.author` shortcut — graph walking starts here

Every `EventCast` exposes `.author: User` synchronously. It just calls `castUser(event.pubkey, store)` and caches the result. From there you can walk the user's reactive surface:

```ts
note.author.npub; // string (sync)
note.author.profile$; // ChainableObservable<Profile | undefined>
note.author.profile$.displayName; // ChainableObservable<string | undefined>
note.author.outboxes$; // ChainableObservable<string[] | undefined>
note.author.contacts$; // ChainableObservable<User[] | undefined>
note.author.contacts$.length; // ChainableObservable<number | undefined>
```

That second-to-last line is the punch line of the chainable system: `note.author.profile$.displayName` is a `ChainableObservable<string>` even though `displayName` is just a plain getter on the `Profile` class. The proxy walks the chain for you and resolves at the leaf.

## Resolving chainable observables

A `ChainableObservable<T>` _is_ an `Observable<T>` — you can `.subscribe()`, `.pipe()`, `firstValueFrom(...)` it like any RxJS observable. The two extras:

```ts
// `$first(timeoutMs, fallback?)` — wait for the first non-null/undefined value
const name = await note.author.profile$.displayName.$first(5000, "Anonymous");

// `$last(timeoutMs, fallback?)` — wait for the final value before complete
const final = await someStream.$last(10_000, undefined);
```

`$first` filters out `undefined` and `null` before resolving, so you don't accidentally get a "still loading" value. Always pass a timeout (and ideally a fallback) — a missing kind 0 / kind 10002 means the observable may never emit otherwise.

In React, use `use$` (see `react.md`):

```tsx
const profile = use$(note.author.profile$);
// or with deps:
const profile = use$(() => note.author.profile$, [note]);
```

## Stream operators — turning event streams into cast streams

When you have an `Observable<NostrEvent>` or `Observable<NostrEvent[]>` from the store or a loader, lift it to a stream of casts in one operator:

```ts
import { castEventStream, castTimelineStream } from "applesauce-common/observable";
import { Note } from "applesauce-common/casts";

// Single event observable → single cast observable
const note$ = eventStore.event(pointer).pipe(castEventStream(Note, eventStore));

// Timeline → array of casts (invalid kinds silently filtered)
const notes$ = eventStore.timeline({ kinds: [1] }).pipe(castTimelineStream(Note, eventStore));
```

These pair naturally with the canonical wiring (see `patterns.md`) and `User.timeline$(filter, Cast)`.

## The `User` cast — the relational hub

`castUser(pubkey, store)` returns a `User` that exposes the user's whole NIP graph as chainable observables. Many take the user's outboxes into account automatically when querying replaceable lists, so you get the _latest_ version even if the store doesn't have it locally yet (assuming a loader is wired — see `patterns.md`).

| Property                                                                    | Yields                                            | NIP       |
| --------------------------------------------------------------------------- | ------------------------------------------------- | --------- |
| `npub` / `nprofile` / `pointer`                                             | sync NIP-19 / pointer values                      | 19        |
| `profile$`                                                                  | `Profile \| undefined` (kind 0)                   | 01        |
| `contacts$`                                                                 | `User[]` (kind 3 contacts, each as a cached User) | 02        |
| `mutes$`                                                                    | `Mutes \| undefined` (kind 10000)                 | 51        |
| `mailboxes$`                                                                | `{inboxes, outboxes} \| undefined`                | 65        |
| `outboxes$` / `inboxes$`                                                    | `string[] \| undefined` (from `mailboxes$`)       | 65        |
| `bookmarks$`                                                                | `BookmarksList \| undefined`                      | 51        |
| `favoriteRelays$` / `searchRelays$` / `lookupRelayList$` / `blockedRelays$` | `RelaysList \| undefined`                         | 51/77/65  |
| `directMessageRelays$`                                                      | `string[] \| undefined`                           | 17        |
| `blossomServers$`                                                           | `URL[] \| undefined`                              | (Blossom) |
| `favoriteEmojis$`                                                           | `FavoriteEmojis \| undefined`                     | 30        |
| `gitAuthors$` / `favoriteGitRepos$` / `graspServers$`                       | git lists                                         | 34        |
| `groups$`                                                                   | `GroupsList \| undefined`                         | 29        |
| `trustedProviders$`                                                         | `TrustedProviderList \| undefined`                | 87        |

Plus methods:

```ts
user.replaceable(kind, identifier?, relays?)  // ChainableObservable<NostrEvent | undefined>
user.addressable(kind, identifier, relays?)   // ChainableObservable<NostrEvent | undefined>
user.timeline$(kindOrFilter)                  // Observable<NostrEvent[]> by author
user.timeline$(kindOrFilter, NoteCast)        // Observable<Note[]>
```

`user.timeline$(1, Note)` is the cleanest way to get a typed live timeline of _this user's_ notes from the store, sorted, deduped, and cast — no manual filter composition.

## Composition patterns

### Walk from a zap to the zapped note's author

```ts
const zap = castEvent(zapEvent, Zap, eventStore);
const zappedEvent = await zap.event$.$first(5000);
if (zappedEvent) {
  const zappedNote = castEvent(zappedEvent, Note, eventStore);
  const authorName = await zappedNote.author.profile$.displayName.$first(2000, "?");
}
```

### Render a comment with its parent

```tsx
function CommentView({ comment }: { comment: Comment }) {
  const parent = use$(comment.parent$);
  const profile = use$(comment.author.profile$);
  // ...
}
```

### Subscribe to all replies _and_ reactions on a note in one component

```tsx
const replies = use$(note.replies$); // Note[]
const reactions = use$(note.reactions$); // Reaction[]
// Both auto-update as new events flow into the store.
```

### Fan from a user to their contacts' timelines

```ts
const user = castUser(pubkey, eventStore);
const contacts = await user.contacts$.$first(5000, []);
// contacts: User[] — each a cached cast you can call .timeline$ on
```

### Bridge a `BehaviorSubject<pubkey>` into a `User` stream

```ts
const user$ = pubkey$.pipe(map((p) => (p ? castUser(p, eventStore) : undefined)));
```

(Used in `bookmarks/manager.tsx` — `castUser` is cheap because of the static cache, so mapping every emission is fine.)

## Writing a custom cast

For an event kind applesauce doesn't ship a cast for, subclass `EventCast<T>` directly. The shape from `examples/casting/custom.md` (NIP-34 git repository):

```ts
import { EventCast, type CastRefEventStore } from "applesauce-common/casts";
import { type KnownEvent, type NostrEvent } from "applesauce-core/helpers/event";
import { getOrComputeCachedValue } from "applesauce-core/helpers/cache";

const REPOSITORY_KIND = 30617;
type RepositoryEvent = KnownEvent<typeof REPOSITORY_KIND>;

function isValidRepository(e: NostrEvent): e is RepositoryEvent {
  return e.kind === REPOSITORY_KIND && /* ...other checks... */ true;
}

class Repository extends EventCast<RepositoryEvent> {
  constructor(event: NostrEvent, store: CastRefEventStore) {
    // Validate in the constructor so castEventStream skips invalid events.
    if (!isValidRepository(event)) throw new Error("Invalid repository");
    super(event, store);
  }

  // Sync getter — delegate to a helper that memoises via getOrComputeCachedValue.
  get name() {
    return getOrComputeCachedValue(this.event, RepoNameSymbol, () => {
      return this.event.tags.find((t) => t[0] === "name")?.[1];
    });
  }

  // Reactive getter — cache the built observable with $$ref so it isn't rebuilt on every read.
  get reactions$() {
    return this.$$ref("reactions$", (store) =>
      store.model(ReactionsModel, this.event).pipe(castTimelineStream(Reaction, store)),
    );
  }
}
```

Three rules to follow:

1. **Validate in the constructor and throw on mismatch.** The `castEvent` factory and the stream operators catch this and skip — that's how mixed-kind streams self-filter.
2. **Sync getters should be cheap and memoised.** Use `getOrComputeCachedValue(event, symbol, fn)` (from `applesauce-core/helpers/cache`) so the parse runs once per event.
3. **Reactive getters wrap the observable in `this.$$ref(key, builder)`.** Without it, every property read builds and subscribes a fresh observable. The key just needs to be unique per property.

For `PubkeyCast`, the pattern is the same but the base class stores a `ProfilePointer` instead of an event. See `packages/core/src/casts/user.ts` for the canonical example. If you subclass `User` (or define a new `PubkeyCast`), give it a `static cache = new Map<string, YourCast>()` so `castPubkey` can intern instances.

## Pitfalls

- **A second `EventStore` breaks chainable walks.** Casts read from `this.store`, and the store passed to the factory is the one walks go through. Mismatch a store and the observables silently see nothing. (Same root cause as the "models never update" pitfall — see `troubleshooting.md`.)
- **Forgetting `$$ref`.** A reactive getter that builds its observable inline rebuilds (and re-subscribes) on every access. Subscriptions accumulate. Always wrap.
- **Treating `await user.profile$` as an event.** It returns the `Profile` cast (or `undefined`), not the underlying kind 0 event. Use `profile.event` if you actually need the raw event.
- **`profile$.displayName` returning `undefined` longer than expected.** The walk is `user → kind 0 event → Profile → displayName getter`. If the kind 0 isn't in the store and no loader is wired, the chain never resolves. Wire `createEventLoaderForStore` (see `patterns.md`) so missing replaceables fetch lazily.
- **`Throw` in custom cast constructors with side effects.** Validation throws are caught by `castEvent`/`castEventStream`/`castTimelineStream` — keep them pure so the silent-skip behaviour stays predictable.
- **Iterating raw events out of habit.** If you're reaching for `event.tags.find(...)` in render code, it's a signal that the cast you need is missing a getter — add one (in a custom cast or upstream) rather than parsing in the component.

## Worked examples

Anchored in `assets/examples/` (indexed in `examples.md`):

- `casting/custom.md` — full custom `EventCast` walkthrough (NIP-34)
- `feed/relay-timeline.md` — `castTimelineStream(Note)` + `note.author.profile$` rendering
- `zap/timeline.md` — `Zap.sender` / `Zap.recipient` / `Zap.event$` graph walks
- `articles/blog.md` — `castUser` + `user.outboxes$` + `castTimelineStream(Article)`
- `bookmarks/manager.md` — `BookmarksList.notes$` / `.articles$` and `castEventStream(Note)` per pointer
- `threading/note-thread.md` — `note.replies$`, `note.replyingTo$`, full thread graph
- `comment/feed.md` — `Comment.parent$` and `Comment.root$`
