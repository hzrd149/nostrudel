import { ReactNode, memo, useEffect, useState } from "react";
import { Box, Button, Text } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import dayjs from "dayjs";

import useSubject from "../../../hooks/use-subject";
import TimelineLoader from "../../../classes/timeline-loader";
import RepostNote from "./repost-note";
import { Note } from "../../note";
import { NostrEvent } from "../../../types/nostr-event";
import { STREAM_KIND } from "../../../helpers/nostr/stream";
import StreamNote from "./stream-note";
import { ErrorBoundary } from "../../error-boundary";
import EmbeddedArticle from "../../embed-event/event-types/embedded-article";
import { getEventUID, isReply } from "../../../helpers/nostr/events";
import ReplyNote from "./reply-note";
import RelayRecommendation from "./relay-recommendation";
import { ExtendedIntersectionObserverEntry, useIntersectionObserver } from "../../../providers/intersection-observer";
import BadgeAwardCard from "../../../views/badges/components/badge-award-card";

function RenderEvent({ event }: { event: NostrEvent }) {
  let content: ReactNode | null = null;
  switch (event.kind) {
    case Kind.Text:
      content = isReply(event) ? <ReplyNote event={event} /> : <Note event={event} showReplyButton />;
      break;
    case Kind.Repost:
      content = <RepostNote event={event} />;
      break;
    case Kind.Article:
      content = <EmbeddedArticle article={event} />;
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

  return content && <ErrorBoundary>{content}</ErrorBoundary>;
}
const RenderEventMemo = memo(RenderEvent);

const PRELOAD_NOTES = 5;
function GenericNoteTimeline({ timeline }: { timeline: TimelineLoader }) {
  const notesArray = useSubject(timeline.timeline);
  const [latest, setLatest] = useState(() => dayjs().unix());
  const { subject } = useIntersectionObserver();

  const [minDate, setMinDate] = useState(timeline.timeline.value[PRELOAD_NOTES]?.created_at ?? 0);

  // reset the latest and minDate when timeline changes
  useEffect(() => {
    setLatest(dayjs().unix());
    setMinDate(timeline.timeline.value[PRELOAD_NOTES]?.created_at ?? 0);
  }, [timeline, setMinDate, setLatest]);

  const newNotes: NostrEvent[] = [];
  const notes: NostrEvent[] = [];
  for (const note of notesArray) {
    if (note.created_at > latest) newNotes.push(note);
    else if (note.created_at > minDate) notes.push(note);
  }

  const [intersectionEntryCache] = useState(() => new Map<string, IntersectionObserverEntry>());
  useEffect(() => {
    const listener = (entities: ExtendedIntersectionObserverEntry[]) => {
      for (const entity of entities) entity.id && intersectionEntryCache.set(entity.id, entity.entry);

      let min: number = Infinity;
      let preload = PRELOAD_NOTES;
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
        }
      }

      setMinDate((v) => Math.min(v, min));
    };

    subject.subscribe(listener);
    return () => {
      subject.unsubscribe(listener);
    };
  }, [setMinDate, intersectionEntryCache, latest, timeline]);

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
        <RenderEventMemo key={note.id} event={note} />
      ))}
    </>
  );
}

export default memo(GenericNoteTimeline);
