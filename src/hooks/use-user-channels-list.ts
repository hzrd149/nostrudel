import { kinds } from "nostr-tools";
import { getEventPointersFromList } from "../helpers/nostr/lists";
import { RequestOptions } from "../services/replaceable-events";
import useCurrentAccount from "./use-current-account";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserChannelsList(pubkey?: string, relays: string[] = [], opts?: RequestOptions) {
  const account = useCurrentAccount();
  const key = pubkey ?? account?.pubkey;

  const list = useReplaceableEvent(key ? { kind: kinds.PublicChatsList, pubkey: key } : undefined, relays, opts);

  const pointers = list ? getEventPointersFromList(list) : [];

  return { list, pointers };
}
