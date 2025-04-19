import { useState } from "react";
import {
  Box,
  Spinner,
  Table,
  TableContainer,
  TableRowProps,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorMode,
} from "@chakra-ui/react";
import { getSeenRelays } from "applesauce-core/helpers";
import { TimelineLoader } from "applesauce-loaders";

import { NostrEvent } from "nostr-tools";
import RelayFavicon from "../../relay-favicon";
import { NoteLink } from "../../note/note-link";
import { BroadcastEventIcon } from "../../icons";
import Timestamp from "../../timestamp";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";

function EventRow({
  event,
  relays,
  ...props
}: { event: NostrEvent; relays: string[] } & Omit<TableRowProps, "children">) {
  const publish = usePublishEvent();

  const ref = useEventIntersectionRef(event);

  const { colorMode } = useColorMode();
  const yes = colorMode === "light" ? "green.200" : "green.800";
  const no = colorMode === "light" ? "red.200" : "red.800";

  const [broadcasting, setBroadcasting] = useState(false);
  const broadcast = async () => {
    setBroadcasting(true);
    await publish("Broadcast", event, relays);
    setBroadcasting(false);
  };

  return (
    <Tr ref={ref} {...props}>
      <Td isTruncated p="2">
        <Timestamp timestamp={event.created_at} />
      </Td>
      <Td isTruncated p="2">
        <NoteLink noteId={event.id} />
      </Td>
      <Td p="2" overflow="hidden">
        <Text isTruncated w={["xs", "xs", "xs", "sm", "xl"]}>
          {event.content}
        </Text>
      </Td>
      <Td title="Broadcast" p="2" onClick={() => !broadcasting && broadcast()} cursor="pointer">
        {broadcasting ? <Spinner size="xs" /> : <BroadcastEventIcon />}
      </Td>
      {relays.map((relay) => (
        <Td key={relay} title={relay} p="2" backgroundColor={getSeenRelays(event)?.has(relay) ? yes : no}>
          <RelayFavicon relay={relay} size="2xs" />
        </Td>
      ))}
    </Tr>
  );
}

export default function TimelineHealth({ timeline, loader }: { loader?: TimelineLoader; timeline: NostrEvent[] }) {
  const relays = loader && loader.requests ? Object.keys(loader.requests) : [];

  return (
    <>
      <TableContainer>
        <Table size="sm">
          <Thead>
            <Tr>
              <Th p="2" w="1">
                Date
              </Th>
              <Th p="2" w="1">
                Event
              </Th>
              <Th p="2">Content</Th>
              <Th />
              {relays.map((relay) => (
                <Th key={relay} title={relay} w="0.1rem" p="0">
                  <Tooltip label={relay}>
                    <Box p="2">
                      <RelayFavicon relay={relay} size="2xs" />
                    </Box>
                  </Tooltip>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {timeline.map((event) => (
              <EventRow key={event.id} event={event} relays={relays} />
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
}
