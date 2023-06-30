import { memo, useCallback } from "react";
import { Card, CardBody, CardHeader, Flex, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import { UserAvatar } from "../../components/user-avatar";
import { UserLink } from "../../components/user-link";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import { NoteLink } from "../../components/note-link";
import RequireCurrentAccount from "../../providers/require-current-account";
import LoadMoreButton from "../../components/load-more-button";

const Kind1Notification = ({ event }: { event: NostrEvent }) => (
  <Card size="sm" variant="outline">
    <CardHeader>
      <Flex gap="4" alignItems="center">
        <UserAvatar pubkey={event.pubkey} size="sm" />
        <UserLink pubkey={event.pubkey} />
        <NoteLink noteId={event.id} color="current" ml="auto">
          {dayjs.unix(event.created_at).fromNow()}
        </NoteLink>
      </Flex>
    </CardHeader>
    <CardBody pt={0}>
      <Text>{event.content.replace("\n", " ").slice(0, 64)}</Text>
    </CardBody>
  </Card>
);

const NotificationItem = memo(({ event }: { event: NostrEvent }) => {
  if (event.kind === 1) {
    return <Kind1Notification event={event} />;
  }
  return <>Unknown event type {event.kind}</>;
});

function NotificationsPage() {
  const readRelays = useReadRelayUrls();
  const account = useCurrentAccount()!;

  const eventFilter = useCallback((event: NostrEvent) => event.pubkey !== account.pubkey, [account]);
  const { timeline, loader } = useTimelineLoader(
    "notifications",
    readRelays,
    {
      "#p": [account.pubkey],
      kinds: [1],
    },
    { eventFilter }
  );

  return (
    <Flex direction="column" overflowX="hidden" overflowY="auto" gap="2">
      {timeline.map((event) => (
        <NotificationItem key={event.id} event={event} />
      ))}

      <LoadMoreButton timeline={loader} />
    </Flex>
  );
}

export default function NotificationsView() {
  return (
    <RequireCurrentAccount>
      <NotificationsPage />
    </RequireCurrentAccount>
  );
}
