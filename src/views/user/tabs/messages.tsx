import { Flex, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { kinds, NostrEvent } from "nostr-tools";

import SuperMap from "../../../classes/super-map";
import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserDnsIdentityIcon from "../../../components/user/user-dns-identity-icon";
import UserLink from "../../../components/user/user-link";
import { getDMRecipient, getDMSender } from "../../../helpers/nostr/dms";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import { useAdditionalRelayContext } from "../../../providers/local/additional-relay";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";

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
  const user = useParamsProfilePointer("pubkey");
  const readRelays = useAdditionalRelayContext();
  const mailboxes = useUserMailboxes(user);

  const { loader, timeline: messages } = useTimelineLoader(
    user.pubkey + "-messages",
    mailboxes?.inboxes || readRelays,
    [
      {
        authors: [user.pubkey],
        kinds: [kinds.EncryptedDirectMessage],
      },
      { "#p": [user.pubkey], kinds: [kinds.EncryptedDirectMessage] },
    ],
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  const byCounterParty = new SuperMap<string, NostrEvent[]>(() => []);
  for (const message of messages) {
    const sender = getDMSender(message);
    const receiver = getDMRecipient(message);
    if (sender !== user.pubkey) byCounterParty.get(sender).push(message);
    else if (receiver !== user.pubkey) byCounterParty.get(receiver).push(message);
  }

  return (
    <ScrollLayout>
      <IntersectionObserverProvider callback={callback}>
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
              {Array.from(byCounterParty).map(([other, messages]) => (
                <DirectMessageRow key={other} self={user.pubkey} pubkey={other} messages={messages} />
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        <TimelineActionAndStatus loader={loader} />
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
