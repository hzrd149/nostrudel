import { Card, CardBody, CardHeader, CardProps, Flex, Heading, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { getReplaceableUID } from "applesauce-core/helpers";

import { NostrEvent } from "../../../types/nostr-event";
import { getListDescription, getListName, isSpecialListKind } from "../../../helpers/nostr/lists";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";
import ListFeedButton from "../../../views/lists/components/list-feed-button";
import { ListCardContent } from "../../../views/lists/components/list-card";
import { getSharableEventAddress } from "../../../services/relay-hints";

export default function EmbeddedSetOrList({ list, ...props }: Omit<CardProps, "children"> & { list: NostrEvent }) {
  const link = isSpecialListKind(list.kind) ? getReplaceableUID(list.kind, list.pubkey) : getSharableEventAddress(list);
  const description = getListDescription(list);

  return (
    <Card {...props}>
      <CardHeader p="2" pb="0">
        <Flex alignItems="center" gap="2">
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
        </Flex>
        {description && <Text fontStyle="italic">{description}</Text>}
      </CardHeader>
      <CardBody p="2">
        <ListCardContent list={list} />
      </CardBody>
    </Card>
  );
}
