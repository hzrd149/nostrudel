import { kinds } from "nostr-tools";
import { getEventPointersFromList } from "applesauce-core/helpers/lists";
import { useActiveAccount } from "applesauce-react/hooks";

import useReplaceableEvent from "./use-replaceable-event";

export default function useUserChannelsList(pubkey?: string, relays: string[] = [], force?: boolean) {
  const account = useActiveAccount();
  const key = pubkey ?? account?.pubkey;

  const list = useReplaceableEvent(key ? { kind: kinds.PublicChatsList, pubkey: key } : undefined, relays, force);

  const pointers = list ? getEventPointersFromList(list) : [];

  return { list, pointers };
}
