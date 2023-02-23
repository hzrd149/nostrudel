import { useMemo } from "react";
import eventZapsService from "../services/event-zaps";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";

export default function useEventZaps(eventId: string, additionalRelays: string[] = [], alwaysFetch = true) {
  const relays = useReadRelayUrls(additionalRelays);

  const subject = useMemo(
    () => eventZapsService.requestZaps(eventId, relays, alwaysFetch),
    [eventId, relays.join("|"), alwaysFetch]
  );

  return useSubject(subject);
}
