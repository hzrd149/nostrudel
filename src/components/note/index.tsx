import React, { useMemo, useRef } from "react";
import dayjs from "dayjs";
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
} from "@chakra-ui/react";
import { NostrEvent } from "../../types/nostr-event";
import { UserAvatarLink } from "../user-avatar-link";

import { NoteMenu } from "./note-menu";
import { EventRelays } from "./note-relays";
import { UserLink } from "../user-link";
import { UserDnsIdentityIcon } from "../user-dns-identity-icon";
import ReactionButton from "./buttons/reaction-button";
import NoteZapButton from "./note-zap-button";
import { ExpandProvider } from "./expanded";
import useSubject from "../../hooks/use-subject";
import appSettings from "../../services/settings/app-settings";
import EventVerificationIcon from "../event-verification-icon";
import { ReplyButton } from "./buttons/reply-button";
import { RepostButton } from "./buttons/repost-button";
import { QuoteRepostButton } from "./buttons/quote-repost-button";
import { ExternalLinkIcon } from "../icons";
import NoteContentWithWarning from "./note-content-with-warning";
import { TrustProvider } from "../../providers/trust";
import { NoteLink } from "../note-link";
import { useRegisterIntersectionEntity } from "../../providers/intersection-observer";

export type NoteProps = {
  event: NostrEvent;
  variant?: CardProps["variant"];
};
export const Note = React.memo(({ event, variant = "outline" }: NoteProps) => {
  const { showReactions, showSignatureVerification } = useSubject(appSettings);

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  // find mostr external link
  const externalLink = useMemo(() => event.tags.find((t) => t[0] === "mostr"), [event]);

  return (
    <TrustProvider event={event}>
      <ExpandProvider>
        <Card variant={variant} ref={ref}>
          <CardHeader padding="2">
            <Flex flex="1" gap="2" alignItems="center" wrap="wrap">
              <UserAvatarLink pubkey={event.pubkey} size={["xs", "sm"]} />
              <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
              <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
              <Flex grow={1} />
              {showSignatureVerification && <EventVerificationIcon event={event} />}
              <NoteLink noteId={event.id} whiteSpace="nowrap" color="current">
                {dayjs.unix(event.created_at).fromNow()}
              </NoteLink>
            </Flex>
          </CardHeader>
          <CardBody p="0">
            <NoteContentWithWarning event={event} />
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
            <EventRelays event={event} />
            <NoteMenu event={event} size="sm" variant="link" aria-label="More Options" />
          </CardFooter>
        </Card>
      </ExpandProvider>
    </TrustProvider>
  );
});
