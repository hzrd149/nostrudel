import { Card, CardBody, CardProps, Flex, Heading } from "@chakra-ui/react";

import { UserAvatar } from "../../../components/user-avatar";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import { NostrEvent } from "../../../types/nostr-event";
import { getBadgeAwardPubkey } from "../../../helpers/nostr/badges";
import { UserLink } from "../../../components/user-link";

export default function BadgeAwardCard({ award, ...props }: Omit<CardProps, "children"> & { award: NostrEvent }) {
  const pubkey = getBadgeAwardPubkey(award);

  return (
    <Card {...props}>
      <CardBody p="2" display="flex" alignItems="center" overflow="hidden" gap="2">
        <UserAvatar pubkey={pubkey} />
        <Flex direction="column" flex={1} overflow="hidden">
          <Heading size="sm" whiteSpace="nowrap" isTruncated>
            <UserLink pubkey={pubkey} />
          </Heading>
          <UserDnsIdentityIcon pubkey={pubkey} />
        </Flex>
      </CardBody>
    </Card>
  );
}
