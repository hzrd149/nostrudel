import {
  AspectRatio,
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

export default function PeopleListCard({ list }: { list: NostrEvent }) {
  const title = getListTitle(list);
  const image = getTagValue(list, "image");
  const people = getProfilePointersFromList(list);

  const naddr = useShareableEventAddress(list);

  return (
    <Card as={LinkBox} overflow="hidden">
      {image && (
        <AspectRatio ratio={3 / 1}>
          <Image src={image} alt={title} objectFit="cover" />
        </AspectRatio>
      )}
      <CardHeader p="2">
        <Heading size="md">
          <HoverLinkOverlay as={RouterLink} to={`/lists/${naddr}`}>
            {title}
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
