import { kinds } from "nostr-tools";
import { getAddressPointerFromATag, getEventPointerFromETag, isATag, isETag } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";

import useReplaceableEvent from "./use-replaceable-event";

export default function useUserPinList(pubkey?: string, relays: string[] = [], force?: boolean) {
  const account = useActiveAccount();
  const key = pubkey ?? account?.pubkey;

  const list = useReplaceableEvent(key ? { kind: kinds.Pinlist, pubkey: key } : undefined, relays, force);

  const pointers = list
    ? list.tags
        .filter((tag) => isATag(tag) || isETag(tag))
        .map((tag) => (isATag(tag) ? getAddressPointerFromATag(tag) : getEventPointerFromETag(tag)))
    : [];

  return { list, pointers };
}
