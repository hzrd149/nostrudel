import { ReactNode, forwardRef, memo, useCallback, useMemo } from "react";
import { AvatarGroup, ButtonGroup, Flex, IconButton, IconButtonProps, Text } from "@chakra-ui/react";
import { kinds, nip18, nip25 } from "nostr-tools";
import { DecodeResult } from "nostr-tools/nip19";

import useCurrentAccount from "../../../hooks/use-current-account";
import { NostrEvent, isATag, isETag } from "../../../types/nostr-event";
import { getParsedZap } from "../../../helpers/nostr/zaps";
import { readablizeSats } from "../../../helpers/bolt11";
import { getThreadReferences, parseCoordinate } from "../../../helpers/nostr/event";
import { EmbedEvent, EmbedEventPointer } from "../../../components/embed-event";
import EmbeddedUnknown from "../../../components/embed-event/event-types/embedded-unknown";
import { ErrorBoundary } from "../../../components/error-boundary";
import { TrustProvider } from "../../../providers/local/trust-provider";
import Heart from "../../../components/icons/heart";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import {
  AtIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LightningIcon,
  ReplyIcon,
  RepostIcon,
} from "../../../components/icons";
import useSingleEvent from "../../../hooks/use-single-event";
import NotificationIconEntry from "./notification-icon-entry";
import { CategorizedEvent, NotificationType, typeSymbol } from "../../../classes/notifications";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import ZapReceiptMenu from "../../../components/zap/zap-receipt-menu";
import ReactionIcon from "../../../components/event-reactions/reaction-icon";
import { TimelineNote } from "../../../components/note/timeline-note";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import { truncateId } from "../../../helpers/string";
import TextNoteContents from "../../../components/note/timeline-note/text-note-contents";
import ArticleCard from "../../articles/components/article-card";

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

const ReplyNotification = forwardRef<HTMLDivElement, { event: NostrEvent; onClick?: () => void }>(
  ({ event, onClick }, ref) => {
    const refs = getThreadReferences(event);

    const pointer = useMemo<DecodeResult | undefined>(() => {
      if (refs.reply?.a) return { type: "naddr", data: refs.reply.a };
      if (refs.reply?.e) return { type: "nevent", data: refs.reply.e };
    }, [refs.reply?.e, refs.reply?.a]);

    return (
      <NotificationIconEntry
        ref={ref}
        icon={<ReplyIcon boxSize={8} color="green.400" />}
        id={event.id}
        pubkey={event.pubkey}
        timestamp={event.created_at}
        summary={event.content}
        onClick={onClick}
      >
        {pointer && <EmbedEventPointer pointer={pointer} />}
        <TimelineNote event={event} showReplyLine={false} showReplyButton />
      </NotificationIconEntry>
    );
  },
);

const MentionNotification = forwardRef<HTMLDivElement, { event: NostrEvent; onClick?: () => void }>(
  ({ event, onClick }, ref) => {
    let content: ReactNode;
    switch (event.kind) {
      case kinds.LongFormArticle:
        content = <ArticleCard article={event} />;
        break;
      case kinds.ShortTextNote:
        content = <TimelineNote event={event} showReplyButton />;
        break;
      default:
        content = <EmbedEvent event={event} />;
        break;
    }

    return (
      <NotificationIconEntry
        ref={ref}
        icon={<AtIcon boxSize={8} color="purple.400" />}
        id={event.id}
        pubkey={event.pubkey}
        timestamp={event.created_at}
        summary={event.content}
        onClick={onClick}
      >
        {content}
      </NotificationIconEntry>
    );
  },
);

