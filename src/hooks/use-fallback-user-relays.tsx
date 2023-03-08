import { useMemo } from "react";
import { normalizeRelayConfigs } from "../helpers/relay";
import userRelaysFallbackService from "../services/user-relays-fallback";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";

export default function useFallbackUserRelays(pubkey: string, additionalRelays: string[] = [], alwaysFetch = false) {
  const readRelays = useReadRelayUrls(additionalRelays);

  const observable = useMemo(
    () => userRelaysFallbackService.requestRelays(pubkey, readRelays, alwaysFetch),
    [pubkey, readRelays.join("|"), alwaysFetch]
  );
  const userRelays = useSubject(observable);

  return userRelays ? normalizeRelayConfigs(userRelays.relays) : [];
}
