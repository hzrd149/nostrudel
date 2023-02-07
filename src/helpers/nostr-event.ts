import { NostrEvent } from "../types/nostr-event";

export function isReply(event: NostrEvent) {
  return !!event.tags.find((t) => t[0] === "e");
}

export function isPost(event: NostrEvent) {
  return !isReply(event);
}
