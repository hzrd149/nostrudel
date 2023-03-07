import { useMemo } from "react";
import { RelayConfig } from "../classes/relay";
import { normalizeRelayConfigs } from "../helpers/relay";
import { useUserContacts } from "./use-user-contacts";
import { useUserRelays } from "./use-user-relays";

export default function useFallbackUserRelays(pubkey: string, alwaysFetch = false) {
  const contacts = useUserContacts(pubkey, [], alwaysFetch);
  const userRelays = useUserRelays(pubkey, [], alwaysFetch);

  return useMemo(() => {
    let relays: RelayConfig[] = userRelays?.relays ?? [];

    // use the relays stored in contacts if there are no relay config
    if (relays.length === 0 && contacts) {
      relays = contacts.relays;
    }

    // normalize relay urls and remove bad ones
    return normalizeRelayConfigs(relays);
  }, [userRelays, contacts]);
}
