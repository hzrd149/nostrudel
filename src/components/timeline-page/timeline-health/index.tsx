import { useMemo, useRef, useState } from "react";
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
import { TimelineLoader } from "../../../classes/timeline-loader";
import useSubject from "../../../hooks/use-subject";
import { getEventRelays, handleEventFromRelay } from "../../../services/event-relays";
import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { RelayFavicon } from "../../relay-favicon";
import { NoteLink } from "../../note-link";
import dayjs from "dayjs";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { RelayIcon } from "../../icons";
import { getEventUID } from "../../../helpers/nostr/events";

function EventRow({
  event,
  relays,
  ...props
}: { event: NostrEvent; relays: string[] } & Omit<TableRowProps, "children">) {
  const sub = useMemo(() => getEventRelays(event.id), [event.id]);
  const seenRelays = useSubject(sub);

  const ref = useRef<HTMLTableRowElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  const { colorMode } = useColorMode();
  const yes = colorMode === "light" ? "green.200" : "green.800";
  const no = colorMode === "light" ? "red.200" : "red.800";

  const [broadcasting, setBroadcasting] = useState(false);
  const broadcast = () => {
    setBroadcasting(true);
    const missingRelays = relays.filter((r) => !seenRelays.includes(r));
    if (missingRelays.length === 0) return;

    const pub = new NostrPublishAction("Broadcast", missingRelays, event);

    pub.onResult.subscribe((result) => {
      if (result.status) {
        handleEventFromRelay(result.relay, event);
      }
    });

    pub.onComplete.then(() => {
      setBroadcasting(false);
    });
  };

  return (
    <Tr ref={ref} {...props}>
      <Td isTruncated p="2">
        {dayjs.unix(event.created_at).fromNow()}
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
        {broadcasting ? <Spinner size="xs" /> : <RelayIcon />}
      </Td>
      {relays.map((relay) => (
        <Td key={relay} title={relay} p="2" backgroundColor={seenRelays.includes(relay) ? yes : no}>
          <RelayFavicon relay={relay} size="2xs" />
        </Td>
      ))}
    </Tr>
  );
}

export default function TimelineHealth({ timeline }: { timeline: TimelineLoader }) {
  const events = useSubject(timeline.timeline);

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
              {timeline.relays.map((relay) => (
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
            {events.map((event) => (
              <EventRow key={event.id} event={event} relays={timeline.relays} />
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
}
