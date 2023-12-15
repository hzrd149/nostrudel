import { ReactNode, memo, useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Text } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";

import useSubject from "../../../hooks/use-subject";
import TimelineLoader from "../../../classes/timeline-loader";
import RepostNote from "./repost-note";
import { Note } from "../../note";
import { NostrEvent } from "../../../types/nostr-event";
import { STREAM_KIND } from "../../../helpers/nostr/stream";
import StreamNote from "./stream-note";
import { ErrorBoundary } from "../../error-boundary";
import { getEventUID, isReply } from "../../../helpers/nostr/events";
import ReplyNote from "./reply-note";
import RelayRecommendation from "./relay-recommendation";
import {
  ExtendedIntersectionObserverEntry,
  useIntersectionObserver,
  useRegisterIntersectionEntity,
} from "../../../providers/intersection-observer";
import BadgeAwardCard from "../../../views/badges/components/badge-award-card";
import ArticleNote from "./article-note";

function RenderEvent({ event, visible, minHeight }: { event: NostrEvent; visible: boolean; minHeight?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  let content: ReactNode | null = null;
  switch (event.kind) {
    case Kind.Text:
      content = isReply(event) ? <ReplyNote event={event} /> : <Note event={event} showReplyButton />;
      break;
    case Kind.Repost:
      content = <RepostNote event={event} />;
      break;
    case Kind.Article:
      content = <ArticleNote article={event} />;
      break;
    case STREAM_KIND:
      content = <StreamNote event={event} />;
      break;
    case Kind.RecommendRelay:
      content = <RelayRecommendation event={event} />;
      break;
    case Kind.BadgeAward:
      content = <BadgeAwardCard award={event} />;
      break;
    default:
      content = <Text>Unknown event kind: {event.kind}</Text>;
      break;
  }

  return (
    <ErrorBoundary>
      <Box minHeight={minHeight} ref={ref}>
        {visible && content}
      </Box>
    </ErrorBoundary>
  );
}
const RenderEventMemo = memo(RenderEvent);

const NOTE_BUFFER = 5;
const timelineNoteMinHeightCache = new WeakMap<TimelineLoader, Record<string, Record<string, number>>>();

function GenericNoteTimeline({ timeline }: { timeline: TimelineLoader }) {
  const notesArray = useSubject(timeline.timeline);
  const [latest, setLatest] = useState(() => dayjs().unix());
  const { subject } = useIntersectionObserver();

  const location = useLocation();
  const setCachedNumber = useCallback(
    (id: string, value: number) => {
      let timelineData = timelineNoteMinHeightCache.get(timeline);
      if (!timelineData) {
        timelineData = {};
        timelineNoteMinHeightCache.set(timeline, timelineData);
      }
      if (!timelineData[location.key]) timelineData[location.key] = {};
      timelineData[location.key][id] = value;
    },
    [location.key, timeline],
  );
  const getCachedNumber = useCallback(
    (id: string) => {
      const timelineData = timelineNoteMinHeightCache.get(timeline);
      if (!timelineData) return undefined;
      return timelineData[location.key]?.[id] ?? undefined;
    },
    [location.key, timeline],
  );
  const [maxDate, setMaxDate] = useState(getCachedNumber("max") ?? -Infinity);
  const [minDate, setMinDate] = useState(
    getCachedNumber("min") ?? timeline.timeline.value[NOTE_BUFFER]?.created_at ?? 0,
  );

  // reset the latest and minDate when timeline changes
  useEffect(() => {
    setLatest(dayjs().unix());
    setMaxDate(getCachedNumber("max") ?? -Infinity);
    setMinDate(getCachedNumber("min") ?? timeline.timeline.value[NOTE_BUFFER]?.created_at ?? 0);
  }, [timeline, setMinDate, setLatest, getCachedNumber]);

  const newNotes: NostrEvent[] = [];
  const notes: NostrEvent[] = [];
  for (const note of notesArray) {
    if (note.created_at > latest) newNotes.push(note);
    else if (note.created_at > minDate) notes.push(note);
  }

  const updateNoteMinHeight = useCallback(
    (id: string, element: Element) => {
      const rect = element.getBoundingClientRect();
      const current = getCachedNumber(id);
      setCachedNumber(id, Math.max(current ?? 0, rect.height));
    },
    [setCachedNumber, getCachedNumber],
  );

  // TODO: break this out into its own component or hook, this is pretty ugly
  const [intersectionEntryCache] = useState(() => new Map<string, IntersectionObserverEntry>());
  useEffect(() => {
    const listener = (entities: ExtendedIntersectionObserverEntry[]) => {
      for (const entity of entities) {
        if (entity.id) {
          intersectionEntryCache.set(entity.id, entity.entry);
          updateNoteMinHeight(entity.id, entity.entry.target);
        }
      }

      let min: number = Infinity;
      let max: number = -Infinity;
      let preload = NOTE_BUFFER;
      let foundVisible = false;
      for (const event of timeline.timeline.value) {
        if (event.created_at > latest) continue;
        const entry = intersectionEntryCache.get(getEventUID(event));
        if (!entry || !entry.isIntersecting) {
          if (foundVisible) {
            // found and event below the view
            if (preload-- < 0) break;
            if (event.created_at < min) min = event.created_at;
          } else {
            // found and event above the view
            continue;
          }
        } else {
          // found visible event
          foundVisible = true;

          const bufferEvent =
            timeline.timeline.value[Math.max(timeline.timeline.value.indexOf(event) - NOTE_BUFFER)] || event;
          if (bufferEvent.created_at > max) max = bufferEvent.created_at;
        }
      }

      setMinDate((v) => Math.min(v, min));
      setMaxDate(max);

      setCachedNumber("max", max);
      setCachedNumber("min", Math.min(getCachedNumber("min") ?? Infinity, min));
    };

    subject.subscribe(listener);
    return () => {
      subject.unsubscribe(listener);
    };
  }, [setMinDate, intersectionEntryCache, updateNoteMinHeight, setCachedNumber, getCachedNumber, latest, timeline]);

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
        <RenderEventMemo
          key={note.id}
          event={note}
          visible={note.created_at <= maxDate}
          minHeight={getCachedNumber(getEventUID(note))}
        />
      ))}
    </>
  );
}

export default memo(GenericNoteTimeline);
