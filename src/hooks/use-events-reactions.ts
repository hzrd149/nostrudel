import { useEffect, useMemo, useState } from "react";
import eventReactionsService from "../services/event-reactions";
import { useReadRelays } from "./use-client-relays";
import { NostrEvent } from "../types/nostr-event";
import Subject from "../classes/subject";

export default function useEventsReactions(
  eventIds: string[],
  additionalRelays?: Iterable<string>,
  alwaysRequest = true,
) {
  const readRelays = useReadRelays(additionalRelays);

  // get subjects
  const subjects = useMemo(() => {
    const dir: Record<string, Subject<NostrEvent[]>> = {};
    for (const eventId of eventIds) {
      dir[eventId] = eventReactionsService.requestReactions(eventId, readRelays, alwaysRequest);
    }
    return dir;
  }, [eventIds, readRelays.urls.join("|"), alwaysRequest]);

  // get values out of subjects
  const reactions: Record<string, NostrEvent[]> = {};
  for (const [id, subject] of Object.entries(subjects)) {
    if (subject.value) reactions[id] = subject.value;
  }

  const [_, update] = useState(0);

  // subscribe to subjects
  useEffect(() => {
    const listener = () => update((v) => v + 1);
    for (const [_, sub] of Object.entries(subjects)) {
      sub?.subscribe(listener, undefined, false);
    }
    return () => {
      for (const [_, sub] of Object.entries(subjects)) {
        sub?.unsubscribe(listener, undefined);
      }
    };
  }, [subjects, update]);

  return reactions;
}
