import { defer, ignoreElements, mergeWith } from "rxjs";
import { zapsLoader } from "../services/loaders";
import { EventZapsModel } from "applesauce-core/models";
import { Model } from "applesauce-core";
import { NostrEvent } from "nostr-tools";

export default function EventZapsQuery(event: NostrEvent, relays?: string[]): Model<NostrEvent[]> {
  return (events) =>
    defer(() => zapsLoader(event, relays)).pipe(ignoreElements(), mergeWith(events.model(EventZapsModel, event.id)));
}
