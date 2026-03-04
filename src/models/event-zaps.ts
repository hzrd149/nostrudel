import { EventZapsModel } from "applesauce-common/models";
import { Model } from "applesauce-core";
import { NostrEvent } from "nostr-tools";

export default function EventZapsQuery(event: NostrEvent, _relays?: string[]): Model<NostrEvent[]> {
  return (events) => events.model(EventZapsModel, event.id);
}
