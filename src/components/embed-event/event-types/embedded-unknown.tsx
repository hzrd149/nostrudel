import { Card, CardBody, CardHeader, CardProps, Flex, Heading, Link, Text } from "@chakra-ui/react";

import { getSharableEventAddress } from "../../../helpers/nip19";
import { NostrEvent } from "../../../types/nostr-event";
import { UserAvatarLink } from "../../user-avatar-link";
import { UserLink } from "../../user-link";
import { truncatedId } from "../../../helpers/nostr/events";
import { buildAppSelectUrl } from "../../../helpers/nostr/apps";
import { UserDnsIdentityIcon } from "../../user-dns-identity-icon";
import dayjs from "dayjs";

export default function EmbeddedUnknown({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const address = getSharableEventAddress(event);

  return (
    <Card {...props}>
      <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0" flexWrap="wrap">
        <UserAvatarLink pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="md" />
        <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
        <Link ml="auto" href={address ? buildAppSelectUrl(address) : ""} isExternal>
          {dayjs.unix(event.created_at).fromNow()}
        </Link>
      </CardHeader>
      <CardBody p="2">
        <Flex gap="2">
          <Text>Kind: {event.kind}</Text>
          <Link href={address ? buildAppSelectUrl(address) : ""} isExternal color="blue.500">
            {address && truncatedId(address)}
          </Link>
        </Flex>
        <Text whiteSpace="pre-wrap">{event.content}</Text>
      </CardBody>
    </Card>
  );
}
