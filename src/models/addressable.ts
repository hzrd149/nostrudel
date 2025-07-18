import { Model } from "applesauce-core";
import { AddressPointerWithoutD } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { defer, EMPTY, ignoreElements, mergeWith } from "rxjs";

import { eventStore } from "../services/event-store";
import { addressLoader } from "../services/loaders";

/** A model that loads an addressable event */
export function AddressableQuery(pointer: AddressPointerWithoutD): Model<NostrEvent | undefined> {
  return (events) =>
    defer(() =>
      eventStore.hasReplaceable(pointer.kind, pointer.pubkey, pointer.identifier) ? EMPTY : addressLoader(pointer),
    ).pipe(ignoreElements(), mergeWith(events.replaceable(pointer.kind, pointer.pubkey, pointer.identifier)));
}
