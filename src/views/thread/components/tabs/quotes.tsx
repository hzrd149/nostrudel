import { kinds } from "nostr-tools";
import { Flex } from "@chakra-ui/react";

import { ThreadItem } from "../../../../helpers/thread";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import useSubject from "../../../../hooks/use-subject";
import { getContentTagRefs } from "../../../../helpers/nostr/event";
import { TimelineNote } from "../../../../components/note/timeline-note";

export default function PostQuotesTab({ post }: { post: ThreadItem }) {
  const readRelays = useReadRelays();
  const timeline = useTimelineLoader(`${post.event.id}-quotes`, readRelays, {
    kinds: [kinds.ShortTextNote],
    "#e": [post.event.id],
  });

  const events = useSubject(timeline.timeline);
  const quotes = events.filter((e) => {
    return getContentTagRefs(e.content, e.tags).some((t) => t[0] === "e" && t[1] === post.event.id);
  });

  return (
    <Flex gap="2" direction="column">
      {quotes.map((quote) => (
        <TimelineNote key={quote.id} event={quote} />
      ))}
    </Flex>
  );
}
