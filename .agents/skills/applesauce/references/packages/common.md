# applesauce-common

Applesauce is a collection of utilities for building reactive nostr applications. The common package provides NIP-specific helpers, models, operations, and utilities for working with various Nostr Improvement Proposals (NIPs). This package contains all the extra functionality that applications can use with nostr events that is not directly related to the core protocol.

## Installation

```bash
npm install applesauce-common
```

or

```bash
yarn add applesauce-common
```

or

```bash
pnpm add applesauce-common
```

## Key Components

- **Helpers**: NIP-specific utility methods for parsing and extracting data from nostr events
- **Models**: Complex reactive subscriptions for NIP-specific nostr data patterns
- **Operations**: Functions for creating and constructing nostr events according to various NIPs
- **Blueprints**: Event blueprints and templates for creating properly formatted nostr events
- **Casts**: Type casting utilities for converting between different event representations
- **Observable**: Observable utilities and operators for working with reactive streams of nostr events

## Documentation

For detailed documentation and guides, visit:

- [Getting Started](https://applesauce.build/introduction/getting-started)
- [API Reference](https://applesauce.build/typedoc/)

## Example

```js
import { EventStore } from "applesauce-core";
import { ThreadModel } from "applesauce-common/models";
import { getNip10References } from "applesauce-common/helpers/threading";
import { Relay } from "nostr-tools/relay";

// Create a single EventStore instance for your app
const eventStore = new EventStore();

// Use any nostr library for relay connections (nostr-tools, ndk, nostrify, etc...)
const relay = await Relay.connect("wss://relay.example.com");

// Subscribe to events and add them to the store
const sub = relay.subscribe([{ ids: ["event-id"] }], {
  onevent(event) {
    eventStore.add(event);
  },
});

// Get NIP-10 thread references
const refs = getNip10References(event);

// Subscribe to a thread using ThreadModel
const thread = eventStore.model(ThreadModel, "event-id");

thread.subscribe((thread) => {
  console.log(thread);
});
```

## Supported NIPs

This package includes helpers, models, and operations for various NIPs including:

- NIP-10 (Threading)
- NIP-18 (Reposts)
- NIP-22 (Comments)
- NIP-23 (Articles)
- NIP-25 (Reactions)
- NIP-28 (Channels)
- NIP-52 (Calendar Events)
- NIP-53 (Streams)
- NIP-57 (Zaps)
- NIP-88 (Polls)
- And many more...

## Exports

The package provides several export paths:

- `applesauce-common` - Main exports (Helpers, Models, Operations, etc.)
- `applesauce-common/helpers` - All helper functions
- `applesauce-common/helpers/*` - Individual helper modules
- `applesauce-common/models` - All model functions
- `applesauce-common/models/*` - Individual model modules
- `applesauce-common/operations` - All operation functions
- `applesauce-common/operations/*` - Individual operation modules
- `applesauce-common/blueprints` - Event blueprints
- `applesauce-common/casts` - Type casting utilities
- `applesauce-common/observable` - Observable utilities
