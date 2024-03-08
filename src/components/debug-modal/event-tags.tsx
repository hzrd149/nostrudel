import { MouseEventHandler, useCallback } from "react";
import { Box, Button, Flex, Link, Text, useDisclosure } from "@chakra-ui/react";
import { NostrEvent, nip19 } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import { Tag, isATag, isETag, isPTag } from "../../types/nostr-event";
import { aTagToAddressPointer, eTagToEventPointer } from "../../helpers/nostr/event";
import { EmbedEventPointer } from "../embed-event";
import UserAvatarLink from "../user/user-avatar-link";
import UserLink from "../user/user-link";
import { UserDnsIdentityIcon } from "../user/user-dns-identity-icon";

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

  if (isETag(tag)) {
    const pointer = eTagToEventPointer(tag);
    return (
      <>
        <Link as={RouterLink} to={`/l/${nip19.neventEncode(pointer)}`} onClick={toggle} {...props}>
          {content}
        </Link>
        {expand.isOpen && <EmbedEventPointer pointer={{ type: "nevent", data: pointer }} />}
      </>
    );
  } else if (isATag(tag)) {
    const pointer = aTagToAddressPointer(tag);
    return (
      <>
        <Link as={RouterLink} to={`/l/${nip19.naddrEncode(pointer)}`} onClick={toggle} {...props}>
          {content}
        </Link>
        {expand.isOpen && <EmbedEventPointer pointer={{ type: "naddr", data: pointer }} />}
      </>
    );
  } else if (isPTag(tag)) {
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

export default function DebugEventTags({ event }: { event: NostrEvent }) {
  const expand = useDisclosure();

  return (
    <>
      <Button variant="link" color="GrayText" fontFamily="monospace" onClick={expand.onToggle}>
        [{expand.isOpen ? "-" : "+"}] Tags ({event.tags.length})
      </Button>
      {expand.isOpen && (
        <Flex direction="column" gap="1" px="2" my="2">
          {event.tags.map((tag, i) => (
            <EventTag key={i} tag={tag} />
          ))}
        </Flex>
      )}
    </>
  );
}
