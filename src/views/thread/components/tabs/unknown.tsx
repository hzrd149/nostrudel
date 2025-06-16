import { Flex } from "@chakra-ui/react";
import { ThreadItem } from "applesauce-core/models";
import { NostrEvent } from "nostr-tools";

import { EmbedEventCard } from "../../../../components/embed-event/card";

export default function UnknownTab({ post, events }: { post: ThreadItem; events: NostrEvent[] }) {
  return (
    <Flex gap="2" direction="column">
      {events.map((event) => (
        <EmbedEventCard event={event} key={event.id} />
      ))}
    </Flex>
  );
}
