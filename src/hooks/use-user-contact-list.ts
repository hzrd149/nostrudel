import { kinds } from "nostr-tools";
import useReplaceableEvent from "./use-replaceable-event";
import { RequestOptions } from "../services/replaceable-event-requester";

export default function useUserContactList(
  pubkey?: string,
  additionalRelays?: Iterable<string>,
  opts: RequestOptions = {},
) {
  return useReplaceableEvent(pubkey && { kind: kinds.Contacts, pubkey }, additionalRelays, opts);
}
