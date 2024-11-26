import { kinds } from "nostr-tools";
import { useStoreQuery } from "applesauce-react/hooks";
import { UserContactsQuery } from "applesauce-lists/queries";

import useReplaceableEvent from "./use-replaceable-event";
import { RequestOptions } from "../services/replaceable-events";

export default function useUserContactList(
  pubkey?: string,
  additionalRelays?: Iterable<string>,
  opts: RequestOptions = {},
) {
  useReplaceableEvent(pubkey && { kind: kinds.Contacts, pubkey }, additionalRelays, opts);

  return useStoreQuery(UserContactsQuery);
}
