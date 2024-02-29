import { EventTemplate, UnsignedEvent } from "nostr-tools";
import { processDateString } from "../event-console/process";

export function processEvent(event: UnsignedEvent): UnsignedEvent {
  if (typeof event.created_at === "string") {
    event.created_at = processDateString(event.created_at);
  }

  return event;
}
