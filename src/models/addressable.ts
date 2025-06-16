import { Model } from "applesauce-core";
import { NostrEvent } from "nostr-tools";
import { defer, EMPTY, ignoreElements, mergeWith } from "rxjs";

import { AddressPointerWithoutD } from "applesauce-core/helpers";
import { AddressPointer } from "nostr-tools/nip19";
import { eventStore } from "../services/event-store";
import { addressLoader } from "../services/loaders";

/** A model that loads a replaceable event */
export function ReplaceableQuery(
  kind: number,
  pubkey: string,
  d?: string,
  relays?: string[],
): Model<NostrEvent | undefined> {
  return (events) =>
    defer(() =>
      eventStore.hasReplaceable(kind, pubkey, d) ? EMPTY : addressLoader({ kind, pubkey, ...(d ? { d } : {}), relays }),
    ).pipe(ignoreElements(), mergeWith(events.replaceable(kind, pubkey, d)));
}

/** A model that loads an addressable event */
export function AddressableQuery(pointer: AddressPointerWithoutD | AddressPointer): Model<NostrEvent | undefined> {
  return (events) =>
    defer(() =>
      eventStore.hasReplaceable(pointer.kind, pointer.pubkey, pointer.identifier) ? EMPTY : addressLoader(pointer),
    ).pipe(ignoreElements(), mergeWith(events.replaceable(pointer.kind, pointer.pubkey, pointer.identifier)));
}
