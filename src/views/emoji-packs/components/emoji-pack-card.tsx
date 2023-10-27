import { useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Flex,
  Heading,
  Image,
  Link,
  Text,
} from "@chakra-ui/react";

import UserAvatarLink from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import EmojiPackFavoriteButton from "./emoji-pack-favorite-button";
import { getEventUID } from "../../../helpers/nostr/events";
import { getEmojisFromPack, getPackName } from "../../../helpers/nostr/emoji-packs";
import EmojiPackMenu from "./emoji-pack-menu";
import Timestamp from "../../../components/timestamp";

export default function EmojiPackCard({ pack, ...props }: Omit<CardProps, "children"> & { pack: NostrEvent }) {
  const emojis = getEmojisFromPack(pack);
  const naddr = getSharableEventAddress(pack);

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(pack));

  return (
    <Card ref={ref} variant="outline" {...props}>
      <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0" flexWrap="wrap">
        <Heading size="md">
          <Link as={RouterLink} to={`/emojis/${naddr}`}>
            {getPackName(pack)}
          </Link>
        </Heading>
        <Text>by</Text>
        <UserAvatarLink pubkey={pack.pubkey} size="xs" />
        <UserLink pubkey={pack.pubkey} isTruncated fontWeight="bold" fontSize="md" />
        <ButtonGroup size="sm" ml="auto">
          <EmojiPackFavoriteButton pack={pack} />
          <EmojiPackMenu pack={pack} aria-label="emoji pack menu" />
        </ButtonGroup>
      </CardHeader>
      <CardBody p="2">
        {emojis.length > 0 && (
          <Flex mb="2" wrap="wrap" gap="2">
            {emojis.map(({ name, url }) => (
              <Image key={name + url} src={url} title={name} w={8} h={8} />
            ))}
          </Flex>
        )}
      </CardBody>
      <CardFooter p="2" display="flex" pt="0">
        <Text>
          Updated: <Timestamp timestamp={pack.created_at} />
        </Text>
      </CardFooter>
    </Card>
  );
}
