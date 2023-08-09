import { useMemo, useRef } from "react";
import {
  Box,
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
  useToast,
} from "@chakra-ui/react";
import { TimelineLoader } from "../../../classes/timeline-loader";
import useSubject from "../../../hooks/use-subject";
import { getEventRelays, handleEventFromRelay } from "../../../services/event-relays";
import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { RelayFavicon } from "../../relay-favicon";
import { NoteLink } from "../../note-link";
import dayjs from "dayjs";
import { nostrPostAction } from "../../../classes/nostr-post-action";
import relayPoolService from "../../../services/relay-pool";

function EventRow({
  event,
  relays,
  ...props
}: { event: NostrEvent; relays: string[] } & Omit<TableRowProps, "children">) {
  const toast = useToast();
  const sub = useMemo(() => getEventRelays(event.id), [event.id]);
  const seenRelays = useSubject(sub);

  const ref = useRef<HTMLTableRowElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  const { colorMode } = useColorMode();
  const yes = colorMode === "light" ? "green.200" : "green.800";
  const no = colorMode === "light" ? "red.200" : "red.800";

  const broadcast = (relay: string) => {
    const { results } = nostrPostAction([relay], event, 5000);

    results.subscribe((result) => {
      if (result.status) {
        handleEventFromRelay(relayPoolService.requestRelay(result.url, false), event);
      } else if (result.message) {
        toast({ description: result.message, status: result.status ? "success" : "error" });
      }
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
      {relays.map((relay) => (
        <Td
          key={relay}
          title={relay}
          p="2"
          backgroundColor={seenRelays.includes(relay) ? yes : no}
          onClick={() => !seenRelays.includes(relay) && broadcast(relay)}
          cursor={seenRelays.includes(relay) ? undefined : "pointer"}
        >
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
              <Th p="p" w="1">
                Event
              </Th>
              <Th p="p">Content</Th>
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
