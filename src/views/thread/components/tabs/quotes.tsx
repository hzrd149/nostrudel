import { Flex } from "@chakra-ui/react";
import { ThreadItem } from "applesauce-core/models";
import { NostrEvent } from "nostr-tools";

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
