import { Flex } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { EmbedEventCard } from "../../../../components/embed-event/card";

export default function UnknownTab({ events }: { events: NostrEvent[] }) {
  return (
    <Flex gap="2" direction="column">
      {events.map((event) => (
        <EmbedEventCard event={event} key={event.id} />
      ))}
    </Flex>
  );
}