const RepostNotification = forwardRef<HTMLDivElement, { event: NostrEvent; onClick?: () => void }>(
  ({ event, onClick }, ref) => {
    const pointer = nip18.getRepostedEventPointer(event);
    if (!pointer) return null;

    return (
      <NotificationIconEntry
        ref={ref}
        icon={<RepostIcon boxSize={8} color="blue.400" />}
        id={event.id}
        pubkey={event.pubkey}
        timestamp={event.created_at}
        summary={<>Reposted {truncateId(pointer.id)}</>}
        onClick={onClick}
      >
        <Text>
          <UserAvatar size="xs" pubkey={event.pubkey} /> <UserName pubkey={event.pubkey} /> reposted:
        </Text>
        <EmbedEventPointer pointer={{ type: "nevent", data: pointer }} />
      </NotificationIconEntry>
    );
  },
);

const ReactionNotification = forwardRef<HTMLDivElement, { event: NostrEvent; onClick?: () => void }>(
  ({ event, onClick }, ref) => {
    const account = useCurrentAccount();
    const pointer = nip25.getReactedEventPointer(event);
    if (!pointer || (account?.pubkey && pointer.author !== account.pubkey)) return null;

    const reactedEvent = useSingleEvent(pointer.id, pointer.relays);
    if (reactedEvent?.kind === kinds.EncryptedDirectMessage) return null;

    return (
      <NotificationIconEntry
        ref={ref}
        icon={<Heart boxSize={8} color="red.400" />}
        id={event.id}
        pubkey={event.pubkey}
        timestamp={event.created_at}
        summary={
          <>
            <ReactionIcon emoji={event.content} />
            {reactedEvent?.content}
          </>
        }
        onClick={onClick}
      >
        <Flex gap="2" alignItems="center" pl="2">
          <AvatarGroup size="sm">
            <UserAvatarLink pubkey={event.pubkey} />
          </AvatarGroup>
          <Text>
            reacted with <ReactionIcon emoji={event.content} />
          </Text>
        </Flex>
        <EmbedEventPointer pointer={{ type: "nevent", data: pointer }} />
      </NotificationIconEntry>
    );
  },
);

const ZapNotification = forwardRef<HTMLDivElement, { event: NostrEvent; onClick?: () => void }>(
  ({ event, onClick }, ref) => {
    const zap = useMemo(() => getParsedZap(event), [event]);

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
      <NotificationIconEntry
        ref={ref}
        icon={<LightningIcon boxSize={8} color="yellow.400" />}
        id={event.id}
        pubkey={zap.request.pubkey}
        timestamp={zap.request.created_at}
        summary={
          <>
            {readablizeSats(zap.payment.amount / 1000)} {zap.request.content}
          </>
        }
        onClick={onClick}
      >
        <Flex gap="2" alignItems="center" pl="2">
          <AvatarGroup size="sm">
            <UserAvatarLink pubkey={zap.request.pubkey} />
          </AvatarGroup>
          <Text>zapped {readablizeSats(zap.payment.amount / 1000)} sats</Text>
          <ButtonGroup size="sm" variant="ghost" ml="auto">
            <ZapReceiptMenu zap={zap.event} aria-label="More Options" />
          </ButtonGroup>
        </Flex>
        <TextNoteContents event={zap.request} />
        {eventJSX}
      </NotificationIconEntry>
    );
  },
);

const NotificationItem = ({ event, onClick }: { event: CategorizedEvent; onClick?: (event: NostrEvent) => void }) => {
  const ref = useEventIntersectionRef(event);

  const handleClick = useCallback(() => {
    if (onClick) onClick(event);
  }, [onClick, event]);

  let content: ReactNode | null = null;
  switch (event[typeSymbol]) {
    case NotificationType.Reply:
      content = <ReplyNotification event={event} onClick={onClick && handleClick} ref={ref} />;
      break;
    case NotificationType.Mention:
      content = <MentionNotification event={event} onClick={onClick && handleClick} ref={ref} />;
      break;
    case NotificationType.Reaction:
      content = <ReactionNotification event={event} onClick={onClick && handleClick} ref={ref} />;
      break;
    case NotificationType.Repost:
      content = <RepostNotification event={event} onClick={onClick && handleClick} ref={ref} />;
      break;
    case NotificationType.Zap:
      content = <ZapNotification event={event} onClick={onClick && handleClick} ref={ref} />;
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
