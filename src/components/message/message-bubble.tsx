import { ReactNode } from "react";
import { ButtonGroup, Card, CardBody, CardFooter, CardHeader, CardProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import Timestamp from "../timestamp";
import UserLink from "../user/user-link";
import UserDnsIdentity from "../user/user-dns-identity";
import useEventReactions from "../../hooks/use-event-reactions";
import EventReactionButtons from "../event-reactions/event-reactions";
import { IconThreadButton } from "./thread-button";
import AddReactionButton from "../note/timeline-note/components/add-reaction-button";
import NoteZapButton from "../note/note-zap-button";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";

export type MessageBubbleProps = {
  message: NostrEvent;
  showHeader?: boolean;
  showThreadButton?: boolean;
  renderContent: (message: NostrEvent, inlineButtons: ReactNode | null) => ReactNode;
} & Omit<CardProps, "children">;

export default function MessageBubble({
  message,
  showHeader = true,
  showThreadButton = true,
  renderContent,
  ...props
}: MessageBubbleProps) {
  const reactions = useEventReactions(message) ?? [];
  const hasReactions = reactions.length > 0;

  let actionPosition = showHeader ? "header" : "inline";
  if (hasReactions && actionPosition === "inline") actionPosition = "footer";

  const ref = useEventIntersectionRef(message);

  const actions = (
    <>
      <NoteZapButton event={message} />
      <AddReactionButton event={message} />
      {showThreadButton && <IconThreadButton event={message} aria-label="Open Thread" />}
    </>
  );

  return (
    <Card {...props} borderRadius="lg" ref={ref}>
      {showHeader && (
        <CardHeader px="2" pt="2" pb="0" gap="2" display="flex" alignItems="center">
          <UserLink pubkey={message.pubkey} fontWeight="bold" />
          <UserDnsIdentity pubkey={message.pubkey} onlyIcon />
          {actionPosition === "header" && (
            <ButtonGroup size="xs" variant="ghost" ml="auto">
              {actions}
            </ButtonGroup>
          )}
        </CardHeader>
      )}
      <CardBody px="2" py="2">
        {renderContent(
          message,
          !hasReactions ? (
            <ButtonGroup size="xs" variant="ghost" float="right" ml="2">
              {actionPosition === "inline" && actions}
              <Timestamp timestamp={message.created_at} ml="2" userSelect="none" />
            </ButtonGroup>
          ) : null,
        )}
      </CardBody>
      {hasReactions && (
        <CardFooter alignItems="center" display="flex" gap="2" px="2" pt="0" pb="2">
          <ButtonGroup size="xs" variant="ghost">
            {actionPosition === "footer" ? actions : <AddReactionButton event={message} />}
            <EventReactionButtons event={message} />
          </ButtonGroup>
          <Timestamp ml="auto" timestamp={message.created_at} />
        </CardFooter>
      )}
    </Card>
  );
}
