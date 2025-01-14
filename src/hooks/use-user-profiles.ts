import { kinds } from "nostr-tools";
import { useStoreQuery } from "applesauce-react/hooks";

import { COMMON_CONTACT_RELAYS } from "../const";
import useReplaceableEvents from "./use-replaceable-events";
import { UserProfilesQuery } from "../queries/user-profiles";

export default function useUserProfiles(pubkeys?: string[], additionalRelays?: Iterable<string>, force?: boolean) {
  useReplaceableEvents(
    pubkeys?.map((pubkey) => ({ kind: kinds.Metadata, pubkey })),
    additionalRelays ? [...additionalRelays, ...COMMON_CONTACT_RELAYS] : COMMON_CONTACT_RELAYS,
    force,
  );

  return useStoreQuery(UserProfilesQuery, pubkeys && [pubkeys]);
}
