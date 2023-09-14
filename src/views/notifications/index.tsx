import { ReactNode, forwardRef, memo, useCallback, useMemo, useRef } from "react";
import { Box, Card, Flex, Switch, Text, useDisclosure } from "@chakra-ui/react";
import { Kind, nip18, nip25 } from "nostr-tools";

import { UserAvatar } from "../../components/user-avatar";
import { UserLink } from "../../components/user-link";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { NostrEvent, isATag, isETag } from "../../types/nostr-event";
import { NoteLink } from "../../components/note-link";
import RequireCurrentAccount from "../../providers/require-current-account";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useNotificationTimeline } from "../../providers/notification-timeline";
import { parseZapEvent } from "../../helpers/nostr/zaps";
import { readablizeSats } from "../../helpers/bolt11";
import { getEventUID, getReferences, parseCoordinate } from "../../helpers/nostr/events";
import Timestamp from "../../components/timestamp";
import { EmbedEvent, EmbedEventPointer } from "../../components/embed-event";
import EmbeddedUnknown from "../../components/embed-event/event-types/embedded-unknown";
import { NoteContents } from "../../components/note/note-contents";
import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";

const Kind1Notification = forwardRef<HTMLDivElement, { event: NostrEvent }>(({ event }, ref) => {
  const refs = getReferences(event);

  if (refs.replyId) {
    return (
      <Card variant="outline" p="2" borderColor="blue.400" ref={ref}>
        <Flex gap="2" alignItems="center" mb="2">
          <UserAvatar pubkey={event.pubkey} size="xs" />
          <UserLink pubkey={event.pubkey} />
          {refs.replyId ? <Text>replied to post</Text> : <Text>mentioned you</Text>}
          <NoteLink noteId={event.id} color="current" ml="auto">
            <Timestamp timestamp={event.created_at} />
          </NoteLink>
        </Flex>
        <EmbedEventPointer pointer={{ type: "note", data: refs.replyId }} />
        <NoteContents event={event} mt="2" />
      </Card>
    );
  }
  return (
    <Box ref={ref}>
      <Flex gap="2" alignItems="center" mb="1">
        <UserAvatar pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} />
        <Text>mentioned you in</Text>
      </Flex>
      <EmbedEvent event={event} />
    </Box>
  );
});

const ShareNotification = forwardRef<HTMLDivElement, { event: NostrEvent }>(({ event }, ref) => {
  const account = useCurrentAccount()!;
  const pointer = nip18.getRepostedEventPointer(event);
  if (pointer?.author !== account.pubkey) return null;

  return (
    <Card variant="outline" p="2" ref={ref}>
      <Flex gap="2" alignItems="center" mb="2">
        <UserAvatar pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} />
        <Text>shared note</Text>
        <NoteLink noteId={event.id} color="current" ml="auto">
          <Timestamp timestamp={event.created_at} />
        </NoteLink>
      </Flex>
      {pointer && <EmbedEventPointer pointer={{ type: "nevent", data: pointer }} />}
    </Card>
  );
});

const ReactionNotification = forwardRef<HTMLDivElement, { event: NostrEvent }>(({ event }, ref) => {
  const account = useCurrentAccount();
  const pointer = nip25.getReactedEventPointer(event);
  if (!pointer || (account?.pubkey && pointer.author !== account.pubkey)) return null;

  return (
    <Box ref={ref}>
      <Flex gap="2" alignItems="center" mb="1">
        <UserAvatar pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} />
        <Text>reacted {event.content} to your post</Text>
        <Timestamp timestamp={event.created_at} ml="auto" />
      </Flex>
      <EmbedEventPointer pointer={{ type: "nevent", data: pointer }} />
    </Box>
  );
});

