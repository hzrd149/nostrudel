import { MouseEventHandler, useCallback, useMemo } from "react";
import {
  Box,
  BoxProps,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  CardProps,
  Flex,
  IconButton,
  Link,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { getSharableEventAddress } from "../../../helpers/nip19";
import { NostrEvent, Tag, isATag, isETag, isPTag } from "../../../types/nostr-event";
import UserAvatarLink from "../../user-avatar-link";
import UserLink from "../../user-link";
import { aTagToAddressPointer, eTagToEventPointer } from "../../../helpers/nostr/events";
import { buildAppSelectUrl } from "../../../helpers/nostr/apps";
import { UserDnsIdentityIcon } from "../../user-dns-identity-icon";
import {
  embedEmoji,
  embedNostrHashtags,
  embedNostrLinks,
  renderGenericUrl,
  renderImageUrl,
  renderVideoUrl,
} from "../../embed-types";
import { EmbedableContent, embedUrls } from "../../../helpers/embeds";
import Timestamp from "../../timestamp";
import { CodeIcon, ExternalLinkIcon } from "../../icons";
import NoteDebugModal from "../../debug-modals/note-debug-modal";
import { renderAudioUrl } from "../../embed-types/audio";
import { EmbedEventPointer } from "..";

function EventTag({ tag }: { tag: Tag }) {
  const expand = useDisclosure();
  const content = `[${tag[0]}] ${tag.slice(1).join(", ")}`;
  const props = {
    fontWeight: "bold",
    fontFamily: "monospace",
    fontSize: "1.2em",
    isTruncated: true,
    color: "GrayText",
  };

  const toggle = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();
      expand.onToggle();
    },
    [expand.onToggle],
  );

  if (isETag(tag) && tag[1]) {
    const pointer = eTagToEventPointer(tag);
    return (
      <>
        <Link as={RouterLink} to={`/l/${nip19.neventEncode(pointer)}`} onClick={toggle} {...props}>
          {content}
        </Link>
        {expand.isOpen && <EmbedEventPointer pointer={{ type: "nevent", data: pointer }} />}
      </>
    );
  } else if (isATag(tag) && tag[1]) {
    const pointer = aTagToAddressPointer(tag);
    return (
      <>
        <Link as={RouterLink} to={`/l/${nip19.naddrEncode(pointer)}`} onClick={toggle} {...props}>
          {content}
        </Link>
        {expand.isOpen && <EmbedEventPointer pointer={{ type: "naddr", data: pointer }} />}
      </>
    );
  } else if (isPTag(tag) && tag[1]) {
    const pubkey = tag[1];
    return (
      <>
        <Link as={RouterLink} to={`/l/${nip19.npubEncode(pubkey)}`} onClick={toggle} {...props}>
          {content}
        </Link>
        {expand.isOpen && (
          <Flex gap="4" p="2">
            <UserAvatarLink pubkey={pubkey} />
            <Box>
              <UserLink pubkey={pubkey} fontWeight="bold" />
              <br />
              <UserDnsIdentityIcon pubkey={pubkey} />
            </Box>
          </Flex>
        )}
      </>
    );
  } else
    return (
      <Text title={content} {...props}>
        {content}
      </Text>
    );
}

export default function EmbeddedUnknown({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const debugModal = useDisclosure();
  const address = getSharableEventAddress(event);

  const alt = event.tags.find((t) => t[0] === "alt")?.[1];
  const content = useMemo(() => {
    let jsx: EmbedableContent = [event.content];
    jsx = embedNostrLinks(jsx);
    jsx = embedNostrHashtags(jsx, event);
    jsx = embedEmoji(jsx, event);

    jsx = embedUrls(jsx, [renderImageUrl, renderVideoUrl, renderAudioUrl, renderGenericUrl]);

    return jsx;
  }, [event.content]);

  return (
    <>
      <Card {...props}>
        <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0" flexWrap="wrap">
          <UserAvatarLink pubkey={event.pubkey} size="xs" />
          <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="md" />
          <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
          <Text>kind: {event.kind}</Text>
          <Timestamp timestamp={event.created_at} />
          <ButtonGroup ml="auto">
            <Button
              as={Link}
              size="sm"
              leftIcon={<ExternalLinkIcon />}
              isExternal
              href={address ? buildAppSelectUrl(address) : ""}
            >
              Open
            </Button>
            <IconButton
              icon={<CodeIcon />}
              aria-label="Raw Event"
              size="sm"
              variant="outline"
              onClick={debugModal.onOpen}
            />
          </ButtonGroup>
        </CardHeader>
        <CardBody p="2">
          {alt && (
            <Text isTruncated fontStyle="italic">
              {alt}
            </Text>
          )}
          <Box whiteSpace="pre-wrap" noOfLines={3}>
            {content}
          </Box>
          <Flex direction="column" gap="1" px="2" my="2">
            {event.tags.map((tag, i) => (
              <EventTag key={i} tag={tag} />
            ))}
          </Flex>
        </CardBody>
      </Card>
      {debugModal.isOpen && <NoteDebugModal isOpen={debugModal.isOpen} onClose={debugModal.onClose} event={event} />}
    </>
  );
}
