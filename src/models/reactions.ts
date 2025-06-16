import { Model } from "applesauce-core";
import { defer, ignoreElements, mergeWith } from "rxjs";
import { reactionsLoader } from "../services/loaders";
import { NostrEvent } from "nostr-tools";

export function ReactionsQuery(event: NostrEvent, relays?: string[]): Model<NostrEvent[]> {
  return (events) =>
    defer(() => reactionsLoader(event, relays)).pipe(ignoreElements(), mergeWith(events.reactions(event)));
}
