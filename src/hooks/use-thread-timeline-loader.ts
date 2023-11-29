import { useEffect, useMemo } from "react";
import { Kind } from "nostr-tools";

import useSubject from "./use-subject";
import useSingleEvent from "./use-single-event";
import singleEventService from "../services/single-event";
import useTimelineLoader from "./use-timeline-loader";
import { getReferences } from "../helpers/nostr/events";
import { NostrEvent } from "../types/nostr-event";

export default function useThreadTimelineLoader(
  focusedEvent: NostrEvent | undefined,
  relays: string[],
  kind: number = Kind.Text,
) {
  const refs = focusedEvent && getReferences(focusedEvent);
  const rootId = refs ? refs.rootId || focusedEvent.id : undefined;

  const timelineId = `${rootId}-replies`;
  const timeline = useTimelineLoader(
    timelineId,
    relays,
    rootId
      ? {
          "#e": [rootId],
          kinds: [kind],
        }
      : undefined,
  );

  const events = useSubject(timeline.timeline);

  // mirror all events to single event cache
  useEffect(() => {
    for (const e of events) singleEventService.handleEvent(e);
  }, [events]);

  const rootEvent = useSingleEvent(rootId, refs?.rootRelay ? [refs.rootRelay] : []);
  const allEvents = useMemo(() => {
    return rootEvent ? [...events, rootEvent] : events;
  }, [events, rootEvent]);

  return { events: allEvents, rootEvent, rootId, timeline };
}
