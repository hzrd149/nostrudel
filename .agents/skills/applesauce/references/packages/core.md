# applesauce-core

Applesauce is a collection of utilities for building reactive nostr applications. The core package provides protocol-level functionality including an in-memory event database, generic event utilities, and basic reactive models.

## Key Components

- **Helpers**: Core utility methods for parsing and extracting data from nostr events
- **EventStore**: In-memory database for storing and subscribing to nostr events
- **Helpers**: Core protocol-level utility methods for working with events, tags, filters, and pointers
- **Models**: Generic models for common nostr data patterns (profiles, reactions, zaps, etc.)
- **Observable**: RxJS utilities for reactive programming

> **Note**: For NIP-specific helpers and models (NIP-10 threading, NIP-22 comments, NIP-53 streams, etc.), see the [`applesauce-common`](../common/README.md) package.

## Documentation

For detailed documentation and guides, visit:

- [Getting Started](https://applesauce.build/introduction/getting-started)
- [API Reference](https://applesauce.build/typedoc/)

## Example

```js
import { EventStore } from "applesauce-core";
import { ProfileModel, TimelineModel } from "applesauce-core/models";
import { Relay } from "nostr-tools/relay";

// Create a single EventStore instance for your app
const eventStore = new EventStore();

// Use any nostr library for relay connections (nostr-tools, ndk, nostrify, etc...)
const relay = await Relay.connect("wss://relay.example.com");

// Subscribe to events and add them to the store
const sub = relay.subscribe([{ authors: ["3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d"] }], {
  onevent(event) {
    eventStore.add(event);
  },
});

// Subscribe to profile changes using ProfileModel
const profile = eventStore.model(ProfileModel, "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d");

profile.subscribe((parsed) => {
  if (parsed) console.log(parsed);
});

// Subscribe to a timeline of events
const timeline = eventStore.model(TimelineModel, { kinds: [1] });

timeline.subscribe((events) => {
  console.log(events);
});
```
