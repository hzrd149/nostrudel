# applesauce-core

AppleSauce Core is an interpretation layer for nostr clients, Push events into the in-memory [database](https://hzrd149.github.io/applesauce/classes/Database.html) and get nicely formatted data out with [queries](https://hzrd149.github.io/applesauce/modules/Queries)

# Example

```js
import { EventStore, QueryStore } from "applesauce-core";
import { Relay } from "nostr-tools/relay";

// The EventStore handles all the events
const eventStore = new EventStore();

// The QueryStore handles queries and makes sure not to run multiple of the same query
const queryStore = new QueryStore(eventStore);

// Use nostr-tools or anything else to talk to relays
const relay = await Relay.connect("wss://relay.example.com");

const sub = relay.subscribe([{ authors: ["266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5"] }], {
  onevent(event) {
    eventStore.add(event);
  },
});

// This will return an Observable<ProfileContent | undefined> of the parsed metadata
const profile = queryStore.profile("266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5");

profile.subscribe((parsed) => {
  if (parsed) console.log(parsed);
});

// This will return an Observable<NostrEvent[]> of all kind 1 events sorted by created_at
const timeline = queryStore.timeline({ kinds: [1] });

timeline.subscribe((events) => {
  console.log(events);
});
```
