import { NostrEvent } from "nostr-tools";
import { Flex } from "@chakra-ui/react";

import { ThreadItem } from "../../../../helpers/thread";
import { TimelineNote } from "../../../../components/note/timeline-note";

export default function PostQuotesTab({ post, quotes }: { post: ThreadItem; quotes: NostrEvent[] }) {
  return (
    <Flex gap="2" direction="column">
      {quotes.map((quote) => (
        <TimelineNote key={quote.id} event={quote} />
      ))}
    </Flex>
  );
}
