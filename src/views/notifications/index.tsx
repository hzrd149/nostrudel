import { memo, useCallback, useMemo, useRef } from "react";
import { Card, CardBody, CardHeader, Flex, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import { UserAvatar } from "../../components/user-avatar";
import { UserLink } from "../../components/user-link";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { NostrEvent } from "../../types/nostr-event";
import { NoteLink } from "../../components/note-link";
import RequireCurrentAccount from "../../providers/require-current-account";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useNotificationTimeline } from "../../providers/notification-timeline";
import { Kind, getEventHash } from "nostr-tools";
import { parseZapEvent } from "../../helpers/zaps";
import { readablizeSats } from "../../helpers/bolt11";
import { getReferences } from "../../helpers/nostr/events";

const Kind1Notification = ({ event }: { event: NostrEvent }) => (
  <Card size="sm" variant="outline">
    <CardHeader>
      <Flex gap="2" alignItems="center">
        <UserAvatar pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} />
        <Text>replied to your post</Text>
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

const ReactionNotification = ({ event }: { event: NostrEvent }) => {
  const refs = getReferences(event);

  return (
    <Flex gap="2" alignItems="center" px="2">
      <UserAvatar pubkey={event.pubkey} size="xs" />
      <UserLink pubkey={event.pubkey} />
      <Text>reacted {event.content} to your post</Text>
      <NoteLink noteId={refs.replyId || event.id} color="current" ml="auto">
        {dayjs.unix(event.created_at).fromNow()}
      </NoteLink>
    </Flex>
  );
};

const ZapNotification = ({ event }: { event: NostrEvent }) => {
  const zap = useMemo(() => {
    try {
      return parseZapEvent(event);
    } catch (e) {}
  }, [event]);

  if (!zap || !zap.payment.amount) return null;

  return (
    <Flex
      direction="row"
      borderRadius="md"
      borderColor="yellow.400"
      borderWidth="1px"
      p="2"
      gap="2"
      alignItems="center"
    >
      <UserAvatar pubkey={zap.request.pubkey} size="xs" />
      <UserLink pubkey={zap.request.pubkey} />
      <Text>
        zapped {readablizeSats(zap.payment.amount / 1000)} sats
        {zap.eventId && (
          <span>
            {" "}
            on note: <NoteLink noteId={zap.eventId} />
          </span>
        )}
      </Text>
      <Text color="current" ml="auto">
        {dayjs.unix(zap.request.created_at).fromNow()}
      </Text>
    </Flex>
  );
};

const NotificationItem = memo(({ event }: { event: NostrEvent }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  let content = <Text>Unknown event type {event.kind}</Text>;
  switch (event.kind) {
    case Kind.Text:
      content = <Kind1Notification event={event} />;
      break;
    case Kind.Reaction:
      content = <ReactionNotification event={event} />;
      break;
    case Kind.Zap:
      content = <ZapNotification event={event} />;
      break;
  }

  return <div ref={ref}>{content}</div>;
});

function NotificationsPage() {
  const account = useCurrentAccount()!;

  const eventFilter = useCallback((event: NostrEvent) => event.pubkey !== account.pubkey, [account]);
  const timeline = useNotificationTimeline();

  const events = useSubject(timeline?.timeline) ?? [];

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Flex direction="column" gap="2">
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
