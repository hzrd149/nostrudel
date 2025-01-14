import { getEventPointersFromList } from "applesauce-lists/helpers";
import { kinds } from "nostr-tools";

import useCurrentAccount from "./use-current-account";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserChannelsList(pubkey?: string, relays: string[] = [], force?: boolean) {
  const account = useCurrentAccount();
  const key = pubkey ?? account?.pubkey;

  const list = useReplaceableEvent(key ? { kind: kinds.PublicChatsList, pubkey: key } : undefined, relays, force);

  const pointers = list ? getEventPointersFromList(list) : [];

  return { list, pointers };
}
