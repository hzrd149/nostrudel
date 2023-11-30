import { nip19 } from "nostr-tools";
import { NostrEvent, isETag } from "../../types/nostr-event";

export const USER_CHANNELS_LIST_KIND = 10005;

export type ChannelMetadata = {
  name: string;
  about: string;
  picture: string;
};

export function parseChannelMetadata(event: NostrEvent) {
  const metadata = JSON.parse(event.content) as ChannelMetadata;
  if (metadata.name === undefined) throw new Error("Missing name");
  if (metadata.about === undefined) throw new Error("Missing about");
  if (metadata.picture === undefined) throw new Error("Missing picture");
  return metadata;
}
export function safeParseChannelMetadata(event: NostrEvent) {
  try {
    return parseChannelMetadata(event);
  } catch (e) {}
}
export function validateChannelMetadata(event: NostrEvent) {
  return !!safeParseChannelMetadata;
}

export function getChannelPointer(event: NostrEvent): nip19.EventPointer | undefined {
  const tag = event.tags.find(isETag);
  if (!tag) return undefined;
  return tag[2] ? { id: tag[1], relays: [tag[2]] } : { id: tag[1] };
}
