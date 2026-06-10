# Applesauce Actions

A collection of pre-built actions nostr clients can use. Built on top of `applesauce-core` and `applesauce-factory`.

[Documentation](https://applesauce.build/typedoc/modules/applesauce-actions.html)

## Installation

```bash
npm install applesauce-actions
```

## Overview

Actions are common pre-built async operations that apps can perform. They use:

- `EventStore` for access to known nostr events
- `EventFactory` to build and sign new nostr events
- A `publish` method to publish or save the resulting events

The package provides an `ActionRunner` class that combines these components into a single manager for easier action execution.

## Basic Usage

```typescript
import { ActionRunner } from "applesauce-actions";
import { FollowUser } from "applesauce-actions/actions";

async function publishEvent(event: NostrEvent) {
  await relayPool.publish(event, ["wss://relay.example.com"]);
}

// Create an action hub with your event store, factory and publish method
const hub = new ActionRunner(eventStore, eventFactory, publishEvent);

// Example: Follow a user
await hub
  .exec(FollowUser, "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d")
  .forEach((event) => publishEvent(event));
```

For more detailed documentation and examples, visit the [full documentation](https://applesauce.build/overview/actions.html).
