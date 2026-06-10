# NIP-65 outbox model

Read this when _publishing_ an event (any kind) or _reading_ events from specific users' outboxes. Hard-coding relay URLs is fine for examples and tests, but in production you almost always want the NIP-65 outbox model so events reach (and arrive from) the relays each user actually uses.

The mental model: every user's kind 10002 _relay list_ declares **outbox** relays (where they publish) and **inbox** relays (where DMs and reply notifications should be sent). NIP-65 routing means publishing to _the author's outboxes_ and _the recipients' inboxes_, and reading other users' content from _their outboxes_.

## Publishing

```ts
import { castUser } from "applesauce-common/casts";

const user = castUser(myPubkey, eventStore);
const outboxes = await user.outboxes$.$first(2000, ["wss://nos.lol"]);

await pool.publish(outboxes, signed);
```

- `user.outboxes$` is a chainable observable on the `User` cast — it returns the user's NIP-65 outbox URLs once loaded.
- `$first(timeoutMs, fallback)` is the idiomatic way to wait on a chainable observable with a sane default. Always pass a fallback so a missing/late kind 10002 doesn't block the publish.
- For DMs, also fetch each recipient's `inboxes$` and union them with the author's outboxes for the wrap envelope.

## Composing an outbox map across many users

For a social feed (timeline across the people the active user follows), you need a _map of pubkey → relays_ and to subscribe across all of them efficiently.

`applesauce-loaders/outbox` exports:

- `createOutboxMap(eventStore, pubkeys)` — produces a reactive `Map<pubkey, string[]>` keyed by author.
- `loadBlocksFromOutboxMap(...)` — batches loaders across the relays grouped by reachability.
- `selectOptimalRelays(...)` — minimises the set of relays needed to cover the requested authors (each relay typically covers many).

```ts
import { createOutboxTimelineLoader } from "applesauce-loaders/loaders";

const loader = createOutboxTimelineLoader(pool, eventStore, {
  authors: followedPubkeys,
  kinds: [1],
});
loader.subscribe();
```

The pool side has matching helpers — `pool.outboxSubscription(...)` for the live REQ. See `packages/relay.md` and `packages/loaders.md`.

## Reading from a specific user's outboxes

```ts
import { firstValueFrom } from "rxjs";

const outboxes = await firstValueFrom(user.outboxes$.pipe(/* ... */));
pool
  .subscription(outboxes, { authors: [user.pubkey], kinds: [1] })
  .pipe(onlyEvents())
  .subscribe((e) => eventStore.add(e));
```

For one-off article / replaceable fetches, prefer `createAddressLoader` with `followRelayHints: true` — it consults the user's outboxes automatically.

## Common pitfalls

- Hard-coded relay arrays in production. The event will reach those relays and nowhere else; the recipient may follow you on entirely different relays. NIP-65 _exists_ because the global relay set has fragmented.
- Awaiting `user.outboxes$` without a timeout / fallback. If kind 10002 is missing or late, the publish blocks forever. `$first(timeoutMs, fallback)` is your friend.
- Treating outbox lookup as a one-off promise. The list can change while the app is open — re-read on long-lived sessions or subscribe through a model that re-emits.

## Worked examples

Look in `examples.md` under `outbox/`:

- `examples/outbox/social-feed.md`
- `examples/outbox/relay-selection.md`
