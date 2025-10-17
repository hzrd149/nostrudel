import {
  Box,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Flex,
  Highlight,
  HighlightProps,
  IconButton,
  LinkBox,
  Text,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { memo } from "react";
import { Link as RouterLink } from "react-router-dom";

import {
  getHighlightContext,
  getHighlightSourceAddressPointer,
  getHighlightSourceEventPointer,
  getHighlightSourceUrl,
  getHighlightText,
  hasHighlightSource,
} from "applesauce-core/helpers/highlight";

import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useEventZaps from "../../hooks/use-event-zaps";
import { getSharableEventAddress } from "../../services/relay-hints";
import { EmbedEventPointerLink } from "../embed-event/link";
import HoverLinkOverlay from "../hover-link-overlay";
import { ReplyIcon } from "../icons";
import EventQuoteButton from "../note/event-quote-button";
import NotePublishedUsing from "../note/note-published-using";
import OpenGraphLink from "../open-graph/open-graph-link";
import POWIcon from "../pow/pow-icon";
import Timestamp from "../timestamp";
import UserAvatarLink from "../user/user-avatar-link";
import UserLink from "../user/user-link";
import EventZapButton from "../zap/event-zap-button";
import EventShareButton from "./note/components/event-share-button";
import NoteReactions from "./note/components/note-reactions";
import ZapBubbles from "./note/components/zap-bubbles";

export type TimelineHighlightProps = Omit<CardProps, "children"> & {
  event: NostrEvent;
  variant?: CardProps["variant"];
  showReplyButton?: boolean;
  showReplyLine?: boolean;
  hideDrawerButton?: boolean;
  registerIntersectionEntity?: boolean;
  clickable?: boolean;
};

const HIGHLIGHT_STYLES: HighlightProps["styles"] = {
  px: "2",
  bg: "#815ad580",
  borderRadius: "md",
  color: "var(--chakra-colors-chakra-body-text)",
  fontStyle: "italic",
};

export function HighlightContent({ highlight }: { highlight: NostrEvent }) {
  const text = getHighlightText(highlight);
  const context = getHighlightContext(highlight);

  return (
    <Box position="relative" overflow="hidden">
      <Box position="absolute" left="0" top="0" bottom="0" width="4px" bg="purple.500" borderRadius="2px" />
      <Box pl="3" color="GrayText">
        {context ? (
          <Highlight query={text} styles={HIGHLIGHT_STYLES}>
            {context}
          </Highlight>
        ) : (
          <Highlight query={text} styles={HIGHLIGHT_STYLES}>
            {text}
          </Highlight>
        )}
      </Box>
    </Box>
  );
}

export function HighlightSource({ highlight }: { highlight: NostrEvent }) {
  const eventPointer = getHighlightSourceEventPointer(highlight);
  const addressPointer = getHighlightSourceAddressPointer(highlight);
  const url = getHighlightSourceUrl(highlight);

  return url && URL.canParse(url) ? (
    <OpenGraphLink url={new URL(url)} />
  ) : eventPointer ? (
    <EmbedEventPointerLink pointer={{ type: "nevent", data: eventPointer }} color="blue.500" />
  ) : addressPointer ? (
    <EmbedEventPointerLink pointer={{ type: "naddr", data: addressPointer }} color="blue.500" />
  ) : null;
}

export function TimelineHighlight({
  event,
  variant = "unstyled",
  showReplyButton,
  hideDrawerButton,
  registerIntersectionEntity = true,
  clickable = true,
  ...props
}: TimelineHighlightProps) {
  const zaps = useEventZaps(event);
  const ref = useEventIntersectionRef(event);

  // Extract highlight data using applesauce helpers
  const highlightText = getHighlightText(event);
  const context = getHighlightContext(event);
  const hasSource = hasHighlightSource(event);

  return (
    <Flex
      direction="column"
      borderWidth="0 2px 0 2px"
      rounded="none"
      borderColor="var(--chakra-colors-chakra-border-color)"
      {...props}
    >
      <Card as={LinkBox} variant={variant} ref={registerIntersectionEntity ? ref : undefined} data-event-id={event.id}>
        {clickable && <HoverLinkOverlay as={RouterLink} to={`/n/${getSharableEventAddress(event)}`} />}
        <CardHeader p="2">
          <Flex flex="1" gap="2" alignItems="center">
            <UserAvatarLink pubkey={event.pubkey} size="sm" />
            <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
            <Timestamp timestamp={event.created_at} />
            <POWIcon event={event} boxSize={5} />
            <NotePublishedUsing event={event} />
            <Flex grow={1} />
          </Flex>
        </CardHeader>
        <CardBody px="2" overflow="hidden">
          {/* Highlight Content */}
          <HighlightContent highlight={event} />

          {/* Source Attribution */}
          {hasSource && (
            <Flex alignItems="center" gap="2" mt="2">
              <Text>From:</Text>
              <HighlightSource highlight={event} />
            </Flex>
          )}
        </CardBody>

        {zaps.length > 0 && (
          <CardFooter p="2" display="flex" gap="2" flexDirection="column" alignItems="flex-start">
            <ZapBubbles event={event} w="full" />
          </CardFooter>
        )}
      </Card>
      <Flex gap="2" w="full" alignItems="center" pt="2" px="2">
        <ButtonGroup size="sm" variant="ghost" zIndex={1}>
          {showReplyButton && <IconButton icon={<ReplyIcon />} aria-label="Reply" title="Reply" />}
          <EventShareButton event={event} />
          <EventQuoteButton event={event} />
          <EventZapButton event={event} />
        </ButtonGroup>
        <NoteReactions event={event} variant="ghost" size="sm" zIndex={1} overflow="hidden" />
      </Flex>
    </Flex>
  );
}

export default memo(TimelineHighlight);
