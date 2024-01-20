import useReplaceableEvent from "./use-replaceable-event";
import { MUTE_LIST_KIND } from "../helpers/nostr/lists";
import { RequestOptions } from "../services/replaceable-event-requester";

export default function useUserMuteList(
  pubkey?: string,
  additionalRelays?: Iterable<string>,
  opts: RequestOptions = {},
) {
  return useReplaceableEvent(pubkey && { kind: MUTE_LIST_KIND, pubkey }, additionalRelays, opts);
}
