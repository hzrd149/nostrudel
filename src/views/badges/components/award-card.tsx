import { useRef } from "react";
import { Card, CardBody, CardProps, Flex, Heading } from "@chakra-ui/react";

import { UserAvatar } from "../../../components/user-avatar";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import { NostrEvent } from "../../../types/nostr-event";
import { UserLink } from "../../../components/user-link";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { getEventUID } from "../../../helpers/nostr/events";

export default function BadgeAwardCard({
  pubkey,
  award,
  ...props
}: Omit<CardProps, "children"> & { award: NostrEvent; pubkey: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(award));

  return (
    <Card {...props} ref={ref}>
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
