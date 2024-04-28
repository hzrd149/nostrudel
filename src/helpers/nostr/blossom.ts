import { NostrEvent } from "nostr-tools";
import { safeUrl } from "../parse";

export const USER_MEDIA_SERVERS_KIND = 10063;

export function isServerTag(tag: string[]) {
  return (tag[0] === "r" || tag[0] === "server") && tag[1];
}

export function serversEqual(a: string, b: string) {
  return new URL(a).hostname === new URL(b).hostname;
}

export function getServersFromEvent(event: NostrEvent) {
  return event.tags
    .filter(isServerTag)
    .map((t) => safeUrl(t[1]))
    .filter(Boolean) as string[];
}
