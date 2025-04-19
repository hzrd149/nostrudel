import { Card, CardFooter, CardHeader, CardProps, Heading, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";
import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { useContext } from "react";

import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import { AppHandlerContext } from "../../../providers/route/app-handler-provider";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";

export default function EmbeddedCommunity({
  community,
  ...props
}: Omit<CardProps, "children"> & { community: NostrEvent }) {
  const name = getTagValue(community, "name") || getTagValue(community, "d");
  const image = getTagValue(community, "image");
  const naddr = useShareableEventAddress(community);
  const { openAddress } = useContext(AppHandlerContext);

  return (
    <Card
      as={LinkBox}
      variant="outline"
      maxW="lg"
      gap="2"
      overflow="hidden"
      borderRadius="xl"
      backgroundImage={image}
      backgroundRepeat="no-repeat"
      backgroundSize="cover"
      backgroundPosition="center"
      textShadow="2px 2px var(--chakra-blur-sm) var(--chakra-colors-blackAlpha-800)"
      {...props}
    >
      <CardHeader pb="0">
        <Heading size="lg">
          <LinkOverlay onClick={() => naddr && openAddress(naddr)}>{name}</LinkOverlay>
        </Heading>
      </CardHeader>
      <CardFooter display="flex" alignItems="center" gap="2" pt="0">
        <UserAvatarLink pubkey={community.pubkey} size="sm" />
        <Text>by</Text>
        <UserLink pubkey={community.pubkey} />
      </CardFooter>
    </Card>
  );
}
