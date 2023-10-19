import { memo, useRef } from "react";
import { Kind, nip19 } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Heading,
  LinkBox,
  LinkOverlay,
  Text,
} from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { getEventUID } from "../../../helpers/nostr/events";
import { getCommunityImage, getCommunityName } from "../../../helpers/nostr/communities";
import CommunityDescription from "./community-description";
import useCountCommunityPosts from "../hooks/use-count-community-post";
import { UserAvatarLink } from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";

function CommunityCard({ community, ...props }: Omit<CardProps, "children"> & { community: NostrEvent }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(community));

  const name = getCommunityName(community);

  // NOTE: disabled because nostr.band has a rate limit
  // const notesInLastMonth = useCountCommunityPosts(community);

  return (
    <Card
      as={LinkBox}
      ref={ref}
      variant="outline"
      gap="2"
      overflow="hidden"
      borderRadius="xl"
      backgroundImage={getCommunityImage(community)}
      backgroundRepeat="no-repeat"
      backgroundSize="cover"
      backgroundPosition="center"
      textShadow="2px 2px var(--chakra-blur-sm) var(--chakra-colors-blackAlpha-800)"
      {...props}
    >
      <CardHeader pb="0">
        <Heading size="lg">
          <LinkOverlay as={RouterLink} to={`/c/${encodeURIComponent(name)}/${nip19.npubEncode(community.pubkey)}`}>
            {name}
          </LinkOverlay>
        </Heading>
      </CardHeader>
      {/* <CardBody>
        <CommunityDescription community={community} maxLength={128} flex={1} />
      </CardBody> */}
      <CardFooter display="flex" alignItems="center" gap="2" pt="0">
        <UserAvatarLink pubkey={community.pubkey} size="sm" />
        <Text>by</Text>
        <UserLink pubkey={community.pubkey} />
        {/* {notesInLastMonth !== undefined && <Text ml="auto">{notesInLastMonth} Posts in the past month</Text>} */}
      </CardFooter>
    </Card>
  );
}

export default memo(CommunityCard);
