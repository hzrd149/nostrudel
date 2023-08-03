import { useMemo } from "react";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";
import userMuteListService from "../services/user-mute-list";

export default function useUserMuteList(pubkey?: string, additionalRelays?: string[], alwaysRequest = false) {
  const relays = useReadRelayUrls(additionalRelays);

  const sub = useMemo(() => {
    if (!pubkey) return;
    return userMuteListService.requestMuteList(relays, pubkey, alwaysRequest);
  }, [pubkey]);

  return useSubject(sub);
}
