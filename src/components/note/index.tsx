import { useRef, memo } from "react";
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
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { NostrEvent } from "../../types/nostr-event";
import UserAvatarLink from "../user-avatar-link";
import { Link as RouterLink } from "react-router-dom";

import NoteMenu from "./note-menu";
import UserLink from "../user-link";
import { UserDnsIdentityIcon } from "../user-dns-identity-icon";
import NoteZapButton from "./note-zap-button";
import { ExpandProvider } from "../../providers/local/expanded";
import useSubject from "../../hooks/use-subject";
import appSettings from "../../services/settings/app-settings";
import EventVerificationIcon from "../event-verification-icon";
import RepostButton from "./components/repost-button";
import QuoteRepostButton from "./components/quote-repost-button";
import { ReplyIcon } from "../icons";
import NoteContentWithWarning from "./note-content-with-warning";
import { TrustProvider } from "../../providers/local/trust";
import { useRegisterIntersectionEntity } from "../../providers/local/intersection-observer";
import BookmarkButton from "./components/bookmark-button";
import useCurrentAccount from "../../hooks/use-current-account";
import NoteReactions from "./components/note-reactions";
import ReplyForm from "../../views/thread/components/reply-form";
import { getThreadReferences, truncatedId } from "../../helpers/nostr/events";
import Timestamp from "../timestamp";
import OpenInDrawerButton from "../open-in-drawer-button";
import { getSharableEventAddress } from "../../helpers/nip19";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import HoverLinkOverlay from "../hover-link-overlay";
import NoteCommunityMetadata from "./note-community-metadata";
import useSingleEvent from "../../hooks/use-single-event";
import { CompactNoteContent } from "../compact-note-content";
import NoteProxyLink from "./components/note-proxy-link";
import { NoteDetailsButton } from "./components/note-details-button";
import EventInteractionDetailsModal from "../event-interactions-modal";
import singleEventService from "../../services/single-event";
import { AddressPointer, EventPointer } from "nostr-tools/lib/types/nip19";
import { nip19 } from "nostr-tools";
import POWIcon from "../pow-icon";

function ReplyToE({ pointer }: { pointer: EventPointer }) {
  const event = useSingleEvent(pointer.id, pointer.relays);

  if (!event) {
    const nevent = nip19.neventEncode(pointer);
    return (
      <Text>
        Replying to{" "}
        <Link as={RouterLink} to={`/l/${nevent}`} color="blue.500">
          {truncatedId(nevent)}
        </Link>
      </Text>
    );
  }

  return (
    <>
      <Text>
        Replying to <UserLink pubkey={event.pubkey} fontWeight="bold" />
      </Text>
      <CompactNoteContent event={event} maxLength={96} isTruncated textOnly />
    </>
  );
}
function ReplyToA({ pointer }: { pointer: AddressPointer }) {
  const naddr = nip19.naddrEncode(pointer);

  return (
    <Text>
      Replying to{" "}
      <Link as={RouterLink} to={`/l/${naddr}`} color="blue.500">
        {truncatedId(naddr)}
      </Link>
    </Text>
  );
}

function ReplyLine({ event }: { event: NostrEvent }) {
  const refs = getThreadReferences(event);
  if (!refs.reply) return null;

  return (
    <Flex gap="2" fontStyle="italic" alignItems="center" whiteSpace="nowrap">
      <ReplyIcon />
      {refs.reply.e ? <ReplyToE pointer={refs.reply.e} /> : <ReplyToA pointer={refs.reply.a} />}
    </Flex>
  );
}

export type NoteProps = Omit<CardProps, "children"> & {
  event: NostrEvent;
  variant?: CardProps["variant"];
  showReplyButton?: boolean;
  showReplyLine?: boolean;
  hideDrawerButton?: boolean;
  registerIntersectionEntity?: boolean;
  clickable?: boolean;
};
export function Note({
  event,
  variant = "outline",
  showReplyButton,
  showReplyLine = true,
  hideDrawerButton,
  registerIntersectionEntity = true,
  clickable = true,
  ...props
}: NoteProps) {
  const account = useCurrentAccount();
  const { showReactions, showSignatureVerification } = useSubject(appSettings);
  const replyForm = useDisclosure();
  const detailsModal = useDisclosure();

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

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
              to={`/n/${getSharableEventAddress(event)}`}
              onClick={() => singleEventService.handleEvent(event)}
            />
          )}
          <CardHeader p="2">
            <Flex flex="1" gap="2" alignItems="center">
              <UserAvatarLink pubkey={event.pubkey} size={["xs", "sm"]} />
              <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
              <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
              <POWIcon event={event} boxSize={5} />
              <Flex grow={1} />
              {showSignatureVerification && <EventVerificationIcon event={event} />}
              {!hideDrawerButton && (
                <OpenInDrawerButton
                  to={`/n/${getSharableEventAddress(event)}`}
                  size="sm"
                  variant="ghost"
                  onClick={() => singleEventService.handleEvent(event)}
                />
              )}
              <Link as={RouterLink} whiteSpace="nowrap" color="current" to={`/n/${getSharableEventAddress(event)}`}>
                <Timestamp timestamp={event.created_at} />
              </Link>
            </Flex>
            <NoteCommunityMetadata event={event} />
            {showReplyLine && <ReplyLine event={event} />}
          </CardHeader>
          <CardBody p="0">
            <NoteContentWithWarning event={event} />
          </CardBody>
          <CardFooter padding="2" display="flex" gap="2" flexDirection="column" alignItems="flex-start">
            {showReactionsOnNewLine && reactionButtons}
            <Flex gap="2" w="full" alignItems="center">
              <ButtonGroup size="sm" variant="ghost" isDisabled={account?.readonly ?? true}>
                {showReplyButton && (
                  <IconButton icon={<ReplyIcon />} aria-label="Reply" title="Reply" onClick={replyForm.onOpen} />
                )}
                <RepostButton event={event} />
                <QuoteRepostButton event={event} />
                <NoteZapButton event={event} />
              </ButtonGroup>
              {!showReactionsOnNewLine && reactionButtons}
              <Box flexGrow={1} />
              <ButtonGroup size="sm" variant="ghost">
                <NoteProxyLink event={event} />
                <NoteDetailsButton event={event} onClick={detailsModal.onOpen} />
                <BookmarkButton event={event} aria-label="Bookmark note" />
                <NoteMenu event={event} aria-label="More Options" detailsClick={detailsModal.onOpen} />
              </ButtonGroup>
            </Flex>
          </CardFooter>
        </Card>
      </ExpandProvider>
      {replyForm.isOpen && (
        <ReplyForm
          item={{ event, replies: [], refs: getThreadReferences(event) }}
          onCancel={replyForm.onClose}
          onSubmitted={replyForm.onClose}
        />
      )}
      {detailsModal.isOpen && <EventInteractionDetailsModal isOpen onClose={detailsModal.onClose} event={event} />}
    </TrustProvider>
  );
}

export default memo(Note);
