# Applesauce Relay

`applesauce-relay` is a nostr relay communication framework built on top of [RxJS](https://rxjs.dev/)

## Installation

```bash
npm install applesauce-relay
```

## Features

- [x] NIP-01 `REQ` and `EVENT` messages
- [x] Relay pool and groups
- [x] NIP-11 `auth_required` limitation
- [ ] NIP-11 `max_subscriptions` limitation
- [x] Client negentropy sync
- [x] Reconnection backoff logic
- [x] republish event on reconnect and auth-required
- [x] Resubscribe on reconnect and auth-required
- [x] NIP-45 COUNT

## Examples

Read the [documentation](https://applesauce.build/overview/relays.html) for more detailed explanation of all methods

### Single Relay

```typescript
import { Relay } from "./relay";

// Connect to a single relay
const relay = new Relay("wss://relay.example.com");

// Subscribe to events
relay
  .req({
    kinds: [1],
    limit: 10,
  })
  .subscribe((response) => {
    if (response === "EOSE") {
      console.log("End of stored events");
    } else {
      console.log("Received event:", response);
    }
  });

// Publish an event
const event = {
  kind: 1,
  content: "Hello Nostr!",
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  // ... other required fields
};

const response = await relay.publish(event);
console.log(`Published:`, response.ok);
```

### Relay Pool

```typescript
import { RelayPool } from "./pool";

// Create a pool and connect to multiple relays
const pool = new RelayPool();
const relays = ["wss://relay1.example.com", "wss://relay2.example.com"];

// Subscribe to events from multiple relays
pool
  .req(relays, {
    kinds: [1],
    limit: 10,
  })
  .subscribe((response) => {
    if (response === "EOSE") {
      console.log("End of stored events");
    } else {
      console.log("Received event:", response);
    }
  });

// Publish to multiple relays
const responses = await pool.publish(relays, event);
responses.forEach((response) => {
  console.log(`Published to ${response.from}:`, response.ok);
});
```

### Relay Group

```typescript
import { RelayPool } from "./pool";

const pool = new RelayPool();
const relays = ["wss://relay1.example.com", "wss://relay2.example.com"];

// Create a group (automatically deduplicates events)
const group = pool.group(relays);

// Subscribe to events
group
  .req({
    kinds: [1],
    limit: 10,
  })
  .subscribe((response) => {
    console.log("Received:", response);
  });

// Publish to all relays in group
const responses = await group.publish(event);
responses.forEach((response) => {
  console.log(`Published to ${response.from}:`, response.ok);
});
```
