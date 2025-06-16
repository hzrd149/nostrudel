import { useMemo } from "react";
import { kinds } from "nostr-tools";
import { getAddressPointersFromList, getEventPointersFromList } from "applesauce-core/helpers/lists";
import { useActiveAccount } from "applesauce-react/hooks";

import useReplaceableEvent from "./use-replaceable-event";

export default function userUserBookmarksList(pubkey?: string, relays?: string[]) {
  const account = useActiveAccount();
  const key = pubkey ?? account?.pubkey;

  const list = useReplaceableEvent(key ? { kind: kinds.BookmarkList, pubkey: key, relays } : undefined);

  const addressPointers = useMemo(() => (list ? getAddressPointersFromList(list) : []), [list]);
  const eventPointers = useMemo(() => (list ? getEventPointersFromList(list) : []), [list]);

  return { list, addressPointers, eventPointers };
}
