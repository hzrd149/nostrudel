import {
  AvatarGroup,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  Image,
  LinkBox,
  Text,
} from "@chakra-ui/react";
import { getProfilePointersFromList, getTagValue } from "applesauce-core/helpers";

import { NostrEvent } from "nostr-tools";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import Timestamp from "../../../components/timestamp";
import { getListTitle } from "../../../helpers/nostr/lists";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import ListFavoriteButton from "./list-favorite-button";
import ListMenu from "./list-menu";
import RouterLink from "../../../components/router-link";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";

export default function ContactListCard({ list }: { list: NostrEvent }) {
  const people = getProfilePointersFromList(list);

  const naddr = useShareableEventAddress(list);

  return (
    <Card as={LinkBox}>
      <CardHeader p="2">
        <Heading size="md">
          <HoverLinkOverlay as={RouterLink} to={`/lists/${naddr}`}>
            <UserName pubkey={list.pubkey} /> following
          </HoverLinkOverlay>
        </Heading>
      </CardHeader>
      <CardBody py="0" px="2">
        <Flex gap="2" alignItems="center" ms="auto">
          <UserAvatarLink size="xs" pubkey={list.pubkey} />
          <UserLink pubkey={list.pubkey} />
        </Flex>

        <AvatarGroup size="sm" m="2">
          {people.slice(0, 15).map((p) => (
            <UserAvatar pubkey={p.pubkey} />
          ))}
        </AvatarGroup>
      </CardBody>
      <CardFooter display="flex" gap="2" p="2" alignItems="center">
        <Text>
          {people.length} users · updated <Timestamp timestamp={list.created_at} />
        </Text>
        <ButtonGroup size="sm" variant="ghost" ml="auto" zIndex="100">
          <ListFavoriteButton list={list} />
          <ListMenu list={list} aria-label="list menu" />
        </ButtonGroup>
      </CardFooter>
    </Card>
  );
}
