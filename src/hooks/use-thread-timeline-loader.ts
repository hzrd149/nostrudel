import { useEffect, useMemo } from "react";
import { kinds } from "nostr-tools";

import useSubject from "./use-subject";
import useSingleEvent from "./use-single-event";
import singleEventService from "../services/single-event";
import useTimelineLoader from "./use-timeline-loader";
import { getThreadReferences } from "../helpers/nostr/events";
import { NostrEvent } from "../types/nostr-event";
import { unique } from "../helpers/array";

export default function useThreadTimelineLoader(
  focusedEvent: NostrEvent | undefined,
  relays: Iterable<string>,
  kind: number = kinds.ShortTextNote,
) {
  const refs = focusedEvent && getThreadReferences(focusedEvent);
  const rootPointer = refs?.root?.e || (focusedEvent && { id: focusedEvent?.id });

  const readRelays = unique([...relays, ...(rootPointer?.relays ?? [])]);

  const timelineId = `${rootPointer?.id}-replies`;
  const timeline = useTimelineLoader(
    timelineId,
    readRelays,
    rootPointer
      ? {
          "#e": [rootPointer.id],
          kinds: [kind],
        }
      : undefined,
  );

  const events = useSubject(timeline.timeline);

  // mirror all events to single event cache
  useEffect(() => {
    for (const e of events) singleEventService.handleEvent(e);
  }, [events]);

  const rootEvent = useSingleEvent(rootPointer?.id, rootPointer?.relays);
  const allEvents = useMemo(() => {
    const arr = Array.from(events);
    if (focusedEvent) arr.push(focusedEvent);
    if (rootEvent && focusedEvent && rootEvent.id !== focusedEvent.id) arr.push(rootEvent);
    return arr;
  }, [events, rootEvent, focusedEvent]);

  return { events: allEvents, rootEvent, rootPointer, timeline };
}
