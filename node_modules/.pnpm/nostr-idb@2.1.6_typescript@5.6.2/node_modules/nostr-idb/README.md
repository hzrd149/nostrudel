# nostr-idb

A collection of helper methods for storing nostr events in an IndexedDB and talking to it like a nostr relay

Live Examples: https://hzrd149.github.io/nostr-idb/

- [Methods](#methods)
  - [openDB](#openDB)
  - [clearDB](#clearDB)
  - [deleteDB](#deleteDB)
- [WebSocket](#WebSocket)
  - [Why](#Why)
- [nostr-tools](#nostr-tools)
  - [CacheRelay](#CacheRelay)
- [Performance](#Performance)

## Features

- Built directly on top of IndexedDB for the lowest latency
- Caches indexes in memory
- Proxy `WebSocket` class that works with any relay implementation
- `CacheRelay` class with similar API to to nostr-tool `Relay` class

## Methods

NOTE: all methods are async unless specified otherwise

### openDB

Opens a database with `name` and optional `callbacks`. see [openDB](https://www.npmjs.com/package/idb#opendb)

If no name is provided it will default to `nostr-idb`

```javascript
import { openDB, addEvents } from "nostr-idb";
const db = await openDB("nostr-idb");
await addEvents(db, [...])
```

### clearDB

Remove all events from the database without deleting it

### deleteDB

Calls `deleteDB` from `idb`. see [deleteDB](https://www.npmjs.com/package/idb#deletedb)

### getEventsForFilter / getEventsForFilters

Returns a sorted array of events that match the filter/filters

```javascript
import { openDB, addEvents, getEventsForFilters } from "nostr-idb";
const db = await openDB("events");

// add events to db
await addEvents(db, [...])

// query db
const events = await getEventsForFilters(db, [
  {
    kinds: [1, 6],
    limit: 30
  }
])
```

### countEventsForFilter / countEventsForFilters

Similar to `getEventsForFilters` but returns just the number of events

### addEvent / addEvents

Add events to the database

Its better to use `addEvents` and batch events. writing many single events to the database can cause performance issues

### pruneDatabaseToSize(db, limit)

Removes the least used events until the database is under the size limit

## WebSocket

The `WebSocket` class is a special class that can be used to override `window.WebSocket` so that you can use any relay implementation to talk to the cache

Example:

```js
import { WebSocket } from "nostr-idb/ws";
window.WebSocket = WebSocket;

// Connect to the IndexedDB like its a relay
const cacheRelay = new Relay("ws://nostr-idb-local");
await cacheRelay.connect();

// connect to any other relay
const relay = new Relay("wss://nos.lol");
await relay.connect();

// load some events
relay.subscribe([{ kinds: [1], limit: 30 }], {
  // publish the event to the cache
  onevent: (event) => cacheRelay.publish(event),
});

// load some events from the cache
cacheRelay.subscribe([{ kinds: [0], limit: 60 }], {
  onevent: (event) => console.log(event),
});
```

### Why

**A cache relay is not the same as a cache**

If your app just needs to cache computed or generic data you should use `idb` or a similar library to cache your data. But if you app needs to store lots of nostr events then there are benefits to having a cache relay

The biggest benefit to using a "cache relay" is it can either be an IndexedDB running in the browser or a local relay running on the users machine

If the cache relay is an IndexedDB it can store up to ~50000 events without the browser slowing down too much. But if the cache relay is a local relay onn the users machine it can hold millions of events without any performance issues or storage concerns

The basic `ws://nostr-idb-local` proxy url will create a relay instance locally that connect to the IndexedDB

The `ws://nostr-idb-worker` and `ws://nostr-idb-shared-worker` proxy urls will spin up a `Worker` and `SharedWorker` that connects to the IndexedDB

_NOTE: There is a small overhead from JSON.stringify and JSON.parse due to websockets only supporting strings_

**NOTE: I have only tested the workers using Vite and Vanilla JS, they might not work in every bundler**

## nostr-tools

There are a few ways you can use nostr-idb with [nostr-tools](https://github.com/nbd-wtf/nostr-tools)

The first and simplest way is to use the exported `CacheRelay` class. Although the `WebSocket` class also works

### CacheRelay

The `CacheRelay` class is lightweight in-memory relay that syncs with the IndexedDB database.

There are a few benefits to using it instead of the underlying `getEventsForFilters` or `addEvents` methods

- Caches indexes in memory.
- Batches write transactions
- Almost a drop-in replacement for nostr-tools `Relay` class

```javascript
import { openDB, CacheRelay } from "nostr-idb";
const db = await openDB("events");

const cacheRelay = new CacheRelay(db);

for (let event of events) {
  cacheRelay.publish(event);
}

const sub = cacheRelay.subscribe([{ kinds: [1] }], {
  onevent: (event) => {
    console.log("got event", event);
  },
  oneose: () => {
    console.log("no more events in cache");
  },
});
```

## Performance

### Disable signature verification

If your using the override `WebSocket` class to connect to the cache. you can disable signature verification on whatever relay implementation your using

for nostr-tools you can use the `AbstractRelay` class and pass a custom `verifyEvents` in

```js
import { WebSocket } from "nostr-idb";
import { AbstractRelay, verifiedSymbol } from "nostr-tools";
window.WebSocket = WebSocket;

const relay = new AbstractRelay("ws://nostr-idb-local", {
  verifyEvent: (event) => (event[verifiedSymbol] = true),
});
```

### Index Cache

The `IndexCache` class is used in the `IndexCache` and override `WebSocket` classes to store the most frequently accessed indexes from the IndexedDB in memory

If your using `getEventsForFilters`, or `countEventsForFilters` methods directly you can pass an `IndexCache` in as the third argument to take advantage of the caching

**NOTE: Don't forget to add events to in-memory indexes**

If your using the `IndexCache` manually and added events to the database using `addEvents` don't forget to call `indexCache.addEventToIndexes(event)` to ensure the index cache stays up-to-date

```javascript
import { openDB, addEvents, getEventsForFilters, IndexCache } from "nostr-idb";

const indexCache = new IndexCache()
const db = await openDB("events");

// add events to db
await addEvents(db, [...])

// if indexCache is passed in getEventsForFilters will check it first and save any indexes to it
const events = await getEventsForFilters(db, [
  {
    kinds: [1, 6],
    limit: 30
  }
], indexCache)

// add more events
await addEvents(db, [...])
// NOTE: don't forget to add events to in-memory indexes
// otherwise your indexes will get out of sync
for(let event of events){
	indexCache.addEventToIndexes(event)
}
```
