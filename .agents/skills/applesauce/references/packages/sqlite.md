# applesauce-sqlite

A SQLite3 event database implementation for Applesauce, providing persistent storage for Nostr events. This package extends the core `applesauce-core` functionality by replacing the default in-memory event database with a persistent SQLite database.

## Key Features

- **Persistent Storage**: Store Nostr events in a SQLite database that persists between application restarts
- **Hybrid Architecture**: Combines in-memory caching with SQLite persistence for optimal performance
- **Full Compatibility**: Drop-in replacement for the default in-memory event database
- **Efficient Querying**: Optimized SQLite queries for filtering and retrieving Nostr events
- **Built-in Relay**: Includes a complete Nostr relay implementation using the SQLite database

## Installation

```bash
# For better-sqlite3
npm install applesauce-sqlite better-sqlite3

# For libsql
npm install applesauce-sqlite @libsql/client

# For bun / deno / native sqlite
bun add applesauce-sqlite
```

## Basic Usage

### Using an event database with EventStore

```js
import { EventStore } from "applesauce-core";
import { BetterSqlite3EventDatabase } from "applesauce-sqlite/better-sqlite3";

// Create a SQLite database (file-based or in-memory)
const database = new BetterSqlite3EventDatabase("./events.db"); // or ":memory:" for in-memory

// Create EventStore with SQLite backend
const eventStore = new EventStore(database);

// Use the event store as normal
eventStore.add(someNostrEvent);

// The events are now persisted to SQLite!
```

### With Models and Subscriptions

```js
import { EventStore } from "applesauce-core";
import { ProfileModel, TimelineModel } from "applesauce-core/models";
import { BetterSqlite3EventDatabase } from "applesauce-better-sqlite3";
import { Relay } from "nostr-tools/relay";

// Create persistent event store
const database = new BetterSqlite3EventDatabase("./events.db");
const eventStore = new EventStore(database);

// Connect to a relay and store events
const relay = await Relay.connect("wss://relay.example.com");
const sub = relay.subscribe([{ kinds: [0, 1] }], {
  onevent(event) {
    eventStore.add(event); // Events are automatically persisted
  },
});

// Use models as normal - they'll work with persisted data
const profile = eventStore.model(ProfileModel, "pubkey...");
profile.subscribe((parsed) => {
  console.log("Profile loaded from database:", parsed);
});

// Timeline will include events from previous sessions
const timeline = eventStore.model(TimelineModel, { kinds: [1] });
timeline.subscribe((events) => {
  console.log("Timeline with persisted events:", events.length);
});
```

## Advanced Usage

### Custom Relay Implementation

```js
import { EventStore } from "applesauce-core";
import { BetterSqlite3EventDatabase } from "applesauce-better-sqlite3";
import { WebSocketServer } from "ws";

// Create your own relay with custom logic
const database = new BetterSqlite3EventDatabase("./custom-relay.db");
const eventStore = new EventStore(database);

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());

    if (message[0] === "EVENT") {
      const event = message[1];
      const added = eventStore.add(event);

      if (added) {
        ws.send(JSON.stringify(["OK", event.id, true, ""]));
        // Broadcast to other clients...
      } else {
        ws.send(JSON.stringify(["OK", event.id, false, "rejected"]));
      }
    }
  });
});
```

## License

MIT
