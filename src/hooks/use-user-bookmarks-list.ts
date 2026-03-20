import { useMemo } from "react";
import { kinds } from "nostr-tools";
import { getEventPointersFromList } from "applesauce-common/helpers/lists";
import { getAddressPointersFromList } from "applesauce-common/helpers/lists";
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
