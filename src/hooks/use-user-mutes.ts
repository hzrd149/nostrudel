import { kinds } from "nostr-tools";
import { useStoreQuery } from "applesauce-react/hooks";
import { UserMuteQuery } from "applesauce-core/queries";

import useReplaceableEvent from "./use-replaceable-event";

export default function useUserMutes(pubkey?: string, additionalRelays?: Iterable<string>, force?: boolean) {
  useReplaceableEvent(pubkey && { kind: kinds.Mutelist, pubkey }, additionalRelays, force);

  return useStoreQuery(UserMuteQuery, pubkey ? [pubkey] : undefined);
}
