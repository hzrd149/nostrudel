import React, { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import moment from "moment";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
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
  Spacer,
} from "@chakra-ui/react";
import { NostrEvent } from "../../types/nostr-event";
import { UserAvatarLink } from "../user-avatar-link";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip19";

import { NoteContents } from "./note-contents";
import { NoteMenu } from "./note-menu";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { NoteRelays } from "./note-relays";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { UserLink } from "../user-link";
import { UserDnsIdentityIcon } from "../user-dns-identity";
import { convertTimestampToDate } from "../../helpers/date";
import { useCurrentAccount } from "../../hooks/use-current-account";
import ReactionButton from "./buttons/reaction-button";
import NoteZapButton from "./note-zap-button";
import { ExpandProvider, useExpand } from "./expanded";
import useSubject from "../../hooks/use-subject";
import appSettings from "../../services/app-settings";
import EventVerificationIcon from "../event-verification-icon";
import { ReplyButton } from "./buttons/reply-button";
import { RepostButton } from "./buttons/repost-button";
import { QuoteRepostButton } from "./buttons/quote-repost-button";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { ExternalLinkIcon } from "../icons";
import SensitiveContentWarning from "../sensitive-content-warning";
import useAppSettings from "../../hooks/use-app-settings";

function NoteContentWithWarning({ event, maxHeight }: { event: NostrEvent; maxHeight?: number }) {
  const account = useCurrentAccount();
  const expand = useExpand();
  const settings = useAppSettings();

  const readRelays = useReadRelayUrls();
  const contacts = useUserContacts(account.pubkey, readRelays);
  const following = contacts?.contacts || [];

  const contentWarning = event.tags.find((t) => t[0] === "content-warning")?.[1];
  const showContentWarning = settings.showContentWarning && contentWarning && !expand?.expanded;

  return showContentWarning ? (
    <SensitiveContentWarning description={contentWarning} />
  ) : (
    <NoteContents
      event={event}
      trusted={event.pubkey === account.pubkey || following.includes(event.pubkey)}
      maxHeight={maxHeight}
    />
  );
}

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
            <Link as={RouterLink} to={`/n/${normalizeToBech32(event.id, Bech32Prefix.Note)}`} whiteSpace="nowrap">
              {moment(convertTimestampToDate(event.created_at)).fromNow()}
            </Link>
          </Flex>
        </CardHeader>
        <CardBody px="2" py="0">
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
  );
});
