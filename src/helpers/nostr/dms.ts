import { NostrEvent } from "nostr-tools";

export function getDMSender(event: NostrEvent) {
  return event.pubkey;
}
export function getDMRecipient(event: NostrEvent) {
  const pubkey = event.tags.find((t) => t[0] === "p")?.[1];
  if (!pubkey) throw new Error("Missing recipient pubkey");
  return pubkey;
}

export type UnknownConversation = { pubkeys: [string, string]; messages: NostrEvent[] };
export type KnownConversation = UnknownConversation & { myself: string; correspondent: string };

export { groupMessageEvents as groupMessages } from "applesauce-common/helpers";
