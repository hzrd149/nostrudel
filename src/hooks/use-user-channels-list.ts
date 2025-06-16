import { getEventPointersFromList } from "applesauce-core/helpers/lists";
import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";

import useAddressableEvent from "./use-addressable-event";

export default function useUserChannelsList(user?: ProfilePointer) {
  const list = useAddressableEvent(
    user ? { kind: kinds.PublicChatsList, pubkey: user.pubkey, relays: user.relays } : undefined,
  );

  const pointers = list ? getEventPointersFromList(list) : [];

  return { list, pointers };
}
