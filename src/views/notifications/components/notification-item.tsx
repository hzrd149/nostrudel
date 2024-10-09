import { ReactNode, memo, useCallback } from "react";
import { Flex, FlexProps, IconButton, IconButtonProps } from "@chakra-ui/react";

import EmbeddedUnknown from "../../../components/embed-event/event-types/embedded-unknown";
import { ErrorBoundary } from "../../../components/error-boundary";
import { TrustProvider } from "../../../providers/local/trust-provider";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import { CategorizedEvent, NotificationType, NotificationTypeSymbol } from "../../../classes/notifications";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { NostrEvent } from "nostr-tools";
import ReplyNotification from "./reply-notification";
import MentionNotification from "./mention-notification";
import ReactionNotification from "./reaction-notification";
import RepostNotification from "./repost-notification";
import ZapNotification from "./zap-notificaiton";
import UnknownNotification from "./unknown-notification";
import MessageNotification from "./message-notification";
import QuoteNotification from "./quote-notification";

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

const NotificationItem = ({
  event,
  visible,
  onClick,
  ...props
}: Omit<FlexProps, "children" | "onClick"> & {
  event: CategorizedEvent;
  onClick?: (event: NostrEvent) => void;
  visible: boolean;
}) => {
  const ref = useEventIntersectionRef(event);

  const handleClick = useCallback(() => {
    if (onClick) onClick(event);
  }, [onClick, event]);

  let content: ReactNode | null = null;
  if (visible) {
    switch (event[NotificationTypeSymbol]) {
      case NotificationType.Reply:
        content = <ReplyNotification event={event} onClick={onClick && handleClick} />;
        break;
      case NotificationType.Mention:
        content = <MentionNotification event={event} onClick={onClick && handleClick} />;
        break;
      case NotificationType.Quote:
        content = <QuoteNotification event={event} onClick={onClick && handleClick} />;
        break;
      case NotificationType.Reaction:
        content = <ReactionNotification event={event} onClick={onClick && handleClick} />;
        break;
      case NotificationType.Repost:
        content = <RepostNotification event={event} onClick={onClick && handleClick} />;
        break;
      case NotificationType.Zap:
        content = <ZapNotification event={event} onClick={onClick && handleClick} />;
        break;
      case NotificationType.Message:
        content = <MessageNotification event={event} onClick={onClick && handleClick} />;
        break;
      default:
        content = <UnknownNotification event={event} onClick={onClick && handleClick} />;
        break;
    }
  }

  return (
    <Flex ref={ref} overflow="hidden" flexShrink={0} {...props}>
      {content && (
        <ErrorBoundary>
          <TrustProvider event={event}>{content}</TrustProvider>
        </ErrorBoundary>
      )}
    </Flex>
  );
};

export default memo(NotificationItem);
