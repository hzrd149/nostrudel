import { NostrEvent } from "nostr-tools";
import { Flex } from "@chakra-ui/react";

import { ThreadItem } from "../../../../helpers/thread";
import { EmbedEvent } from "../../../../components/embed-event";

export default function UnknownTab({ post, events }: { post: ThreadItem; events: NostrEvent[] }) {
  return (
    <Flex gap="2" direction="column">
      {events.map((event) => (
        <EmbedEvent event={event} key={event.id} />
      ))}
    </Flex>
  );
}
