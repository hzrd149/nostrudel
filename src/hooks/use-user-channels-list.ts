import { CHANNELS_LIST_KIND, getEventPointersFromList } from "../helpers/nostr/lists";
import { RequestOptions } from "../services/replaceable-event-requester";
import useCurrentAccount from "./use-current-account";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserChannelsList(pubkey?: string, relays: string[] = [], opts?: RequestOptions) {
  const account = useCurrentAccount();
  const key = pubkey ?? account?.pubkey;

  const list = useReplaceableEvent(key ? { kind: CHANNELS_LIST_KIND, pubkey: key } : undefined, relays, opts);

  const pointers = list ? getEventPointersFromList(list) : [];

  return { list, pointers };
}
