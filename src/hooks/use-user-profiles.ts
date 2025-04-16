import { kinds } from "nostr-tools";
import { useStoreQuery } from "applesauce-react/hooks";

import { DEFAULT_LOOKUP_RELAYS } from "../const";
import useReplaceableEvents from "./use-replaceable-events";
import { UserProfilesQuery } from "../queries/user-profiles";

export default function useUserProfiles(pubkeys?: string[], additionalRelays?: Iterable<string>, force?: boolean) {
  useReplaceableEvents(
    pubkeys?.map((pubkey) => ({ kind: kinds.Metadata, pubkey })),
    additionalRelays ? [...additionalRelays, ...DEFAULT_LOOKUP_RELAYS] : DEFAULT_LOOKUP_RELAYS,
    force,
  );

  return useStoreQuery(UserProfilesQuery, pubkeys && [pubkeys]);
}
