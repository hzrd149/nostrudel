import { ReactNode, forwardRef, memo, useMemo, useRef } from "react";
import { AvatarGroup, Flex, IconButton, IconButtonProps, Text, useDisclosure } from "@chakra-ui/react";
import { kinds, nip18, nip25 } from "nostr-tools";

import useCurrentAccount from "../../hooks/use-current-account";
import { NostrEvent, isATag, isETag } from "../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../providers/local/intersection-observer";
import { parseZapEvent } from "../../helpers/nostr/zaps";
import { readablizeSats } from "../../helpers/bolt11";
import { getEventUID, getThreadReferences, isMentionedInContent, parseCoordinate } from "../../helpers/nostr/events";
import { EmbedEvent, EmbedEventPointer } from "../../components/embed-event";
import EmbeddedUnknown from "../../components/embed-event/event-types/embedded-unknown";
import { ErrorBoundary } from "../../components/error-boundary";
import { TrustProvider } from "../../providers/local/trust";
import Heart from "../../components/icons/heart";
import UserAvatarLink from "../../components/user-avatar-link";
import { AtIcon, ChevronDownIcon, ChevronUpIcon, LightningIcon, ReplyIcon, RepostIcon } from "../../components/icons";
import useSingleEvent from "../../hooks/use-single-event";
import { TORRENT_COMMENT_KIND } from "../../helpers/nostr/torrents";
import NotificationIconEntry from "./components/notification-icon-entry";
import { getPubkeysMentionedInContent } from "../../helpers/nostr/post";

export const ExpandableToggleButton = ({
  toggle,
  ...props
}: { toggle: { isOpen: boolean; onToggle: () => void } } & Omit<IconButtonProps, "icon">) => (
  <IconButton
    icon={toggle.isOpen ? <ChevronUpIcon boxSize={6} /> : <ChevronDownIcon boxSize={6} />}
    variant="ghost"
    onClick={toggle.onToggle}
    {...props}
  />
);

const NoteNotification = forwardRef<HTMLDivElement, { event: NostrEvent }>(({ event }, ref) => {
  const account = useCurrentAccount()!;
  const refs = getThreadReferences(event);
  const parent = useSingleEvent(refs.reply?.e?.id);

  const isReplyingToMe = !!refs.reply?.e?.id && (parent ? parent.pubkey === account.pubkey : true);
  // is the "p" tag directly mentioned in the content
  const isMentioned = isMentionedInContent(event, account.pubkey);
  // is the pubkey mentioned in any way in the content
  const isQuoted = !isMentioned && getPubkeysMentionedInContent(event.content).includes(account.pubkey);

  if (isReplyingToMe) return <ReplyNotification event={event} ref={ref} />;
  else if (isMentioned || isQuoted) return <MentionNotification event={event} ref={ref} />;
  else return null;
});
const ReplyNotification = forwardRef<HTMLDivElement, { event: NostrEvent }>(({ event }, ref) => (
  <NotificationIconEntry ref={ref} icon={<ReplyIcon boxSize={8} color="green.400" />}>
    <EmbedEvent event={event} />
  </NotificationIconEntry>
));

const MentionNotification = forwardRef<HTMLDivElement, { event: NostrEvent }>(({ event }, ref) => (
  <NotificationIconEntry ref={ref} icon={<AtIcon boxSize={8} color="purple.400" />}>
    <EmbedEvent event={event} />
  </NotificationIconEntry>
));

const RepostNotification = forwardRef<HTMLDivElement, { event: NostrEvent }>(({ event }, ref) => {
  const account = useCurrentAccount()!;
  const pointer = nip18.getRepostedEventPointer(event);
  const expanded = useDisclosure({ defaultIsOpen: true });

  if (pointer?.author !== account.pubkey) return null;

  return (
    <NotificationIconEntry ref={ref} icon={<RepostIcon boxSize={8} color="blue.400" />}>
      <Flex gap="2" alignItems="center">
        <AvatarGroup size="sm">
          <UserAvatarLink pubkey={event.pubkey} />
        </AvatarGroup>
        <ExpandableToggleButton aria-label="Toggle event" ml="auto" toggle={expanded} />
      </Flex>
      {expanded.isOpen && <EmbedEventPointer pointer={{ type: "nevent", data: pointer }} />}
    </NotificationIconEntry>
  );
});

const ReactionNotification = forwardRef<HTMLDivElement, { event: NostrEvent }>(({ event }, ref) => {
  const account = useCurrentAccount();
  const pointer = nip25.getReactedEventPointer(event);
  const expanded = useDisclosure({ defaultIsOpen: true });
  if (!pointer || (account?.pubkey && pointer.author !== account.pubkey)) return null;

  const reactedEvent = useSingleEvent(pointer.id, pointer.relays);
  if (reactedEvent?.kind === kinds.EncryptedDirectMessage) return null;

  return (
    <NotificationIconEntry ref={ref} icon={<Heart boxSize={8} color="red.400" />}>
      <Flex gap="2" alignItems="center">
        <AvatarGroup size="sm">
          <UserAvatarLink pubkey={event.pubkey} />
        </AvatarGroup>
        <Text fontSize="xl">{event.content}</Text>
        <ExpandableToggleButton aria-label="Toggle event" ml="auto" toggle={expanded} />
        {/* <Timestamp timestamp={event.created_at} ml="auto" /> */}
      </Flex>
      {expanded.isOpen && <EmbedEventPointer pointer={{ type: "nevent", data: pointer }} />}
    </NotificationIconEntry>
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
  const expanded = useDisclosure({ defaultIsOpen: true });

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
    <NotificationIconEntry ref={ref} icon={<LightningIcon boxSize={8} color="yellow.400" />}>
      <Flex gap="2" alignItems="center">
        <AvatarGroup size="sm">
          <UserAvatarLink pubkey={zap.request.pubkey} />
        </AvatarGroup>
        <Text>{readablizeSats(zap.payment.amount / 1000)} sats</Text>
        {zap.request.content && <Text>{zap.request.content}</Text>}
        {eventJSX !== null && <ExpandableToggleButton aria-label="Toggle event" ml="auto" toggle={expanded} />}
      </Flex>
      {expanded.isOpen && eventJSX}
    </NotificationIconEntry>
  );
});

const NotificationItem = ({ event }: { event: NostrEvent }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  let content: ReactNode | null = null;
  switch (event.kind) {
    case kinds.ShortTextNote:
    case TORRENT_COMMENT_KIND:
    case kinds.LongFormArticle:
      content = <NoteNotification event={event} ref={ref} />;
      break;
    case kinds.Reaction:
      content = <ReactionNotification event={event} ref={ref} />;
      break;
    case kinds.Repost:
      content = <RepostNotification event={event} ref={ref} />;
      break;
    case kinds.Zap:
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
