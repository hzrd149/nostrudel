import { ReactNode, useRef } from "react";
import { ButtonGroup, Card, CardBody, CardFooter, CardHeader, CardProps } from "@chakra-ui/react";

import { NostrEvent } from "../types/nostr-event";
import { useRegisterIntersectionEntity } from "../providers/intersection-observer";
import { getEventUID } from "../helpers/nostr/events";
import Timestamp from "./timestamp";
import NoteZapButton from "./note/note-zap-button";
import UserLink from "./user-link";
import { UserDnsIdentityIcon } from "./user-dns-identity-icon";
import useEventReactions from "../hooks/use-event-reactions";
import AddReactionButton from "./note/components/add-reaction-button";
import EventReactionButtons from "./event-reactions/event-reactions";
import { IconThreadButton } from "../views/dms/components/thread-button";

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
  const reactions = useEventReactions(message.id) ?? [];
  const hasReactions = reactions.length > 0;

  let actionPosition = showHeader ? "header" : "inline";
  if (hasReactions && actionPosition === "inline") actionPosition = "footer";

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(message));

  const actions = (
    <>
      <NoteZapButton event={message} />
      <AddReactionButton event={message} portal />
      {showThreadButton && <IconThreadButton event={message} label="Open Thread" />}
    </>
  );

  return (
    <Card {...props} borderRadius="lg" ref={ref}>
      {showHeader && (
        <CardHeader px="2" pt="2" pb="0" gap="2" display="flex" alignItems="center">
          <UserLink pubkey={message.pubkey} fontWeight="bold" />
          <UserDnsIdentityIcon pubkey={message.pubkey} onlyIcon />
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
            {actionPosition === "footer" ? actions : <AddReactionButton event={message} portal />}
            <EventReactionButtons event={message} />
          </ButtonGroup>
          <Timestamp ml="auto" timestamp={message.created_at} />
        </CardFooter>
      )}
    </Card>
  );
}
