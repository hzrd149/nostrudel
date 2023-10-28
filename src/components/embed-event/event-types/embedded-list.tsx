import { Card, CardBody, CardHeader, CardProps, Flex, Heading, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { NostrEvent } from "../../../types/nostr-event";
import { getListName, isSpecialListKind } from "../../../helpers/nostr/lists";
import { createCoordinate } from "../../../services/replaceable-event-requester";
import { getSharableEventAddress } from "../../../helpers/nip19";
import UserAvatarLink from "../../user-avatar-link";
import { UserLink } from "../../user-link";
import ListFeedButton from "../../../views/lists/components/list-feed-button";
import { ListCardContent } from "../../../views/lists/components/list-card";

export default function EmbeddedList({ list, ...props }: Omit<CardProps, "children"> & { list: NostrEvent }) {
  const link = isSpecialListKind(list.kind) ? createCoordinate(list.kind, list.pubkey) : getSharableEventAddress(list);

  return (
    <Card {...props}>
      <CardHeader display="flex" alignItems="center" p="2" pb="0" gap="2">
        <Heading size="md">
          <Link as={RouterLink} to={`/lists/${link}`}>
            {getListName(list)}
          </Link>
        </Heading>
        <Flex gap="2">
          <Text>by</Text>
          <UserAvatarLink pubkey={list.pubkey} size="xs" />
          <UserLink pubkey={list.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        </Flex>
        <ListFeedButton list={list} ml="auto" size="sm" />
      </CardHeader>
      <CardBody p="2">
        <ListCardContent list={list} />
      </CardBody>
    </Card>
  );
}
