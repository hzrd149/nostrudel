import { useMemo } from "react";

import { BOOKMARK_LIST_KIND, getAddressPointersFromList, getEventPointersFromList } from "../helpers/nostr/lists";
import { RequestOptions } from "../services/replaceable-events";
import useCurrentAccount from "./use-current-account";
import useReplaceableEvent from "./use-replaceable-event";

export default function userUserBookmarksList(pubkey?: string, relays: string[] = [], opts?: RequestOptions) {
  const account = useCurrentAccount();
  const key = pubkey ?? account?.pubkey;

  const list = useReplaceableEvent(key ? { kind: BOOKMARK_LIST_KIND, pubkey: key } : undefined, relays, opts);

  const addressPointers = useMemo(() => (list ? getAddressPointersFromList(list) : []), [list]);
  const eventPointers = useMemo(() => (list ? getEventPointersFromList(list) : []), [list]);

  return { list, addressPointers, eventPointers };
}
