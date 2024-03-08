import { memo, useRef } from "react";
import { nip19 } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";
import {
  Card,
  CardFooter,
  CardHeader,
  CardProps,
  Heading,
  LinkBox,
  LinkOverlay,
  Tag,
  TagLabel,
  TagLeftIcon,
  Text,
} from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/local/intersection-observer";
import { getEventUID } from "../../../helpers/nostr/event";
import { getCommunityImage, getCommunityName } from "../../../helpers/nostr/communities";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import useCountCommunityMembers from "../../../hooks/use-count-community-members";
import { readablizeSats } from "../../../helpers/bolt11";
import User01 from "../../../components/icons/user-01";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import { AddressPointer } from "nostr-tools/lib/types/nip19";

function CommunityCard({ community, ...props }: Omit<CardProps, "children"> & { community: NostrEvent }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(community));

  const name = getCommunityName(community);
  const countMembers = useCountCommunityMembers(community);

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
        {countMembers !== undefined && countMembers > 0 && (
          <Tag variant="solid" ml="auto" alignSelf="flex-end" textShadow="none">
            <TagLeftIcon as={User01} boxSize={4} />
            <TagLabel>{readablizeSats(countMembers)}</TagLabel>
          </Tag>
        )}

        {/* {notesInLastMonth !== undefined && <Text ml="auto">{notesInLastMonth} Posts in the past month</Text>} */}
      </CardFooter>
    </Card>
  );
}

export function PointerCommunityCard({ pointer, ...props }: Omit<CardProps, "children"> & { pointer: AddressPointer }) {
  const community = useReplaceableEvent(pointer);
  if (!community) return <span>Loading {pointer.identifier}</span>;
  return <CommunityCard community={community} {...props} />;
}

export default memo(CommunityCard);
