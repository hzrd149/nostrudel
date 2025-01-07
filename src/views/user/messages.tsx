import { Flex, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { useOutletContext } from "react-router-dom";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import VerticalPageLayout from "../../components/vertical-page-layout";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import { NostrEvent } from "../../types/nostr-event";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserLink from "../../components/user/user-link";
import Timestamp from "../../components/timestamp";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import SuperMap from "../../classes/super-map";
import { getDMRecipient, getDMSender } from "../../helpers/nostr/dms";
import UserDnsIdentityIcon from "../../components/user/user-dns-identity-icon";

function DirectMessageRow({ messages, pubkey, self }: { messages: NostrEvent[]; pubkey: string; self: string }) {
  const ref = useEventIntersectionRef<HTMLTableRowElement>(messages[0]);

  return (
    <Tr ref={ref}>
      <Td>
        <Flex gap="2" alignItems="center">
          <UserAvatarLink pubkey={pubkey} size="xs" />
          <UserLink pubkey={pubkey} />
          <UserDnsIdentityIcon pubkey={pubkey} />
        </Flex>
      </Td>
      <Td isNumeric>
        <Timestamp timestamp={messages[0].created_at} />
      </Td>
      <Td isNumeric>{messages.filter((dm) => getDMSender(dm) === self).length}</Td>
      <Td isNumeric>{messages.filter((dm) => getDMRecipient(dm) === self).length}</Td>
      <Td isNumeric>{messages.length}</Td>
    </Tr>
  );
}

export default function UserMessagesTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { loader, timeline: messages } = useTimelineLoader(pubkey + "-articles", readRelays, [
    {
      authors: [pubkey],
      kinds: [kinds.EncryptedDirectMessage],
    },
    { "#p": [pubkey], kinds: [kinds.EncryptedDirectMessage] },
  ]);
  const callback = useTimelineCurserIntersectionCallback(loader);

  const byCounterParty = new SuperMap<string, NostrEvent[]>(() => []);
  for (const message of messages) {
    const sender = getDMSender(message);
    const receiver = getDMRecipient(message);
    if (sender !== pubkey) byCounterParty.get(sender).push(message);
    else if (receiver !== pubkey) byCounterParty.get(receiver).push(message);
  }

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>User</Th>
                <Th isNumeric>Recent</Th>
                <Th isNumeric>Sent</Th>
                <Th isNumeric>Received</Th>
                <Th isNumeric>Total</Th>
              </Tr>
            </Thead>
            <Tbody>
              {Array.from(byCounterParty).map(([user, messages]) => (
                <DirectMessageRow key={user} self={pubkey} pubkey={user} messages={messages} />
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        <TimelineActionAndStatus timeline={loader} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
