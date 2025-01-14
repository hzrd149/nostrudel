import { kinds } from "nostr-tools";
import { useStoreQuery } from "applesauce-react/hooks";
import { UserContactsQuery } from "applesauce-lists/queries";

import useReplaceableEvent from "./use-replaceable-event";

export default function useUserContactList(pubkey?: string, additionalRelays?: Iterable<string>, force?: boolean) {
  useReplaceableEvent(pubkey && { kind: kinds.Contacts, pubkey }, additionalRelays, force);

  return useStoreQuery(UserContactsQuery);
}
