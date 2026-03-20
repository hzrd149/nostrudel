import { Model } from "applesauce-core";
import { ReactionsModel } from "applesauce-common/models";
import { NostrEvent } from "nostr-tools";

export function ReactionsQuery(event: NostrEvent, _relays?: string[]): Model<NostrEvent[]> {
  return (events) => events.model(ReactionsModel, event);
}
