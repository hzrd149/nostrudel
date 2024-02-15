import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";

import useSubject from "../../../hooks/use-subject";
import TimelineLoader from "../../../classes/timeline-loader";
import { NostrEvent } from "../../../types/nostr-event";
import { getEventUID } from "../../../helpers/nostr/events";
import {
  ExtendedIntersectionObserverEntry,
  useIntersectionObserver,
} from "../../../providers/local/intersection-observer";
import TimelineItem from "./timeline-item";

const NOTE_BUFFER = 5;
const timelineNoteMinHeightCache = new WeakMap<TimelineLoader, Record<string, Record<string, number>>>();

function GenericNoteTimeline({ timeline }: { timeline: TimelineLoader }) {
  const events = useSubject(timeline.timeline);
  const [latest, setLatest] = useState(() => dayjs().unix());

  const location = useLocation();
  // only update the location key when the timeline changes
  // this fixes an issue with the key changes when the drawer opens
  const cachedLocationKey = useMemo(() => location.key, [timeline]);
  const setCachedNumber = useCallback(
    (id: string, value: number) => {
      let timelineData = timelineNoteMinHeightCache.get(timeline);
      if (!timelineData) {
        timelineData = {};
        timelineNoteMinHeightCache.set(timeline, timelineData);
      }
      if (!timelineData[cachedLocationKey]) timelineData[cachedLocationKey] = {};
      timelineData[cachedLocationKey][id] = value;
    },
    [cachedLocationKey, timeline],
  );
  const getCachedNumber = useCallback(
    (id: string) => {
      const timelineData = timelineNoteMinHeightCache.get(timeline);
      if (!timelineData) return undefined;
      return timelineData[cachedLocationKey]?.[id] ?? undefined;
    },
    [cachedLocationKey, timeline],
  );

  const [pinDate, setPinDate] = useState(getCachedNumber("pin") ?? events[NOTE_BUFFER]?.created_at ?? Infinity);

  const [maxDate, setMaxDate] = useState(getCachedNumber("max") ?? Infinity);
  const [minDate, setMinDate] = useState(getCachedNumber("min") ?? events[NOTE_BUFFER]?.created_at ?? Infinity);

  if (pinDate === Infinity && events.length > 0)
    setPinDate(events[Math.min(NOTE_BUFFER, events.length - 1)]?.created_at);
  if (minDate === Infinity && events.length > 0)
    setMinDate(events[Math.min(NOTE_BUFFER, events.length - 1)]?.created_at);

  // reset the latest and minDate when timeline changes
  useEffect(() => {
    setLatest(dayjs().unix());
    setPinDate(getCachedNumber("pin") ?? timeline.timeline.value[NOTE_BUFFER]?.created_at ?? Infinity);

    setMaxDate(getCachedNumber("max") ?? Infinity);
    setMinDate(getCachedNumber("min") ?? timeline.timeline.value[NOTE_BUFFER]?.created_at ?? Infinity);
  }, [timeline, setPinDate, setMinDate, setMaxDate, setLatest, getCachedNumber]);

  const updateNoteMinHeight = useCallback(
    (id: string, element: Element) => {
      const rect = element.getBoundingClientRect();
      const current = getCachedNumber(id);
      if (rect.height !== current) setCachedNumber(id, Math.max(current ?? 0, rect.height));
    },
    [setCachedNumber, getCachedNumber],
  );

  // TODO: break this out into its own component or hook, this is pretty ugly
  const { subject: intersectionSubject } = useIntersectionObserver();
  const [intersectionEntryCache] = useState(() => new Map<string, boolean>());
  useEffect(() => {
    const listener = (entities: ExtendedIntersectionObserverEntry[]) => {
      for (const entity of entities) {
        if (entity.id) {
          intersectionEntryCache.set(entity.id, entity.entry.isIntersecting);
          updateNoteMinHeight(entity.id, entity.entry.target);
        }
      }

      let max: number = -Infinity;
      let min: number = Infinity;
      let minBuffer = NOTE_BUFFER;
      let foundVisible = false;
      for (const event of timeline.timeline.value) {
        if (event.created_at > latest) continue;
        const isIntersecting = intersectionEntryCache.get(getEventUID(event));

        if (!isIntersecting) {
          if (foundVisible) {
            // found an event below the view
            if (minBuffer-- < 0) break;
            if (event.created_at < min) min = event.created_at;
          } else {
            // found an event above the view
            continue;
          }
        } else {
          // found visible event
          foundVisible = true;

          // find the event that is x indexes back
          const bufferEvent = timeline.timeline.value[timeline.timeline.value.indexOf(event) - NOTE_BUFFER];
          if (bufferEvent && bufferEvent.created_at > max) max = bufferEvent.created_at;
        }
      }

      if (min !== Infinity) {
        setCachedNumber("min", min);
        setMinDate(min);

        // only set the pin date if its less than before (the timeline only get longer)
        setPinDate((v) => {
          const value = Math.min(v, min);
          setCachedNumber("pin", value);
          return value;
        });
      }
      if (max !== -Infinity) {
        setMaxDate(max);
        setCachedNumber("max", max);
      } else if (foundVisible) {
        setMaxDate(Infinity);
        setCachedNumber("max", Infinity);
      }
    };

    const sub = intersectionSubject.subscribe(listener);
    return () => {
      sub.unsubscribe();
    };
  }, [
    setPinDate,
    setMaxDate,
    setMinDate,
    intersectionSubject,
    intersectionEntryCache,
    updateNoteMinHeight,
    setCachedNumber,
    getCachedNumber,
    latest,
  ]);

  const newNotes: NostrEvent[] = [];
  const notes: NostrEvent[] = [];
  for (const note of events) {
    if (note.created_at > latest) newNotes.push(note);
    else if (note.created_at >= pinDate) notes.push(note);
  }

  return (
    <>
      {newNotes.length > 0 && (
        <Box h="0" overflow="visible" w="full" zIndex={100} display="flex" position="relative">
          <Button
            onClick={() => setLatest(timeline.timeline.value[0].created_at + 10)}
            colorScheme="primary"
            size="lg"
            mx="auto"
            w={["50%", null, "30%"]}
          >
            Show {newNotes.length} new notes
          </Button>
        </Box>
      )}
      {notes.map((note) => (
        <TimelineItem
          key={note.id}
          event={note}
          visible={note.created_at <= maxDate && note.created_at >= minDate}
          minHeight={getCachedNumber(getEventUID(note))}
        />
      ))}
    </>
  );
}

export default memo(GenericNoteTimeline);
