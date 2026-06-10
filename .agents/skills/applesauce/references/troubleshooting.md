# Applesauce Troubleshooting

## "Models / casts never update"

Almost always one of:

- More than one `EventStore` instance — models cache per store, and the store's `insert$`/`update$`/`remove$` streams are instance-scoped. A second store silently fails to feed observables from the first.
- An event source (relay subscription, loader, action result, manual `fetch`) that bypasses `eventStore.add(...)`.

Audit every place an event enters your app and route them all through the same store. Pipe relays with `mapEventsToStore(eventStore)` or `.subscribe(e => eventStore.add(e))`.

## "Loader never fires"

Loaders return cold `Observable`s — no request is sent until you `.subscribe()`. Either subscribe explicitly:

```ts
loader(args).subscribe((event) => ...);
```

…or bridge to a Promise:

```ts
const event = await firstValueFrom(loader(args));
```

This is the #1 loader bug and the loader docs repeat the warning on every page.

## "Subscription never fires"

Observables are lazy. Make sure you actually called `.subscribe(...)`. If using React, make sure you used the hook (which subscribes for you) and that the component is mounted. If using `use$` with a dependency, make sure you used the **factory form** (`use$(() => ..., [deps])`) — the bare form re-subscribes every render and may appear stuck.

## "REQ stays open forever"

Relay `subscription()` / `req()` return cold observables that close when you unsubscribe. Always tear down — `subscription.unsubscribe()`, compose with `takeUntil(destroy$)`, or use operators that complete (`take(1)`, `firstValueFrom`, `completeOnEose`).

## "ActionRunner.run() throws"

`ActionRunner` was constructed without a `publishMethod`. `.run(...)` auto-publishes and throws if there is no publisher. Either pass one at construction:

```ts
new ActionRunner(eventStore, signer, (event, relays) => pool.publish(relays, event));
```

…or use `.exec(...)` to get the events without publishing.

## "Replaceable list overwritten / lost entries after an action"

Actions that mutate replaceable lists (contacts, mute list, bookmarks, …) throw when the expected existing event is missing, by design — to avoid overwriting a list you have not loaded. Load the existing list first (via the loader or by subscribing to the corresponding model), then run the action.

## "Hidden tags / encrypted content is empty"

You have not unlocked them yet. For encrypted content, call `persistEncryptedContent(signer, eventStore)` once at startup so the `EncryptedContentModel` can deliver decrypted bodies. For hidden tags, call `unlockHiddenTags(event, signer)` (from `applesauce-core/helpers`) and gate UI on `isHiddenTagsUnlocked(event)`. Once unlocked, the change propagates through the store and any subscribed model/cast re-emits.

## "Signer prompts repeatedly"

NIP-07 / NIP-46 signer methods are async and may show UI or round-trip a relay per call. Don't call them in loops. Sign once and reuse the signed event, or use an action that signs + publishes in one step. (`AccountManager`/`Account` queue calls by default, so concurrent calls are serialised — the cost is UX, not crashes.)

## "NIP-46 (bunker) signing hangs"

NIP-46 needs a relay round-trip and the bunker may be offline. Set a timeout when awaiting the signer's promise (or use `firstValueFrom(...).pipe(timeout(ms))`), and surface a useful error — bunker latency is normal.

## "Publish to outboxes fails / event never seen by recipient"

Hard-coded relay arrays are the usual culprit. Read the author's outboxes (and the recipient's inboxes for DMs) before publishing:

```ts
const outboxes = await user.outboxes$.$first(2000, ["wss://nos.lol"]);
await pool.publish(outboxes, signed);
```

`user.outboxes$` may not be loaded yet — give `$first` a sensible fallback and timeout.

## "Imports are huge"

Always import from the public package entry, never `dist/`:

```ts
// ✅
import { EventStore } from "applesauce-core";
import { ProfileModel } from "applesauce-core/models";
import { NoteFactory } from "applesauce-common/factories";

// ❌
import { EventStore } from "applesauce-core/dist/event-store";
```

The subpath exports (`/models`, `/helpers`, `/factories`, `/casts`, `/observable`, `/operators`, …) exist precisely so unused code tree-shakes away. Using `dist/` paths bypasses the export map and breaks tree-shaking.

## "Replaceable / addressable events look wrong"

Don't compare by `id` alone. Use the helpers in `applesauce-core/helpers` (`getReplaceableAddress`, `getReplaceableUID`, `isReplaceable`, …) and let models handle dedup. The store keeps only the latest version by `created_at` unless you constructed it with `keepOldVersions: true`.

## "Timeline ordering looks off"

The store maintains a sorted timeline by `created_at` descending. If you see a different order in the UI it is almost always because you (a) re-sorted in component code, (b) held a parallel array in state, or (c) forgot to clone the timeline array (`map(t => [...t])`) so React noticed the in-place update.

## "Which SQLite driver should I use?"

`applesauce-sqlite` ships six implementations — pick by environment:

| Subpath                            | Environment                                         |
| ---------------------------------- | --------------------------------------------------- |
| `applesauce-sqlite/better-sqlite3` | Node, native build (`better-sqlite3` peer dep)      |
| `applesauce-sqlite/native`         | Node ≥22 (`node:sqlite`); also aliased `/deno`      |
| `applesauce-sqlite/bun`            | Bun (`bun:sqlite`)                                  |
| `applesauce-sqlite/libsql`         | LibSQL (async)                                      |
| `applesauce-sqlite/turso`          | Turso hosted (async)                                |
| `applesauce-sqlite/turso-wasm`     | Browser via WASM (async — only browser-side option) |

All async drivers require `AsyncEventStore`, not `EventStore`. Browser apps that just want caching (not a full event database) should use `persistEventsToCache` + `cacheRequest` against `nostr-idb` or similar instead — see `examples/cache/nostr-idb.md`.

## Diagnostic snippets

Log every event entering the store:

```ts
eventStore.insert$.subscribe((evt) => console.log("[store]", evt.kind, evt.id));
```

Log every relay socket message:

```ts
pool.relay(url).message$.subscribe((msg) => console.log("[relay]", msg));
```

Log a relay's connection status:

```ts
pool.relay(url).status$.subscribe((status) => console.log("[status]", url, status));
```

Watch the active account change:

```ts
manager.active$.subscribe((acct) => console.log("[active]", acct?.pubkey));
```
