import { useMemo } from "react";
import { kinds } from "nostr-tools";
import { getAddressPointersFromList, getEventPointersFromList } from "applesauce-lists/helpers";

import { RequestOptions } from "../services/replaceable-events";
import useCurrentAccount from "./use-current-account";
import useReplaceableEvent from "./use-replaceable-event";

export default function userUserBookmarksList(pubkey?: string, relays: string[] = [], opts?: RequestOptions) {
  const account = useCurrentAccount();
  const key = pubkey ?? account?.pubkey;

  const list = useReplaceableEvent(key ? { kind: kinds.BookmarkList, pubkey: key } : undefined, relays, opts);

  const addressPointers = useMemo(() => (list ? getAddressPointersFromList(list) : []), [list]);
  const eventPointers = useMemo(() => (list ? getEventPointersFromList(list) : []), [list]);

  return { list, addressPointers, eventPointers };
}
