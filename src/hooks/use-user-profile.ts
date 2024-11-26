import { kinds } from "nostr-tools";
import { useStoreQuery } from "applesauce-react/hooks";
import { ProfileQuery } from "applesauce-core/queries";

import { RequestOptions } from "../services/replaceable-events";
import { COMMON_CONTACT_RELAYS } from "../const";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserProfile(pubkey?: string, additionalRelays?: Iterable<string>, opts?: RequestOptions) {
  useReplaceableEvent(
    pubkey && { kind: kinds.Metadata, pubkey },
    additionalRelays ? [...additionalRelays, ...COMMON_CONTACT_RELAYS] : COMMON_CONTACT_RELAYS,
  );

  return useStoreQuery(ProfileQuery, pubkey ? [pubkey] : undefined);
}
