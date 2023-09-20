import { Kind } from "nostr-tools";
import useReplaceableEvent from "./use-replaceable-event";
import { RequestOptions } from "../services/replaceable-event-requester";

export default function useUserContactList(
  pubkey?: string,
  additionalRelays: string[] = [],
  opts: RequestOptions = {},
) {
  return useReplaceableEvent(pubkey && { kind: Kind.Contacts, pubkey }, additionalRelays, opts);
}
