import { useMemo } from "react";
import eventReactionsService from "../services/event-reactions";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";

export default function useEventReactions(eventId: string, additionalRelays: string[] = [], alwaysFetch = true) {
  const relays = useReadRelayUrls(additionalRelays);

  const subject = useMemo(
    () => eventReactionsService.requestReactions(eventId, relays, alwaysFetch),
    [eventId, relays.join("|"), alwaysFetch]
  );

  return useSubject(subject);
}
