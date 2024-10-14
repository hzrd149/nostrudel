import { useEffect } from "react";

import userMetadataService from "../services/user-metadata";
import { useReadRelays } from "./use-client-relays";
import { RequestOptions } from "../services/replaceable-events";
import { COMMON_CONTACT_RELAYS } from "../const";
import { useStoreQuery } from "applesauce-react";
import { ProfileQuery } from "applesauce-core/queries";

export default function useUserProfile(pubkey?: string, additionalRelays?: Iterable<string>, opts?: RequestOptions) {
  const readRelays = useReadRelays(
    additionalRelays ? [...additionalRelays, ...COMMON_CONTACT_RELAYS] : COMMON_CONTACT_RELAYS,
  );

  useEffect(() => {
    if (pubkey) userMetadataService.requestMetadata(pubkey, readRelays, opts);
  }, [pubkey, readRelays]);

  return useStoreQuery(ProfileQuery, pubkey ? [pubkey] : undefined);
}
