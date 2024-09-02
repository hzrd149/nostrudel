import { kinds } from "nostr-tools";

import useReplaceableEvent from "./use-replaceable-event";
import { RequestOptions } from "../services/replaceable-events";

export default function useUserSearchRelayList(
  pubkey?: string,
  additionalRelays?: Iterable<string>,
  opts: RequestOptions = {},
) {
  return useReplaceableEvent(pubkey && { kind: kinds.SearchRelaysList, pubkey }, additionalRelays, opts);
}
