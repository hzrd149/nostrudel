import { memo, useCallback, useRef } from "react";
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
import TimelineActionAndStatus from "../../components/timeline-action-and-status";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import useSubject from "../../hooks/use-subject";
import { truncatedId } from "../../helpers/nostr-event";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";

const Kind1Notification = ({ event }: { event: NostrEvent }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  return (
    <Card size="sm" variant="outline" ref={ref}>
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
};

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
  const timeline = useTimelineLoader(
    `${truncatedId(account.pubkey)}-notifications`,
    readRelays,
    {
      "#p": [account.pubkey],
      kinds: [1],
    },
    { eventFilter }
  );

  const events = useSubject(timeline.timeline);

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback} root={scrollBox}>
      <Flex direction="column" overflowX="hidden" overflowY="auto" gap="2" ref={scrollBox}>
        {events.map((event) => (
          <NotificationItem key={event.id} event={event} />
        ))}

        <TimelineActionAndStatus timeline={timeline} />
      </Flex>
    </IntersectionObserverProvider>
  );
}

export default function NotificationsView() {
  return (
    <RequireCurrentAccount>
      <NotificationsPage />
    </RequireCurrentAccount>
  );
}
