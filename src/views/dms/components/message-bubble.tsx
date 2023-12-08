import { useRef } from "react";
import {
  Box,
  BoxProps,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  IconButton,
  IconButtonProps,
} from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import DecryptPlaceholder from "./decrypt-placeholder";
import { EmbedableContent, embedUrls } from "../../../helpers/embeds";
import {
  embedCashuTokens,
  embedNostrLinks,
  renderGenericUrl,
  renderImageUrl,
  renderVideoUrl,
} from "../../../components/embed-types";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { getEventUID } from "../../../helpers/nostr/events";
import Timestamp from "../../../components/timestamp";
import NoteZapButton from "../../../components/note/note-zap-button";
import UserLink from "../../../components/user-link";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import useEventReactions from "../../../hooks/use-event-reactions";
import AddReactionButton from "../../../components/note/components/add-reaction-button";
import { TrustProvider } from "../../../providers/trust";
import { useLocation, useNavigate } from "react-router-dom";
import { ThreadIcon } from "../../../components/icons";
import EventReactionButtons from "../../../components/event-reactions/event-reactions";
import { LightboxProvider } from "../../../components/lightbox-provider";

export function IconThreadButton({
  event,
  ...props
}: { event: NostrEvent } & Omit<IconButtonProps, "aria-label" | "icon">) {
  const navigate = useNavigate();
  const location = useLocation();

  const onClick = () => {
    navigate(`.`, { state: { ...location.state, thread: event.id } });
  };

  return (
    <IconButton
      icon={<ThreadIcon />}
      onClick={onClick}
      aria-label="Reply in thread"
      title="Reply in thread"
      {...props}
    />
  );
}

export function MessageContent({ event, text, children, ...props }: { event: NostrEvent; text: string } & BoxProps) {
  let content: EmbedableContent = [text];

  content = embedNostrLinks(content);
  content = embedUrls(content, [renderImageUrl, renderVideoUrl, renderGenericUrl]);

  // cashu
  content = embedCashuTokens(content);

  return (
    <TrustProvider event={event}>
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" {...props}>
          {content}
          {children}
        </Box>
      </LightboxProvider>
    </TrustProvider>
  );
}

export type MessageBubbleProps = { message: NostrEvent; showHeader?: boolean; showThreadButton?: boolean } & Omit<
  CardProps,
  "children"
>;

export default function MessageBubble({
  message,
  showHeader = true,
  showThreadButton = true,
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
      {showThreadButton && <IconThreadButton event={message} />}
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
        <DecryptPlaceholder message={message} variant="link" py="4" px="6rem">
          {(plaintext) => (
            <MessageContent event={message} text={plaintext} display="inline">
              {!hasReactions && (
                <ButtonGroup size="xs" variant="ghost" float="right">
                  {actionPosition === "inline" && actions}
                  <Timestamp timestamp={message.created_at} ml="2" />
                </ButtonGroup>
              )}
            </MessageContent>
          )}
        </DecryptPlaceholder>
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