const ZapNotification = forwardRef<HTMLDivElement, { event: NostrEvent }>(({ event }, ref) => {
  const zap = useMemo(() => {
    try {
      return parseZapEvent(event);
    } catch (e) {}
  }, [event]);

  if (!zap || !zap.payment.amount) return null;

  const eventId = zap?.request.tags.find(isETag)?.[1];
  const coordinate = zap?.request.tags.find(isATag)?.[1];
  const parsedCoordinate = coordinate ? parseCoordinate(coordinate) : null;

  let eventJSX: ReactNode | null = null;
  if (parsedCoordinate && parsedCoordinate.identifier) {
    eventJSX = (
      <EmbedEventPointer
        pointer={{
          type: "naddr",
          data: {
            pubkey: parsedCoordinate.pubkey,
            identifier: parsedCoordinate.identifier,
            kind: parsedCoordinate.kind,
          },
        }}
      />
    );
  } else if (eventId) {
    eventJSX = <EmbedEventPointer pointer={{ type: "note", data: eventId }} />;
  }

  return (
    <Card variant="outline" borderColor="yellow.400" p="2" ref={ref}>
      <Flex direction="row" gap="2" alignItems="center" mb="2">
        <UserAvatar pubkey={zap.request.pubkey} size="xs" />
        <UserLink pubkey={zap.request.pubkey} />
        <Text>zapped {readablizeSats(zap.payment.amount / 1000)} sats</Text>
        <Timestamp color="current" ml="auto" timestamp={zap.request.created_at} />
      </Flex>
      {eventJSX}
    </Card>
  );
});

const NotificationItem = memo(({ event }: { event: NostrEvent }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  switch (event.kind) {
    case Kind.Text:
      return <Kind1Notification event={event} ref={ref} />;
    case Kind.Reaction:
      return <ReactionNotification event={event} ref={ref} />;
    case Kind.Repost:
      return <ShareNotification event={event} ref={ref} />;
    case Kind.Zap:
      return <ZapNotification event={event} ref={ref} />;
    default:
      return <EmbeddedUnknown event={event} />;
  }
});

function NotificationsPage() {
  const hideReplies = useDisclosure();
  const hideMentions = useDisclosure();
  const hideZaps = useDisclosure();
  const hideReactions = useDisclosure();
  const hideShares = useDisclosure();

  const { people } = usePeopleListContext();
  const peoplePubkeys = useMemo(() => people?.map((p) => p.pubkey), [people]);

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (peoplePubkeys && event.kind !== Kind.Zap && !peoplePubkeys.includes(event.pubkey)) return false;

      if (hideZaps.isOpen && event.kind === Kind.Zap) return false;
      if (hideReactions.isOpen && event.kind === Kind.Reaction) return false;
      if (hideShares.isOpen && event.kind === Kind.Repost) return false;
      if (event.kind === Kind.Text) {
        const refs = getReferences(event);
        if (hideReplies.isOpen && refs.replyId) return false;
        if (hideMentions.isOpen && !refs.replyId) return false;
      }

      return true;
    },
    [hideMentions.isOpen, hideReplies.isOpen, hideZaps.isOpen, hideReactions.isOpen, hideShares.isOpen, peoplePubkeys],
  );

  const timeline = useNotificationTimeline();
  const events = useSubject(timeline?.timeline).filter(eventFilter) ?? [];

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <PeopleListSelection />
          <Switch isChecked={!hideReplies.isOpen} onChange={hideReplies.onToggle}>
            Replies
          </Switch>
          <Switch isChecked={!hideMentions.isOpen} onChange={hideMentions.onToggle}>
            Mentions
          </Switch>
          <Switch isChecked={!hideReactions.isOpen} onChange={hideReactions.onToggle}>
            Reactions
          </Switch>
          <Switch isChecked={!hideShares.isOpen} onChange={hideShares.onToggle}>
            Shares
          </Switch>
          <Switch isChecked={!hideZaps.isOpen} onChange={hideZaps.onToggle}>
            Zaps
          </Switch>
        </Flex>
        {events.map((event) => (
          <NotificationItem key={event.id} event={event} />
        ))}

        <TimelineActionAndStatus timeline={timeline} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}

export default function NotificationsView() {
  return (
    <RequireCurrentAccount>
      <PeopleListProvider initList="global">
        <NotificationsPage />
      </PeopleListProvider>
    </RequireCurrentAccount>
  );
}
