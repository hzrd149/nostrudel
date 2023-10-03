import { ReactNode, forwardRef, memo, useMemo, useRef } from "react";
import { Box, Card, Flex, Text } from "@chakra-ui/react";
import { Kind, nip18, nip25 } from "nostr-tools";

import { UserAvatar } from "../../components/user-avatar";
import { UserLink } from "../../components/user-link";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { NostrEvent, isATag, isETag } from "../../types/nostr-event";
import { NoteLink } from "../../components/note-link";
import { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import { parseZapEvent } from "../../helpers/nostr/zaps";
import { readablizeSats } from "../../helpers/bolt11";
import { getEventUID, getReferences, parseCoordinate } from "../../helpers/nostr/events";
import Timestamp from "../../components/timestamp";
import { EmbedEvent, EmbedEventPointer } from "../../components/embed-event";
import EmbeddedUnknown from "../../components/embed-event/event-types/embedded-unknown";
import { NoteContents } from "../../components/note/note-contents";
import { ErrorBoundary } from "../../components/error-boundary";
import { TrustProvider } from "../../providers/trust";

const Kind1Notification = forwardRef<HTMLDivElement, { event: NostrEvent }>(({ event }, ref) => {
  const refs = getReferences(event);

  if (refs.replyId) {
    return (
      <Card variant="outline" p="2" ref={ref}>
        <Flex gap="2" alignItems="center" mb="2" wrap="wrap">
          <UserAvatar pubkey={event.pubkey} size="xs" />
          <UserLink pubkey={event.pubkey} />
          {refs.replyId ? <Text>replied to:</Text> : <Text>mentioned you</Text>}
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
    <Box ref={ref}>
      <Flex gap="2" alignItems="center" mb="2">
        <UserAvatar pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} />
        <Text>shared note:</Text>
        <NoteLink noteId={event.id} color="current" ml="auto">
          <Timestamp timestamp={event.created_at} />
        </NoteLink>
      </Flex>
      {pointer && <EmbedEventPointer pointer={{ type: "nevent", data: pointer }} />}
    </Box>
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
    <Card variant="outline" p="2" ref={ref}>
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

const NotificationItem = ({ event }: { event: NostrEvent }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  let content: ReactNode | null = null;
  switch (event.kind) {
    case Kind.Text:
      content = <Kind1Notification event={event} ref={ref} />;
      break;
    case Kind.Reaction:
      content = <ReactionNotification event={event} ref={ref} />;
      break;
    case Kind.Repost:
      content = <ShareNotification event={event} ref={ref} />;
      break;
    case Kind.Zap:
      content = <ZapNotification event={event} ref={ref} />;
      break;
    default:
      content = <EmbeddedUnknown event={event} />;
      break;
  }
  return (
    content && (
      <ErrorBoundary>
        <TrustProvider event={event}>{content}</TrustProvider>
      </ErrorBoundary>
    )
  );
};

export default memo(NotificationItem);
