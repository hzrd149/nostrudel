import { Button, Card, CardBody, CardHeader, CardProps, Flex, Heading, Link, Text } from "@chakra-ui/react";
import { getReplaceableUID } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import { getListDescription, getListTitle, isSpecialListKind } from "../../../helpers/nostr/lists";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import { getSharableEventAddress } from "../../../services/relay-hints";
import { ListCardContent } from "../../../views/lists/components/fallback-list-card";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";

export default function EmbeddedSetOrList({ list, ...props }: Omit<CardProps, "children"> & { list: NostrEvent }) {
  const link = isSpecialListKind(list.kind) ? getReplaceableUID(list.kind, list.pubkey) : getSharableEventAddress(list);
  const description = getListDescription(list);

  const shouldShowFeedButton = list.kind === kinds.Followsets || list.kind === kinds.Contacts;
  const naddr = useShareableEventAddress(list);

  return (
    <Card {...props}>
      <CardHeader p="2" pb="0">
        <Flex alignItems="center" gap="2">
          <Heading size="md">
            <Link as={RouterLink} to={`/lists/${link}`}>
              {getListTitle(list)}
            </Link>
          </Heading>
          <Flex gap="2">
            <Text>by</Text>
            <UserAvatarLink pubkey={list.pubkey} size="xs" />
            <UserLink pubkey={list.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
          </Flex>
          {shouldShowFeedButton && naddr && (
            <Button
              ms="auto"
              as={RouterLink}
              to={{ pathname: "/", search: new URLSearchParams({ people: naddr }).toString() }}
              size="sm"
            >
              View Feed
            </Button>
          )}
        </Flex>
        {description && <Text fontStyle="italic">{description}</Text>}
      </CardHeader>
      <CardBody p="2">
        <ListCardContent list={list} />
      </CardBody>
    </Card>
  );
}
