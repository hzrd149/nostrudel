import { BOOKMARK_LIST_KIND, getEventsFromList } from "../helpers/nostr/lists";
import { RequestOptions } from "../services/replaceable-event-requester";
import useCurrentAccount from "./use-current-account";
import useReplaceableEvent from "./use-replaceable-event";

export default function userUserBookmarksList(pubkey?: string, relays: string[] = [], opts?: RequestOptions) {
  const account = useCurrentAccount();
  const key = pubkey ?? account?.pubkey;

  const list = useReplaceableEvent(key ? { kind: BOOKMARK_LIST_KIND, pubkey: key } : undefined, relays, opts);

  const pointers = list ? getEventsFromList(list) : [];

  return { list, pointers };
}
