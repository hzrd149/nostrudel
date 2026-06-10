# Persistence

Read this when events need to survive process restarts or browser reloads. The default `EventStore` is in-memory; you opt into persistence by picking the right driver for your environment.

There are **two distinct persistence patterns** — pick by environment:

1. **Server / desktop / WASM browser — `applesauce-sqlite` + `AsyncEventStore`** (a real event _database_)
2. **Browser cache — `persistEventsToCache` + `cacheRequest`** against `nostr-idb`, `window.nostrdb`, or a worker-relay (a _cache_ in front of the in-memory store)

There is no IndexedDB _event database_ shipped with applesauce. (The `IndexedDBCouch` in `applesauce-wallet` is for cashu tokens — not events.)

## Server / desktop with `applesauce-sqlite`

```ts
import { AsyncEventStore } from "applesauce-core";
import { BetterSqlite3EventDatabase } from "applesauce-sqlite/better-sqlite3";

const db = new BetterSqlite3EventDatabase("./events.db");
const eventStore = new AsyncEventStore(db);
```

All `applesauce-sqlite` subpaths require `AsyncEventStore` (some drivers are async-only):

| Subpath                            | Environment                                         |
| ---------------------------------- | --------------------------------------------------- |
| `applesauce-sqlite/better-sqlite3` | Node, native build (`better-sqlite3` peer dep)      |
| `applesauce-sqlite/native`         | Node ≥22 (`node:sqlite`); also aliased `/deno`      |
| `applesauce-sqlite/bun`            | Bun (`bun:sqlite`)                                  |
| `applesauce-sqlite/libsql`         | LibSQL (async)                                      |
| `applesauce-sqlite/turso`          | Turso hosted (async)                                |
| `applesauce-sqlite/turso-wasm`     | Browser via WASM (async — only browser-side option) |

`applesauce-sqlite` also ships a built-in relay (`./relay`) so a Node/Bun process can host its own relay backed by the same database — useful for desktop apps and integration tests. See `packages/sqlite.md`.

## Browser cache (IndexedDB / worker-relay)

`EventStore` stays in-memory; a _cache_ sits in front of relay loaders so subsequent loads hit local storage first.

```ts
import { persistEventsToCache, cacheRequest } from "applesauce-loaders/cache";
// driver examples:
//   nostr-idb        — IndexedDB
//   window.nostrdb   — browser extension cache
//   worker-relay     — relay running in a Web Worker
```

`persistEventsToCache(eventStore, cache)` pipes every event added to the store into the cache, and `cacheRequest(cache)` is the operator loaders use to read from the cache before falling back to relays.

See `examples/cache/nostr-idb.md` (look it up in `examples.md`) for the wired-up shape.

## Choosing a driver

- **Node app / desktop with native build available** → `better-sqlite3` (sync, fastest).
- **Node ≥22 without native build** → `/native` (uses built-in `node:sqlite`).
- **Bun app** → `/bun` (sync, uses `bun:sqlite`).
- **Edge / serverless / Turso** → `/libsql` or `/turso`.
- **Browser with persistent storage** → `/turso-wasm` (full SQLite) _or_ `persistEventsToCache` against `nostr-idb` (lighter, IndexedDB-only). Pick by whether you want SQL queries or just a key/value cache.

## When persistence does _not_ help

- Loaders are still cold observables. Persistence avoids re-fetching, but the loader still must be subscribed (see `patterns.md` → loaders).
- Replaceable / addressable resolution is still by `created_at`. Stale rows in the database don't shadow newer events the store receives.
- Hidden tags and encrypted content are still resolved at runtime — the stored event is the raw on-wire form. Re-call `persistEncryptedContent(signer, eventStore)` and `unlockHiddenTags(...)` on each session.
