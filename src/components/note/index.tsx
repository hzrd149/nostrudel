import React, { useMemo } from "react";
import moment from "moment";
import {
  Box,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Flex,
  Heading,
  IconButton,
  Link,
} from "@chakra-ui/react";
import { NostrEvent } from "../../types/nostr-event";
import { UserAvatarLink } from "../user-avatar-link";

import { NoteMenu } from "./note-menu";
import { NoteRelays } from "./note-relays";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { UserLink } from "../user-link";
import { UserDnsIdentityIcon } from "../user-dns-identity-icon";
import { convertTimestampToDate } from "../../helpers/date";
import ReactionButton from "./buttons/reaction-button";
import NoteZapButton from "./note-zap-button";
import { ExpandProvider } from "./expanded";
import useSubject from "../../hooks/use-subject";
import appSettings from "../../services/app-settings";
import EventVerificationIcon from "../event-verification-icon";
import { ReplyButton } from "./buttons/reply-button";
import { RepostButton } from "./buttons/repost-button";
import { QuoteRepostButton } from "./buttons/quote-repost-button";
import { ExternalLinkIcon } from "../icons";
import NoteContentWithWarning from "./note-content-with-warning";
import { TrustProvider } from "./trust";
import { NoteLink } from "../note-link";

export type NoteProps = {
  event: NostrEvent;
  maxHeight?: number;
  variant?: CardProps["variant"];
};
export const Note = React.memo(({ event, maxHeight, variant = "outline" }: NoteProps) => {
  const isMobile = useIsMobile();
  const { showReactions, showSignatureVerification } = useSubject(appSettings);

  // find mostr external link
  const externalLink = useMemo(() => event.tags.find((t) => t[0] === "mostr"), [event]);

  return (
    <TrustProvider event={event}>
      <ExpandProvider>
        <Card variant={variant}>
          <CardHeader padding="2">
            <Flex flex="1" gap="2" alignItems="center" wrap="wrap">
              <UserAvatarLink pubkey={event.pubkey} size={isMobile ? "xs" : "sm"} />

              <Heading size="sm" display="inline">
                <UserLink pubkey={event.pubkey} />
              </Heading>
              <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
              <Flex grow={1} />
              {showSignatureVerification && <EventVerificationIcon event={event} />}
              <NoteLink noteId={event.id} whiteSpace="nowrap" color="current">
                {moment(convertTimestampToDate(event.created_at)).fromNow()}
              </NoteLink>
            </Flex>
          </CardHeader>
          <CardBody p="0">
            <NoteContentWithWarning event={event} maxHeight={maxHeight} />
          </CardBody>
          <CardFooter padding="2" display="flex" gap="2">
            <ButtonGroup size="sm" variant="link">
              <ReplyButton event={event} />
              <RepostButton event={event} />
              <QuoteRepostButton event={event} />
              <NoteZapButton note={event} size="sm" />
              {showReactions && <ReactionButton note={event} size="sm" />}
            </ButtonGroup>
            <Box flexGrow={1} />
            {externalLink && (
              <IconButton
                as={Link}
                icon={<ExternalLinkIcon />}
                aria-label="Open External"
                href={externalLink[1]}
                size="sm"
                variant="link"
                target="_blank"
              />
            )}
            <NoteRelays event={event} size="sm" variant="link" />
            <NoteMenu event={event} size="sm" variant="link" aria-label="More Options" />
          </CardFooter>
        </Card>
      </ExpandProvider>
    </TrustProvider>
  );
});
