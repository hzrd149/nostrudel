import { NostrEvent, kinds } from "nostr-tools";

import { getEventUID } from "../helpers/nostr/event";
import ControlledObservable from "../classes/controlled-observable";

const deleteEventStream = new ControlledObservable<NostrEvent>();

function handleEvent(deleteEvent: NostrEvent) {
  if (deleteEvent.kind !== kinds.EventDeletion) return;
  deleteEventStream.next(deleteEvent);
}

function doseMatch(deleteEvent: NostrEvent, event: NostrEvent) {
  const id = getEventUID(event);
  return deleteEvent.tags.some((t) => (t[0] === "a" || t[0] === "e") && t[1] === id);
}

const deleteEventService = {
  stream: deleteEventStream,
  handleEvent,
  doseMatch,
};

export default deleteEventService;
