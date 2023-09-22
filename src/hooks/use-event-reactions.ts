import { useMemo } from "react";
import eventReactionsService from "../services/event-reactions";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";

export default function useEventReactions(eventId: string, additionalRelays: string[] = [], alwaysRequest = true) {
  const relays = useReadRelayUrls(additionalRelays);

  const subject = useMemo(
    () => eventReactionsService.requestReactions(eventId, relays, alwaysRequest),
    [eventId, relays.join("|"), alwaysRequest],
  );

  return useSubject(subject);
}
