# applesauce-loaders

A collection of functional loading methods to make common event loading patterns easier.

[Documentation](https://applesauce.build/loaders/package.html) [typedoc](https://applesauce.build/typedoc/modules/applesauce-loaders.html)

## Address Loader

The Address Loader is a specialized loader for fetching Nostr replaceable events by their address (kind, pubkey, and optional identifier). It provides an efficient way to batch and deduplicate requests, cache results, and handle relay hints.

```ts
import { createAddressLoader } from "applesauce-loaders/loaders";
import { EventStore } from "applesauce-core";
import { RelayPool } from "applesauce-relay";

const eventStore = new EventStore();
const pool = new RelayPool();

// Create an address loader (do this once at the app level)
const addressLoader = createAddressLoader(pool, {
  // Pass all events to the event store to deduplicate them
  eventStore,
  // Optional configuration options
  bufferTime: 1000,
  followRelayHints: true,
  extraRelays: ["wss://relay.example.com"],
});

// Load a profile (kind 0)
addressLoader({
  kind: 0,
  pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  relays: ["wss://relay.example.com"],
}).subscribe((event) => {
  // Handle the loaded event
  console.log(event);
});

// Load a contact list (kind 3)
addressLoader({
  kind: 3,
  pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  relays: ["wss://relay.example.com"],
}).subscribe((event) => {
  // Handle the loaded event
  console.log(event);
});

// Load a parameterized replaceable event
addressLoader({
  kind: 30000,
  pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  identifier: "list of bad people",
  relays: ["wss://relay.example.com"],
}).subscribe((event) => {
  // Handle the loaded event
  console.log(event);
});
```

## Event Loader

The Event Loader is a specialized loader for fetching Nostr events by their IDs. It provides an efficient way to batch and deduplicate requests, cache results, and handle relay hints.

```ts
import { createEventLoader } from "applesauce-loaders/loaders";

// Create an event loader (do this once at the app level)
const eventLoader = createEventLoader(pool, {
  // Pass all events to the event store to deduplicate them
  eventStore,
  // Optional configuration options
  bufferTime: 1000,
  followRelayHints: true,
  extraRelays: ["wss://relay.example.com"],
});

// Load an event by ID
eventLoader({
  id: "2650f6292166624f45795248edb9ca136c276a3d10a0d8f4efd2b8b23eb2d5fc",
  relays: ["wss://relay.example.com"],
}).subscribe((event) => {
  // Handle the loaded event
  console.log(event);
});

// Load from extra relays
eventLoader({
  id: "2650f6292166624f45795248edb9ca136c276a3d10a0d8f4efd2b8b23eb2d5fc",
  relays: ["wss://relay.example.com"],
}).subscribe((event) => {
  // Handle the loaded event
  console.log(event);
});
```

## Unified Event Loader

The Unified Event Loader is a single loader that can handle both `EventPointer` and `AddressPointer` types. It automatically routes to the appropriate loader (`createEventLoader` for events by ID, `createAddressLoader` for addressable/replaceable events) based on the pointer type.

This is the recommended approach when setting up loaders for an EventStore, as it provides a single loader that works with the unified `eventLoader` property.

```ts
import { createUnifiedEventLoader, createEventLoaderForStore } from "applesauce-loaders/loaders";
import { EventStore } from "applesauce-core";
import { RelayPool } from "applesauce-relay";

const eventStore = new EventStore();
const pool = new RelayPool();

// Option 1: Create and assign manually
const unifiedLoader = createUnifiedEventLoader(pool, {
  eventStore,
  bufferTime: 1000,
  followRelayHints: true,
  extraRelays: ["wss://relay.example.com"],
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

eventStore.eventLoader = unifiedLoader;

// Option 2: Use the convenience function (recommended)
createEventLoaderForStore(eventStore, pool, {
  bufferTime: 1000,
  followRelayHints: true,
  extraRelays: ["wss://relay.example.com"],
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

// Now the event store can load both events by ID and addressable events
eventStore.event({ id: "event_id" }).subscribe((event) => {
  console.log("Loaded event:", event);
});

eventStore.replaceable({ kind: 0, pubkey: "pubkey" }).subscribe((profile) => {
  console.log("Loaded profile:", profile);
});
```

The unified loader accepts all options from both `EventPointerLoaderOptions` and `AddressLoaderOptions`, making it easy to configure both types of loading in one place.

## Timeline Loader

The Timeline Loader is designed for fetching paginated Nostr events in chronological order. It maintains state between calls, allowing you to efficiently load timeline events in blocks until you reach a specific timestamp or exhaust available events.

```ts
import { createTimelineLoader } from "applesauce-loaders/loaders";

// Create a timeline loader
const timelineLoader = createTimelineLoader(
  pool,
  ["wss://relay.example.com"],
  { kinds: [1] }, // Load text notes
  { eventStore },
);

// Initial load - gets the most recent events
timelineLoader().subscribe((event) => {
  console.log("Loaded event:", event);
});

// Later, load older events by calling the loader again
// Each call continues from where the previous one left off
timelineLoader().subscribe((event) => {
  console.log("Loaded older event:", event);
});

// Load events until a specific timestamp
const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
timelineLoader(oneWeekAgo).subscribe((event) => {
  console.log("Event from last week:", event);
});
```

## Loading from cache

All loaders support a `cacheRequest` option to load events from a local cache.

```ts
import { NostrEvent, Filter } from "nostr-tools";
import { createEventLoader } from "applesauce-loaders/loaders";

// Custom method for loading events from a database
async function cacheRequest(filters: Filter[]): Promise<NostrEvent[]> {
  return await cacheDatabase.getEvents(filters);
}

const eventLoader = createEventLoader(pool, {
  // Pass all events to the event store to deduplicate them
  eventStore,
  // Pass a custom cache method
  cacheRequest,
  // Optional configuration options
  bufferTime: 1000,
});

// Because no relays are specified, the event will be loaded from the cache
eventLoader({
  id: "2650f6292166624f45795248edb9ca136c276a3d10a0d8f4efd2b8b23eb2d5fc",
}).subscribe((event) => {
  // Handle the loaded event
  console.log(event);
});
```

## Configuration Options

All loaders accept these common configuration options:

### Address Loader Options

- `bufferTime`: Time interval to buffer requests in ms (default 1000)
- `bufferSize`: Max buffer size (default 200)
- `eventStore`: An event store used to deduplicate events
- `cacheRequest`: A method used to load events from a local cache
- `followRelayHints`: Whether to follow relay hints (default true)
- `lookupRelays`: Fallback lookup relays to check when event can't be found
- `extraRelays`: An array of relays to always fetch from

### Event Loader Options

- `bufferTime`: Time interval to buffer requests in ms (default 1000)
- `bufferSize`: Max buffer size (default 200)
- `eventStore`: An event store used to deduplicate events
- `cacheRequest`: A method used to load events from a local cache
- `followRelayHints`: Whether to follow relay hints (default true)
- `extraRelays`: An array of relays to always fetch from

### Unified Event Loader Options

The unified event loader accepts all options from both Event Loader and Address Loader options, plus:

- `lookupRelays`: Fallback lookup relays to check when event can't be found (from Address Loader)

### Timeline Loader Options

- `limit`: Maximum number of events to request per filter
- `cache`: A method used to load events from a local cache
- `eventStore`: An event store to pass all events to

## Working with Relay Pools

All loaders require a request method for loading Nostr events from relays. You can provide this in multiple ways:

### Using a RelayPool instance

The simplest approach is to pass a RelayPool instance directly:

```ts
import { createAddressLoader, createEventLoader } from "applesauce-loaders/loaders";
import { RelayPool } from "applesauce-relay";

const pool = new RelayPool();
const addressLoader = createAddressLoader(pool, { eventStore });
const eventLoader = createEventLoader(pool, { eventStore });
```

### Using a custom request method

You can also provide a custom request method, such as one from nostr-tools:

```ts
import { createEventLoader } from "applesauce-loaders/loaders";
import { SimplePool } from "nostr-tools";
import { Observable } from "rxjs";

const pool = SimplePool();

// Create a custom request function using nostr-tools
function customRequest(relays, filters) {
  return new Observable((observer) => {
    const sub = pool.subscribeMany(relays, filters, {
      onevent: (event) => observer.next(event),
      eose: () => observer.complete(),
    });

    return () => sub.close();
  });
}

// Create event loader with custom request
const eventLoader = createEventLoader(customRequest, options);
```
