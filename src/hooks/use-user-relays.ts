import { useMemo } from "react";
import userRelaysService from "../services/user-relays";
import useSubject from "./use-subject";
import { useReadRelayUrls } from "./use-client-relays";
import { RequestOptions } from "../services/replaceable-event-requester";
import { COMMON_CONTACT_RELAY } from "../const";
import useSubjects from "./use-subjects";
import { RelayMode } from "../classes/relay";
import { unique } from "../helpers/array";

export function useUserRelays(pubkey: string, additionalRelays: string[] = [], opts: RequestOptions = {}) {
  const readRelays = useReadRelayUrls([...additionalRelays, COMMON_CONTACT_RELAY]);
  const subject = useMemo(
    () => userRelaysService.requestRelays(pubkey, readRelays, opts),
    [pubkey, readRelays.join("|")],
  );
  const userRelays = useSubject(subject);

  return userRelays?.relays ?? [];
}

export function useMultiUserReadRelays(pubkeys: string[], additionalRelays: string[] = [], opts: RequestOptions = {}) {
  const readRelays = useReadRelayUrls([...additionalRelays, COMMON_CONTACT_RELAY]);
  const subjects = useMemo(
    () => pubkeys.map((pubkey) => userRelaysService.requestRelays(pubkey, readRelays, opts)),
    [pubkeys.join("|"), readRelays.join("|")],
  );
  const userRelays = useSubjects(subjects);

  return (
    unique(userRelays.flatMap((ur) => ur.relays.filter((rc) => rc.mode & RelayMode.READ).map((rc) => rc.url))) || []
  );
}
