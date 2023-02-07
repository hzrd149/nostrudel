import React, { useCallback, useEffect, useState } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
} from "@chakra-ui/react";
import { useSubscription } from "../../hooks/use-subscription";
import { NostrEvent } from "../../types/nostr-event";
import settings from "../../services/settings";
import useSubject from "../../hooks/use-subject";
import { Subscription } from "../../services/subscriptions";

function useEventDir(subscription: Subscription) {
  const [events, setEvents] = useState<Record<string, NostrEvent>>({});

  useEffect(() => {
    const s = subscription.onEvent.subscribe((event) => {
      setEvents((dir) => {
        if (!dir[event.id]) {
          return { [event.id]: event, ...dir };
        }
        return dir;
      });
    });

    return () => s.unsubscribe();
  }, [subscription]);

  const reset = () => setEvents({});

  return { events, reset };
}

export const UserRelaysTab = ({ pubkey }: { pubkey: string }) => {
  const relays = useSubject(settings.relays);

  const sub = useSubscription(
    relays,
    { authors: [pubkey], kinds: [2] },
    `${pubkey} relays`
  );

  const { events, reset } = useEventDir(sub);

  // clear events when pubkey changes
  useEffect(() => reset(), [pubkey]);

  const addRelay = useCallback(
    (url: string) => {
      settings.relays.next([...relays, url]);
    },
    [relays]
  );

  return (
    <TableContainer>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Url</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {Object.values(events).map((event) => (
            <Tr key={event.id}>
              <Td>{event.content}</Td>
              <Td>
                <Button
                  onClick={() => addRelay(event.content)}
                  isDisabled={relays.includes(event.content)}
                >
                  Add Relay
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
