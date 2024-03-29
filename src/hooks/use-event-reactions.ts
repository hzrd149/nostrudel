import { useMemo } from "react";
import eventReactionsService from "../services/event-reactions";
import { useReadRelays } from "./use-client-relays";
import useSubject from "./use-subject";

export default function useEventReactions(eventId: string, additionalRelays?: Iterable<string>, alwaysRequest = true) {
  const relays = useReadRelays(additionalRelays);

  const subject = useMemo(
    () => eventReactionsService.requestReactions(eventId, relays, alwaysRequest),
    [eventId, relays.urls.join("|"), alwaysRequest],
  );

  return useSubject(subject);
}
