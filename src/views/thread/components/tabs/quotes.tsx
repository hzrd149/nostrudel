import { Flex } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { TimelineNote } from "../../../../components/timeline/note";

export default function PostQuotesTab({ quotes }: { quotes: NostrEvent[] }) {
  return (
    <Flex gap="2" direction="column">
      {quotes.map((quote) => (
        <TimelineNote key={quote.id} event={quote} />
      ))}
    </Flex>
  );
}
