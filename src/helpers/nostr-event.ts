import { NostrEvent } from "../types/nostr-event";

export function isReply(event: NostrEvent) {
  return !!event.tags.find((t) => t[0] === "e");
}

export function isPost(event: NostrEvent) {
  return !isReply(event);
}

export function truncatedId(id: string) {
  return id.substring(0, 6) + "..." + id.substring(id.length - 6);
}
