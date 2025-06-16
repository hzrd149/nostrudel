import { Model, withImmediateValueOrDefault } from "applesauce-core";
import { NostrEvent } from "nostr-tools";
import { EventPointer } from "nostr-tools/nip19";
import { defer, EMPTY, ignoreElements, mergeWith } from "rxjs";
import { eventLoader } from "../services/loaders";

/** Loads and subscribes to an event */
export default function EventQuery(event: string | EventPointer): Model<NostrEvent | undefined> {
  const pointer = typeof event === "string" ? { id: event } : event;

  return (events) =>
    defer(() => (events.hasEvent(pointer.id) ? EMPTY : eventLoader(pointer))).pipe(
      ignoreElements(),
      mergeWith(events.event(pointer.id)),
      withImmediateValueOrDefault(undefined),
    );
}
