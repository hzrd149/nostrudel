import { useEffect, useMemo } from "react";
import { Kind } from "nostr-tools";

import useSubject from "./use-subject";
import useSingleEvent from "./use-single-event";
import singleEventService from "../services/single-event";
import useTimelineLoader from "./use-timeline-loader";
import { getReferences } from "../helpers/nostr/events";
import { NostrEvent } from "../types/nostr-event";
import { unique } from "../helpers/array";

export default function useThreadTimelineLoader(
  focusedEvent: NostrEvent | undefined,
  relays: string[],
  kind: number = Kind.Text,
) {
  const refs = focusedEvent && getReferences(focusedEvent);
  const rootId = refs?.root?.e?.id || focusedEvent?.id;

  const readRelays = unique([...relays, ...(refs?.root?.e?.relays ?? [])]);

  const timelineId = `${rootId}-replies`;
  const timeline = useTimelineLoader(
    timelineId,
    readRelays,
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

  const rootEvent = useSingleEvent(refs?.root?.e?.id, refs?.root?.e?.relays);
  const allEvents = useMemo(() => {
    const arr = Array.from(events);
    if (focusedEvent) arr.push(focusedEvent);
    if (rootEvent && focusedEvent && rootEvent.id !== focusedEvent.id) arr.push(rootEvent);
    return arr;
  }, [events, rootEvent, focusedEvent]);

  return { events: allEvents, rootEvent, rootId, timeline };
}
