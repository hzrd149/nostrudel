import { useEffect } from "react";

import userMetadataService from "../services/user-metadata";
import { useReadRelays } from "./use-client-relays";
import { RequestOptions } from "../services/replaceable-events";
import { COMMON_CONTACT_RELAYS } from "../const";
import { queryStore } from "../services/event-store";
import { useObservable } from "./use-observable";

export default function useUserProfile(pubkey?: string, additionalRelays?: Iterable<string>, opts?: RequestOptions) {
  const readRelays = useReadRelays(
    additionalRelays ? [...additionalRelays, ...COMMON_CONTACT_RELAYS] : COMMON_CONTACT_RELAYS,
  );

  useEffect(() => {
    if (pubkey) userMetadataService.requestMetadata(pubkey, readRelays, opts);
  }, [pubkey, readRelays]);

  const observable = pubkey ? queryStore.profile(pubkey) : undefined;
  return useObservable(observable);
}
