import {
  Box,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  CardProps,
  Flex,
  IconButton,
  Link,
  LinkBox,
  useDisclosure,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { memo } from "react";
import { Link as RouterLink } from "react-router-dom";

import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import { ExpandProvider } from "../../providers/local/expanded";
import { ContentSettingsProvider } from "../../providers/local/content-settings";
import { getSharableEventAddress } from "../../services/relay-hints";
import GenericCommentForm from "../comment/generic-comment-form";
import HoverLinkOverlay from "../hover-link-overlay";
import { ReplyIcon } from "../icons";
import POWIcon from "../pow/pow-icon";
import Timestamp from "../timestamp";
import UserAvatarLink from "../user/user-avatar-link";
import UserLink from "../user/user-link";
import BookmarkEventButton from "../note/bookmark-button";
import EventQuoteButton from "../note/event-quote-button";
import PollMenu from "../poll/poll-menu";
import NotePublishedUsing from "../note/note-published-using";
import EventShareButton from "./note/components/event-share-button";
import NoteProxyLink from "./note/components/note-proxy-link";
import ReplyContext from "./note/components/reply-context";
import PollContent from "../poll/poll-content";

export type TimelinePollProps = Omit<CardProps, "children"> & {
  event: NostrEvent;
  variant?: CardProps["variant"];
  showReplyButton?: boolean;
  showReplyLine?: boolean;
  registerIntersectionEntity?: boolean;
  clickable?: boolean;
};

export function TimelinePoll({
  event,
  variant = "unstyled",
  showReplyButton,
  showReplyLine = true,
  registerIntersectionEntity = true,
  clickable = true,
  ...props
}: TimelinePollProps) {
  const replyForm = useDisclosure();
  const ref = useEventIntersectionRef(event);

  return (
    <ContentSettingsProvider event={event}>
      <ExpandProvider>
        <Flex
          direction="column"
          borderWidth="0 2px 0 2px"
          rounded="none"
          borderColor="var(--chakra-colors-chakra-border-color)"
          {...props}
        >
          <Card
            as={LinkBox}
            variant={variant}
            ref={registerIntersectionEntity ? ref : undefined}
            data-event-id={event.id}
          >
            {clickable && <HoverLinkOverlay as={RouterLink} to={`/poll/${getSharableEventAddress(event)}`} />}
            <CardHeader p="2">
              <Flex flex="1" gap="2" alignItems="center">
                <UserAvatarLink pubkey={event.pubkey} size="sm" />
                <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
                <Link
                  as={RouterLink}
                  whiteSpace="nowrap"
                  color="current"
                  to={`/poll/${getSharableEventAddress(event)}`}
                >
                  <Timestamp timestamp={event.created_at} />
                </Link>
                <POWIcon event={event} boxSize={5} />
                <NotePublishedUsing event={event} />
                <Flex grow={1} />
              </Flex>
              {showReplyLine && <ReplyContext event={event} />}
            </CardHeader>
            <CardBody px="2">
              <PollContent event={event} position="relative" zIndex={1} />
            </CardBody>
          </Card>
          <Flex gap="2" w="full" alignItems="center" pt="2" px="2">
            <ButtonGroup size="sm" variant="ghost" zIndex={1}>
              {showReplyButton && (
                <IconButton icon={<ReplyIcon />} aria-label="Reply" title="Reply" onClick={replyForm.onOpen} />
              )}
              <EventShareButton event={event} />
              <EventQuoteButton event={event} />
            </ButtonGroup>
            <Box flexGrow={1} />
            <ButtonGroup size="sm" variant="ghost" zIndex={1}>
              <NoteProxyLink event={event} />
              <BookmarkEventButton event={event} aria-label="Bookmark poll" />
              <PollMenu event={event} aria-label="More Options" />
            </ButtonGroup>
          </Flex>
        </Flex>
      </ExpandProvider>
      {replyForm.isOpen && (
        <GenericCommentForm event={event} onCancel={replyForm.onClose} onSubmitted={replyForm.onClose} />
      )}
    </ContentSettingsProvider>
  );
}

export default memo(TimelinePoll);
