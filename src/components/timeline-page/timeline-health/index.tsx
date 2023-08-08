import {
  Button,
  Flex,
  Table,
  TableContainer,
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
import { getEventRelays } from "../../../services/event-relays";
import { NostrEvent } from "../../../types/nostr-event";
import { useMemo, useRef } from "react";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { RelayFavicon } from "../../relay-favicon";
import { NoteLink } from "../../note-link";
import dayjs from "dayjs";

function EventRow({ event, relays }: { event: NostrEvent; relays: string[] }) {
  const sub = useMemo(() => getEventRelays(event.id), [event.id]);
  const seenRelays = useSubject(sub);

  const ref = useRef<HTMLTableRowElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  const { colorMode } = useColorMode();
  const yes = colorMode === "light" ? "green.200" : "green.800";
  const no = colorMode === "light" ? "red.200" : "red.800";

  return (
    <Tr ref={ref}>
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
      {relays.map((relay) => (
        <Td key={relay} backgroundColor={seenRelays.includes(relay) ? yes : no} title={relay} p="2">
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
      <Flex gap="2">
        {/* <Button>All Relays</Button> */}
        {/* <Button>Repair feed</Button> */}
      </Flex>
      <TableContainer>
        <Table size="sm">
          <Thead>
            <Tr>
              <Th p="2" w="1">
                Date
              </Th>
              <Th p="p" w="1">
                Event
              </Th>
              <Th p="p">Content</Th>
              {timeline.relays.map((relay) => (
                <Tooltip label={relay}>
                  <Th title={relay} w="0.1rem" p="2">
                    <RelayFavicon relay={relay} size="2xs" />
                  </Th>
                </Tooltip>
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
