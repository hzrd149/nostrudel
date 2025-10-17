import { memo, useState } from "react";
import { Box, Button } from "@chakra-ui/react";
import { kinds, NostrEvent } from "nostr-tools";
import dayjs from "dayjs";

import useNumberCache from "../../../hooks/timeline/use-number-cache";
import useCacheEntryHeight from "../../../hooks/timeline/use-cache-entry-height";
import { useTimelineDates } from "../../../hooks/timeline/use-timeline-dates";
import useTimelineLocationCacheKey from "../../../hooks/timeline/use-timeline-cache-key";
import TimelineItem from "./timeline-item";
import { getEventUID } from "applesauce-core/helpers";

const INITIAL_NOTES = 10;
const NOTE_BUFFER = 5;

/** The kinds of events that the generic timeline can display */
export const GENERIC_TIMELINE_KINDS = [kinds.ShortTextNote, kinds.Repost, kinds.GenericRepost, kinds.Highlights];

function GenericNoteTimeline({ timeline }: { timeline: NostrEvent[] }) {
  const [latest, setLatest] = useState(() => dayjs().unix());

  const cacheKey = useTimelineLocationCacheKey();
  const numberCache = useNumberCache(cacheKey);
  const dates = useTimelineDates(timeline, numberCache, NOTE_BUFFER, INITIAL_NOTES);

  // measure and cache the hight of every entry
  useCacheEntryHeight(numberCache.set);

  const newNotes: NostrEvent[] = [];
  const notes: NostrEvent[] = [];
  for (const note of timeline) {
    if (note.created_at > latest) newNotes.push(note);
    else if (note.created_at >= dates.cursor) notes.push(note);
  }

  return (
    <>
      {newNotes.length > 0 && (
        <Box h="0" overflow="visible" w="full" zIndex={100} display="flex" position="relative">
          <Button
            onClick={() => setLatest(newNotes[0].created_at + 10)}
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
