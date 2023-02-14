import { Button, Card, CardBody, Flex, Spinner, Text } from "@chakra-ui/react";
import moment from "moment";
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { UserAvatar } from "../../components/user-avatar";
import { UserLink } from "../../components/user-link";
import { convertTimestampToDate } from "../../helpers/date";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";

const Kind1Notification = ({ event }: { event: NostrEvent }) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardBody>
        <Flex gap="4">
          <UserAvatar pubkey={event.pubkey} size="sm" />
          <UserLink pubkey={event.pubkey} />
          <Text>{moment(convertTimestampToDate(event.created_at)).fromNow()}</Text>
          <Button onClick={() => navigate(`/n/${event.id}`)} size="sm" ml="auto">
            View
          </Button>
        </Flex>
      </CardBody>
    </Card>
  );
};

const NotificationItem = memo(({ event }: { event: NostrEvent }) => {
  if (event.kind === 1) {
    return <Kind1Notification event={event} />;
  }
  return <>Unknown event type {event.kind}</>;
});

const NotificationsView = () => {
  const readRelays = useReadRelayUrls();
  const account = useCurrentAccount();
  const { events, loading, loadMore } = useTimelineLoader(
    "notifications",
    readRelays,
    {
      "#p": [account.pubkey],
      kinds: [1],
      since: moment().subtract(1, "day").unix(),
    },
    { pageSize: moment.duration(1, "day").asSeconds() }
  );

  const timeline = events
    // ignore events made my the user
    .filter((e) => e.pubkey !== account.pubkey);

  return (
    <Flex direction="column" overflowX="hidden" overflowY="auto" gap="2">
      {timeline.map((event) => (
        <NotificationItem key={event.id} event={event} />
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
};

export default NotificationsView;
