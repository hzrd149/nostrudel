import { Model } from "applesauce-core";
import { ReactionsModel } from "applesauce-common/models";
import { defer, ignoreElements, mergeWith } from "rxjs";
import { reactionsLoader } from "../services/loaders";
import { NostrEvent } from "nostr-tools";

// v5: Use ReactionsModel instead of events.reactions() method
export function ReactionsQuery(event: NostrEvent, relays?: string[]): Model<NostrEvent[]> {
  return (events) =>
    defer(() => reactionsLoader(event, relays)).pipe(ignoreElements(), mergeWith(events.model(ReactionsModel, event)));
}
