import { memo } from "react";
import {
  Box,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Flex,
  IconButton,
  Link,
  LinkBox,
  useDisclosure,
} from "@chakra-ui/react";
import { NostrEvent } from "../../../types/nostr-event";
import UserAvatarLink from "../../user/user-avatar-link";
import { Link as RouterLink } from "react-router-dom";

import NoteMenu from "../note-menu";
import UserLink from "../../user/user-link";
import NoteZapButton from "../note-zap-button";
import { ExpandProvider } from "../../../providers/local/expanded";
import useSubject from "../../../hooks/use-subject";
import appSettings from "../../../services/settings/app-settings";
import EventVerificationIcon from "../../common-event/event-verification-icon";
import RepostButton from "./components/repost-button";
import QuoteEventButton from "../quote-event-button";
import { ReplyIcon } from "../../icons";
import NoteContentWithWarning from "./note-content-with-warning";
import { TrustProvider } from "../../../providers/local/trust-provider";
import BookmarkEventButton from "../bookmark-event";
import useCurrentAccount from "../../../hooks/use-current-account";
import NoteReactions from "./components/note-reactions";
import ReplyForm from "../../../views/thread/components/reply-form";
import { getThreadReferences } from "../../../helpers/nostr/event";
import Timestamp from "../../timestamp";
import OpenInDrawerButton from "../open-in-drawer-button";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import HoverLinkOverlay from "../../hover-link-overlay";
import NoteCommunityMetadata from "./note-community-metadata";
import NoteProxyLink from "./components/note-proxy-link";
import singleEventService from "../../../services/single-event";
import POWIcon from "../../pow/pow-icon";
import ReplyContext from "./components/reply-context";
import ZapBubbles from "./components/zap-bubbles";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import relayHintService from "../../../services/event-relay-hint";
import localSettings from "../../../services/local-settings";
import NotePublishedUsing from "../note-published-using";

export type TimelineNoteProps = Omit<CardProps, "children"> & {
  event: NostrEvent;
  variant?: CardProps["variant"];
  showReplyButton?: boolean;
  showReplyLine?: boolean;
  hideDrawerButton?: boolean;
  registerIntersectionEntity?: boolean;
  clickable?: boolean;
};
export function TimelineNote({
  event,
  variant = "outline",
  showReplyButton,
  showReplyLine = true,
  hideDrawerButton,
  registerIntersectionEntity = true,
  clickable = true,
  ...props
}: TimelineNoteProps) {
  const account = useCurrentAccount();
  const { showReactions, showSignatureVerification } = useSubject(appSettings);
  const hideZapBubbles = useSubject(localSettings.hideZapBubbles);
  const replyForm = useDisclosure();

  const ref = useEventIntersectionRef(event);

  const showReactionsOnNewLine = useBreakpointValue({ base: true, lg: false });

  const reactionButtons = showReactions && <NoteReactions event={event} flexWrap="wrap" variant="ghost" size="sm" />;

  return (
    <TrustProvider event={event}>
      <ExpandProvider>
        <Card
          as={LinkBox}
          variant={variant}
          ref={registerIntersectionEntity ? ref : undefined}
          data-event-id={event.id}
          {...props}
        >
          {clickable && (
            <HoverLinkOverlay
              as={RouterLink}
              to={`/n/${relayHintService.getSharableEventAddress(event)}`}
              onClick={() => singleEventService.handleEvent(event)}
            />
          )}
          <CardHeader p="2">
            <Flex flex="1" gap="2" alignItems="center">
              <UserAvatarLink pubkey={event.pubkey} size="sm" />
              <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
              <Link
                as={RouterLink}
                whiteSpace="nowrap"
                color="current"
                to={`/n/${relayHintService.getSharableEventAddress(event)}`}
              >
                <Timestamp timestamp={event.created_at} />
              </Link>
              <POWIcon event={event} boxSize={5} />
              <NotePublishedUsing event={event} />
              <Flex grow={1} />
              {showSignatureVerification && <EventVerificationIcon event={event} />}
              {!hideDrawerButton && (
                <OpenInDrawerButton
                  to={`/n/${relayHintService.getSharableEventAddress(event)}`}
                  size="sm"
                  variant="ghost"
                  onClick={() => singleEventService.handleEvent(event)}
                />
              )}
            </Flex>
            <NoteCommunityMetadata event={event} />
            {showReplyLine && <ReplyContext event={event} />}
          </CardHeader>
          <CardBody p="0">
            <NoteContentWithWarning event={event} />
          </CardBody>
          <CardFooter padding="2" display="flex" gap="2" flexDirection="column" alignItems="flex-start">
            {!hideZapBubbles && <ZapBubbles event={event} w="full" />}
            {showReactionsOnNewLine && reactionButtons}
            <Flex gap="2" w="full" alignItems="center">
              <ButtonGroup size="sm" variant="ghost" isDisabled={account?.readonly ?? true}>
                {showReplyButton && (
                  <IconButton icon={<ReplyIcon />} aria-label="Reply" title="Reply" onClick={replyForm.onOpen} />
                )}
                <RepostButton event={event} />
                <QuoteEventButton event={event} />
                <NoteZapButton event={event} />
              </ButtonGroup>
              {!showReactionsOnNewLine && reactionButtons}
              <Box flexGrow={1} />
              <ButtonGroup size="sm" variant="ghost">
                <NoteProxyLink event={event} />
                <BookmarkEventButton event={event} aria-label="Bookmark note" />
                <NoteMenu event={event} aria-label="More Options" />
              </ButtonGroup>
            </Flex>
          </CardFooter>
        </Card>
      </ExpandProvider>
      {replyForm.isOpen && (
        <ReplyForm
          item={{ event, replies: new Set(), refs: getThreadReferences(event) }}
          onCancel={replyForm.onClose}
          onSubmitted={replyForm.onClose}
        />
      )}
    </TrustProvider>
  );
}

export default memo(TimelineNote);
