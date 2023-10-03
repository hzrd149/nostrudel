import React, { useMemo, useRef } from "react";
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
  Text,
  useBreakpointValue,
  useDisclosure,
} from "@chakra-ui/react";
import { NostrEvent, isATag } from "../../types/nostr-event";
import { UserAvatarLink } from "../user-avatar-link";
import { Link as RouterLink } from "react-router-dom";

import { NoteMenu } from "./note-menu";
import { EventRelays } from "./note-relays";
import { UserLink } from "../user-link";
import { UserDnsIdentityIcon } from "../user-dns-identity-icon";
import NoteZapButton from "./note-zap-button";
import { ExpandProvider } from "../../providers/expanded";
import useSubject from "../../hooks/use-subject";
import appSettings from "../../services/settings/app-settings";
import EventVerificationIcon from "../event-verification-icon";
import { RepostButton } from "./components/repost-button";
import { QuoteRepostButton } from "./components/quote-repost-button";
import { ExternalLinkIcon, ReplyIcon } from "../icons";
import NoteContentWithWarning from "./note-content-with-warning";
import { TrustProvider } from "../../providers/trust";
import { NoteLink } from "../note-link";
import { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import BookmarkButton from "./components/bookmark-button";
import { useCurrentAccount } from "../../hooks/use-current-account";
import NoteReactions from "./components/note-reactions";
import ReplyForm from "../../views/note/components/reply-form";
import { getReferences, parseCoordinate } from "../../helpers/nostr/events";
import Timestamp from "../timestamp";
import OpenInDrawerButton from "../open-in-drawer-button";
import { getSharableEventAddress } from "../../helpers/nip19";
import { COMMUNITY_DEFINITION_KIND, getCommunityName } from "../../helpers/nostr/communities";
import useReplaceableEvent from "../../hooks/use-replaceable-event";

export type NoteProps = Omit<CardProps, "children"> & {
  event: NostrEvent;
  variant?: CardProps["variant"];
  showReplyButton?: boolean;
  hideDrawerButton?: boolean;
  registerIntersectionEntity?: boolean;
};
export const Note = React.memo(
  ({
    event,
    variant = "outline",
    showReplyButton,
    hideDrawerButton,
    registerIntersectionEntity = true,
    ...props
  }: NoteProps) => {
    const account = useCurrentAccount();
    const { showReactions, showSignatureVerification } = useSubject(appSettings);
    const replyForm = useDisclosure();

    // if there is a parent intersection observer, register this card
    const ref = useRef<HTMLDivElement | null>(null);
    useRegisterIntersectionEntity(ref, event.id);

    // find mostr external link
    const externalLink = useMemo(() => event.tags.find((t) => t[0] === "mostr" || t[0] === "proxy"), [event])?.[1];
    const communityPointer = useMemo(() => {
      const tag = event.tags.find((t) => isATag(t) && t[1].startsWith(COMMUNITY_DEFINITION_KIND + ":"));
      return tag?.[1] ? parseCoordinate(tag[1], true) : undefined;
    }, [event]);
    const community = useReplaceableEvent(communityPointer);

    const showReactionsOnNewLine = useBreakpointValue({ base: true, md: false });

    const reactionButtons = showReactions && <NoteReactions event={event} flexWrap="wrap" variant="ghost" size="xs" />;

    return (
      <TrustProvider event={event}>
        <ExpandProvider>
          <Card
            variant={variant}
            ref={registerIntersectionEntity ? ref : undefined}
            data-event-id={event.id}
            {...props}
          >
            <CardHeader p="2">
              <Flex flex="1" gap="2" alignItems="center">
                <UserAvatarLink pubkey={event.pubkey} size={["xs", "sm"]} />
                <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
                <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
                <Flex grow={1} />
                {showSignatureVerification && <EventVerificationIcon event={event} />}
                {!hideDrawerButton && (
                  <OpenInDrawerButton to={`/n/${getSharableEventAddress(event)}`} size="sm" variant="ghost" />
                )}
                <NoteLink noteId={event.id} whiteSpace="nowrap" color="current">
                  <Timestamp timestamp={event.created_at} />
                </NoteLink>
              </Flex>
              {community && (
                <Text fontStyle="italic">
                  Posted in{" "}
                  <Link as={RouterLink} to={`/c/${getCommunityName(community)}/${community.pubkey}`} color="blue.500">
                    {getCommunityName(community)}
                  </Link>{" "}
                  community
                </Text>
              )}
            </CardHeader>
            <CardBody p="0">
              <NoteContentWithWarning event={event} />
            </CardBody>
            <CardFooter padding="2" display="flex" gap="2" flexDirection="column" alignItems="flex-start">
              {showReactionsOnNewLine && reactionButtons}
              <Flex gap="2" w="full" alignItems="center">
                <ButtonGroup size="xs" variant="ghost" isDisabled={account?.readonly ?? true}>
                  {showReplyButton && (
                    <IconButton icon={<ReplyIcon />} aria-label="Reply" title="Reply" onClick={replyForm.onOpen} />
                  )}
                  <RepostButton event={event} />
                  <QuoteRepostButton event={event} />
                  <NoteZapButton event={event} />
                </ButtonGroup>
                {!showReactionsOnNewLine && reactionButtons}
                <Box flexGrow={1} />
                {externalLink && (
                  <IconButton
                    as={Link}
                    icon={<ExternalLinkIcon />}
                    aria-label="Open External"
                    href={externalLink}
                    size="xs"
                    variant="ghost"
                    target="_blank"
                  />
                )}
                <EventRelays event={event} />
                <BookmarkButton event={event} aria-label="Bookmark note" size="xs" variant="ghost" />
                <NoteMenu event={event} size="xs" variant="ghost" aria-label="More Options" />
              </Flex>
            </CardFooter>
          </Card>
        </ExpandProvider>
        {replyForm.isOpen && (
          <ReplyForm
            item={{ event, replies: [], refs: getReferences(event) }}
            onCancel={replyForm.onClose}
            onSubmitted={replyForm.onClose}
          />
        )}
      </TrustProvider>
    );
  },
);

export default Note;
