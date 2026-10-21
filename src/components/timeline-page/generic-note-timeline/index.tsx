import { memo, useState } from "react";
import { Box, Button } from "@chakra-ui/react";
import { kinds, NostrEvent } from "nostr-tools";
import dayjs from "dayjs";

import useNumberCache from "../../../hooks/timeline/use-number-cache";
import useCacheEntryHeight from "../../../hooks/timeline/use-cache-entry-height";
import { useTimelineDates } from "../../../hooks/timeline/use-timeline-dates";
import useTimelineLocationCacheKey from "../../../hooks/timeline/use-timeline-cache-key";
import useScrollAnchor from "../../../hooks/timeline/use-scroll-anchor";
import { useScrollContainer } from "../../../providers/local/scroll-container";
import TimelineItem from "../../timeline/timeline-item";
import { getEventUID } from "applesauce-core/helpers";
import { POLL_KIND } from "../../../helpers/nostr/polls";

const INITIAL_NOTES = 10;
const NOTE_BUFFER = 5;

/** The kinds of events that the generic timeline can display */
export const GENERIC_TIMELINE_KINDS = [
  kinds.ShortTextNote,
  kinds.Repost,
  kinds.GenericRepost,
  kinds.Highlights,
  POLL_KIND,
];

/**
 * @param since the oldest created_at loaded far enough to render, unset to render every event
 */
function GenericNoteTimeline({ timeline, since }: { timeline: NostrEvent[]; since?: number }) {
  const [latest, setLatest] = useState(() => dayjs().unix());

  const cacheKey = useTimelineLocationCacheKey();
  const numberCache = useNumberCache(cacheKey);
  // Returning to a page renders what it rendered before right away, so scroll restoration has the same height
  const [restored] = useState(() => numberCache.get("cursor") ?? Infinity);
  const oldest = since === undefined ? -Infinity : Math.min(since, restored);
  const dates = useTimelineDates(timeline, numberCache, NOTE_BUFFER, INITIAL_NOTES);

  // measure and cache the hight of every entry
  useCacheEntryHeight(numberCache.set);

  const container = useScrollContainer();
  const afterAnchoredRender = useScrollAnchor();

  const newNotes: NostrEvent[] = [];
  const notes: NostrEvent[] = [];
  for (const note of timeline) {
    if (note.created_at > latest) newNotes.push(note);
    else if (note.created_at >= dates.cursor && note.created_at >= oldest) notes.push(note);
  }

  return (
    <>
      {newNotes.length > 0 && (
        <Box h="0" overflow="visible" w="full" zIndex={100} display="flex" position="relative">
          <Button
            onClick={() => {
              // Add the new notes above the reader without moving them, then scroll up to reveal them
              afterAnchoredRender(() => container?.scrollTo({ top: 0, behavior: "smooth" }));
              setLatest(newNotes[0].created_at + 10);
            }}
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
          visible={note.created_at <= dates.max && note.created_at >= dates.min}
          minHeight={numberCache.get(getEventUID(note))}
        />
      ))}
    </>
  );
}

export default memo(GenericNoteTimeline);
