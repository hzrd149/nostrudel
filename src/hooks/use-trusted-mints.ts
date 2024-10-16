import { useEffect } from "react";

import replaceableEventsService from "../services/replaceable-events";
import { useReadRelays } from "./use-client-relays";
import { useStoreQuery } from "applesauce-react";
import TrustedMintsQuery from "../queries/trusted-mints";

export default function useTrustedMints(pubkey?: string) {
  const relays = useReadRelays();
  useEffect(() => {
    if (pubkey) replaceableEventsService.requestEvent(relays, 10019, pubkey);
  }, [pubkey, relays]);

  return useStoreQuery(TrustedMintsQuery, pubkey ? [pubkey] : undefined);
}
