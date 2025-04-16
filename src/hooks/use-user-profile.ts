import { kinds } from "nostr-tools";
import { useStoreQuery } from "applesauce-react/hooks";
import { ProfileQuery } from "applesauce-core/queries";

import { DEFAULT_LOOKUP_RELAYS } from "../const";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserProfile(pubkey?: string, additionalRelays?: Iterable<string>, force?: boolean) {
  useReplaceableEvent(
    pubkey && { kind: kinds.Metadata, pubkey },
    additionalRelays ? [...additionalRelays, ...DEFAULT_LOOKUP_RELAYS] : DEFAULT_LOOKUP_RELAYS,
    force,
  );

  return useStoreQuery(ProfileQuery, pubkey ? [pubkey] : undefined);
}
