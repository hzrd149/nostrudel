import { kinds } from "nostr-tools";

import { cacheRequest } from "./cache-relay";
import { TagValueLoader } from "applesauce-loaders";
import { nostrRequest } from "./rx-nostr";
import { eventStore } from "./event-store";

const channelMetadataLoader = new TagValueLoader(nostrRequest, "e", {
  name: "channel-metadata",
  kinds: [kinds.ChannelMetadata],
  cacheRequest,
});

// start the loader and send all events to the event store
channelMetadataLoader.subscribe((event) => eventStore.add(event));

export default channelMetadataLoader;
