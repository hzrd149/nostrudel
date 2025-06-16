import { kinds as eventKinds } from "nostr-tools";
import { useMemo } from "react";

import { unique } from "../helpers/array";
import { getThreadReferences } from "../helpers/nostr/event";
import { NostrEvent } from "nostr-tools";
import useSingleEvent from "./use-single-event";
import useTimelineLoader from "./use-timeline-loader";

export default function useThreadTimelineLoader(
  focusedEvent: NostrEvent | undefined,
  relays: Iterable<string>,
  kinds?: number[],
) {
  const refs = focusedEvent && getThreadReferences(focusedEvent);
  const rootPointer = refs?.root?.e || (focusedEvent && { id: focusedEvent?.id });

  const readRelays = useMemo(() => unique([...relays, ...(rootPointer?.relays ?? [])]), [relays, rootPointer?.relays]);

  const kindArr = kinds ? (kinds.length > 0 ? kinds : undefined) : [eventKinds.ShortTextNote];
  const timelineId = `${rootPointer?.id}-thread`;
  const { loader, timeline: events } = useTimelineLoader(
    timelineId,
    readRelays,
    rootPointer
      ? [
          {
            "#e": [rootPointer.id],
            kinds: kindArr,
          },
          {
            "#q": [rootPointer.id],
            kinds: kindArr,
          },
        ]
      : undefined,
  );

  const rootEvent = useSingleEvent(rootPointer);
  const allEvents = useMemo(() => {
    const arr = Array.from(events);
    if (focusedEvent) arr.push(focusedEvent);
    if (rootEvent && focusedEvent && rootEvent.id !== focusedEvent.id) arr.push(rootEvent);
    return arr;
  }, [events, rootEvent, focusedEvent]);

  return { events: allEvents, rootEvent, rootPointer, timeline: loader };
}
